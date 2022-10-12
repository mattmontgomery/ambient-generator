import { useState } from "react";
import type { PropsWithChildren } from "react";

export default function UserTouch(
  props: PropsWithChildren & {
    bgColor: string;
    duration: number;
    onPlayNote: (x: number, y: number, touchLength: number) => void;
  }
): React.ReactElement {
  const { bgColor, duration, onPlayNote } = props;
  const [touchStart, setTouchStart] = useState<Record<string, number>>({
    mouse: -1,
    touch: -1,
  });

  return (
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
            onPlayNote(x, y, touchLength);
          });
          setTouchStart({
            ...touchStart,
            touch: -1,
          });
        }
      }}
      onMouseDown={async (ev) => {
        setTouchStart({
          ...touchStart,
          mouse: ev.timeStamp,
        });
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
          onPlayNote(x, y, touchLength);
        }
      }}
    >
      {props.children}
    </div>
  );
}
