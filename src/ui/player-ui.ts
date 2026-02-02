/**
 * Player UI updates
 * Manages player controls and now-playing display
 */

import { getDOMElements } from "./dom";
import * as State from "../lib/state";
import type { PlaybackStatus } from "../types";

export function updatePlayerUI(
  status: PlaybackStatus,
  title: string | null,
  artist: string | null
): void {
  const {
    trackTitleEl,
    trackArtistEl,
    playPauseBtn,
    stopBtn,
    prevBtn,
    nextBtn,
  } = getDOMElements();

  const hasPrev = State.hasPreviousTrack();
  const hasNext = State.hasNextTrack();

  if (!title) {
    // No track selected at all
    trackTitleEl.textContent = "Not playing";
    trackArtistEl.textContent = "";
    playPauseBtn.textContent = "▶";
    playPauseBtn.title = "Play";
    playPauseBtn.disabled = true;
    stopBtn.disabled = true;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  } else {
    // Track is selected
    trackTitleEl.textContent = title;
    trackArtistEl.textContent = artist || "";
    prevBtn.disabled = !hasPrev;
    nextBtn.disabled = !hasNext;

    if (status === "Playing") {
      playPauseBtn.textContent = "⏸";
      playPauseBtn.title = "Pause";
      playPauseBtn.disabled = false;
      stopBtn.disabled = false;
    } else if (status === "Paused") {
      playPauseBtn.textContent = "▶";
      playPauseBtn.title = "Resume";
      playPauseBtn.disabled = false;
      stopBtn.disabled = false;
    } else {
      // Stopped - show play button, disable stop (already stopped)
      playPauseBtn.textContent = "▶";
      playPauseBtn.title = "Play";
      playPauseBtn.disabled = false;
      stopBtn.disabled = true;
    }
  }
}
