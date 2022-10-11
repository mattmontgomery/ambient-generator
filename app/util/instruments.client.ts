import * as Tone from "tone";
import type { PolySynthOptions, Synth } from "tone";

Tone.setContext(new Tone.Context({ lookAhead: 0.1 }));

export function getSynth<T extends Synth>(
  options: Partial<PolySynthOptions<T>> = {},
  root = Tone.PolySynth
) {
  return new root(options).toDestination();
}

export function play({
  notes,
  duration = "4n",
  synth = defaultSynth,
}: {
  notes: Tone.Unit.Frequency | Tone.Unit.Frequency[];
  octave?: number;
  synth?: Tone.PolySynth;
  duration?: Tone.Unit.Time | Tone.Unit.Time[];
}) {
  synth.triggerAttackRelease(notes, duration);
}

export function getNow() {
  return Tone.now();
}

// const envelope = new Tone.AmplitudeEnvelope({
//   attack: 1,
//   attackCurve: "linear",
//   sustain: 0.6,
//   decay: 0.7,
//   release: 1,
//   releaseCurve: "linear",
// });

export const lowSynth = new Tone.MonoSynth({
  volume: -10,
  oscillator: {
    type: "sine",
  },
  envelope: {
    attack: 1,
    decay: 1,
    sustain: 0.9,
    release: 1,
  },
  filterEnvelope: {
    attack: 0.06,
    decay: 0.2,
    sustain: 0.5,
    release: 2,
    baseFrequency: 100,
    octaves: 7,
    exponent: 1.2,
  },
}).toDestination();

export const highSynth = new Tone.DuoSynth({
  harmonicity: 1,
  volume: -20,
  voice0: {
    oscillator: { type: "sawtooth" },
    envelope: {
      attack: 0.1,
      release: 4,
      releaseCurve: "linear",
    },
    filterEnvelope: {
      baseFrequency: 200,
      octaves: 4,
      attack: 2,
      decay: 0,
      release: 1000,
    },
  },
  voice1: {
    oscillator: { type: "sine" },
    envelope: {
      attack: 0.1,
      release: 4,
      releaseCurve: "linear",
    },
    filterEnvelope: {
      baseFrequency: 50,
      octaves: 1,
      attack: 10,
      decay: 40,
      release: 1000,
    },
  },
  vibratoRate: 0.5,
  vibratoAmount: 0.1,
}).toDestination();

export const defaultSynth = getSynth({});
