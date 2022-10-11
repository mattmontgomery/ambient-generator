import { useEffect, useState } from "react";

export default function Line({ x }: { x: number }): React.ReactElement {
  const [visible, setVisible] = useState<boolean>(false);
  useEffect(() => {
    setTimeout(() => {
      setVisible(true);
    }, 250);
  }, []);
  return (
    <div
      className={`absolute rounded-full top-0 bottom-0 w-2 ${
        visible ? "opacity-100" : "opacity-0"
      } transition-all`}
      style={{
        left: `${x * 100}%`,
        transitionProperty: "opacity",
      }}
    >
      <div className="absolute -inset-10 rounded-full bg-gradient-to-r from-teal-600 to-green-600 blur opacity-75 transition duration-1000"></div>
    </div>
  );
}
