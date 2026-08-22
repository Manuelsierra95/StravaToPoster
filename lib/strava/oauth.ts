import { cookies } from "next/headers";
import { cacheLife, cacheTag } from "next/cache";

import type {
  ActivitySummary,
  ScrapedActivity,
  StravaActivityType,
  StravaClub,
} from "./types";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API_BASE = "https://www.strava.com/api/v3";

const COOKIE_NAMES = {
  accessToken: "strava_access_token",
  refreshToken: "strava_refresh_token",
  expiresAt: "strava_expires_at",
  athlete: "strava_athlete",
} as const;

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export class StravaAuthError extends Error {
  constructor(message: string, public readonly status = 401) {
    super(message);
    this.name = "StravaAuthError";
  }
}

export class StravaApiError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = "StravaApiError";
  }
}

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: number | null;
  athleteFirstName: string | null;
  athleteLastName: string | null;
};

type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete?: {
    id?: number;
    firstname?: string;
    lastname?: string;
  };
};

type StravaDetailedActivity = {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date_local: string;
  description: string | null;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  elev_high: number | null;
  elev_low: number | null;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  has_heartrate: boolean;
  average_watts?: number;
  max_watts?: number;
  weighted_average_watts?: number;
  device_watts?: boolean;
  average_cadence?: number;
  calories?: number;
  map?: {
    summary_polyline?: string;
    polyline?: string;
  };
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  athlete?: {
    id?: number;
    firstname?: string;
    lastname?: string;
  };
};

type StravaStreamsResponse = Record<
  string,
  { data: number[] } | undefined
>;

export async function exchangeCodeForTokens(code: string): Promise<AuthTokens> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new StravaAuthError(
      "Faltan las variables STRAVA_CLIENT_ID o STRAVA_CLIENT_SECRET",
    );
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new StravaAuthError(
      `Strava rechazó el código (${response.status})`,
      response.status,
    );
  }

  return normaliseTokens((await response.json()) as StravaTokenResponse);
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new StravaAuthError(
      "Faltan las variables STRAVA_CLIENT_ID o STRAVA_CLIENT_SECRET",
    );
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new StravaAuthError(
      `No se pudo refrescar el token (${response.status})`,
      response.status,
    );
  }

  return normaliseTokens((await response.json()) as StravaTokenResponse);
}

function normaliseTokens(data: StravaTokenResponse): AuthTokens {
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    athleteId: data.athlete?.id ?? null,
    athleteFirstName: data.athlete?.firstname ?? null,
    athleteLastName: data.athlete?.lastname ?? null,
  };
}

export async function storeTokens(tokens: AuthTokens) {
  const jar = await cookies();
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
  jar.set({ name: COOKIE_NAMES.accessToken, value: tokens.accessToken, ...base });
  jar.set({ name: COOKIE_NAMES.refreshToken, value: tokens.refreshToken, ...base });
  jar.set({
    name: COOKIE_NAMES.expiresAt,
    value: String(tokens.expiresAt),
    ...base,
  });
  jar.set({
    name: COOKIE_NAMES.athlete,
    value: JSON.stringify({
      id: tokens.athleteId,
      firstName: tokens.athleteFirstName,
      lastName: tokens.athleteLastName,
    }),
    ...base,
  });
}

export async function clearTokens() {
  const jar = await cookies();
  for (const name of Object.values(COOKIE_NAMES)) {
    jar.delete(name);
  }
}

export async function getStoredTokens(): Promise<AuthTokens | null> {
  const jar = await cookies();
  const accessToken = jar.get(COOKIE_NAMES.accessToken)?.value;
  const refreshToken = jar.get(COOKIE_NAMES.refreshToken)?.value;
  const expiresAtRaw = jar.get(COOKIE_NAMES.expiresAt)?.value;
  const athleteRaw = jar.get(COOKIE_NAMES.athlete)?.value;

  if (!accessToken || !refreshToken || !expiresAtRaw) return null;

  let athleteId: number | null = null;
  let athleteFirstName: string | null = null;
  let athleteLastName: string | null = null;
  if (athleteRaw) {
    try {
      const parsed = JSON.parse(athleteRaw) as {
        id?: number;
        firstName?: string;
        lastName?: string;
      };
      athleteId = parsed.id ?? null;
      athleteFirstName = parsed.firstName ?? null;
      athleteLastName = parsed.lastName ?? null;
    } catch {
      /* ignore */
    }
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: Number(expiresAtRaw),
    athleteId,
    athleteFirstName,
    athleteLastName,
  };
}

