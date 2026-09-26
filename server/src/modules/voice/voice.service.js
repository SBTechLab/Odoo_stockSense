import { prisma } from '../../lib/prisma.js';
import { phoneticKey, similarity, tokenize } from './voice.text.js';
import {
  FROM_WORDS,
  GENERIC_NAME_WORDS,
  INTENT_WORDS,
  LOCATION_WORDS,
  MULTIPLIERS,
  NUMBER_WORDS,
  ORDINAL_WORDS,
  STOP_WORDS,
  TO_WORDS,
  UNIT_WORDS,
  WAREHOUSE_WORDS,
} from './voice.lexicon.js';

/*
 * Voice-to-Action parser: turns a spoken/typed command such as
 *   "Receive 500 kg steel rods from Tata Steel in warehouse 1"
 *   "टाटा स्टील से 500 किलो स्टील रॉड मंगाओ"
 *   "ટાટા સ્ટીલ પાસેથી ૫૦૦ કિલો સ્ટીલ રોડ મંગાવો"
 * into a draft operation. Rule-based and fully offline.
 * The result is only a suggestion — the user confirms or edits it in the UI.
 */

const keySet = (words) => new Set(words.map(phoneticKey));
const INTENT_KEYS = Object.fromEntries(Object.entries(INTENT_WORDS).map(([k, v]) => [k, keySet(v)]));
const UNIT_KEYS = Object.entries(UNIT_WORDS).flatMap(([uom, words]) => words.map((w) => [phoneticKey(w), uom]));
const UNIT_MAP = new Map(UNIT_KEYS);
const NUMBER_MAP = new Map(Object.entries(NUMBER_WORDS).map(([w, n]) => [phoneticKey(w), n]));
const MULT_MAP = new Map(Object.entries(MULTIPLIERS).map(([w, n]) => [phoneticKey(w), n]));
const ORDINAL_MAP = new Map(Object.entries(ORDINAL_WORDS).map(([w, n]) => [phoneticKey(w), n]));
const WAREHOUSE_KEYS = keySet(WAREHOUSE_WORDS);
const LOCATION_KEYS = keySet(LOCATION_WORDS);
// Markers and filler words are compared by exact spelling: phonetic keys would make
// e.g. "tata" (tat) collide with "that" (tat).
const FROM_KEYS = new Set(FROM_WORDS);
const TO_KEYS = new Set(TO_WORDS);
const STOP_KEYS = new Set(STOP_WORDS);
const isMarker = (t, set) => Boolean(t) && set.has(t.raw);
/** Number words that are also ordinary words — only numbers when next to a unit/multiplier. */
const AMBIGUOUS_NUMBER_KEYS = keySet(['do', 'be', 'so', 'sat', 'che', 'chhe', 'no', 'ek', 'nav', 'char', 'das']);

const MATCH_MIN = 0.75;
const round3 = (n) => Math.round(n * 1000) / 1000;

// ───────────────────────────── extraction steps ─────────────────────────────

