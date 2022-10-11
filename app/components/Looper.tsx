import { Collection, Scale } from "@tonaljs/tonal";
import { useCallback, useEffect, useState } from "react";
import type { Notey } from "~/util/music.client";
import { getNotes, perform } from "~/util/music.client";

export function Looper(props: {
  duration: number;
  enabled: boolean;
  root: string;
  scale: string;
  synth: any;
  onComplete: () => string;
  onPlayNote: (note: Notey) => void;
}): React.ReactElement {
  const { enabled, root, duration, scale, synth, onComplete, onPlayNote } =
    props;
  const [interval, setInterval] = useState<number>();
  const playLoop = useCallback(
    async (notes: { note: string; duration: number; delay: number }[]) => {
      const playNotes = notes.map((note, idx) => {
        if (idx === 0) {
          return {
            ...note,
            duration: note.duration / duration,
          };
        } else {
          return {
            ...note,
            delay: notes
              .slice(0, idx)
              .reduce((acc, curr) => acc + curr.duration * (1 / duration), 0),
            duration: note.duration * (1 / duration),
          };
        }
      });
      for await (const play of playNotes.map((n) => perform({ ...n, synth }))) {
        onPlayNote(play.note);
        await play.playNote();
      }
    },
    [duration, onPlayNote, synth]
  );
  useEffect(() => {
    if (!enabled) {
      window.clearInterval(interval);
      setInterval(undefined);
      return;
    }
    if (!interval) {
      const notes = Collection.shuffle(getNotes(Scale.get(`${root} ${scale}`)));
      const runtime = notes.reduce(
        (acc, curr) => acc + curr.duration * (1 / duration),
        0
      );
      playLoop(notes);
      setInterval(
        window.setInterval(() => {
          const scaleName = onComplete();
          const notes = Collection.shuffle(
            getNotes(Scale.get(`${root} ${scaleName}`))
          );
          playLoop(notes);
        }, runtime * 1000)
      );
    }
  }, [enabled, duration, playLoop, interval, onComplete, root, scale]);
  return <></>;
}
