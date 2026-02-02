# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tauri v2 desktop music player that reads from ~/Music/tunes and provides basic playback controls. Uses vanilla TypeScript frontend and Rust backend with rodio for audio playback.

## Commands

```bash
# Development - run the full app (starts Vite on :1420, then Tauri)
bun run tauri dev

# Build production app
bun run tauri build

# Frontend only
bun run dev       # Vite dev server
bun run build     # TypeScript check + Vite build

# Add Rust dependencies
cd src-tauri && cargo add <crate>
```

## Architecture

**Frontend (`src/`)**:
- `main.ts` - App logic, IPC calls, DOM manipulation, event listening
- `styles.css` - Minimal Apple-style UI with dark mode support
- Uses `@tauri-apps/api/core` for IPC and `@tauri-apps/api/event` for backend events

**Backend (`src-tauri/src/`)**:
- `lib.rs` - Tauri command handlers, app setup, filesystem watcher initialization
- `library.rs` - Music directory management, file scanning, metadata extraction (lofty), library persistence, filesystem watching (notify)
- `audio.rs` - Audio playback via dedicated thread (rodio), command channel pattern

**Audio Thread Pattern**: Because rodio's `OutputStream` is not `Send`, audio playback runs on a dedicated thread that receives commands via `mpsc` channel. The `AppState` holds only a `Sender<AudioCommand>`.

**Filesystem Watching**: Uses `notify` crate to watch ~/Music/tunes. Changes are debounced (500ms) before rescanning and emitting `library-changed` event to frontend.

**Library Persistence**: Library data stored in `~/Music/tunes/library.json` containing array of Tune objects with id, filename, path, and ID3 tags (title, artist, album, year, track_number, genre, duration).

**IPC Commands**:
- `get_music_directory()` - Returns ~/Music/tunes path
- `scan_library()` - Scans directory, returns Library with tunes array
- `play_track(path, title, artist)` - Start playback
- `pause()` / `resume()` / `stop()` - Playback controls
- `get_playback_state()` - Returns current status and track info

**Events** (backend → frontend):
- `library-changed` - Emitted when files are added/removed, payload is full Library

## Key Dependencies

**Rust**: rodio (audio), lofty (metadata), dirs (path resolution), notify (filesystem watching)
**Frontend**: @tauri-apps/api

## Music Directory

The app creates and reads from `~/Music/tunes`. Supported formats: mp3, flac, wav, m4a, ogg, aac. Library metadata cached in `library.json`.