/** Find the operation type from keywords. */
function detectIntent(tokens) {
  const scores = { RECEIPT: 0, DELIVERY: 0, INTERNAL: 0 };
  const used = new Set();
  for (const t of tokens) {
    for (const [intent, keys] of Object.entries(INTENT_KEYS)) {
      for (const k of keys) {
        const sim = t.key.length >= 4 && k.length >= 4 ? similarity(t.key, k) : t.key === k ? 1 : 0;
        if (sim >= 0.86) {
          scores[intent] = Math.max(scores[intent], sim);
          used.add(t.i);
        }
      }
    }
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? { value: best[0], used } : { value: null, used };
}

function unitAt(tokens, i) {
  const t = tokens[i];
  return t ? UNIT_MAP.get(t.key) ?? null : null;
}

/**
 * Parse quantity + unit. Prefers a number directly followed by a unit word;
 * supports digits, decimals and number words ("five hundred", "पांच सौ", "પાંચ સો").
 */
function detectQuantity(tokens, skip) {
  const candidates = [];
  for (let i = 0; i < tokens.length; i++) {
    if (skip.has(i)) continue;
    let total = 0;
    let current = 0;
    let j = i;
    let found = false;
    while (j < tokens.length && !skip.has(j)) {
      const t = tokens[j];
      if (/^\d+(\.\d+)?$/.test(t.raw)) {
        if (found && current) break; // "500 12" → two separate numbers
        current += Number(t.raw);
        found = true;
      } else if (NUMBER_MAP.has(t.key) && !(AMBIGUOUS_NUMBER_KEYS.has(t.key) && !found && !MULT_MAP.has(tokens[j + 1]?.key) && !unitAt(tokens, j + 1))) {
        current += NUMBER_MAP.get(t.key);
        found = true;
      } else if (found && MULT_MAP.has(t.key)) {
        const m = MULT_MAP.get(t.key);
        if (m === 100) current = (current || 1) * 100;
        else {
          total += (current || 1) * m;
          current = 0;
        }
      } else if (found && (t.key === 'and' || t.key === 'aur')) {
        // "two hundred and fifty"
      } else break;
      j++;
    }
    if (found) {
      const value = total + current;
      const unit = unitAt(tokens, j);
      const indexes = new Set();
      for (let k = i; k < j + (unit ? 1 : 0); k++) indexes.add(k);
      candidates.push({ value, unit, indexes, afterWarehouseWord: WAREHOUSE_KEYS.has(tokens[i - 1]?.key) || LOCATION_KEYS.has(tokens[i - 1]?.key) });
      i = j;
    }
  }
  const pick =
    candidates.find((c) => c.unit && c.value > 0) ??
    candidates.find((c) => !c.afterWarehouseWord && c.value > 0) ??
    null;
  // A unit word without a number ("kg steel") still tells us the unit.
  const loneUnit = pick ? null : tokens.find((t) => !skip.has(t.i) && UNIT_MAP.has(t.key) && t.key.length > 1);
  return {
    value: pick ? round3(pick.value) : null,
    unit: pick?.unit ?? (loneUnit ? UNIT_MAP.get(loneUnit.key) : null),
    used: pick ? pick.indexes : new Set(loneUnit ? [loneUnit.i] : []),
  };
}

/** Match a warehouse by ordinal ("warehouse 2"), short code ("WH2") or name words ("second", "main"). */
function detectWarehouse(tokens, warehouses) {
  const used = new Set();
  let byIndex = null;
  tokens.forEach((t, i) => {
    if (!WAREHOUSE_KEYS.has(t.key)) return;
    used.add(i);
    for (const n of [tokens[i + 1], tokens[i - 1]]) {
      if (!n) continue;
      const num = /^\d+$/.test(n.raw) ? Number(n.raw) : ORDINAL_MAP.get(n.key);
      if (num && warehouses[num - 1]) {
        byIndex = warehouses[num - 1];
        used.add(n.i);
        return;
      }
    }
  });
  if (byIndex) return { value: byIndex, used, source: 'spoken' };

  for (const w of warehouses) {
    const code = phoneticKey(w.shortCode);
    const hit = tokens.find((t) => t.key === code && code.length >= 2 && !WAREHOUSE_KEYS.has(t.key));
    if (hit) return { value: w, used: new Set([...used, hit.i]), source: 'spoken' };
  }
  const named = bestEntity(tokens, warehouses.map((w) => ({ ...w, label: w.name.replace(/warehouse/i, '') })), new Set(), { min: 0.9 });
  if (named && used.size) return { value: named.item, used: new Set([...used, ...named.matched]), source: 'spoken' };
  return { value: warehouses[0] ?? null, used, source: 'default' };
}

/** Candidate tokens of an entity label (skips filler words and tokens with digits like "12mm"). */
function labelKeys(label, { keepShort = false } = {}) {
  const words = labelWords(label, keepShort);
  const specific = words.filter((w) => !GENERIC_NAME_WORDS.includes(w));
  return (specific.length ? specific : words).map(phoneticKey).filter(Boolean);
}

function labelWords(label, keepShort) {
  return String(label)
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !/\d/.test(w) && (keepShort ? true : w.length > 1 && !STOP_WORDS.includes(w)));
}

