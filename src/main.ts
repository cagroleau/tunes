import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface Tune {
  id: string;
  filename: string;
  path: string;
  title: string | null;
  artist: string | null;
  album: string | null;
  year: number | null;
  track_number: number | null;
  genre: string | null;
  duration_secs: number;
}

interface Library {
  tunes: Tune[];
}

interface PlaybackState {
  status: "Stopped" | "Playing" | "Paused";
  current_track_path: string | null;
  current_track_title: string | null;
  current_track_artist: string | null;
}

let tunes: Tune[] = [];
let currentTunePath: string | null = null;

// DOM elements
let tunesEl: HTMLUListElement;
let emptyStateEl: HTMLElement;
let musicPathEl: HTMLElement;
let trackTitleEl: HTMLElement;
let trackArtistEl: HTMLElement;
let playPauseBtn: HTMLButtonElement;
let stopBtn: HTMLButtonElement;
let prevBtn: HTMLButtonElement;
let nextBtn: HTMLButtonElement;

function formatDuration(secs: number): string {
  const minutes = Math.floor(secs / 60);
  const seconds = secs % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getCurrentTuneIndex(): number {
  if (!currentTunePath) return -1;
  return tunes.findIndex((t) => t.path === currentTunePath);
}

function renderTunes() {
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

    li.addEventListener("click", () => playTune(tune));
    tunesEl.appendChild(li);
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function playTune(tune: Tune) {
  const title = tune.title || tune.filename;
  const artist = tune.artist || "Unknown Artist";

  try {
    await invoke("play_track", {
      path: tune.path,
      title,
      artist,
    });
    currentTunePath = tune.path;
    updatePlayerUI("Playing", title, artist);
    renderTunes();
  } catch (e) {
    console.error("Failed to play tune:", e);
  }
}

async function playNext() {
  const currentIndex = getCurrentTuneIndex();
  if (currentIndex < 0 || currentIndex >= tunes.length - 1) return;
  await playTune(tunes[currentIndex + 1]);
}

async function playPrev() {
  const currentIndex = getCurrentTuneIndex();
  if (currentIndex <= 0) return;
  await playTune(tunes[currentIndex - 1]);
}

async function togglePlayPause() {
  try {
    const state = (await invoke("get_playback_state")) as PlaybackState;
    if (state.status === "Playing") {
      await invoke("pause");
      updatePlayerUI("Paused", state.current_track_title, state.current_track_artist);
    } else if (state.status === "Paused") {
      await invoke("resume");
      updatePlayerUI("Playing", state.current_track_title, state.current_track_artist);
    }
  } catch (e) {
    console.error("Failed to toggle play/pause:", e);
  }
}

async function stopPlayback() {
  try {
    await invoke("stop");
    // Keep currentTunePath so the track stays selected
    const tune = tunes.find((t) => t.path === currentTunePath);
    if (tune) {
      const title = tune.title || tune.filename;
      const artist = tune.artist || "Unknown Artist";
      updatePlayerUI("Stopped", title, artist);
    } else {
      updatePlayerUI("Stopped", null, null);
    }
  } catch (e) {
    console.error("Failed to stop:", e);
  }
}

function updatePlayerUI(
  status: PlaybackState["status"],
  title: string | null,
  artist: string | null
) {
  const currentIndex = getCurrentTuneIndex();
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < tunes.length - 1;

  if (status === "Stopped" || !title) {
    trackTitleEl.textContent = "Not playing";
    trackArtistEl.textContent = "";
    playPauseBtn.textContent = "▶";
    playPauseBtn.title = "Play";
    playPauseBtn.disabled = true;
    stopBtn.disabled = true;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  } else {
    trackTitleEl.textContent = title;
    trackArtistEl.textContent = artist || "";
    playPauseBtn.disabled = false;
    stopBtn.disabled = false;
    prevBtn.disabled = !hasPrev;
    nextBtn.disabled = !hasNext;

    if (status === "Playing") {
      playPauseBtn.textContent = "⏸";
      playPauseBtn.title = "Pause";
    } else {
      playPauseBtn.textContent = "▶";
      playPauseBtn.title = "Play";
    }
  }
}

async function loadLibrary() {
  try {
    const library = (await invoke("scan_library")) as Library;
    tunes = library.tunes;
    renderTunes();
  } catch (e) {
    console.error("Failed to scan library:", e);
  }
}

async function loadMusicPath() {
  try {
    const path = (await invoke("get_music_directory")) as string;
    musicPathEl.textContent = path;
  } catch (e) {
    console.error("Failed to get music path:", e);
  }
}

async function pollPlaybackState() {
  try {
    const state = (await invoke("get_playback_state")) as PlaybackState;

    // Check if track finished playing - autoplay next
    if (state.status === "Stopped" && currentTunePath !== null) {
      const currentIndex = getCurrentTuneIndex();
      const hasNext = currentIndex >= 0 && currentIndex < tunes.length - 1;

      if (hasNext) {
        // Autoplay next track
        await playTune(tunes[currentIndex + 1]);
      } else {
        // No more tracks, stop
        currentTunePath = null;
        updatePlayerUI("Stopped", null, null);
        renderTunes();
      }
    }
  } catch (e) {
    // Ignore polling errors
  }
}

async function setupEventListeners() {
  // Listen for library changes from the backend
  await listen<Library>("library-changed", (event) => {
    tunes = event.payload.tunes;
    renderTunes();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  tunesEl = document.querySelector("#tracks")!;
  emptyStateEl = document.querySelector("#empty-state")!;
  musicPathEl = document.querySelector("#music-path")!;
  trackTitleEl = document.querySelector("#track-title")!;
  trackArtistEl = document.querySelector("#track-artist")!;
  playPauseBtn = document.querySelector("#play-pause-btn")!;
  stopBtn = document.querySelector("#stop-btn")!;
  prevBtn = document.querySelector("#prev-btn")!;
  nextBtn = document.querySelector("#next-btn")!;

  playPauseBtn.addEventListener("click", togglePlayPause);
  stopBtn.addEventListener("click", stopPlayback);
  prevBtn.addEventListener("click", playPrev);
  nextBtn.addEventListener("click", playNext);

  loadMusicPath();
  loadLibrary();
  setupEventListeners();

  // Poll for playback state changes (e.g., track finished)
  setInterval(pollPlaybackState, 1000);
});
