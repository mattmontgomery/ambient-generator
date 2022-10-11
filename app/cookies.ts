import { createCookie } from "@remix-run/node"; // or cloudflare/deno

export const userId = createCookie("user-id");
