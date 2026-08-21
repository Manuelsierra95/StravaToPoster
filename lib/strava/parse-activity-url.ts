export async function parseActivityId(input: string): Promise<string> {
  "use cache";

  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Introduce una URL o ID de actividad de Strava");
  }

  const numericMatch = trimmed.match(/^\d+$/);
  if (numericMatch) return numericMatch[0];

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error("URL no válida");
  }

  const host = url.hostname.replace(/^www\./, "");
  if (host !== "strava.com") {
    throw new Error("La URL debe ser de strava.com");
  }

  const match = url.pathname.match(/\/(?:activities|dashboard)\/(\d+)/);
  if (!match) {
    throw new Error("No se encontró un ID de actividad en la URL");
  }

  return match[1];
}
