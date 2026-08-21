import { clearTokens } from "@/lib/strava/oauth";

export async function GET(request: Request) {
  await clearTokens();
  return Response.redirect(new URL("/?strava_disconnected=1", request.url));
}

export async function POST() {
  await clearTokens();
  return Response.json({ ok: true });
}
