/**
 * DOM element management
 * Centralizes all DOM queries and provides cached access to elements
 */

export interface DOMElements {
  tunesEl: HTMLUListElement;
  emptyStateEl: HTMLElement;
  musicPathEl: HTMLElement;
  trackTitleEl: HTMLElement;
  trackArtistEl: HTMLElement;
  playPauseBtn: HTMLButtonElement;
  stopBtn: HTMLButtonElement;
  prevBtn: HTMLButtonElement;
  nextBtn: HTMLButtonElement;
  currentTimeEl: HTMLElement;
  totalTimeEl: HTMLElement;
  progressFillEl: HTMLElement;
}

let cachedElements: DOMElements | null = null;

/**
 * Query and cache all DOM elements
 * Should be called once during initialization
 */
export function queryDOMElements(): DOMElements {
  const elements: DOMElements = {
    tunesEl: document.querySelector("#tracks")!,
    emptyStateEl: document.querySelector("#empty-state")!,
    musicPathEl: document.querySelector("#music-path")!,
    trackTitleEl: document.querySelector("#track-title")!,
    trackArtistEl: document.querySelector("#track-artist")!,
    playPauseBtn: document.querySelector("#play-pause-btn")!,
    stopBtn: document.querySelector("#stop-btn")!,
    prevBtn: document.querySelector("#prev-btn")!,
    nextBtn: document.querySelector("#next-btn")!,
    currentTimeEl: document.querySelector("#current-time")!,
    totalTimeEl: document.querySelector("#total-time")!,
    progressFillEl: document.querySelector("#progress-fill")!,
  };

  cachedElements = elements;
  return elements;
}

/**
 * Get cached DOM elements
 * Must call queryDOMElements() first
 */
export function getDOMElements(): DOMElements {
  if (!cachedElements) {
    throw new Error("DOM elements not initialized. Call queryDOMElements() first.");
  }
  return cachedElements;
}