/**
 * Score one entity against the command.
 * @returns {{ coverage: number, matched: Set<number> }} coverage = share of the label's words heard
 */
function scoreEntity(tokens, keys, skip) {
  if (!keys.length) return { coverage: 0, matched: new Set() };
  let sum = 0;
  const matched = new Set();
  for (const k of keys) {
    let best = 0;
    let bestIdx = -1;
    for (const t of tokens) {
      if (skip.has(t.i) || !t.key) continue;
      const sim = k.length === 1 || t.key.length === 1 ? (k === t.key ? 1 : 0) : similarity(k, t.key);
      if (sim > best) {
        best = sim;
        bestIdx = t.i;
      }
    }
    if (best >= MATCH_MIN) {
      sum += best;
      matched.add(bestIdx);
    }
  }
  return { coverage: sum / keys.length, matched };
}

function bestEntity(tokens, items, skip, { min = 0.3, keepShort = false } = {}) {
  let best = null;
  for (const item of items) {
    const keys = labelKeys(item.label ?? item.name, { keepShort });
    const s = scoreEntity(tokens, keys, skip);
    if (s.coverage >= min && (!best || s.coverage > best.coverage)) best = { item, ...s };
  }
  return best;
}

/**
 * Jointly choose the product and the contact. Words like "steel" may belong to both
 * ("Tata Steel" and "Steel Rods"), so every pair is scored on how well it explains the command.
 */
function detectProductAndContact(tokens, skip, products, contacts) {
  const content = tokens.filter((t) => !skip.has(t.i) && !STOP_KEYS.has(t.raw) && t.key);
  const contentCount = Math.max(1, content.length);

  const scoredProducts = products
    .map((p) => {
      const nameScore = scoreEntity(tokens, labelKeys(p.name), skip);
      const sku = tokens.find((t) => !skip.has(t.i) && t.raw.toUpperCase() === p.sku);
      return sku ? { item: p, coverage: 1, matched: new Set([sku.i]) } : { item: p, ...nameScore };
    })
    .filter((s) => s.matched.size > 0)
    .sort((a, b) => b.coverage - a.coverage)
    .slice(0, 8);

  // People usually say only the brand ("Infosys", "Tata Steel"), i.e. the first word(s)
  // of a company name, so a heard first word counts for at least half the name.
  const scoredContacts = contacts
    .map((c) => {
      const keys = labelKeys(c.name);
      const full = scoreEntity(tokens, keys, skip);
      const brand = scoreEntity(tokens, keys.slice(0, 1), skip);
      return { item: c, ...full, coverage: Math.max(full.coverage, brand.coverage >= 0.8 ? 0.5 * brand.coverage : 0) };
    })
    .filter((s) => s.matched.size > 0 && s.coverage >= 0.25)
    .slice(0, 8);

  let best = { score: -1, product: null, contact: null };
  for (const p of [...scoredProducts, null]) {
    for (const c of [...scoredContacts, null]) {
      const pm = p?.matched ?? new Set();
      const cm = c?.matched ?? new Set();
      const union = new Set([...pm, ...cm]);
      const overlap = [...pm].filter((i) => cm.has(i)).length;
      const score = (p?.coverage ?? 0) + 0.8 * (c?.coverage ?? 0) + (0.8 * union.size) / contentCount - (0.3 * overlap) / contentCount;
      if (score > best.score) best = { score, product: p, contact: c };
    }
  }

  const product = best.product && best.product.coverage >= 0.3 ? best.product : null;
  const alternatives = scoredProducts
    .filter((s) => s.item.id !== product?.item.id && s.coverage >= 0.2)
    .slice(0, 3)
    .map((s) => ({ ...publicProduct(s.item), score: round3(s.coverage) }));
  return { product, contact: best.contact && best.contact.coverage >= 0.3 ? best.contact : null, alternatives };
}

