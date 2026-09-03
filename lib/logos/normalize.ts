/** Normalizes a team or league name into a stable lookup key: lowercase, no diacritics, no punctuation. */
export function normalizeTeamName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics (e.g. "Léon" -> "Leon")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
