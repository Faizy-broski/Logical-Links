// Dashboard text colour choices. Light mode offers dark inks, dark mode offers
// light tones, so every option stays readable on its own background.
export interface TextSwatch { id: string; name: string; bg: string }

export const TEXT_SWATCHES_LIGHT: TextSwatch[] = [
  { id: "ink-charcoal", name: "Charcoal", bg: "#111827" },
  { id: "ink-black",    name: "Black",    bg: "#000000" },
  { id: "ink-navy",     name: "Navy",     bg: "#14213d" },
  { id: "ink-espresso", name: "Espresso", bg: "#3b2a20" },
  { id: "ink-forest",   name: "Forest",   bg: "#1f3d2b" },
  { id: "ink-plum",     name: "Plum",     bg: "#3b1f3d" },
];

export const TEXT_SWATCHES_DARK: TextSwatch[] = [
  { id: "tone-ivory",   name: "Ivory",   bg: "#edeae4" },
  { id: "tone-white",   name: "White",   bg: "#ffffff" },
  { id: "tone-sand",    name: "Sand",    bg: "#e6d8bd" },
  { id: "tone-sage",    name: "Sage",    bg: "#cfdcc9" },
  { id: "tone-sky",     name: "Sky",     bg: "#d3e3f5" },
];

export function getTextSwatchById(mode: "light" | "dark", id: string | null | undefined): TextSwatch | undefined {
  if (!id) return undefined;
  return (mode === "dark" ? TEXT_SWATCHES_DARK : TEXT_SWATCHES_LIGHT).find((s) => s.id === id);
}
