function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function expandHex(hex: string): [number, number, number] | null {
  const value = hex.trim().replace("#", "");
  if (value.length === 3) {
    const r = Number.parseInt(value[0] + value[0], 16);
    const g = Number.parseInt(value[1] + value[1], 16);
    const b = Number.parseInt(value[2] + value[2], 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [r, g, b];
  }
  if (value.length === 6) {
    const r = Number.parseInt(value.slice(0, 2), 16);
    const g = Number.parseInt(value.slice(2, 4), 16);
    const b = Number.parseInt(value.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [r, g, b];
  }
  return null;
}

function channelLuminance(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const rgb = expandHex(hex);
  if (!rgb) return 1;
  const [r, g, b] = rgb;
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

export function pickReadableTextColor(
  background: string,
  options: { light?: string; dark?: string } = {},
): string {
  const light = options.light ?? "#ffffff";
  const dark = options.dark ?? "#000000";
  return relativeLuminance(background) > 0.5 ? dark : light;
}

export function hexToRgba(hex: string, alpha: number): string {
  const rgb = expandHex(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb;
  const a = clamp(alpha, 0, 1);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
