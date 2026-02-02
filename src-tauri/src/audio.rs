use rodio::stream::OutputStreamBuilder;
use rodio::{Decoder, Sink};
use serde::Serialize;
use std::fs::File;
use std::io::BufReader;
use std::sync::mpsc::{self, Receiver, Sender};
use std::sync::Mutex;
use std::thread;

#[derive(Debug, Clone, Serialize, PartialEq)]
pub enum PlaybackStatus {
    Stopped,
    Playing,
    Paused,
}

#[derive(Debug, Clone, Serialize)]
pub struct PlaybackState {
    pub status: PlaybackStatus,
    pub current_track_path: Option<String>,
    pub current_track_title: Option<String>,
    pub current_track_artist: Option<String>,
}

#[derive(Debug)]
pub enum AudioCommand {
    Play {
        path: String,
        title: String,
        artist: String,
    },
    Pause,
    Resume,
    Stop,
    GetState(Sender<PlaybackState>),
}

struct AudioThread {
    command_rx: Receiver<AudioCommand>,
}

impl AudioThread {
    fn run(self) {
        // Create the audio output stream - this must stay on this thread
        let stream = match OutputStreamBuilder::open_default_stream() {
            Ok(s) => s,
            Err(e) => {
                eprintln!("Failed to open audio output: {}", e);
                return;
            }
        };
        let mixer = stream.mixer();

        let mut sink: Option<Sink> = None;
        let mut current_track_path: Option<String> = None;
        let mut current_track_title: Option<String> = None;
        let mut current_track_artist: Option<String> = None;

        loop {
            match self.command_rx.recv() {
                Ok(cmd) => match cmd {
                    AudioCommand::Play {
                        path,
                        title,
                        artist,
                    } => {
                        // Stop any current playback
                        if let Some(s) = sink.take() {
                            s.stop();
                        }

                        // Open and decode the file
                        match File::open(&path) {
                            Ok(file) => {
                                let reader = BufReader::new(file);
                                match Decoder::new(reader) {
                                    Ok(source) => {
                                        let new_sink = Sink::connect_new(mixer);
                                        new_sink.append(source);
                                        sink = Some(new_sink);
                                        current_track_path = Some(path);
                                        current_track_title = Some(title);
                                        current_track_artist = Some(artist);
                                    }
                                    Err(e) => {
                                        eprintln!("Failed to decode audio: {}", e);
                                    }
                                }
                            }
                            Err(e) => {
                                eprintln!("Failed to open file: {}", e);
                            }
                        }
                    }
                    AudioCommand::Pause => {
                        if let Some(ref s) = sink {
                            s.pause();
                        }
                    }
                    AudioCommand::Resume => {
                        if let Some(ref s) = sink {
                            s.play();
                        }
                    }
                    AudioCommand::Stop => {
                        if let Some(s) = sink.take() {
                            s.stop();
                        }
                        current_track_path = None;
                        current_track_title = None;
                        current_track_artist = None;
                    }
                    AudioCommand::GetState(response_tx) => {
                        let status = match &sink {
                            Some(s) if s.empty() => PlaybackStatus::Stopped,
                            Some(s) if s.is_paused() => PlaybackStatus::Paused,
                            Some(_) => PlaybackStatus::Playing,
                            None => PlaybackStatus::Stopped,
                        };

                        // Clear track info if playback finished
                        let (path, title, artist) = if status == PlaybackStatus::Stopped {
                            (None, None, None)
                        } else {
                            (
                                current_track_path.clone(),
                                current_track_title.clone(),
                                current_track_artist.clone(),
                            )
                        };

                        let state = PlaybackState {
                            status,
                            current_track_path: path,
                            current_track_title: title,
                            current_track_artist: artist,
                        };

                        let _ = response_tx.send(state);
                    }
                },
                Err(_) => {
                    // Channel closed, exit thread
                    break;
                }
            }
        }
    }
}

pub struct AppState {
    command_tx: Mutex<Option<Sender<AudioCommand>>>,
}

impl AppState {
    pub fn new() -> Self {
        let (command_tx, command_rx) = mpsc::channel();

        // Spawn the audio thread
        thread::spawn(move || {
            let audio_thread = AudioThread { command_rx };
            audio_thread.run();
        });

        Self {
            command_tx: Mutex::new(Some(command_tx)),
        }
    }

    pub fn send_command(&self, cmd: AudioCommand) -> Result<(), String> {
        let guard = self.command_tx.lock().map_err(|e| e.to_string())?;
        if let Some(tx) = guard.as_ref() {
            tx.send(cmd).map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn get_playback_state(&self) -> Result<PlaybackState, String> {
        let (response_tx, response_rx) = mpsc::channel();
        self.send_command(AudioCommand::GetState(response_tx))?;
        response_rx
            .recv()
            .map_err(|e| format!("Failed to get state: {}", e))
    }
}
