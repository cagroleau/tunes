/**
 * Progress bar updates and interaction
 */

import { getDOMElements } from "./dom";
import { formatDuration } from "../utils/format";

export function updateProgressBar(position: number, duration: number): void {
  const { progressFillEl, currentTimeEl, totalTimeEl } = getDOMElements();

  if (duration > 0) {
    const percentage = Math.min((position / duration) * 100, 100);
    progressFillEl.style.width = `${percentage}%`;
    currentTimeEl.textContent = formatDuration(position);
    totalTimeEl.textContent = formatDuration(duration);
  } else {
    progressFillEl.style.width = "0%";
    currentTimeEl.textContent = "0:00";
    totalTimeEl.textContent = "0:00";
  }
}
