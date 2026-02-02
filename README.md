# tunes

A minimalist iTunes-style desktop music player built with Tauri, Rust, and TypeScript.

## Features

- **Automatic library management** - Reads music from `~/Music/tunes` with automatic filesystem watching
- **ID3 tag support** - Extracts and displays title, artist, album, year, track number, and genre
- **Full playback controls** - Play, pause, resume, stop, skip forward/backward
- **Autoplay** - Automatically plays the next track when the current one finishes
- **Persistent library** - Metadata cached in `library.json` for fast loading
- **Dark mode support** - Follows system preferences
- **Supported formats** - mp3, flac, wav, m4a, ogg, aac

## Getting Started

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Bun](https://bun.sh/) (or npm/pnpm/yarn)
- [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

### Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run tauri dev

# Build production app
bun run tauri build
```

### Usage

1. Add music files to `~/Music/tunes`
2. The app will automatically detect and index them
3. Click any track to start playing
4. Use the player controls to navigate your library

## Architecture

- **Frontend**: Vanilla TypeScript with minimal Apple-style UI
- **Backend**: Rust with rodio for audio playback and lofty for metadata extraction
- **IPC**: Tauri commands for backend communication
- **File watching**: Real-time library updates using the notify crate

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
