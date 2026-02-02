/**
 * Playback state polling
 * Polls backend for playback state and handles autoplay logic
 */

import * as State from "../lib/state";
import * as IPC from "./ipc";
import { playTune } from "../lib/player";
import { updatePlayerUI } from "../ui/player-ui";
import { updateProgressBar } from "../ui/progress-bar";
import { renderTracks } from "../ui/library-ui";

let pollInterval: number | null = null;

async function pollPlaybackState() {
  try {
    const state = await IPC.getPlaybackState();

    // Update progress bar
    updateProgressBar(state.position_secs, state.duration_secs);

    // Only autoplay if we were playing and now stopped (track finished naturally)
    const lastStatus = State.getLastPlaybackStatus();
    const currentTunePath = State.getCurrentTunePath();

    if (
      state.status === "Stopped" &&
      lastStatus === "Playing" &&
      currentTunePath !== null
    ) {
      const nextTune = State.getNextTune();

      if (nextTune) {
        // Autoplay next track
        await playTune(nextTune);
      } else {
        // No more tracks, clear selection
        State.setCurrentTunePath(null);
        State.setLastPlaybackStatus("Stopped");
        updatePlayerUI("Stopped", null, null);
        renderTracks(playTune);
      }
    }
  } catch (e) {
    // Ignore polling errors
  }
}

export function startPlaybackPoller(intervalMs: number = 1000): void {
  if (pollInterval !== null) {
    stopPlaybackPoller();
  }
  pollInterval = setInterval(pollPlaybackState, intervalMs) as unknown as number;
}

export function stopPlaybackPoller(): void {
  if (pollInterval !== null) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
