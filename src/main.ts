/**
 * Application entry point
 * Initializes and wires up all modules
 */

import { queryDOMElements, getDOMElements } from "./ui/dom";
import { loadLibrary, loadMusicPath, setupLibraryEventListener } from "./lib/library";
import { togglePlayPause, stopPlayback, playNext, playPrevious } from "./lib/player";
import { startPlaybackPoller } from "./services/poller";

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // Initialize DOM
    queryDOMElements();

    // Attach button event listeners
    const { playPauseBtn, stopBtn, prevBtn, nextBtn } = getDOMElements();
    playPauseBtn.addEventListener("click", togglePlayPause);
    stopBtn.addEventListener("click", stopPlayback);
    prevBtn.addEventListener("click", playPrevious);
    nextBtn.addEventListener("click", playNext);

    // Load data
    await loadMusicPath();
    await loadLibrary();
    await setupLibraryEventListener();

    // Start polling
    startPlaybackPoller();
  } catch (e) {
    console.error("Error during initialization:", e);
  }
});
