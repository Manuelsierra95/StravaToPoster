import { isPaceActivity, type MetricFormat, type StravaActivityType } from "./strava/types";

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return "0 m";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 2 : 1)} km`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) {
    return `${h}h ${String(m).padStart(2, "0")}'`;
  }
  if (m > 0) {
    return `${m}'${String(s).padStart(2, "0")}"`;
  }
  return `${s}s`;
}

export function formatElevation(meters: number): string {
  if (!Number.isFinite(meters)) return "—";
  return `${Math.round(meters).toLocaleString("es-ES")} m`;
}

export function formatSpeed(metersPerSecond: number): string {
  if (!Number.isFinite(metersPerSecond) || metersPerSecond <= 0) return "—";
  const kmh = metersPerSecond * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

export function formatPace(metersPerSecond: number): string {
  if (!Number.isFinite(metersPerSecond) || metersPerSecond <= 0) return "—";
  const secondsPerKm = 1000 / metersPerSecond;
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}:${String(secs).padStart(2, "0")} /km`;
}

export function formatSpeedOrPace(
  metersPerSecond: number,
  type: StravaActivityType,
): string {
  return isPaceActivity(type) ? formatPace(metersPerSecond) : formatSpeed(metersPerSecond);
}

export function formatPower(watts: number | null): string {
  if (watts === null || !Number.isFinite(watts) || watts <= 0) return "—";
  return `${Math.round(watts)} W`;
}

export function formatBpm(bpm: number | null): string {
  if (bpm === null || !Number.isFinite(bpm) || bpm <= 0) return "—";
  return `${Math.round(bpm)} bpm`;
}

export function formatCadence(cadence: number | null): string {
  if (cadence === null || !Number.isFinite(cadence) || cadence <= 0) return "—";
  return `${Math.round(cadence)} rpm`;
}

export function formatCalories(kcal: number | null): string {
  if (kcal === null || !Number.isFinite(kcal) || kcal <= 0) return "—";
  return `${Math.round(kcal)} kcal`;
}

export function formatMetric(
  format: MetricFormat,
  value: number | null,
): string {
  if (value === null) return "—";
  switch (format) {
    case "distance":
      return formatDistance(value);
    case "duration":
      return formatDuration(value);
    case "elevation":
      return formatElevation(value);
    case "speed":
      return formatSpeed(value);
    case "pace":
      return formatPace(value);
    case "bpm":
      return formatBpm(value);
    case "power":
      return formatPower(value);
    case "cadence":
      return formatCadence(value);
    case "kcal":
      return formatCalories(value);
  }
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatActivityDate(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return dateFormatter.format(date);
  } catch {
    return "";
  }
}

export function formatActivityType(type: StravaActivityType): string {
  const labels: Record<string, string> = {
    Ride: "Ciclismo",
    Run: "Carrera",
    Walk: "Caminata",
    Hike: "Senderismo",
    Swim: "Natación",
    Workout: "Entrenamiento",
    WeightTraining: "Pesas",
    Yoga: "Yoga",
    CrossFit: "CrossFit",
    Elliptical: "Elíptica",
    StairStepper: "Escalador",
    VirtualRide: "Ciclismo virtual",
    VirtualRun: "Carrera virtual",
    TrailRun: "Trail running",
    MountainBikeRide: "MTB",
    GravelRide: "Gravel",
    EMountainBikeRide: "E-MTB",
    Velomobile: "Velomóvil",
    Canoeing: "Piragüismo",
    Kayaking: "Kayak",
    Rowing: "Remo",
    StandUpPaddling: "SUP",
    Surfing: "Surf",
    Kitesurf: "Kitesurf",
    Snowboard: "Snowboard",
    Ski: "Esquí",
    Snowshoe: "Raquetas",
    IceSkate: "Patinaje hielo",
    InlineSkate: "Patinaje",
    RockClimb: "Escalada",
    RollerSki: "Esquí de ruedas",
    Windsurf: "Windsurf",
    Tennis: "Tenis",
    Badminton: "Bádminton",
    Soccer: "Fútbol",
    Golf: "Golf",
    Sail: "Vela",
    Handcycle: "Handbike",
    Wheelchair: "Silla de ruedas",
  };
  return labels[type] ?? type;
}
