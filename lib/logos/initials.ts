// Muted, professional palette — no neon/casino colors, works in both themes
// since these are always paired with white text on a solid chip.
const PALETTE = [
  "#64748b", // slate
  "#0891b2", // cyan
  "#7c3aed", // violet
  "#db2777", // pink
  "#059669", // emerald
  "#d97706", // amber
  "#4f46e5", // indigo
  "#0d9488", // teal
];

const STOPWORDS = new Set(["the", "of", "and", "fc", "cf", "sc", "afc", "ac"]);

/** Up to `maxLetters` initials from the most significant words in a name. */
export function getInitials(name: string, maxLetters = 2): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
  const significant = words.filter((w) => !STOPWORDS.has(w.toLowerCase()));
  const source = significant.length > 0 ? significant : words;

  const letters = source
    .slice(0, maxLetters)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return letters || "?";
}

/** Deterministic (same name -> same color every time) pick from a fixed, muted palette. */
export function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
