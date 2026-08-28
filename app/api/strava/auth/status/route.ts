import { unstable_rethrow } from "next/navigation";

import { getCurrentAthleteSummary } from "@/lib/strava/oauth";

export async function GET() {
  try {
    const athlete = await getCurrentAthleteSummary();
    return Response.json({ connected: Boolean(athlete), athlete });
  } catch (error) {
    unstable_rethrow(error);
    throw error;
  }
}
