/**
 * Shared type definitions
 */

export interface Tune {
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

export interface Library {
  tunes: Tune[];
}

export interface PlaybackState {
  status: "Stopped" | "Playing" | "Paused";
  current_track_path: string | null;
  current_track_title: string | null;
  current_track_artist: string | null;
  position_secs: number;
  duration_secs: number;
}

export type PlaybackStatus = PlaybackState["status"];
