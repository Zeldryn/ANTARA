"""Generate original, sample-free audio for ANTARA (Antariksa Nusantara). Requires Python + NumPy.

Run from any directory: python tools/generate_audio.py
All notes, synthesis, and deterministic noise are created here; no recordings,
external sound libraries, or existing musical compositions are used.
"""
from pathlib import Path
import wave
import numpy as np

RATE = 24000
OUT = Path(__file__).resolve().parents[1] / "assets" / "audio"
OUT.mkdir(parents=True, exist_ok=True)
RNG = np.random.default_rng(2026)


def save(name, signal, peak=0.65):
    signal = np.asarray(signal)
    if signal.ndim == 1:
        signal = np.column_stack((signal, signal))
    signal -= signal.mean(axis=0)
    signal *= peak / max(np.max(np.abs(signal)), 1e-9)
    with wave.open(str(OUT / name), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes((signal * 32767).astype("<i2").tobytes())
    print(f"{name}: {len(signal) / RATE:.2f}s, peak {np.max(np.abs(signal)):.3f}")


def frequency(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def ring_add(target, sound, start, pan=0):
    indices = (np.arange(len(sound)) + int(start * RATE)) % len(target)
    # Equal-power panning, with all musical tails wrapped for a seamless loop.
    np.add.at(target[:, 0], indices, sound * np.sqrt((1 - pan) / 2))
    np.add.at(target[:, 1], indices, sound * np.sqrt((1 + pan) / 2))


def reverb(signal, circular=False):
    result = signal.copy()
    for delay, level in [(0.137, 0.15), (0.283, 0.12), (0.457, 0.09), (0.719, 0.06), (1.13, 0.04)]:
        shift = int(delay * RATE)
        echo = np.roll(signal[:, ::-1], shift, axis=0)
        if not circular:
            echo[:shift] = 0
        result += echo * level
    return result


def pad(midi, seconds=10):
    t = np.arange(int(seconds * RATE)) / RATE
    f = frequency(midi)
    envelope = np.minimum(t / 2, 1) * np.minimum((seconds - t) / 2, 1)
    envelope = np.sin(np.clip(envelope, 0, 1) * np.pi / 2) ** 2
    tone = (np.sin(2 * np.pi * f * t) + 0.26 * np.sin(2 * np.pi * f * 1.0018 * t)
            + 0.13 * np.sin(2 * np.pi * f * 2 * t) + 0.04 * np.sin(2 * np.pi * f * 3 * t))
    return tone * envelope * (0.96 + 0.04 * np.sin(2 * np.pi * 0.19 * t))


def bell(midi, seconds=3.5):
    t = np.arange(int(seconds * RATE)) / RATE
    f = frequency(midi)
    envelope = (1 - np.exp(-t * 35)) * np.exp(-t * 1.6) * np.minimum((seconds - t) / 0.3, 1)
    return (np.sin(2 * np.pi * f * t) + 0.12 * np.sin(2 * np.pi * f * 2 * t)) * envelope


def colored_noise(seconds, low, high):
    length = int(seconds * RATE)
    bins = np.fft.rfftfreq(length, 1 / RATE)
    spectrum = np.fft.rfft(RNG.standard_normal(length))
    weights = 1 / np.sqrt(np.maximum(bins, 1))
    weights *= (1 - np.exp(-(bins / low) ** 4)) * np.exp(-(bins / high) ** 4)
    sound = np.fft.irfft(spectrum * weights, n=length)
    return sound / max(np.std(sound), 1e-8)


# 32-second ambient score: four spacious eight-second chords, no percussion.
music = np.zeros((RATE * 32, 2))
chords = [(50, 57, 61, 64, 69), (45, 57, 59, 64, 69), (47, 54, 57, 62, 66), (43, 55, 59, 62, 69)]
for i, chord in enumerate(chords):
    for j, note in enumerate(chord):
        ring_add(music, pad(note) * (0.11 if j else 0.14), i * 8 - 1, (j - 2) * 0.25)
    for j, note in enumerate([chord[2] + 12, chord[3] + 12, chord[4] + 12, chord[3] + 12]):
        ring_add(music, bell(note) * 0.045, i * 8 + j * 2 + 0.5, (-1) ** j * 0.4)
save("orbital-dawn-music.wav", reverb(music, circular=True), 0.7)

# Periodic filtered noise: soft wind, ventilation, and a distant engine bed.
seconds = 12
t = np.arange(RATE * seconds) / RATE
wind = colored_noise(seconds, 180, 1500) * (0.055 + 0.012 * np.sin(2 * np.pi * t / seconds))
rumble = colored_noise(seconds, 30, 120) * 0.055
hum = 0.012 * np.sin(2 * np.pi * 48 * t) + 0.006 * np.sin(2 * np.pi * 96 * t)
ambience = np.column_stack((wind + rumble + hum, np.roll(wind, 1200) + rumble + hum))
save("launch-facility-ambience.wav", ambience, 0.45)

seconds = 4.8
t = np.arange(int(RATE * seconds)) / RATE
envelope = np.sin(np.minimum(t / 1.8, 1) * np.pi / 2) ** 2 * np.minimum((seconds - t) / 1.7, 1) ** 2
ignition = (0.15 * colored_noise(seconds, 26, 180) + 0.018 * colored_noise(seconds, 200, 850)
            + 0.03 * np.sin(2 * np.pi * (42 * t + 2 * t * t))) * envelope
save("engine-ignition-rumble.wav", ignition, 0.62)

# Liftoff: layered low-frequency pressure, controlled broadband exhaust, and a
# rising turbine texture. The long release suggests the vehicle receding overhead.
seconds = 3.7
t = np.arange(int(RATE * seconds)) / RATE
attack = (1 - np.exp(-t * 8)) ** 2
release = np.minimum((seconds - t) / 2.3, 1) ** 2
pressure = colored_noise(seconds, 28, 240) * 0.22
exhaust = colored_noise(seconds, 120, 2300) * 0.065
turbine = np.sin(2 * np.pi * (62 * t + 6 * t ** 2)) * 0.024
roar = (pressure + exhaust + turbine) * attack * release
stereo_roar = np.column_stack((roar, 0.94 * roar + 0.06 * np.roll(roar, 160)))
# Explicit edge taper prevents the stereo delay from introducing a boundary click.
stereo_roar *= np.minimum(t / 0.02, 1)[:, None]
stereo_roar *= np.minimum((seconds - t) / 0.08, 1)[:, None]
save("rocket-ascent-roar.wav", reverb(stereo_roar), 0.82)

for name, notes, duration, peak in [
    ("soft-ui-hover.wav", [81], 0.18, 0.30),
    ("mission-activation.wav", [62, 69, 74], 0.85, 0.55),
    ("mission-ready-chime.wav", [74, 78, 81], 1.7, 0.45),
]:
    effect = np.zeros((int(duration * RATE), 2))
    for i, note in enumerate(notes):
        start = int(i * 0.1 * RATE)
        length = len(effect) - start
        tt = np.arange(length) / RATE
        env = (1 - np.exp(-tt * 140)) * np.exp(-tt * (24 if duration < 0.2 else 6))
        env *= np.minimum((length / RATE - tt) / 0.06, 1)
        tone = np.sin(2 * np.pi * frequency(note) * tt) * env
        effect[start:] += np.column_stack((tone, tone)) * 0.2
    save(name, reverb(effect), peak)
