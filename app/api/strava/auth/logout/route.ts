import { unstable_rethrow } from "next/navigation";

import { clearTokens } from "@/lib/strava/oauth";

export async function GET(request: Request) {
  try {
    await clearTokens();
    return Response.redirect(new URL("/?strava_disconnected=1", request.url));
  } catch (error) {
    unstable_rethrow(error);
    throw error;
  }
}

export async function POST() {
  try {
    await clearTokens();
    return Response.json({ ok: true });
  } catch (error) {
    unstable_rethrow(error);
    throw error;
  }
}
