/*
 * Text utilities for Voice-to-Action (offline, no external services).
 *
 *  - Devanagari (Hindi) and Gujarati script → rough Latin transliteration, so
 *    "स्टील रॉड" and "સ્ટીલ રોડ" can be matched against the product "Steel Rods".
 *  - A phonetic key that makes English spellings and transliterations comparable
 *    ("steel" / "stiil" → "stil", "tata" / "taataa" → "tat").
 *  - Fuzzy similarity (Levenshtein on keys + consonant skeleton).
 */

// ───────────────────────────── transliteration ─────────────────────────────

const DEV_VOWELS = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ii', 'उ': 'u', 'ऊ': 'uu', 'ऋ': 'ri',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'ऑ': 'o', 'ऍ': 'e', 'ऎ': 'e', 'ऒ': 'o',
};
const DEV_MATRAS = {
  'ा': 'aa', 'ि': 'i', 'ी': 'ii', 'ु': 'u', 'ू': 'uu', 'ृ': 'ri',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ॉ': 'o', 'ॅ': 'e', 'ॆ': 'e', 'ॊ': 'o',
};
const DEV_CONSONANTS = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'ळ': 'l', 'व': 'v',
  'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'क़': 'q', 'ख़': 'kh', 'ग़': 'g', 'ज़': 'z', 'फ़': 'f', 'ड़': 'r', 'ढ़': 'rh', 'य़': 'y',
};
const VIRAMA = '्';
const NUKTA = '़';
const SIGNS = { 'ं': 'n', 'ँ': 'n', 'ः': 'h' };

/** Gujarati block (U+0A80) mirrors Devanagari (U+0900) at a fixed offset. */
function gujaratiToDevanagari(text) {
  let out = '';
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    out += cp >= 0x0a80 && cp <= 0x0aff ? String.fromCodePoint(cp - 0x180) : ch;
  }
  return out;
}

/** Convert Devanagari / Gujarati / Indic digits to ASCII digits. */
export function normalizeDigits(text) {
  return text.replace(/[०-९૦-૯]/g, (d) => {
    const cp = d.codePointAt(0);
    return String(cp >= 0x0ae6 ? cp - 0x0ae6 : cp - 0x0966);
  });
}

/**
 * Transliterate Hindi / Gujarati script to lowercase Latin (approximate, for matching only).
 * Latin text passes through unchanged.
 * @param {string} input
 * @returns {string}
 */
export function transliterate(input) {
  const separated = normalizeDigits(String(input ?? '').normalize('NFC')).replace(
    /([\u0A80-\u0AFF]{2,}?)(ને|થી|માં|નું)(?=\s|$)/g,
    '$1 $2',
  );
  const text = gujaratiToDevanagari(separated);
  // Only Indic runs are transliterated; Latin words pass through untouched.
  return text.replace(/[ऀ-ॿ]+/g, transliterateRun).toLowerCase();
}

function transliterateRun(run) {
  const chars = [...run];
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    let ch = chars[i];
    if (chars[i + 1] === NUKTA && DEV_CONSONANTS[ch + NUKTA]) {
      ch += NUKTA;
      i++;
    }
    if (DEV_CONSONANTS[ch]) {
      out += DEV_CONSONANTS[ch];
      const next = chars[i + 1];
      if (next === VIRAMA) {
        i++;
      } else if (DEV_MATRAS[next]) {
        out += DEV_MATRAS[next];
        i++;
      } else {
        // inherent vowel; dropped at word end (Hindi schwa deletion) below
        out += 'a';
      }
    } else if (DEV_VOWELS[ch]) {
      out += DEV_VOWELS[ch];
    } else if (SIGNS[ch]) {
      out += SIGNS[ch];
    } else if (ch === NUKTA || ch === VIRAMA) {
      // ignore stray marks
    } else {
      out += ch;
    }
  }
  // schwa deletion: "रॉड" → "roda" → "rod"; keep short words like "se"/"na"
  return /^[a-z]*[aeiou][a-z]*[^aeiou]a$/.test(out) && out.length > 3 ? out.slice(0, -1) : out;
}

