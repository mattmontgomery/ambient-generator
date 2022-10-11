import * as Tone from "tone";

Tone.setContext(new Tone.Context({ lookAhead: 0.4 }));

export const lowSynth = new Tone.MonoSynth({
  volume: -30,
  oscillator: {
    type: "sine",
  },
  envelope: {
    attack: 10,
    decay: 10,
    sustain: 0.8,
    release: 10,
  },
  filterEnvelope: {
    attack: 1.06,
    decay: 0.9,
    sustain: 0.5,
    release: 20,
    baseFrequency: 100,
    octaves: 2,
    exponent: 1.2,
  },
})
  .connect(new Tone.Delay("4n").toDestination())
  .connect(new Tone.Reverb(188).toDestination())
  .connect(new Tone.Delay("4n").toDestination())
  .connect(new Tone.Freeverb(0.1).toDestination())
  .toDestination();

export const highSynth = new Tone.MonoSynth({
  volume: -40,
  oscillator: {
    type: "sine",
  },
  envelope: {
    attack: 10,
    decay: 10,
    sustain: 0.8,
    release: 10,
  },
  filterEnvelope: {
    attack: 1.06,
    decay: 0.9,
    sustain: 0.5,
    release: 20,
    baseFrequency: 100,
    octaves: 2,
    exponent: 1.2,
  },
})
  .connect(new Tone.Freeverb(0.4).toDestination())
  .connect(new Tone.Reverb(12).toDestination())
  .connect(new Tone.Delay("32n").toDestination())
  .connect(new Tone.Freeverb(0.8).toDestination())
  .toDestination();

export const userSynth = new Tone.DuoSynth({
  harmonicity: 1,
  volume: -35,
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
})
  .connect(new Tone.Freeverb(0.4).toDestination())
  .connect(new Tone.Reverb(12).toDestination())
  .connect(new Tone.Delay("16n").toDestination())
  .connect(new Tone.Freeverb(0.4).toDestination())
  .toDestination();
