/*
 * Multilingual vocabulary for Voice-to-Action: English, Hindi and Gujarati.
 * Hindi/Gujarati words are written in their transliterated Latin form (what
 * voice.text.js#transliterate produces) plus common Hinglish spellings.
 * Everything is compared through phoneticKey(), so small spelling variations match.
 */

/** Words that identify the operation type. */
export const INTENT_WORDS = {
  RECEIPT: [
    // English
    'receive', 'received', 'receiving', 'receipt', 'inward', 'incoming', 'purchase', 'purchased', 'buy', 'bought', 'restock', 'procure',
    // Hindi (प्राप्त, मंगाओ, मंगवाओ, आया, खरीदो, जमा)
    'praapt', 'prapt', 'mangaao', 'mangao', 'mangvaao', 'mangwao', 'mangvao', 'aaya', 'aayaa', 'aayi', 'kharido', 'khariido', 'khariida', 'kharida', 'jama',
    // Gujarati (મેળવો, મંગાવો, આવક, આવ્યું, ખરીદો)
    'melavo', 'medavo', 'mangaavo', 'mangavo', 'aavak', 'aavyu', 'aavyun', 'kharido',
  ],
  DELIVERY: [
    'deliver', 'delivered', 'delivery', 'dispatch', 'dispatched', 'send', 'sent', 'ship', 'shipped', 'outward', 'sell', 'sold',
    // Hindi (भेजो, भेजना, डिलीवर, डिस्पैच, बेचो)
    'bhejo', 'bhej', 'bhejna', 'bhejnaa', 'bhejiye', 'diliivar', 'dilivar', 'dispaich', 'becho', 'bechna',
    // Gujarati (મોકલો, મોકલવું, વેચો, ડિલિવર)
    'moklo', 'mokalo', 'mokal', 'mokalvu', 'mokalavu', 'vecho', 'dilivar',
  ],
  INTERNAL: [
    'transfer', 'transferred', 'move', 'moved', 'shift', 'shifted', 'relocate',
    // Hindi (ट्रांसफर, शिफ्ट, स्थानांतरण, ले जाओ)
    'traansphar', 'transphar', 'shipht', 'sthaanaantaran', 'lejao',
    // Gujarati (ખસેડો, ટ્રાન્સફર, શિફ્ટ)
    'khaseda', 'khasedo', 'khasedavo',
  ],
};

/** Unit words → canonical product UoM (see Product.uom). */
export const UNIT_WORDS = {
  kg: ['kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms', 'kilogramme', 'kilograam'],
  g: ['g', 'gm', 'gms', 'gram', 'grams', 'graam'],
  m: ['m', 'meter', 'meters', 'metre', 'metres', 'miitar', 'mitar', 'miter'],
  L: ['l', 'ltr', 'litre', 'litres', 'liter', 'liters', 'liitar', 'litar'],
  box: ['box', 'boxes', 'boks', 'baks', 'carton', 'cartons', 'dibba', 'dibbaa', 'dibbe', 'dabba', 'dabbaa', 'dabbe', 'petii', 'peti'],
  pack: ['pack', 'packs', 'packet', 'packets', 'paiket', 'paket', 'pekat', 'pakit'],
  Units: ['unit', 'units', 'piece', 'pieces', 'pcs', 'pc', 'nos', 'no', 'nag', 'piis', 'pis', 'item', 'items', 'number'],
};