/** Transfers: first location heard = source, second = destination ("from Rack A to Production Floor"). */
function detectLocations(tokens, locations, skip) {
  const hits = [];
  for (const loc of locations) {
    const s = scoreEntity(tokens, labelKeys(loc.name, { keepShort: true }), skip);
    const code = tokens.find((t) => !skip.has(t.i) && t.raw.toUpperCase() === loc.shortCode);
    const coverage = code ? 1 : s.coverage;
    const matched = code ? new Set([code.i]) : s.matched;
    if (coverage >= 0.8) hits.push({ loc, first: Math.min(...matched), matched });
  }
  hits.sort((a, b) => a.first - b.first);
  // drop hits whose tokens are already used by an earlier hit (e.g. "Rack A" vs "Rack B")
  const chosen = [];
  const taken = new Set();
  for (const h of hits) {
    if ([...h.matched].some((i) => taken.has(i))) continue;
    chosen.push(h);
    h.matched.forEach((i) => taken.add(i));
  }
  const markerBefore = (h, set) => [tokens[h.first - 1], tokens[h.first - 2]].some((t) => isMarker(t, set));
  const markerAfter = (h, set) => isMarker(tokens[Math.max(...h.matched) + 1], set);
  let source = null;
  let dest = null;
  if (chosen.length >= 2) {
    [source, dest] = [chosen[0], chosen[1]];
    // "to X from Y" (English) — swap when the first one is introduced by "to"
    if (markerBefore(chosen[0], TO_KEYS) && markerBefore(chosen[1], FROM_KEYS)) [source, dest] = [dest, source];
  } else if (chosen.length === 1) {
    const h = chosen[0];
    const isDest = markerBefore(h, TO_KEYS) || markerAfter(h, TO_KEYS);
    if (isDest) dest = h;
    else source = h;
  }
  return { source: source?.loc ?? null, dest: dest?.loc ?? null, used: taken };
}

const publicProduct = (p) => ({ id: p.id, name: p.name, sku: p.sku, uom: p.uom });
const publicContact = (c) => ({ id: c.id, name: c.name, type: c.type });
const publicLocation = (l) => (l ? { id: l.id, name: l.name, shortCode: l.shortCode } : null);

/** Convert between compatible units (g ↔ kg). Returns null when not convertible. */
function convert(qty, from, to) {
  if (!from || !to || from === to) return qty;
  if (from === 'g' && to === 'kg') return round3(qty / 1000);
  if (from === 'kg' && to === 'g') return round3(qty * 1000);
  return null;
}

// ───────────────────────────── main entry ─────────────────────────────

/**
 * Parse a voice/typed command into a suggested operation.
 * @param {{ text: string, language?: string, contextType?: 'RECEIPT'|'DELIVERY'|'INTERNAL' }} input
 */
