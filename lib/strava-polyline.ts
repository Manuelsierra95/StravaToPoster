import polyline from "@mapbox/polyline";

export type LngLat = [number, number];

export function decodePolyline(encoded: string): LngLat[] {
  if (!encoded) return [];
  const decoded = polyline.decode(encoded);
  return decoded.map(([lat, lng]) => [lng, lat]);
}

export function getBounds(coordinates: LngLat[]): {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
} | null {
  if (coordinates.length === 0) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coordinates) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  return { minLng, maxLng, minLat, maxLat };
}

export function getCenterAndZoom(
  coordinates: LngLat[],
): { center: LngLat; zoom: number } | null {
  const bounds = getBounds(coordinates);
  if (!bounds) return null;

  const center: LngLat = [
    (bounds.minLng + bounds.maxLng) / 2,
    (bounds.minLat + bounds.maxLat) / 2,
  ];

  const lngDelta = bounds.maxLng - bounds.minLng;
  const latDelta = bounds.maxLat - bounds.minLat;
  const maxDelta = Math.max(lngDelta, latDelta);

  let zoom = 13;
  if (maxDelta > 0) {
    if (maxDelta < 0.005) zoom = 15;
    else if (maxDelta < 0.02) zoom = 14;
    else if (maxDelta < 0.05) zoom = 13;
    else if (maxDelta < 0.2) zoom = 12;
    else if (maxDelta < 0.5) zoom = 11;
    else if (maxDelta < 1) zoom = 10;
    else if (maxDelta < 2) zoom = 9;
    else if (maxDelta < 4) zoom = 8;
    else zoom = 7;
  }

  return { center, zoom };
}
