/**
 * Track list rendering
 * Manages the display of the music library
 */

import { getDOMElements } from "./dom";
import * as State from "../lib/state";
import { formatDuration, escapeHtml } from "../utils/format";
import type { Tune } from "../types";

export function renderTracks(onTrackClick: (tune: Tune) => void): void {
  const { tunesEl, emptyStateEl } = getDOMElements();
  const tunes = State.getTunes();
  const currentTunePath = State.getCurrentTunePath();

  tunesEl.innerHTML = "";

  if (tunes.length === 0) {
    emptyStateEl.style.display = "block";
    return;
  }

  emptyStateEl.style.display = "none";

  for (const tune of tunes) {
    const li = document.createElement("li");
    li.className = "track";
    if (tune.path === currentTunePath) {
      li.classList.add("playing");
    }

    const displayTitle = tune.title || tune.filename;
    const displayArtist = tune.artist || "Unknown Artist";

    li.innerHTML = `
      <div class="track-info">
        <span class="track-title">${escapeHtml(displayTitle)}</span>
        <span class="track-artist">${escapeHtml(displayArtist)}</span>
      </div>
      <span class="track-duration">${formatDuration(tune.duration_secs)}</span>
    `;

    li.addEventListener("click", () => {
      onTrackClick(tune);
    });
    tunesEl.appendChild(li);
  }
}
