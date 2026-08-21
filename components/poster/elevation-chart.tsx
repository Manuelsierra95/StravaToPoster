"use client";

type Point = { distance: number; altitude: number };

export function ElevationChart({
  points,
  color,
  height = 64,
  className,
}: {
  points: Point[] | null | undefined;
  color: string;
  height?: number;
  className?: string;
}) {
  if (!points || points.length < 2) return null;

  const distances = points.map((p) => p.distance);
  const altitudes = points.map((p) => p.altitude);
  const minDist = distances[0];
  const maxDist = distances[distances.length - 1];
  const minAlt = Math.min(...altitudes);
  const maxAlt = Math.max(...altitudes);

  if (maxDist <= minDist) return null;

  const distRange = maxDist - minDist;
  const altRange = maxAlt - minAlt;

  const width = 1000;
  const padTop = 4;
  const padBottom = 4;
  const innerHeight = height - padTop - padBottom;

  const xOf = (distance: number): number =>
    ((distance - minDist) / distRange) * width;
  const yOf = (altitude: number): number => {
    if (altRange === 0) return padTop + innerHeight / 2;
    return padTop + (1 - (altitude - minAlt) / altRange) * innerHeight;
  };

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(p.distance).toFixed(2)} ${yOf(p.altitude).toFixed(2)}`)
    .join(" ");

  const lastX = xOf(points[points.length - 1].distance).toFixed(2);
  const firstX = xOf(points[0].distance).toFixed(2);
  const areaPath = `${linePath} L ${lastX} ${height} L ${firstX} ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      className={className}
      aria-hidden
    >
      <path d={areaPath} fill={color} fillOpacity="0.22" />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
