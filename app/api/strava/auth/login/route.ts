import { redirect } from "next/navigation";

import { buildAuthorizeUrl } from "@/lib/strava/oauth";

export async function GET() {
  const state = Math.random().toString(36).slice(2);
  const url = await buildAuthorizeUrl(state);
  redirect(url);
}
