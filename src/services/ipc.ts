/**
 * Tauri IPC wrapper functions
 * Provides type-safe wrappers around backend invoke calls
 */

import { invoke } from "@tauri-apps/api/core";
import type { Library, PlaybackState } from "../types";

export async function getMusicDirectory(): Promise<string> {
  return await invoke("get_music_directory");
}

export async function scanLibrary(): Promise<Library> {
  return await invoke("scan_library");
}

export async function playTrack(
  path: string,
  title: string,
  artist: string,
  durationSecs: number
): Promise<void> {
  await invoke("play_track", {
    path,
    title,
    artist,
    durationSecs,
  });
}

export async function pause(): Promise<void> {
  await invoke("pause");
}

export async function resume(): Promise<void> {
  await invoke("resume");
}

export async function stop(): Promise<void> {
  await invoke("stop");
}

export async function getPlaybackState(): Promise<PlaybackState> {
  return await invoke("get_playback_state");
}