export async function getValidAccessToken(): Promise<string> {
  const tokens = await getStoredTokens();
  if (!tokens) {
    throw new StravaAuthError("No has conectado tu cuenta de Strava");
  }

  const now = Math.floor(Date.now() / 1000);
  if (tokens.expiresAt - now < 60) {
    const refreshed = await refreshTokens(tokens.refreshToken);
    await storeTokens(refreshed);
    return refreshed.accessToken;
  }

  return tokens.accessToken;
}

function toScrapedActivity(
  raw: StravaDetailedActivity,
  elevationPoints: { distance: number; altitude: number }[] | null = null,
): ScrapedActivity {
  return {
    id: String(raw.id),
    name: raw.name || "Actividad sin título",
    type: (raw.type ?? "Workout") as StravaActivityType,
    sportType: (raw.sport_type ?? raw.type ?? "Workout") as StravaActivityType,
    startDateLocal: raw.start_date_local ?? new Date().toISOString(),
    description: raw.description ?? null,

    distance: raw.distance ?? 0,
    movingTime: raw.moving_time ?? 0,
    elapsedTime: raw.elapsed_time ?? 0,

    totalElevationGain: raw.total_elevation_gain ?? 0,
    elevHigh: raw.elev_high ?? null,
    elevLow: raw.elev_low ?? null,

    averageSpeed: raw.average_speed ?? 0,
    maxSpeed: raw.max_speed ?? 0,

    averageHeartrate: raw.average_heartrate ?? null,
    maxHeartrate: raw.max_heartrate ?? null,
    hasHeartrate: raw.has_heartrate ?? false,

    averageWatts: raw.average_watts ?? null,
    maxWatts: raw.max_watts ?? null,
    weightedAverageWatts: raw.weighted_average_watts ?? null,
    hasPower: Boolean(raw.device_watts) || (raw.average_watts ?? 0) > 0,

    averageCadence: raw.average_cadence ?? null,
    calories: raw.calories ?? null,

    summaryPolyline:
      raw.map?.summary_polyline ?? raw.map?.polyline ?? "",
    startLatLng: raw.start_latlng ?? null,
    endLatLng: raw.end_latlng ?? null,

    elevationPoints,

    athleteFirstName: raw.athlete?.firstname ?? null,
    athleteLastName: raw.athlete?.lastname ?? null,
  };
}

