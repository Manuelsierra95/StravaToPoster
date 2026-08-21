import { fetchStravaActivity, StravaApiError, StravaAuthError } from "@/lib/strava/oauth";
import { parseActivityId } from "@/lib/strava/parse-activity-url";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await ctx.params;

  let activityId: string;
  try {
    activityId = await parseActivityId(rawId);
  } catch (error) {
    return Response.json(
      { error: (error as Error).message, requiresAuth: false },
      { status: 400 },
    );
  }

  try {
    const activity = await fetchStravaActivity(activityId);
    return Response.json({ activity });
  } catch (error) {
    if (error instanceof StravaAuthError) {
      return Response.json(
        { error: error.message, requiresAuth: true },
        { status: error.status ?? 401 },
      );
    }
    if (error instanceof StravaApiError) {
      return Response.json(
        { error: error.message, requiresAuth: false },
        { status: error.status ?? 502 },
      );
    }
    console.error("Strava fetch failed", error);
    return Response.json(
      { error: "Error inesperado al procesar la actividad" },
      { status: 500 },
    );
  }
}
