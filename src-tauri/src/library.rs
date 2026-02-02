use lofty::file::TaggedFileExt;
use lofty::prelude::*;
use lofty::probe::Probe;
use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::mpsc::Sender;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tune {
    pub id: String,
    pub filename: String,
    pub path: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub year: Option<u32>,
    pub track_number: Option<u32>,
    pub genre: Option<String>,
    pub duration_secs: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Library {
    pub tunes: Vec<Tune>,
}

const SUPPORTED_EXTENSIONS: &[&str] = &["mp3", "flac", "wav", "m4a", "ogg", "aac"];
const LIBRARY_FILE: &str = "library.json";

pub fn get_music_directory() -> Result<PathBuf, String> {
    let audio_dir = dirs::audio_dir().ok_or("Could not find Music directory")?;
    Ok(audio_dir.join("tunes"))
}

pub fn ensure_music_directory() -> Result<PathBuf, String> {
    let tunes_dir = get_music_directory()?;
    if !tunes_dir.exists() {
        fs::create_dir_all(&tunes_dir)
            .map_err(|e| format!("Failed to create tunes directory: {}", e))?;
    }
    Ok(tunes_dir)
}

fn library_path() -> Result<PathBuf, String> {
    Ok(get_music_directory()?.join(LIBRARY_FILE))
}

pub fn load_library() -> Result<Library, String> {
    let path = library_path()?;
    if path.exists() {
        let content =
            fs::read_to_string(&path).map_err(|e| format!("Failed to read library: {}", e))?;
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse library: {}", e))
    } else {
        Ok(Library::default())
    }
}

pub fn save_library(library: &Library) -> Result<(), String> {
    let path = library_path()?;
    let content = serde_json::to_string_pretty(library)
        .map_err(|e| format!("Failed to serialize library: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("Failed to write library: {}", e))
}

pub fn scan_library() -> Result<Library, String> {
    let tunes_dir = ensure_music_directory()?;
    let mut library = load_library().unwrap_or_default();

    // Get list of current files
    let entries =
        fs::read_dir(&tunes_dir).map_err(|e| format!("Failed to read directory: {}", e))?;

    let mut current_files: Vec<PathBuf> = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        // Skip library.json
        if path.file_name().map(|n| n == LIBRARY_FILE).unwrap_or(false) {
            continue;
        }

        let extension = path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_lowercase());

        if let Some(ext) = extension {
            if SUPPORTED_EXTENSIONS.contains(&ext.as_str()) {
                current_files.push(path);
            }
        }
    }

    // Remove tunes that no longer exist
    library.tunes.retain(|tune| {
        let path = PathBuf::from(&tune.path);
        current_files.contains(&path)
    });

    // Add new tunes that aren't in the library
    for file_path in &current_files {
        let path_str = file_path.to_string_lossy().to_string();
        if !library.tunes.iter().any(|t| t.path == path_str) {
            if let Some(tune) = read_tune_metadata(file_path) {
                library.tunes.push(tune);
            }
        }
    }

    // Sort by title
    library
        .tunes
        .sort_by(|a, b| {
            let title_a = a.title.as_deref().unwrap_or(&a.filename).to_lowercase();
            let title_b = b.title.as_deref().unwrap_or(&b.filename).to_lowercase();
            title_a.cmp(&title_b)
        });

    // Save the updated library
    save_library(&library)?;

    Ok(library)
}

fn read_tune_metadata(path: &PathBuf) -> Option<Tune> {
    let path_str = path.to_string_lossy().to_string();
    let filename = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown")
        .to_string();

    // Generate ID from path
    let id = format!("{:x}", simple_hash(&path_str));

    // Try to read metadata with lofty
    let tagged_file = Probe::open(path).ok()?.read().ok()?;
    let tag = tagged_file.primary_tag().or_else(|| tagged_file.first_tag());

    let title = tag.and_then(|t| t.title().map(|s| s.to_string()));
    let artist = tag.and_then(|t| t.artist().map(|s| s.to_string()));
    let album = tag.and_then(|t| t.album().map(|s| s.to_string()));
    let year = tag.and_then(|t| t.year());
    let track_number = tag.and_then(|t| t.track());
    let genre = tag.and_then(|t| t.genre().map(|s| s.to_string()));
    let duration_secs = tagged_file.properties().duration().as_secs();

    Some(Tune {
        id,
        filename,
        path: path_str,
        title,
        artist,
        album,
        year,
        track_number,
        genre,
        duration_secs,
    })
}

fn simple_hash(input: &str) -> u64 {
    let mut hash: u64 = 0;
    for byte in input.bytes() {
        hash = hash.wrapping_mul(31).wrapping_add(byte as u64);
    }
    hash
}

fn has_supported_extension(path: &PathBuf) -> bool {
    // Skip library.json
    if path.file_name().map(|n| n == LIBRARY_FILE).unwrap_or(false) {
        return false;
    }

    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| SUPPORTED_EXTENSIONS.contains(&e.to_lowercase().as_str()))
        .unwrap_or(false)
}

pub enum LibraryEvent {
    Changed,
}

pub fn start_watcher(event_tx: Sender<LibraryEvent>) -> Result<RecommendedWatcher, String> {
    let tunes_dir = ensure_music_directory()?;

    let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
        if let Ok(event) = res {
            match event.kind {
                EventKind::Create(_) | EventKind::Remove(_) | EventKind::Modify(_) => {
                    // Check if any paths have supported audio extensions (works for deleted files too)
                    let dominated = event.paths.iter().any(|p| has_supported_extension(p));
                    if dominated {
                        let _ = event_tx.send(LibraryEvent::Changed);
                    }
                }
                _ => {}
            }
        }
    })
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    watcher
        .watch(&tunes_dir, RecursiveMode::NonRecursive)
        .map_err(|e| format!("Failed to watch directory: {}", e))?;

    Ok(watcher)
}
