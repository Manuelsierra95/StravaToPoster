import {
  getCachedAthleteClubs,
  getValidAccessToken,
  StravaApiError,
  StravaAuthError,
} from "@/lib/strava/oauth";

export async function GET() {
  try {
    const accessToken = await getValidAccessToken();
    const clubs = await getCachedAthleteClubs(accessToken);
    return Response.json({ clubs });
  } catch (error) {
    if (error instanceof StravaAuthError) {
      return Response.json(
        { error: error.message, requiresAuth: true },
        { status: error.status ?? 401 },
      );
    }
    if (error instanceof StravaApiError) {
      return Response.json(
        { error: error.message },
        { status: error.status ?? 502 },
      );
    }
    console.error("Strava clubs failed", error);
    return Response.json(
      { error: "Error inesperado al cargar los clubes" },
      { status: 500 },
    );
  }
}
