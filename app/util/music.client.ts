import { Collection } from "@tonaljs/tonal";
import { pTimeout } from "./timeout";

export type Notey = {
  note: string;
  duration: number;
  delay: number;
};

export function getNotes(scale: Required<{ notes: string[] }>) {
  return Collection.shuffle(scale.notes).map((n: string, idx) => ({
    note: n,
    duration: Math.floor(Math.random() * 30) + 10,
    delay: idx > 0 ? 8 : 0,
  }));
}

export async function perform({
  note,
  duration,
  delay,
  synth,
}: Notey & { synth: any }): Promise<{
  note: Notey;
  playNote: () => Promise<void>;
}> {
  return new Promise(async (resolve) => {
    await pTimeout(delay * 1000);
    const playNote = async () => {
      try {
        synth.triggerAttackRelease(note, duration);
      } catch (e) {
        console.error(e);
      }
      // console.log(synth);
      await pTimeout(duration * 1.125 * 1000);
    };
    resolve({
      note: { note, duration, delay },
      playNote,
    });
  });
}
