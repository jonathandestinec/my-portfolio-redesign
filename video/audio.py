"""Soundtrack for the project films: 12.075 s, 48 kHz stereo, no voice.

Synthesized here (no licensed samples): a 124 BPM house groove with a soft intro
and the drop on beat 5 (2.467 s), plus the cut effects. Then mastered with
ffmpeg loudnorm to -14 LUFS / -1 dBTP, with a 60 ms fade at the very end only.

    python3 -I video/audio.py out.wav
"""
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np

SR = 48_000
DUR = 12.075
N = int(SR * DUR)
BEAT = 60 / 124  # 0.4838 s
beat_t = lambda k: 0.048 + BEAT * k  # noqa: E731
rng = np.random.default_rng(124)  # seeded: the same file every time

t = np.arange(N) / SR
L = np.zeros(N)
R = np.zeros(N)


def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i : i + len(sig)] += sig * (1 - max(pan, 0))
    R[i : i + len(sig)] += sig * (1 + min(pan, 0))


def env(n, a, d, sustain=0.0, curve=4.0):
    """Attack then exponential decay, n samples."""
    x = np.arange(n) / SR
    e = np.minimum(x / max(a, 1e-4), 1.0) * np.exp(-curve * np.maximum(x - a, 0) / max(d, 1e-4))
    return np.maximum(e, sustain * (x < d))


def lowpass(x, cutoff):
    """One-pole low-pass (cheap, smooth)."""
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def note(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


# ---------- instruments ----------
def kick():
    n = int(0.35 * SR)
    x = np.arange(n) / SR
    f = 46 + 110 * np.exp(-x * 38)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-x * 9) * 0.9


def hat(open_=False):
    n = int((0.16 if open_ else 0.05) * SR)
    s = highpass(rng.standard_normal(n), 7000)
    return s * env(n, 0.001, 0.09 if open_ else 0.025) * 0.25


def clap():
    n = int(0.22 * SR)
    s = highpass(lowpass(rng.standard_normal(n), 3000), 900)
    e = np.zeros(n)
    for d in (0, 0.009, 0.018):
        e += env(n, 0.0005, 0.03) * (np.arange(n) >= int(d * SR))
    return s * e * 0.25 + s * env(n, 0.001, 0.12) * 0.12


def pad(midis, dur, bright=0.0):
    n = int(dur * SR)
    x = np.arange(n) / SR
    out = np.zeros(n)
    for m in midis:
        for det in (-0.08, 0.08):
            f = note(m) * 2 ** (det / 12)
            out += np.sin(2 * np.pi * f * x) + 0.3 * np.sin(4 * np.pi * f * x) * bright
    out *= np.minimum(x / 0.25, 1) * np.minimum((dur - x) / 0.2, 1)
    return out / (len(midis) * 2) * 0.35


def stab(midis, dur=0.22):
    n = int(dur * SR)
    x = np.arange(n) / SR
    out = np.zeros(n)
    for m in midis:
        f = note(m)
        # Soft saw (a few harmonics), quick decay.
        for h in range(1, 6):
            out += np.sin(2 * np.pi * f * h * x) / h
    return lowpass(out * env(n, 0.003, 0.18), 2600) / len(midis) * 0.32


def bass(midi, dur):
    n = int(dur * SR)
    x = np.arange(n) / SR
    f = note(midi)
    s = np.sin(2 * np.pi * f * x) + 0.25 * np.sin(4 * np.pi * f * x)
    return s * env(n, 0.004, dur * 0.9, curve=2.5) * 0.42


# ---------- the groove ----------
CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
ROOTS = [33, 29, 36, 31]

# Soft intro: a filtered pad and a ticking hat, beats 0–4.
add(lowpass(pad(CHORDS[0], beat_t(5) - 0.0), 900), 0.0, 0.9)
for k in range(0, 5):
    add(hat(), beat_t(k) + BEAT / 2, 0.45)

# The drop on beat 5: four-on-the-floor, claps on 2 and 4, off-beat hats, bass and stabs.
for k in range(5, 26):
    tk = beat_t(k)
    add(kick(), tk, 1.0)
    add(hat(open_=True), tk + BEAT / 2, 0.55, pan=0.2)
    add(hat(), tk + BEAT * 0.25, 0.3, pan=-0.2)
    if k % 2 == 0:
        add(clap(), tk, 0.9)
    bar = ((k - 5) // 4) % 4
    add(bass(ROOTS[bar], BEAT * 0.45), tk + BEAT / 2, 1.0)
    if (k - 5) % 4 in (0, 2):
        add(stab([m + 12 for m in CHORDS[bar]]), tk + BEAT * 0.75, 1.0, pan=0.1)
for bar in range(5):
    add(pad(CHORDS[bar % 4], BEAT * 4, bright=0.4), beat_t(5 + bar * 4), 0.55)


# ---------- effects ----------
def whoosh(peak, length=0.7, gain=0.5):
    n = int(length * SR)
    x = np.arange(n) / SR
    s = rng.standard_normal(n)
    # Rising band of noise, loudest at the peak (70% through).
    shape = np.exp(-(((x - length * 0.7) / (length * 0.22)) ** 2))
    s = lowpass(s, 4200) - lowpass(s, 500)
    add(s * shape * gain, peak - length * 0.7, 1.0)


def click(at, gain=0.35):
    n = int(0.02 * SR)
    s = highpass(rng.standard_normal(n), 2500) * env(n, 0.0003, 0.004)
    add(s, at, gain)


def hit(at, gain=0.6):
    n = int(0.6 * SR)
    x = np.arange(n) / SR
    body = np.sin(2 * np.pi * (60 + 80 * np.exp(-x * 30)) * x) * np.exp(-x * 7)
    air = highpass(rng.standard_normal(n), 3000) * np.exp(-x * 14) * 0.3
    add((body + air) * gain, at)


def shimmer(at, gain=0.22):
    n = int(1.6 * SR)
    x = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * note(m) * x) for m in (81, 84, 88, 93)) / 4
    add(s * np.minimum(x / 0.08, 1) * np.exp(-x * 2.2) * gain, at)


add(np.sin(2 * np.pi * 55 * np.arange(int(0.25 * SR)) / SR) * env(int(0.25 * SR), 0.004, 0.15) * 0.5, 0.10)  # soft impact
for p in (2.402, 3.370, 5.305, 10.043):
    whoosh(p)
for h in (6.240, 8.175):
    hit(h)
for c in (2.33, 3.83):
    click(c)
tk = 4.04
while tk <= 5.00:  # very quiet key ticks while the prompt types
    click(tk, 0.06)
    tk += 0.032
shimmer(10.05)

# ---------- write, then master ----------
mix = np.stack([L, R], axis=1)
mix /= max(1e-9, np.abs(mix).max()) * 1.25
fade = int(0.06 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]

out = sys.argv[1] if len(sys.argv) > 1 else "audio.wav"
with tempfile.TemporaryDirectory() as d:
    raw = os.path.join(d, "raw.wav")
    with wave.open(raw, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.87:level=false,aresample=48000", "-t", f"{DUR}", out],
        check=True,
    )
print(f"wrote {out}")
