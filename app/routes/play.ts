import type { ActionFunction } from "@remix-run/node";
import { json } from "remix-utils";

import Pusher from "pusher";

import { userId } from "~/cookies";

const pusher = new Pusher({
  key: String(process.env.PUSHER_KEY),
  appId: String(process.env.PUSHER_APP_ID),
  cluster: String(process.env.PUSHER_CLUSTER),
  secret: String(process.env.PUSHER_SECRET),
});

export const action: ActionFunction = async ({ request }) => {
  const note = (await request.formData()).get("note");
  if (!note) {
    return json({ error: 1 });
  }
  const user = await userId.parse(request.headers.get("Cookie"));
  try {
    await pusher.trigger("level-up", "note_played", {
      message: note,
      userId: user,
    });
  } catch (e) {
    console.error(e);
  }
  return json({ ok: true });
};
