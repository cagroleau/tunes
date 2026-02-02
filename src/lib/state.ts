/**
 * Centralized state management
 * Encapsulates all global application state with controlled access
 */

import type { Tune, PlaybackStatus } from "../types";

// Internal state (private to this module)
let tunes: Tune[] = [];
let currentTunePath: string | null = null;
let lastPlaybackStatus: PlaybackStatus = "Stopped";

// ============================================================================
// State Getters
// ============================================================================

export function getTunes(): Tune[] {
  return tunes;
}

export function getCurrentTunePath(): string | null {
  return currentTunePath;
}

export function getLastPlaybackStatus(): PlaybackStatus {
  return lastPlaybackStatus;
}

export function getCurrentTuneIndex(): number {
  if (!currentTunePath) return -1;
  return tunes.findIndex((t) => t.path === currentTunePath);
}

// ============================================================================
// State Setters
// ============================================================================

export function setTunes(newTunes: Tune[]): void {
  tunes = newTunes;
}

export function setCurrentTunePath(path: string | null): void {
  currentTunePath = path;
}

export function setLastPlaybackStatus(status: PlaybackStatus): void {
  lastPlaybackStatus = status;
}

// ============================================================================
// Computed State
// ============================================================================

export function hasNextTrack(): boolean {
  const currentIndex = getCurrentTuneIndex();
  return currentIndex >= 0 && currentIndex < tunes.length - 1;
}

export function hasPreviousTrack(): boolean {
  const currentIndex = getCurrentTuneIndex();
  return currentIndex > 0;
}

export function getNextTune(): Tune | null {
  if (!hasNextTrack()) return null;
  const currentIndex = getCurrentTuneIndex();
  return tunes[currentIndex + 1];
}

export function getPreviousTune(): Tune | null {
  if (!hasPreviousTrack()) return null;
  const currentIndex = getCurrentTuneIndex();
  return tunes[currentIndex - 1];
}
