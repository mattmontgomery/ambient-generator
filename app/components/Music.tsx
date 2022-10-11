import { useCallback, useEffect, useRef, useState } from "react";
import { highSynth, lowSynth } from "~/util/instruments.client";
import { Chord, Note, Collection, Scale } from "@tonaljs/tonal";
import { ClientOnly } from "remix-utils";

export type Notey = {
  note: string | string[];
  duration: number;
  delay: number;
};

const root = "D3";

export type MusicProps = {
  onPlayNote?: (note: string) => void;
};

export default function Music(props: MusicProps): React.ReactElement {
  const [scaleName, setScaleName] = useState<string>(
    Collection.shuffle(Scale.names())[0]
  );
  const [notes, setNotes] = useState(
    getNotes(Scale.get(`${root} ${scaleName}`))
  );

  const [interval, setInterval] = useState<number>();
  const [duration, setDuration] = useState<number>(30);
  const [bgColor, setBgColor] = useState<string>(`bg-slate-500`);
  const [activeNote, setActiveNote] = useState<Notey>();
  const [chords, setChords] = useState<string[]>(
    Scale.scaleChords(`${root} ${scaleName}`).filter(
      (c) => Chord.get(c).intervals.length > 2
    )
  );
  const [chordsPlaying, setChordsPlaying] = useState<boolean>(false);
  const [chordsEnabled, setChordsEnabled] = useState<boolean>(false);
  const [activeHighNotes, setActiveHighNotes] = useState<
    (Notey & { x: number; y: number })[]
  >([]);

  useEffect(() => {
    setChords((c) => Collection.shuffle(c));
  }, [activeNote, setChords]);

  useEffect(() => {
    (async () => {
      if (activeNote && !chordsPlaying && chordsEnabled) {
        const chord = Chord.getChord(chords[0], String(activeNote.note));
        const chordNotes = Collection.shuffle(chord.notes);
        setChordsPlaying(true);
        for await (const note of chordNotes) {
          const { playNote } = await perform({
            note: note,
            delay: activeNote.delay / chordNotes.length,
            duration: activeNote.duration / chordNotes.length,
            synth: highSynth,
          });
          await playNote();
        }
        setChordsPlaying(false);
      }
    })();
  }, [activeNote, chords, chordsPlaying, chordsEnabled]);

  const playLoop = useCallback(async () => {
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
    for await (const play of playNotes.map((n) =>
      perform({ ...n, synth: lowSynth })
    )) {
      setActiveNote(play.note);
      const freq = Note.get(String(play.note.note).split(",")?.[0]).freq;
      setBgColor(transformFrequencyToBackgroundColor(freq ?? 1));
      await play.playNote();
    }
  }, [duration, setBgColor, notes]);
  return (
    <div className={`grid grid-cols-12 ap-2 h-full `}>
      <div className="grid gap-1 col-span-4">
        <select
          value={scaleName}
          onChange={(ev) => {
            const newScaleName = ev.target.value;
            setScaleName(newScaleName);
            setNotes(getNotes(Scale.get(`${root} ${newScaleName}`)));
            setChords(
              Scale.scaleChords(newScaleName).filter(
                (c) => Chord.get(c).intervals.length > 2
              )
            );
            window.clearInterval(interval);
          }}
        >
          {Scale.names().map((opt, idx) => (
            <option key={idx}>{opt}</option>
          ))}
        </select>
        <button
          className="bg-slate-800 text-white rounded p-4"
          onClick={() => {
            if (interval) {
              window.clearInterval(interval);
            }
            playLoop();
            const runtime = notes.reduce(
              (acc, curr) => acc + curr.duration * (1 / duration),
              0
            );
            setInterval(window.setInterval(playLoop, runtime * 1000));
          }}
        >
          play a series of notes
          <ClientOnly>
            {() => <div>{notes.map((n) => n.note).join(", ")}</div>}
          </ClientOnly>
        </button>
        <button
          className="bg-slate-700 text-white rounded p-4"
          onClick={() => setChordsEnabled(!chordsEnabled)}
        >
          play more notes from{" "}
          <ClientOnly>{() => Chord.get(chords[0]).intervals.length}</ClientOnly>
          <div>{chordsEnabled ? "enabled" : ""}</div>
          <div>{chordsPlaying ? "playing" : ""}</div>
        </button>
        <div>
          volume
          <input
            onChange={(ev) => {
              lowSynth.set({ volume: Number(ev.target.value) });
              highSynth.set({ volume: Number(ev.target.value) - 10 });
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
        className={`${bgColor} col-span-8 transition-colors relative duration-[${
          (1 / duration) * 10_000
        }ms]`}
        onMouseDown={async (ev) => {
          const x =
            (ev.pageX - ev.currentTarget.offsetLeft) /
            ev.currentTarget.offsetWidth;
          const y =
            (ev.pageY - ev.currentTarget.offsetTop) /
            ev.currentTarget.offsetHeight;
          const chord = Chord.getChord(
            chords[0],
            String(activeNote?.note ?? root)
          );
          const f = Math.floor(
            Math.random() * (x > y ? y / x : x / y) * chord.notes.length
          );
          const note = {
            note: chord.notes[f],
            delay: 0,
            duration: 50 / duration,
            x,
            y,
          };
          const { playNote } = await perform({ ...note, synth: highSynth });
          setActiveHighNotes((a) => [...a, note]);
          await playNote();
          setActiveHighNotes((a) => [
            ...a.slice(0, a.indexOf(note)),
            ...a.slice(a.indexOf(note) + 1),
          ]);
        }}
      >
        <div className="font-mono font-light text-lg bg-white">
          {JSON.stringify(activeNote)}
        </div>
        <div className="absolute top-0 bottom-0 left-0 right-0 bg-red overflow-hidden">
          {activeHighNotes.map((note, idx) => {
            return (
              <div
                key={idx}
                className={`absolute rounded-full w-24 h-24 filter`}
                style={{
                  left: `${note.x * 100 - 5}%`,
                  top: `${note.y * 100 - 5}%`,
                }}
              >
                <div className="absolute -inset-10 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 blur opacity-75 transition duration-1000"></div>
              </div>
            );
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
      // console.log(synth);
      synth.triggerAttackRelease(
        note,
        Array.isArray(note) ? note.map(() => duration) : duration
      );
      await pTimeout(duration * 1000);
    };
    resolve({
      note: { note, duration, delay },
      playNote,
    });
  });
}

async function pTimeout(duration: number): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
}

function transformFrequencyToBackgroundColor(initialFrequency: number): string {
  const frequency = initialFrequency % 100;
  if (frequency > 80) {
    return "bg-amber-700";
  }
  if (frequency > 70) {
    return "bg-amber-600";
  }
  if (frequency > 60) {
    return "bg-amber-500";
  }
  if (frequency > 50) {
    return "bg-slate-500";
  }
  if (frequency > 40) {
    return "bg-slate-600";
  }
  if (frequency > 30) {
    return "bg-slate-700";
  }
  if (frequency > 20) {
    return "bg-slate-800";
  }
  return "bg-slate-900";
}

function getPositionOfNote(note: string) {
  return { left: 100, right: 100, top: 100 };
}

function getNotes(scale: any) {
  return Collection.shuffle(scale.notes).map((n, idx) => ({
    note: n,
    duration: Math.floor(Math.random() * 30) + 10,
    delay: idx > 0 ? 8 : 0,
  }));
}