export async function fetchStravaActivity(id: string): Promise<ScrapedActivity> {
  const accessToken = await getValidAccessToken();

  const response = await fetch(`${STRAVA_API_BASE}/activities/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new StravaAuthError("Token de Strava inválido o expirado", 401);
  }

  if (response.status === 404) {
    throw new StravaApiError("Actividad no encontrada", 404);
  }

  if (!response.ok) {
    throw new StravaApiError(
      `Strava API error (${response.status})`,
      response.status,
    );
  }

  const data = (await response.json()) as StravaDetailedActivity;
  if (!data.map?.summary_polyline) {
    throw new StravaApiError("La actividad no contiene ruta para mostrar");
  }

  const elevationPoints = await fetchStravaActivityStreams(id, accessToken).catch(
    () => null,
  );
  return toScrapedActivity(data, elevationPoints);
}

async function fetchStravaActivityStreams(
  id: string,
  accessToken: string,
): Promise<{ distance: number; altitude: number }[] | null> {
  const url = `${STRAVA_API_BASE}/activities/${id}/streams?keys=altitude,distance&key_by_type=true`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const raw = (await response.json()) as StravaStreamsResponse;
  const altitude = raw.altitude?.data;
  const distance = raw.distance?.data;
  if (!altitude || !distance) return null;
  if (altitude.length === 0 || altitude.length !== distance.length) return null;

  const points: { distance: number; altitude: number }[] = [];
  for (let i = 0; i < altitude.length; i++) {
    points.push({ distance: distance[i], altitude: altitude[i] });
  }
  return points;
}

type StravaSummaryActivity = {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  average_speed: number;
};

function toActivitySummary(raw: StravaSummaryActivity): ActivitySummary {
  return {
    id: String(raw.id),
    name: raw.name || "Actividad sin título",
    type: (raw.type ?? "Workout") as StravaActivityType,
    sportType: (raw.sport_type ?? raw.type ?? "Workout") as StravaActivityType,
    startDateLocal: raw.start_date_local ?? new Date().toISOString(),
    distance: raw.distance ?? 0,
    movingTime: raw.moving_time ?? 0,
    totalElevationGain: raw.total_elevation_gain ?? 0,
    averageSpeed: raw.average_speed ?? 0,
  };
}

export async function fetchStravaActivities(
  page: number,
  perPage: number,
): Promise<{ activities: ActivitySummary[]; hasMore: boolean }> {
  const accessToken = await getValidAccessToken();

  const response = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?page=${page}&per_page=${perPage}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (response.status === 401) {
    throw new StravaAuthError("Token de Strava inválido o expirado", 401);
  }

  if (!response.ok) {
    throw new StravaApiError(
      `Strava API error (${response.status})`,
      response.status,
    );
  }

  const data = (await response.json()) as StravaSummaryActivity[];
  const activities = data.map(toActivitySummary);
  return { activities, hasMore: activities.length === perPage };
}

export async function getCurrentAthleteSummary(): Promise<{
  id: number | null;
  firstName: string | null;
  lastName: string | null;
} | null> {
  const tokens = await getStoredTokens();
  if (!tokens) return null;

  if (!tokens.athleteFirstName && !tokens.athleteLastName) {
    try {
      const accessToken = await getValidAccessToken();
      const response = await fetch(`${STRAVA_API_BASE}/athlete`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (response.ok) {
        const data = (await response.json()) as {
          id?: number;
          firstname?: string;
          lastname?: string;
        };
        const updated: AuthTokens = {
          ...tokens,
          athleteId: tokens.athleteId ?? data.id ?? null,
          athleteFirstName: data.firstname ?? null,
          athleteLastName: data.lastname ?? null,
        };
        await storeTokens(updated);
        return {
          id: updated.athleteId,
          firstName: updated.athleteFirstName,
          lastName: updated.athleteLastName,
        };
      }
    } catch {
      /* fall through to stored values */
    }
  }

  return {
    id: tokens.athleteId,
    firstName: tokens.athleteFirstName,
    lastName: tokens.athleteLastName,
  };
}

type StravaClubRaw = {
  id: number;
  name: string;
  profile?: string;
  sport_type?: string;
  city?: string;
  state?: string;
  country?: string;
  member_count?: number;
};

async function fetchAthleteClubsUncached(
  accessToken: string,
): Promise<StravaClub[]> {
  const response = await fetch(
    `${STRAVA_API_BASE}/athlete/clubs?per_page=100`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as StravaClubRaw[];
  return data.map((club) => ({ id: club.id, name: club.name }));
}

export async function getCachedAthleteClubs(
  accessToken: string,
): Promise<StravaClub[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("strava:athlete-clubs");
  return fetchAthleteClubsUncached(accessToken);
}

export async function buildAuthorizeUrl(state: string): Promise<string> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri =
    process.env.STRAVA_REDIRECT_URI ??
    "http://localhost:3000/api/strava/auth/callback";

  if (!clientId) {
    throw new StravaAuthError("Falta STRAVA_CLIENT_ID");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    approval_prompt: "auto",
    scope: "activity:read",
    state,
  });

  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}
