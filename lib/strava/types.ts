export type StravaActivityType =
  | "Ride"
  | "Run"
  | "Walk"
  | "Hike"
  | "Swim"
  | "Workout"
  | "WeightTraining"
  | "Yoga"
  | "CrossFit"
  | "Elliptical"
  | "StairStepper"
  | "VirtualRide"
  | "VirtualRun"
  | "TrailRun"
  | "MountainBikeRide"
  | "GravelRide"
  | "EMountainBikeRide"
  | "Velomobile"
  | "Canoeing"
  | "Kayaking"
  | "Rowing"
  | "StandUpPaddling"
  | "Surfing"
  | "Kitesurf"
  | "Snowboard"
  | "Ski"
  | "Snowshoe"
  | "IceSkate"
  | "InlineSkate"
  | "RockClimb"
  | "RollerSki"
  | "Windsurf"
  | "Tennis"
  | "Badminton"
  | "Soccer"
  | "Golf"
  | "Sail"
  | "Handcycle"
  | "Wheelchair"
  | string;

export type ActivitySummary = {
  id: string;
  name: string;
  type: StravaActivityType;
  sportType: StravaActivityType;
  startDateLocal: string;
  distance: number;
  movingTime: number;
  totalElevationGain: number;
  averageSpeed: number;
};

export type ScrapedActivity = {
  id: string;
  name: string;
  type: StravaActivityType;
  sportType: StravaActivityType;
  startDateLocal: string;
  description: string | null;

  distance: number;
  movingTime: number;
  elapsedTime: number;

  totalElevationGain: number;
  elevHigh: number | null;
  elevLow: number | null;

  averageSpeed: number;
  maxSpeed: number;

  averageHeartrate: number | null;
  maxHeartrate: number | null;
  hasHeartrate: boolean;

  averageWatts: number | null;
  maxWatts: number | null;
  weightedAverageWatts: number | null;
  hasPower: boolean;

  averageCadence: number | null;
  calories: number | null;

  summaryPolyline: string;
  startLatLng: [number, number] | null;
  endLatLng: [number, number] | null;

  elevationPoints: { distance: number; altitude: number }[] | null;

  athleteFirstName: string | null;
  athleteLastName: string | null;
};

export type MetricId =
  | "distance"
  | "moving_time"
  | "elevation"
  | "elev_high"
  | "elev_low"
  | "avg_speed"
  | "max_speed"
  | "avg_hr"
  | "max_hr"
  | "avg_power"
  | "max_power"
  | "avg_cadence"
  | "calories";

export type MetricFormat =
  | "distance"
  | "duration"
  | "elevation"
  | "speed"
  | "pace"
  | "bpm"
  | "power"
  | "cadence"
  | "kcal";

export type MetricDefinition = {
  id: MetricId;
  label: string;
  format: MetricFormat;
  shownIf?: "hasPower" | "hasHeartrate" | "hasCadence" | "hasElevRange";
};

export const METRICS: readonly MetricDefinition[] = [
  { id: "distance", label: "Distancia", format: "distance" },
  { id: "moving_time", label: "Tiempo", format: "duration" },
  { id: "elevation", label: "Desnivel +", format: "elevation" },
  { id: "elev_high", label: "Altitud máx", format: "elevation", shownIf: "hasElevRange" },
  { id: "elev_low", label: "Altitud mín", format: "elevation", shownIf: "hasElevRange" },
  { id: "avg_speed", label: "Vel. media", format: "speed" },
  { id: "max_speed", label: "Vel. máx", format: "speed" },
  { id: "avg_power", label: "Potencia media", format: "power", shownIf: "hasPower" },
  { id: "max_power", label: "Potencia máx", format: "power", shownIf: "hasPower" },
  { id: "avg_hr", label: "FC media", format: "bpm", shownIf: "hasHeartrate" },
  { id: "max_hr", label: "FC máx", format: "bpm", shownIf: "hasHeartrate" },
  { id: "avg_cadence", label: "Cadencia", format: "cadence", shownIf: "hasCadence" },
  { id: "calories", label: "Calorías", format: "kcal" },
] as const;

export const DEFAULT_VISIBLE_METRICS: readonly MetricId[] = [
  "distance",
  "moving_time",
  "elevation",
  "avg_speed",
  "max_speed",
  "avg_power",
  "max_power",
  "avg_hr",
  "max_hr",
  "avg_cadence",
  "calories",
] as const;

export function isPaceActivity(type: StravaActivityType): boolean {
  return (
    type === "Run" ||
    type === "TrailRun" ||
    type === "Walk" ||
    type === "Hike" ||
    type === "VirtualRun" ||
    type === "Snowshoe" ||
    type === "RollerSki"
  );
}
