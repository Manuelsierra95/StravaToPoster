import { getCurrentAthleteSummary } from "@/lib/strava/oauth";

export async function GET() {
  const athlete = await getCurrentAthleteSummary();
  return Response.json({ connected: Boolean(athlete), athlete });
}
