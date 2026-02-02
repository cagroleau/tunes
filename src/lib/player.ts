/**
 * Player control logic
 * High-level playback control functions
 */

import * as State from "./state";
import * as IPC from "../services/ipc";
import { updatePlayerUI } from "../ui/player-ui";
import { renderTracks } from "../ui/library-ui";
import type { Tune } from "../types";

export async function playTune(tune: Tune): Promise<void> {
  const title = tune.title || tune.filename;
  const artist = tune.artist || "Unknown Artist";

  try {
    await IPC.playTrack(tune.path, title, artist, tune.duration_secs);
    State.setCurrentTunePath(tune.path);
    State.setLastPlaybackStatus("Playing");
    updatePlayerUI("Playing", title, artist);
    renderTracks(playTune);
  } catch (e) {
    console.error("Failed to play tune:", e);
  }
}

export async function playNext(): Promise<void> {
  const nextTune = State.getNextTune();
  if (nextTune) {
    await playTune(nextTune);
  }
}

export async function playPrevious(): Promise<void> {
  const prevTune = State.getPreviousTune();
  if (prevTune) {
    await playTune(prevTune);
  }
}

export async function togglePlayPause(): Promise<void> {
  try {
    const state = await IPC.getPlaybackState();
    if (state.status === "Playing") {
      await IPC.pause();
      State.setLastPlaybackStatus("Paused");
      updatePlayerUI("Paused", state.current_track_title, state.current_track_artist);
    } else if (state.status === "Paused") {
      await IPC.resume();
      State.setLastPlaybackStatus("Playing");
      updatePlayerUI("Playing", state.current_track_title, state.current_track_artist);
    } else if (state.status === "Stopped") {
      // Restart the current track
      const currentTunePath = State.getCurrentTunePath();
      if (currentTunePath) {
        const tunes = State.getTunes();
        const tune = tunes.find((t) => t.path === currentTunePath);
        if (tune) {
          await playTune(tune);
        }
      }
    }
  } catch (e) {
    console.error("Failed to toggle play/pause:", e);
  }
}

export async function stopPlayback(): Promise<void> {
  try {
    await IPC.stop();
    State.setLastPlaybackStatus("Stopped");
    // Keep currentTunePath so the track stays selected
    const currentTunePath = State.getCurrentTunePath();
    if (currentTunePath) {
      const tunes = State.getTunes();
      const tune = tunes.find((t) => t.path === currentTunePath);
      if (tune) {
        const title = tune.title || tune.filename;
        const artist = tune.artist || "Unknown Artist";
        updatePlayerUI("Stopped", title, artist);
      } else {
        updatePlayerUI("Stopped", null, null);
      }
    } else {
      updatePlayerUI("Stopped", null, null);
    }
  } catch (e) {
    console.error("Failed to stop:", e);
  }
}
