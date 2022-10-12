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

  const [iterations, setIterations] = useState<number>(0);

  const [touchStart, setTouchStart] = useState<Record<string, number>>({
    mouse: -1,
    touch: -1,
  });

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
    <div className={`h-full grid `}>
      <Looper
        duration={duration}
        enabled={loopEnabled}
        onComplete={() => {
          setIterations(iterations + 1);
          if (iterations % 4 === 0) {
            const newScale = Collection.shuffle(Scale.names())[0];
            setScaleName(newScale);
            return newScale;
          }
          return scaleName;
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
      <div
        className={`${bgColor} col-span-12 transition-colors relative duration-[${
          (1 / duration) * 10_000
        }ms]`}
        onTouchStart={(ev) => {
          setTouchStart({
            ...touchStart,
            touch: ev.timeStamp,
          });
        }}
        onTouchEnd={(ev) => {
          if (touchStart.touch > -1) {
            const touchLength = ev.timeStamp - touchStart.mouse;
            // const x =
            //   (ev.pageX - ev.currentTarget.offsetLeft) /
            //   ev.currentTarget.offsetWidth;
            // const y =
            //   (ev.pageY - ev.currentTarget.offsetTop) /
            //   ev.currentTarget.offsetHeight;
            [...Array.from(ev.changedTouches)].forEach((touch) => {
              const x = touch.clientX / ev.currentTarget.offsetWidth;
              const y = touch.clientY / ev.currentTarget.offsetHeight;
              console.log(ev);
              const notes = getNotes(Scale.get(`${root} ${scaleName}`));
              const newNote = Collection.shuffle(notes)[0];
              const note = {
                note: newNote.note,
                delay: 0,
                duration:
                  Math.floor(Math.random() * (touchLength / 24)) / duration,
                x,
                y,
              };
              playUserNote(note, true);
            });
            setTouchStart({
              ...touchStart,
              touch: -1,
            });
          }
        }}
        onMouseUp={async (ev) => {
          if (touchStart.mouse > -1) {
            const touchLength = ev.timeStamp - touchStart.mouse;
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
              duration:
                Math.floor(Math.random() * (touchLength / 6)) / duration,
              x,
              y,
            };
            playUserNote(note, true);
            setTouchStart({
              ...touchStart,
              mouse: -1,
            });
          }
        }}
        onMouseDown={async (ev) => {
          setTouchStart({
            ...touchStart,
            mouse: ev.timeStamp,
          });
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
        <div className="absolute bottom-4 right-4 color-white text-slate-200 outline-zinc-300 antialiased font-semibold text-lg">
          {root} {scaleName}
        </div>
        <div className="absolute">
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
                  lowSynth.set({ volume: Number(ev.target.value) - 30 });
                  highSynth.set({ volume: Number(ev.target.value) - 30 });
                  userSynth.set({ volume: Number(ev.target.value) - 30 });
                }}
                type="range"
                min="-70"
                max="-10"
                defaultValue={0}
                id="myRange"
              />
            </div>
          </div>
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