/** Number words (0–99 and multipliers). English, Hindi and Gujarati. */
export const NUMBER_WORDS = {
  // English
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  // Hindi (एक दो तीन चार पांच छह सात आठ नौ दस ... पच्चीस पचास)
  ek: 1, do: 2, teen: 3, tiin: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhah: 6, chhe: 6, che: 6, saat: 7, sat: 7,
  aath: 8, aat: 8, nau: 9, das: 10, gyaarah: 11, gyarah: 11, baarah: 12, barah: 12, pandrah: 15, bees: 20, biis: 20,
  pachchiis: 25, pachchees: 25, pachis: 25, tees: 30, tiis: 30, chaaliis: 40, chalis: 40, pachaas: 50, pachas: 50,
  sattar: 70, assii: 80, assi: 80, nabbe: 90,
  // Gujarati (એક બે ત્રણ ચાર પાંચ છ સાત આઠ નવ દસ વીસ પચાસ)
  be: 2, tran: 3, traan: 3, chha: 6, nav: 9, vees: 20, viis: 20, pachchis: 25, trees: 30, chaalis: 40,
};

/** Multipliers: hundred / thousand / lakh. */
export const MULTIPLIERS = {
  hundred: 100, sau: 100, so: 100, // सौ / સો
  thousand: 1000, hajaar: 1000, hazaar: 1000, hajar: 1000, hazar: 1000, // हज़ार / હજાર
  lakh: 100000, laakh: 100000, lac: 100000,
};

/** Words meaning "warehouse". */
export const WAREHOUSE_WORDS = ['warehouse', 'godown', 'godaam', 'godam', 'veyarahaus', 'veyarahaaus', 'verahaus', 'verahaaus', 'vareyarahaus', 'wh', 'store', 'gowdown'];

/** Ordinals for "warehouse 1 / second warehouse / पहला / બીજું". */
export const ORDINAL_WORDS = {
  first: 1, one: 1, pehla: 1, pahla: 1, pahalaa: 1, pehlaa: 1, pahelu: 1, pahelun: 1, main: 1,
  second: 2, two: 2, dusra: 2, doosra: 2, duusraa: 2, dusraa: 2, biju: 2, bijun: 2,
  third: 3, three: 3, tisra: 3, tiisraa: 3, triju: 3, trijun: 3,
};

/** Location words (rack / floor / room / shelf) in all three languages. */
export const LOCATION_WORDS = ['rack', 'raik', 'raek', 'floor', 'phlor', 'room', 'rum', 'shelf', 'shelph', 'bin', 'zone', 'aisle', 'section'];

/**
 * "from" markers (source / vendor) and "to" markers (destination / customer).
 * Compared by exact (transliterated) spelling, not phonetically.
 */
export const FROM_WORDS = ['from', 'se', 'thi', 'thii', 'paasethi', 'paasethii', 'pasethi', 'out'];
export const TO_WORDS = ['to', 'into', 'in', 'at', 'ko', 'me', 'mein', 'men', 'maan', 'ma', 'maa', 'ne', 'for', 'tak', 'sudhi', 'sudhii'];

/**
 * Descriptive words in product / company names that people rarely say
 * ("Industrial Packing Tape 2-inch", "Tata Steel Industrial Supply"). Ignored when
 * matching unless the name has nothing else.
 */
export const GENERIC_NAME_WORDS = [
  'industrial', 'heavy', 'duty', 'high', 'roll', 'inch', 'set', 'tensile', 'premium', 'standard',
  'supply', 'supplies', 'ltd', 'pvt', 'limited', 'private', 'co', 'company', 'enterprises', 'industries',
  'facilities', 'tech', 'technologies', 'solutions', 'services', 'traders', 'trading', 'automation',
];

/** Filler words ignored when matching products / contacts. */
export const STOP_WORDS = [
  'the', 'a', 'an', 'of', 'and', 'please', 'pls', 'kindly', 'some', 'our', 'my', 'this', 'that', 'with', 'by', 'on', 'for',
  'hai', 'hain', 'kar', 'karo', 'kariye', 'karna', 'do', 'dijiye', 'ka', 'ki', 'ke', 'aur', 'ek', 'yah', 'ye', 'vah',
  'che', 'chhe', 'karo', 'ane', 'nu', 'ni', 'na', 'no', 'ma', 'maan', 'thi', 'thii', 'ne', 'nun',
  'karo', 'kar', 'karoo', 'kijiye', 'karvu', 'karavo', 'karo.',
];
