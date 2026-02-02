/**
 * Library loading and management
 * Handles music library loading and filesystem event listening
 */

import { listen } from "@tauri-apps/api/event";
import * as State from "./state";
import * as IPC from "../services/ipc";
import { renderTracks } from "../ui/library-ui";
import { getDOMElements } from "../ui/dom";
import { playTune } from "./player";
import type { Library } from "../types";

export async function loadLibrary(): Promise<void> {
  try {
    const library = await IPC.scanLibrary();
    State.setTunes(library.tunes);
    renderTracks(playTune);
  } catch (e) {
    console.error("Failed to scan library:", e);
  }
}

export async function loadMusicPath(): Promise<void> {
  try {
    const path = await IPC.getMusicDirectory();
    const { musicPathEl } = getDOMElements();
    musicPathEl.textContent = path;
  } catch (e) {
    console.error("Failed to get music path:", e);
  }
}

export async function setupLibraryEventListener(): Promise<void> {
  // Listen for library changes from the backend
  await listen<Library>("library-changed", (event) => {
    State.setTunes(event.payload.tunes);
    renderTracks(playTune);
  });
}
