import { useEffect, useState } from "react";

export function Dot({ x, y }: { x: number; y: number }) {
  const [visible, setVisible] = useState<boolean>(false);
  useEffect(() => {
    setTimeout(() => {
      setVisible(true);
    }, 100);
  }, []);
  return (
    <div
      className={`absolute rounded-full w-24 h-24 filter ${
        visible ? "opacity-0" : "opacity-100"
      } transition-all`}
      style={{
        left: `${x * 100 - 5}%`,
        top: `${y * 100 - 5}%`,
        transitionProperty: "opacity",
      }}
    >
      <div className="absolute -inset-10 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 blur opacity-75 transition duration-1000"></div>
    </div>
  );
}
