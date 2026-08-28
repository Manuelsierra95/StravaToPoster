import { unstable_rethrow } from "next/navigation";

import {
  fetchStravaActivities,
  StravaApiError,
  StravaAuthError,
} from "@/lib/strava/oauth";

const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 30;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, Number(url.searchParams.get("perPage")) || DEFAULT_PER_PAGE),
  );

  try {
    const result = await fetchStravaActivities(page, perPage);
    return Response.json({ ...result, page, perPage });
  } catch (error) {
    unstable_rethrow(error);
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
    console.error("Strava list failed", error);
    return Response.json(
      { error: "Error inesperado al cargar actividades" },
      { status: 500 },
    );
  }
}