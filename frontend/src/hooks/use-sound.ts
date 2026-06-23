import { useCallback } from "react";
import { useGameStore } from "@/stores/game.store";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx || ctx.state === "closed") {
    ctx = new AudioContext();
  }
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  return ctx;
}

function playBetSound(ac: AudioContext) {
  const gain = ac.createGain();
  gain.connect(ac.destination);

  const osc = ac.createOscillator();
  osc.connect(gain);
  osc.type = "sine";

  const t = ac.currentTime;
  osc.frequency.setValueAtTime(700, t);
  osc.frequency.linearRampToValueAtTime(950, t + 0.06);
  gain.gain.setValueAtTime(0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

  osc.start(t);
  osc.stop(t + 0.1);
}

function playCashoutSound(ac: AudioContext) {
  // Ascending arpeggio: C5 → E5 → G5 → C6
  const notes = [523, 659, 784, 1047];
  const noteDuration = 0.09;

  notes.forEach((freq, i) => {
    const gain = ac.createGain();
    gain.connect(ac.destination);

    const osc = ac.createOscillator();
    osc.connect(gain);
    osc.type = "sine";

    const t = ac.currentTime + i * noteDuration;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + noteDuration + 0.05);

    osc.start(t);
    osc.stop(t + noteDuration + 0.05);
  });
}

function playCrashSound(ac: AudioContext) {
  const t = ac.currentTime;

  // Sub-bass kick: the core "boom" impact
  const kick = ac.createOscillator();
  const kickGain = ac.createGain();
  kick.connect(kickGain);
  kickGain.connect(ac.destination);
  kick.type = "sine";
  kick.frequency.setValueAtTime(160, t);
  kick.frequency.exponentialRampToValueAtTime(32, t + 0.18);
  kickGain.gain.setValueAtTime(0.9, t);
  kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  kick.start(t);
  kick.stop(t + 0.35);

  // Square wave crunch for the "explosion" texture
  const crunch = ac.createOscillator();
  const crunchGain = ac.createGain();
  crunch.connect(crunchGain);
  crunchGain.connect(ac.destination);
  crunch.type = "square";
  crunch.frequency.setValueAtTime(200, t);
  crunch.frequency.exponentialRampToValueAtTime(48, t + 0.22);
  crunchGain.gain.setValueAtTime(0.18, t);
  crunchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  crunch.start(t);
  crunch.stop(t + 0.28);

  // Filtered noise burst — sharp impact transient
  const bufferSize = Math.floor(ac.sampleRate * 0.3);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  const noiseGain = ac.createGain();
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ac.destination);
  noiseGain.gain.setValueAtTime(0.55, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  noise.start(t);
}

function playRoundStartSound(ac: AudioContext) {
  const t = ac.currentTime;

  // Two slightly detuned sawtooth oscillators — "rocket engine igniting"
  for (const freq of [210, 216]) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq * 0.4, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.18);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    osc.start(t);
    osc.stop(t + 0.38);
  }

  // High "ping" at the end — launch confirmed
  const ping = ac.createOscillator();
  const pingGain = ac.createGain();
  ping.connect(pingGain);
  pingGain.connect(ac.destination);
  ping.type = "sine";
  ping.frequency.setValueAtTime(1100, t + 0.18);
  ping.frequency.linearRampToValueAtTime(1800, t + 0.38);
  pingGain.gain.setValueAtTime(0, t + 0.18);
  pingGain.gain.linearRampToValueAtTime(0.3, t + 0.22);
  pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  ping.start(t + 0.18);
  ping.stop(t + 0.5);
}

export function useSound() {
  const soundEnabled = useGameStore((s) => s.soundEnabled);

  const play = useCallback(
    (fn: (ac: AudioContext) => void) => {
      if (!soundEnabled) return;
      try {
        fn(getCtx());
      } catch {
        // AudioContext blocked or unavailable — silently ignore
      }
    },
    [soundEnabled],
  );

  return {
    playBet: useCallback(() => play(playBetSound), [play]),
    playCashout: useCallback(() => play(playCashoutSound), [play]),
    playCrash: useCallback(() => play(playCrashSound), [play]),
    playRoundStart: useCallback(() => play(playRoundStartSound), [play]),
  };
}