// ───────────────────────────── phonetic key & similarity ─────────────────────────────

/** Spoken letter names → letter (so "rack ए" / "rack bee" match "Rack A" / "Rack B"). */
const LETTER_NAMES = { e: 'a', ay: 'a', ei: 'a', bi: 'b', bee: 'b', si: 'c', see: 'c', di: 'd', dee: 'd', ef: 'f' };

/** Common spoken/transliterated variants mapped to one spelling (रैक / રેક → rack). */
const SYNONYMS = { raik: 'rack', raek: 'rack', rek: 'rack', raiks: 'rack', phlor: 'floor', flor: 'floor' };

/**
 * Phonetic key used for all comparisons.
 * @param {string} word lowercase latin word
 * @returns {string}
 */
export function phoneticKey(word) {
  let w = String(word).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!w) return '';
  if (/^\d+(\.\d+)?$/.test(w)) return w;
  if (LETTER_NAMES[w]) return LETTER_NAMES[w];
  if (SYNONYMS[w]) w = SYNONYMS[w];
  w = w
    .replace(/[ts]ion/g, 'shan') // production ≈ प्रोडक्शन (prodakshan)
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/q/g, 'k')
    .replace(/w/g, 'v')
    .replace(/z/g, 'j')
    .replace(/x/g, 'ks')
    .replace(/c(?=[eiy])/g, 's') // soft c: reliance ≈ रिलायंस
    .replace(/c(?!h)/g, 'k')
    .replace(/(ee|ii|ea|ie)/g, 'i')
    .replace(/(oo|uu)/g, 'u')
    .replace(/aa/g, 'a')
    .replace(/([kgtdb])h/g, '$1')
    .replace(/y$/, 'i')
    .replace(/(.)\1+/g, '$1');
  if (w.length > 3) w = w.replace(/[ae]$/, '');
  return w;
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

const skeleton = (k) => k[0] + k.slice(1).replace(/[aeiouy]/g, '');

/**
 * Similarity 0..1 between two phonetic keys. Also tolerates plural "s" and
 * vowel differences (consonant skeleton) for longer words.
 */
export function similarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const strip = (k) => (k.length > 3 ? k.replace(/s$/, '') : k);
  const a1 = strip(a);
  const b1 = strip(b);
  if (a1 === b1) return 0.97;
  const lev = 1 - levenshtein(a1, b1) / Math.max(a1.length, b1.length);
  const sa = skeleton(a1);
  const sb = skeleton(b1);
  const skel = sa.length >= 3 && sa === sb ? 0.88 : sa.length === 2 && sa === sb && a1.length <= 4 && b1.length <= 4 ? 0.78 : 0;
  // prefix match for longer spoken words, e.g. "tensile" vs "tensil"
  const prefix = a1.length >= 4 && b1.length >= 4 && (a1.startsWith(b1) || b1.startsWith(a1)) ? 0.85 : 0;
  return Math.max(lev, skel, prefix);
}

/**
 * Tokenize a command. Returns tokens with the original (transliterated) text and its key.
 * @param {string} input raw transcript in any supported script
 * @returns {{ latin: string, tokens: Array<{ i: number, raw: string, key: string }> }}
 */
export function tokenize(input) {
  const latin = transliterate(input)
    .replace(/(\d),(\d)/g, '$1$2') // 1,000 → 1000
    .replace(/(\d)([a-z]+)/g, '$1 $2') // 500kg → 500 kg
    .replace(/[^a-z0-9.\s]/g, ' ')
    .replace(/\.(?!\d)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = latin
    .split(' ')
    .filter(Boolean)
    .map((raw, i) => ({ i, raw, key: phoneticKey(raw) }));
  return { latin, tokens };
}
