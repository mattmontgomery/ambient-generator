import { useCallback, useEffect, useState } from "react";
import { highSynth, lowSynth, userSynth } from "~/util/instruments.client";
import { Note, Collection, Scale } from "@tonaljs/tonal";
import { useFetcher } from "@remix-run/react";
import type Pusher from "pusher-js";
import { getNotes, perform } from "~/util/music.client";
import type { Notey } from "~/util/music.client";
import { Looper } from "./Looper";
import { Dot } from "./Dot";
import Line from "./Line";

export type MusicProps = {
  pusher: Pusher;
  user: string;
};

export default function Music(props: MusicProps): React.ReactElement {
  const { submit } = useFetcher();

  const [root] = useState<string>("D4");
  const [loopRoot] = useState<string>("D2");
  const [scaleName, setScaleName] = useState<string>("enigmatic");

  const [loopEnabled, setLoopEnabled] = useState<boolean>(false);
  const [duration] = useState<number>(4);
  const [bgColor, setBgColor] = useState<string>(`bg-slate-500`);
  const [chordsEnabled, setChordsEnabled] = useState<boolean>(false);
  const [activeHighNotes, setActiveHighNotes] = useState<
    (Notey & { x: number })[]
  >([]);
  const [activeUserNotes, setActiveUserNotes] = useState<
    (Notey & { x: number; y: number })[]
  >([]);

  const playUserNote = useCallback(
    async (note: Notey & { x: number; y: number }, self = false) => {
      const { playNote } = await perform({ ...note, synth: userSynth });
      if (self) {
        submit(
          { note: JSON.stringify(note) },
          { method: "post", action: "/play" }
        );
      }
      setActiveUserNotes((a) => [...a, note]);
      await playNote();
      setActiveUserNotes((a) => [
        ...a.slice(0, a.indexOf(note)),
        ...a.slice(a.indexOf(note) + 1),
      ]);
    },
    [setActiveUserNotes, submit]
  );

  useEffect(() => {
    const channel = props.pusher.subscribe("level-up");
    channel.bind(
      "note_played",
      (event: { message: string; userId: string }) => {
        if (event.userId !== props.user) {
          const note = JSON.parse(event.message);
          playUserNote(note, false);
        }
      }
    );
  }, [props.pusher, props.user, playUserNote]);

  return (
    <div className={`grid grid-cols-12 h-full`}>
      <Looper
        duration={duration}
        enabled={loopEnabled}
        onComplete={() => {
          const newScale = Collection.shuffle(Scale.names())[0];
          setScaleName(newScale);
          return newScale;
        }}
        onPlayNote={(note) => {
          const freq = Note.get(String(note.note).split(",")?.[0]).freq;
          setBgColor(transformFrequencyToBackgroundColor(freq ?? 1));
        }}
        root={loopRoot}
        scale={scaleName}
        synth={lowSynth}
      />
      <Looper
        scale={scaleName}
        root={root}
        duration={duration * 2}
        enabled={chordsEnabled}
        onComplete={() => scaleName}
        onPlayNote={(note) => {
          setActiveHighNotes([
            { ...note, x: ((Note.get(note.note).midi ?? 0) % 8) / 8 },
          ]);
        }}
        synth={highSynth}
      />
      <div className="grid gap-1 col-span-2">
        <select
          value={scaleName}
          onChange={(ev) => {
            const newScaleName = ev.target.value;
            setScaleName(newScaleName);
          }}
        >
          {Scale.names().map((opt, idx) => (
            <option key={idx}>{opt}</option>
          ))}
        </select>
        <button
          className="bg-slate-800 text-white rounded p-4"
          onClick={() => {
            setLoopEnabled(!loopEnabled);
          }}
        >
          {loopEnabled ? "stop repeating" : "play"} base tones
        </button>
        <button
          className="bg-slate-700 text-white rounded p-4"
          onClick={() => setChordsEnabled(!chordsEnabled)}
        >
          {!chordsEnabled ? "play high tones" : "stop high tones"}
        </button>
        <div className="p-4">
          volume
          <input
            onChange={(ev) => {
              lowSynth.set({ volume: Number(ev.target.value) });
              highSynth.set({ volume: Number(ev.target.value) - 10 });
              userSynth.set({ volume: Number(ev.target.value) - 10 });
            }}
            type="range"
            min="-100"
            max="-10"
            defaultValue={0}
            id="myRange"
          />
        </div>
      </div>
      <div
        className={`${bgColor} col-span-10 transition-colors relative duration-[${
          (1 / duration) * 10_000
        }ms]`}
        onMouseDown={async (ev) => {
          const x =
            (ev.pageX - ev.currentTarget.offsetLeft) /
            ev.currentTarget.offsetWidth;
          const y =
            (ev.pageY - ev.currentTarget.offsetTop) /
            ev.currentTarget.offsetHeight;
          const notes = getNotes(Scale.get(`${root} ${scaleName}`));
          const newNote = Collection.shuffle(notes)[0];
          const note = {
            note: newNote.note,
            delay: 0,
            duration: 1 / duration,
            x,
            y,
          };
          playUserNote(note, true);
        }}
      >
        <div className="absolute top-0 bottom-0 left-0 right-0 bg-red overflow-hidden">
          {activeHighNotes.map((note, idx) => {
            return <Line x={note.x} key={idx} />;
          })}
          {activeUserNotes.map((note, idx) => {
            return <Dot x={note.x} y={note.y} key={idx} />;
          })}
        </div>
      </div>
    </div>
  );
}

export function useMusic(props: MusicProps) {
  return {
    Component: () => <Music {...props} />,
  };
}

function transformFrequencyToBackgroundColor(initialFrequency: number): string {
  const frequency = initialFrequency % 100;
  if (frequency > 80) {
    return "bg-rose-700";
  }
  if (frequency > 70) {
    return "bg-sky-600";
  }
  if (frequency > 60) {
    return "bg-violet-500";
  }
  if (frequency > 50) {
    return "bg-indigo-500";
  }
  if (frequency > 40) {
    return "bg-emerald-800";
  }
  if (frequency > 30) {
    return "bg-teal-800";
  }
  if (frequency > 20) {
    return "bg-amber-800";
  }
  return "bg-slate-900";
}
