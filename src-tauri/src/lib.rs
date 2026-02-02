mod audio;
mod library;

use audio::{AppState, AudioCommand, PlaybackState};
use library::{LibraryEvent, Library};
use std::sync::mpsc;
use std::thread;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
fn get_music_directory() -> Result<String, String> {
    library::get_music_directory().map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
fn scan_library() -> Result<Library, String> {
    library::scan_library()
}

#[tauri::command]
fn play_track(
    path: String,
    title: String,
    artist: String,
    duration_secs: u64,
    state: State<AppState>,
) -> Result<(), String> {
    state.send_command(AudioCommand::Play {
        path,
        title,
        artist,
        duration_secs: duration_secs as f64,
    })
}

#[tauri::command]
fn pause(state: State<AppState>) -> Result<(), String> {
    state.send_command(AudioCommand::Pause)
}

#[tauri::command]
fn resume(state: State<AppState>) -> Result<(), String> {
    state.send_command(AudioCommand::Resume)
}

#[tauri::command]
fn stop(state: State<AppState>) -> Result<(), String> {
    state.send_command(AudioCommand::Stop)
}

#[tauri::command]
fn get_playback_state(state: State<AppState>) -> Result<PlaybackState, String> {
    state.get_playback_state()
}

fn setup_file_watcher(app: &AppHandle) {
    let (tx, rx) = mpsc::channel::<LibraryEvent>();

    // Start the filesystem watcher
    let _watcher = match library::start_watcher(tx) {
        Ok(w) => w,
        Err(e) => {
            eprintln!("Failed to start file watcher: {}", e);
            return;
        }
    };

    // Keep watcher alive by moving it into the thread
    let app_handle = app.clone();
    thread::spawn(move || {
        let _watcher = _watcher; // Move watcher into thread to keep it alive

        // Debounce: wait a bit after receiving an event before emitting
        let mut last_event = std::time::Instant::now();
        let debounce_duration = std::time::Duration::from_millis(500);

        loop {
            match rx.recv_timeout(std::time::Duration::from_millis(100)) {
                Ok(LibraryEvent::Changed) => {
                    last_event = std::time::Instant::now();
                }
                Err(mpsc::RecvTimeoutError::Timeout) => {
                    // Check if we should emit
                    if last_event.elapsed() < debounce_duration
                        && last_event.elapsed() >= std::time::Duration::from_millis(100)
                    {
                        // Rescan and emit
                        if let Ok(library) = library::scan_library() {
                            let _ = app_handle.emit("library-changed", library);
                        }
                        // Reset to prevent re-emit
                        last_event = std::time::Instant::now()
                            - debounce_duration
                            - std::time::Duration::from_secs(1);
                    }
                }
                Err(mpsc::RecvTimeoutError::Disconnected) => break,
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::new())
        .setup(|app| {
            setup_file_watcher(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_music_directory,
            scan_library,
            play_track,
            pause,
            resume,
            stop,
            get_playback_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