export async function parseCommand({ text, language = 'en-IN', contextType }) {
  const { latin, tokens } = tokenize(text);

  const [products, contacts, warehouses] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { id: true, name: true, sku: true, uom: true } }),
    prisma.contact.findMany({ where: { isActive: true }, select: { id: true, name: true, type: true } }),
    prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        shortCode: true,
        defaultLocationId: true,
        locations: { where: { isActive: true, type: 'INTERNAL' }, select: { id: true, name: true, shortCode: true } },
      },
    }),
  ]);

  const skip = new Set();
  const intent = detectIntent(tokens);
  intent.used.forEach((i) => skip.add(i));
  const type = intent.value ?? contextType ?? 'RECEIPT';

  const warehouse = detectWarehouse(tokens, warehouses);
  warehouse.used.forEach((i) => skip.add(i));

  const quantity = detectQuantity(tokens, skip);
  quantity.used.forEach((i) => skip.add(i));

  // location words and from/to markers are not product/contact words
  tokens.forEach((t, i) => {
    const letterAfterLocationWord = t.key.length === 1 && LOCATION_KEYS.has(tokens[i - 1]?.key);
    if (!letterAfterLocationWord && (FROM_KEYS.has(t.raw) || TO_KEYS.has(t.raw) || STOP_KEYS.has(t.raw))) skip.add(t.i);
  });

  const wh = warehouse.value;
  const locs = detectLocations(tokens, wh?.locations ?? [], skip);
  locs.used.forEach((i) => skip.add(i));
  tokens.forEach((t) => LOCATION_KEYS.has(t.key) && skip.add(t.i));

  const partnerTypes = type === 'RECEIPT' ? ['VENDOR', 'BOTH'] : type === 'DELIVERY' ? ['CUSTOMER', 'BOTH'] : [];
  const pc = detectProductAndContact(
    tokens,
    skip,
    products,
    contacts.filter((c) => partnerTypes.includes(c.type)),
  );

  const product = pc.product?.item ?? null;
  let qty = quantity.value;
  let unitNote = null;
  if (product && quantity.unit && quantity.unit !== product.uom) {
    const converted = qty === null ? null : convert(qty, quantity.unit, product.uom);
    if (converted !== null && qty !== null) {
      unitNote = { type: 'converted', from: `${qty} ${quantity.unit}`, to: `${converted} ${product.uom}` };
      qty = converted;
    } else {
      unitNote = { type: 'mismatch', spoken: quantity.unit, productUom: product.uom };
    }
  }

  const defaultLoc = wh?.locations.find((l) => l.id === wh.defaultLocationId) ?? wh?.locations[0] ?? null;
  let sourceLocation = null;
  let destLocation = null;
  if (type === 'RECEIPT') destLocation = locs.dest ?? locs.source ?? defaultLoc;
  if (type === 'DELIVERY') sourceLocation = locs.source ?? locs.dest ?? defaultLoc;
  if (type === 'INTERNAL') {
    sourceLocation = locs.source ?? (locs.dest && locs.dest.id !== defaultLoc?.id ? defaultLoc : null);
    destLocation = locs.dest ?? null;
    if (!destLocation && sourceLocation) destLocation = wh?.locations.find((l) => l.id !== sourceLocation.id) ?? null;
  }

  const missing = [];
  if (!product) missing.push('product');
  if (!(qty > 0)) missing.push('quantity');
  if (!wh) missing.push('warehouse');
  if (type === 'INTERNAL' && (!sourceLocation || !destLocation)) missing.push('locations');
  if (type !== 'INTERNAL' && !pc.contact) missing.push('contact'); // optional, reported for the UI

  const ready = !missing.some((m) => m !== 'contact');

  return {
    input: text,
    language,
    transliterated: latin,
    intent: { value: type, source: intent.value ? 'spoken' : contextType ? 'form' : 'default' },
    quantity: qty,
    spokenUnit: quantity.unit,
    unitNote,
    product: product ? { ...publicProduct(product), score: round3(pc.product.coverage) } : null,
    productAlternatives: pc.alternatives,
    contact: pc.contact ? { ...publicContact(pc.contact.item), score: round3(pc.contact.coverage) } : null,
    warehouse: wh ? { id: wh.id, name: wh.name, shortCode: wh.shortCode, source: warehouse.source } : null,
    sourceLocation: publicLocation(sourceLocation),
    destLocation: publicLocation(destLocation),
    missing,
    ready,
    draft: ready
      ? {
          type,
          warehouseId: wh.id,
          contactId: pc.contact?.item.id ?? null,
          sourceLocationId: sourceLocation?.id ?? null,
          destLocationId: destLocation?.id ?? null,
          lines: [{ productId: product.id, quantity: qty }],
        }
      : null,
  };
}

