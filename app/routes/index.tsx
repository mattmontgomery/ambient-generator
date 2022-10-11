// import { useMusic } from "~/components/Music";

// export default function Index() {
//   const Music = useMusic();
//   return (
//     <div className="h-screen bg-slate-500">
//       <Music.Component />
//     </div>
//   );
// }

import Music from "~/components/Music";

/*
 * Callouts:
 *  - Web Audio, Tone.js
 */
export default function Index() {
  return (
    <>
      <Music />
    </>
  );
}
