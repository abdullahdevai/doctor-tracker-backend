const SPLIT = /[^\p{L}\p{N}]+/u;
const MAX_TERMS = 5;

function tokenize(value: string): string[] {
  return value.toLowerCase().split(SPLIT).filter(Boolean);
}

export function buildSearchTokens(...values: Array<string | null | undefined>): string[] {
  const tokens = new Set<string>();

  for (const value of values) {
    if (!value) continue;
    for (const token of tokenize(value)) tokens.add(token);

    const lower = value.toLowerCase().trim();
    if (lower.includes('@')) tokens.add(lower);
    if (/^\+?[\d\s\-().]{6,}$/.test(lower)) tokens.add(lower.replace(/\D/g, ''));
  }

  return [...tokens];
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function searchFilter(
  q: string | undefined,
): { searchTokens: { $all: RegExp[] } } | undefined {
  if (!q) return undefined;
  const terms = tokenize(q).slice(0, MAX_TERMS);
  if (terms.length === 0) return undefined;
  return { searchTokens: { $all: terms.map((t) => new RegExp(`^${escapeRegex(t)}`)) } };
}
