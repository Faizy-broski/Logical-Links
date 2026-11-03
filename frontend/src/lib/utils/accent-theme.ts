export interface AccentTheme {
  id: string;
  name: string;
  /** Maps to --primary (bg-primary, text-primary, border-primary, ring-primary…). */
  primary: string;
  /** Maps to --primary-light (bg-primary-light, gradient stops…). */
  primaryLight: string;
  /** Maps to --primary-dark (bg-primary-dark, hover:bg-primary-dark…). */
  primaryDark: string;
  /** Maps to --primary-foreground — text/icon color that sits on a primary fill
   *  (e.g. the active sidebar link label, primary buttons). */
  primaryForeground: string;
}

// User-selectable accent ("primary") palettes for the admin dashboard. Selecting
// one overrides the --primary* CSS variables on the dashboard shell, so every
// element that renders with primary / primary-dark backgrounds shifts together:
// page/section headers, primary + active buttons, the active sidebar link
// background, focus rings, badges, etc.
export const BASE_ACCENT_THEMES: AccentTheme[] = [
  { id: "sage",      name: "Sage",       primary: "#7a9384", primaryLight: "#9ab0a4", primaryDark: "#5f7568", primaryForeground: "#ffffff" },
  { id: "stone",     name: "Stone",      primary: "#6b7280", primaryLight: "#8b909c", primaryDark: "#4f545e", primaryForeground: "#ffffff" },
  { id: "denim",     name: "Denim",      primary: "#5c7291", primaryLight: "#7d93af", primaryDark: "#465872", primaryForeground: "#ffffff" },
  { id: "lightgray", name: "Light Gray", primary: "#9ca3af", primaryLight: "#c1c7d0", primaryDark: "#7c828c", primaryForeground: "#1c1f24" },
];

// Mix a hex colour toward white (amount > 0) or black (amount < 0).
function mix(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const target = amount >= 0 ? 255 : 0;
  const t = Math.abs(amount);
  const ch = (v: number) => Math.round(v + (target - v) * t).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

// Text colour that stays readable on a fill of this colour.
function foregroundFor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? "#1c1f24" : "#ffffff";
}

function earthTone(id: string, name: string, primary: string): AccentTheme {
  return {
    id,
    name,
    primary,
    primaryLight: mix(primary, 0.2),
    primaryDark: mix(primary, -0.2),
    primaryForeground: foregroundFor(primary),
  };
}

// Client-supplied earth-tone accents (Oct 2026). Light/dark shades are derived.
export const EARTH_TONE_ACCENT_THEMES: AccentTheme[] = [
  earthTone("pale-champagne", "Pale Champagne", "#C6B28C"),
  earthTone("soft-sandstone", "Soft Sandstone", "#DED5C7"),
  earthTone("grey-olive", "Grey Olive", "#A4A48A"),
  earthTone("silver-green", "Silver Green", "#B5BDB0"),
  earthTone("soft-sage", "Soft Sage", "#A8B5A0"),
  earthTone("eucalyptus", "Eucalyptus", "#82978A"),
  earthTone("copper-taupe", "Copper Taupe", "#A58A78"),
  earthTone("pale-copper", "Pale Copper", "#C9A58E"),
  earthTone("terracotta-bronze", "Terracotta Bronze", "#AD7961"),
  earthTone("almond", "Almond", "#D9C7AC"),
  earthTone("oatmeal", "Oatmeal", "#DCD0BD"),
  earthTone("vanilla-cream", "Vanilla Cream", "#EFE4CF"),
];

export const ACCENT_THEMES: AccentTheme[] = [...BASE_ACCENT_THEMES, ...EARTH_TONE_ACCENT_THEMES];

// The admin dashboard's out-of-the-box accent, applied whenever no swatch is
// stored (fresh install, or the picker's "reset to default"). Overrides the
// globals.css gold that the marketing site / corporate / residential portals
// keep using.
export const DEFAULT_ACCENT_ID = "stone";

// Hex of the default accent above, used only to render the "reset to default" swatch.
export const ACCENT_DEFAULT_HEX = ACCENT_THEMES.find((t) => t.id === DEFAULT_ACCENT_ID)!.primary;

export function getAccentThemeById(id: string | null | undefined): AccentTheme | undefined {
  if (!id) return undefined;
  return ACCENT_THEMES.find((t) => t.id === id);
}
