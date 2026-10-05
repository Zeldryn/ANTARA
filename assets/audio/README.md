# Antariksa audio

All seven WAV files are original, deterministic synthesized audio made for this
project with `tools/generate_audio.py`. No commercial music, sampled recordings,
or third-party audio assets are included. These original audio assets may be
used, modified, and redistributed with this project without attribution.

| File | Purpose |
| --- | --- |
| `orbital-dawn-music.wav` | Seamless 32-second atmospheric score; warm pads and sparse bells |
| `launch-facility-ambience.wav` | Seamless 12-second wind, ventilation, distant rocket hum |
| `engine-ignition-rumble.wav` | 4.8-second soft ignition swell |
| `rocket-ascent-roar.wav` | 3.7-second layered rocket roar with a receding exhaust tail |
| `soft-ui-hover.wav` | Quiet 0.18-second UI tone, only after audio has been unlocked |
| `mission-activation.wav` | 0.85-second rising activation cue |
| `mission-ready-chime.wav` | 1.7-second resolved preparation chime |

Format: stereo, 24 kHz, 16-bit PCM WAV. Regenerate with Python and NumPy:
`python tools/generate_audio.py`.

## Replacing audio

Replace a file using the same filename, or edit `AUDIO_ASSETS` in `script.js`.
Use audio you own or have permission to distribute. Music and ambience should
loop seamlessly. `MissionAudio.startMission()` contains volumes and cue timings.
The default master gain is 0.48, with a separate quieter gain for each layer.

Nothing plays on initial load. A click on “Siap Meluncur?” unlocks Web Audio;
music fades in over 1.8 seconds. Ignition starts at 2.4 seconds, the stronger
ascent roar at 4.55 seconds, music recedes at 6.75 seconds, and the closing chime
begins at 8.3 seconds. These times come from `LAUNCH_TIMING`. Mute fades over 0.4
seconds and is remembered locally. Returning to the opening fades all sources
out over 1.1 seconds. Hidden tabs fade out and suspend audio.

Serve through HTTP; browsers commonly block audio fetching on `file://`.
Missing/undecodable files, denied playback, or unavailable Web Audio never block
the landing scene or transition. If the music cannot load, the control reports
“AUDIO TIDAK TERSEDIA”; independently available effects can still play.
If only an effect fails, “AUDIO TERBATAS” explicitly indicates partial audio.
