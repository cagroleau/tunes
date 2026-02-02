# Tunes App - Implementation Plan

## Goal
Build a minimalist iTunes-style music player that reads from ~/Music/tunes and provides basic playback controls.

## Phase 1: Core Infrastructure

### 1.1 Music Directory Setup (Rust)
- Create `~/Music/tunes` directory on app startup if it doesn't exist
- Add Tauri command `ensure_music_directory()` that returns the path

### 1.2 Music File Scanning (Rust)
- Add Tauri command `scan_library()` that:
  - Scans ~/Music/tunes for audio files (.mp3, .flac, .wav, .m4a, .ogg)
  - Extracts basic metadata (title, artist, duration) using a crate like `lofty` or `symphonia`
  - Returns a list of tracks with id, path, title, artist, duration

### 1.3 Audio Playback (Rust)
- Use `rodio` crate for audio playback
- Maintain playback state in app state (using Tauri's managed state)
- Add Tauri commands:
  - `play_track(path: String)` - start playing a track
  - `pause()` - pause current playback
  - `resume()` - resume paused playback
  - `stop()` - stop playback entirely
  - `get_playback_state()` - returns current state (playing/paused/stopped, current track, position)

## Phase 2: Frontend UI

### 2.1 Track List
- Display scanned tracks in a simple list
- Show title, artist, duration for each track
- Click to play

### 2.2 Playback Controls
- Play/Pause button
- Stop button
- Current track display (title, artist)
- Progress indicator (current time / total duration)

### 2.3 Styling
- Minimal dark theme (already have dark mode CSS)
- Clean, simple layout

## Dependencies to Add

### Rust (Cargo.toml)
```toml
rodio = "0.19"           # Audio playback
lofty = "0.21"           # Audio metadata reading
dirs = "5"               # For ~/Music path resolution
```

## File Structure (new/modified)

```
src-tauri/src/
├── lib.rs              # Register new commands
├── audio.rs            # Playback state and controls
├── library.rs          # Directory scanning and metadata
└── state.rs            # App state management

src/
├── main.ts             # App initialization, IPC calls
├── player.ts           # Playback control logic
├── library.ts          # Track list management
└── styles.css          # Updated styles
```

## Implementation Order

1. Add Rust dependencies
2. Implement `library.rs` - directory creation and scanning
3. Implement `audio.rs` - playback with rodio
4. Implement `state.rs` - managed state for player
5. Wire up commands in `lib.rs`
6. Build frontend track list UI
7. Build frontend playback controls
8. Style and polish
