import { unstable_rethrow } from "next/navigation";

import { exchangeCodeForTokens, storeTokens, StravaAuthError } from "@/lib/strava/oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return Response.redirect(
      new URL(`/?strava_error=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!code) {
    return Response.redirect(
      new URL("/?strava_error=missing_code", request.url),
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await storeTokens(tokens);
    return Response.redirect(new URL("/?strava_connected=1", request.url));
  } catch (err) {
    unstable_rethrow(err);
    const message =
      err instanceof StravaAuthError ? err.message : "Error desconocido";
    return Response.redirect(
      new URL(
        `/?strava_error=${encodeURIComponent(message)}`,
        request.url,
      ),
    );
  }
}
