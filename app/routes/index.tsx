// import { useMusic } from "~/components/Music";

// export default function Index() {
//   const Music = useMusic();
//   return (
//     <div className="h-screen bg-slate-500">
//       <Music.Component />
//     </div>
//   );
// }

import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Music from "~/components/Music";

import { userId } from "~/cookies";
import crypto from "crypto";
import Pusher from "pusher-js";
import { useEffect, useState } from "react";

type LoaderData = {
  userId: string;
  pusher: {
    key: string;
    cluster: string;
  };
};

export const loader: LoaderFunction = async ({ request }) => {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await userId.parse(cookieHeader)) || crypto.randomUUID();
  return json<LoaderData>(
    {
      userId: cookie,
      pusher: {
        key: String(process.env.PUSHER_KEY),
        cluster: String(process.env.PUSHER_CLUSTER),
      },
    },
    { headers: { "Set-Cookie": await userId.serialize(cookie) } }
  );
};
/*
 * Callouts:
 *  - Web Audio, Tone.js
 */
export default function Index() {
  const [pusherClient, setPusherClient] = useState<Pusher>();
  const { userId, pusher } = useLoaderData<LoaderData>();
  useEffect(() => {
    const client = new Pusher(String(pusher.key), {
      cluster: String(pusher.cluster),
    });
    setPusherClient(client);
  }, [pusher.key, pusher.cluster, userId]);
  return <>{pusherClient && <Music user={userId} pusher={pusherClient} />}</>;
}
