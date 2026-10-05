export interface Token {
  /** Original text (casing preserved) without surrounding punctuation. */
  raw: string;
  /** Lowercased form used for matching. */
  low: string;
  used: boolean;
}

const KEEP_DOTS = new Set(['a.s.', 'i.p.v.']);

/** Normalizes a full sentence before clause splitting. */
export function normalizeSentence(input: string): string {
  return input
    .replace(/[‘’`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/(^|\s)'?s\s*'?\s*(avonds|ochtends|morgens|middags|nachts)\b/gi, "$1's_$2")
    .replace(/\bi\.?p\.?v\.?(?=\s|$)/gi, 'ipv')
    .replace(/\bin plaats van\b/gi, 'ipv')
    .replace(/\ba\.s\.?(?=\s|$)/gi, 'aanstaande')
    .replace(/(\d{1,2})[:.](\d{2})\s*u\b/gi, '$1:$2')
    .replace(/(\d{1,2})u(\d{2})\b/gi, '$1:$2')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text: string): Token[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((piece) => {
      let raw = piece.replace(/^[("'[]+(?!s_)/, '').replace(/[)"\]!?:;]+$/, '');
      if (!KEEP_DOTS.has(raw.toLowerCase())) raw = raw.replace(/\.+$/, '');
      return { raw, low: raw.toLowerCase(), used: false };
    })
    .filter((t) => t.raw.length > 0);
}

export function remaining(tokens: Token[]): Token[] {
  return tokens.filter((t) => !t.used);
}

export function joinRaw(tokens: Token[]): string {
  return tokens.map((t) => t.raw).join(' ').trim();
}
