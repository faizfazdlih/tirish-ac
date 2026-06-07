export interface Gejala {
  kode: string;
  nama: string;
}

export interface Kerusakan {
  kode: string;
  nama: string;
  deskripsi: string;
  solusi: string;
}

export interface Rule {
  kode: string;
  kodeKerusakan: string;
  kodeGejala: string[];
}

export interface HasilDiagnosa {
  kerusakan: Kerusakan;
  rule: Rule;
  gejalaCocok: Gejala[];
  isPartial: boolean;
}

// ─────────────────────────────────────────────
// PARSING
// ─────────────────────────────────────────────

export interface ParsedToken {
  original: string;   // kata asli
  normalized: string; // setelah lowercase & buang tanda baca
  position: number;   // posisi ke-n dalam kalimat
  isNegated: boolean; // apakah didahului kata negasi
  isStopword: boolean;
}

export interface ParseResult {
  tokens: ParsedToken[];
  negatedTerms: string[];   // daftar term yang kena negasi
  affirmedTerms: string[];  // daftar term yang tidak kena negasi
  rawSentence: string;
}

const NEGATION_WORDS = new Set([
  "tidak", "bukan", "belum", "tanpa", "tak", "jangan", "tiada",
]);

const STOPWORDS_SET = new Set([
  "ac", "unit", "indoor", "outdoor", "ruangan", "pada", "yang",
  "dari", "atau", "dan", "di", "ke", "dengan", "untuk", "tidak",
  "kurang", "secara", "terlalu", "saat", "ini", "saya", "sudah",
  "ada", "juga", "itu", "ini", "nya", "lagi", "bisa",
]);

export function parseText(text: string): ParseResult {
  // 1. Normalisasi dasar
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const rawWords = cleaned.split(" ").filter(Boolean);
  const tokens: ParsedToken[] = [];

  let negationActive = false;
  let negationWindow = 0; // negasi berlaku max 3 kata ke depan

  for (let i = 0; i < rawWords.length; i++) {
    const word = rawWords[i];
    const isNegWord = NEGATION_WORDS.has(word);
    const isStop = STOPWORDS_SET.has(word);

    if (isNegWord) {
      negationActive = true;
      negationWindow = 3;
      tokens.push({
        original: word,
        normalized: word,
        position: i,
        isNegated: false,
        isStopword: true,
      });
      continue;
    }

    if (negationActive && negationWindow > 0) {
      negationWindow--;
      if (negationWindow === 0) negationActive = false;
    }

    tokens.push({
      original: word,
      normalized: word,
      position: i,
      isNegated: negationActive && !isStop,
      isStopword: isStop,
    });
  }

  const negatedTerms = tokens
    .filter((t) => t.isNegated && !t.isStopword)
    .map((t) => t.normalized);

  const affirmedTerms = tokens
    .filter((t) => !t.isNegated && !t.isStopword)
    .map((t) => t.normalized);

  return { tokens, negatedTerms, affirmedTerms, rawSentence: text };
}


export interface IndexEntry {
  kodeGejala: string;
  namaGejala: string;
  term: string; // token yang menjadi kunci index
}

export type InvertedIndex = Map<string, IndexEntry[]>;

const SYNONYM_GROUPS_FOR_INDEX: Array<{ canonical: string; variants: string[] }> = [
  { canonical: "dingin",    variants: ["sejuk", "adem", "dingin"] },
  { canonical: "berisik",   variants: ["bising", "ribut", "berdengung", "dengung", "berisik"] },
  { canonical: "mati",      variants: ["padam", "off", "shutdown", "mati"] },
  { canonical: "menetes",   variants: ["bocor", "tetes", "rembes", "menetes"] },
  { canonical: "kipas",     variants: ["fan", "blower", "kipas"] },
  { canonical: "indikator", variants: ["lampu", "led", "indikator"] },
  { canonical: "kompresor", variants: ["compressor", "kompresor"] },
  { canonical: "kondensor", variants: ["condenser", "kondensor"] },
  { canonical: "evaporator",variants: ["evap", "evaporator"] },
  { canonical: "gembung",   variants: ["bengkak", "gembung"] },
  { canonical: "lemah",     variants: ["lemot", "pelan", "lemah"] },
  { canonical: "tersumbat", variants: ["mampet", "sumbat", "tersumbat"] },
  { canonical: "berkedip",  variants: ["blink", "kedip", "berkedip"] },
];

const SYNONYM_INDEX_MAP = new Map<string, string>();
for (const group of SYNONYM_GROUPS_FOR_INDEX) {
  for (const variant of group.variants) {
    SYNONYM_INDEX_MAP.set(variant, group.canonical);
  }
}

function stemForIndex(token: string): string {
  const suffixes = ["nya", "lah", "kah", "pun", "ku", "mu", "kan", "an", "i"];
  for (const suf of suffixes) {
    if (token.length > 4 && token.endsWith(suf)) {
      return token.slice(0, -suf.length);
    }
  }
  return token;
}

function canonicalize(token: string): string {
  const stemmed = stemForIndex(token);
  return SYNONYM_INDEX_MAP.get(stemmed) ?? stemmed;
}

export function buildInvertedIndex(gejalaList: Gejala[]): InvertedIndex {
  const index: InvertedIndex = new Map();

  for (const gejala of gejalaList) {
    const words = gejala.nama
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(" ")
      .filter(Boolean);

    for (const word of words) {
      if (STOPWORDS_SET.has(word)) continue;
      const term = canonicalize(word);
      if (!term || term.length < 3) continue;

      const entry: IndexEntry = {
        kodeGejala: gejala.kode,
        namaGejala: gejala.nama,
        term,
      };

      if (!index.has(term)) {
        index.set(term, []);
      }
      // hindari duplikat
      const existing = index.get(term)!;
      if (!existing.some((e) => e.kodeGejala === gejala.kode)) {
        existing.push(entry);
      }
    }
  }

  return index;
}

export function queryIndex(
  parseResult: ParseResult,
  index: InvertedIndex
): Map<string, number> {
  const scores = new Map<string, number>(); // kodeGejala → skor

  for (const term of parseResult.affirmedTerms) {
    const canonical = canonicalize(term);
    const entries = index.get(canonical) ?? [];
    for (const entry of entries) {
      scores.set(entry.kodeGejala, (scores.get(entry.kodeGejala) ?? 0) + 1);
    }
  }

  return scores;
}

export const gejalaBobot: Record<string, number> = {
  G3: 1.4,
  G8: 1.4,
  G5: 1.3,
  G16: 1.3,
  G4: 1.1,
  G10: 1.1,
  G14: 1.1,
  G15: 1.1,
  G12: 1.0,
  G17: 1.0,
  G6: 1.0,
  G1: 0.9,
  G2: 0.8,
  G7: 0.8,
  G11: 0.8,
  G13: 0.8,
  G9: 0.8,
};

export const gejalaDaftar: Gejala[] = [
  { kode: "G1",  nama: "Ruangan AC tidak dingin" },
  { kode: "G2",  nama: "Ruangan AC kurang dingin" },
  { kode: "G3",  nama: "AC tidak menyala" },
  { kode: "G4",  nama: "Pembekuan pada pipa kecil" },
  { kode: "G5",  nama: "Kipas outdoor tidak berputar" },
  { kode: "G6",  nama: "Lampu indikator indoor unit berkedip" },
  { kode: "G7",  nama: "Suara dengung dari unit outdoor" },
  { kode: "G8",  nama: "Kompresor tidak bekerja" },
  { kode: "G9",  nama: "Air menetes dari unit indoor" },
  { kode: "G10", nama: "AC mati secara otomatis" },
  { kode: "G11", nama: "Suara kipas outdoor berisik" },
  { kode: "G12", nama: "Putaran kipas outdoor tidak lancar" },
  { kode: "G13", nama: "Hembusan blower indoor terhambat dan tidak merata" },
  { kode: "G14", nama: "Sirip-sirip evaporator tersumbat" },
  { kode: "G15", nama: "Sirip-sirip kondensor tersumbat" },
  { kode: "G16", nama: "Kapasitor kipas tampak gembung atau pecah" },
  { kode: "G17", nama: "Putaran kipas outdoor lemah" },
];

export const kerusakanDaftar: Kerusakan[] = [
  {
    kode: "K1",
    nama: "Kompresor rusak",
    deskripsi:
      "Kompresor adalah 'jantung' sistem pendingin. Jika rusak, AC biasanya tidak mampu mendinginkan dan dapat muncul suara tidak normal atau unit sering mati karena proteksi.",
    solusi:
      "Segera hubungi teknisi profesional untuk memeriksa dan mengganti kompresor AC. Kompresor adalah komponen vital dan penggantiannya harus dilakukan oleh ahli.",
  },
  {
    kode: "K2",
    nama: "Kekurangan refrigerant",
    deskripsi:
      "Refrigerant (freon) yang kurang membuat proses pendinginan tidak optimal. Gejalanya bisa AC kurang dingin dan dapat terjadi pembekuan pada pipa/evaporator.",
    solusi:
      "Lakukan pengisian ulang refrigerant oleh teknisi bersertifikat. Periksa juga kemungkinan kebocoran pada sistem sebelum pengisian ulang.",
  },
  {
    kode: "K3",
    nama: "Kapasitor rusak",
    deskripsi:
      "Kapasitor membantu start/menstabilkan kerja motor (misalnya kompresor). Jika lemah/rusak, kompresor sulit bekerja sehingga AC tidak dingin atau gagal menyala dengan normal.",
    solusi:
      "Ganti kapasitor kompresor dengan kapasitor baru yang sesuai spesifikasi. Pastikan mematikan daya listrik sebelum melakukan penggantian.",
  },
  {
    kode: "K4",
    nama: "Modul kontrol error",
    deskripsi:
      "Modul kontrol/PCB mengatur seluruh operasi AC. Jika terjadi error, unit dapat gagal menyala atau indikator berkedip sebagai tanda gangguan sistem.",
    solusi:
      "Reset modul kontrol dengan mematikan AC dari sumber listrik selama 10-15 menit. Jika masalah berlanjut, ganti modul kontrol/PCB board.",
  },
  {
    kode: "K5",
    nama: "Motor blower rusak",
    deskripsi:
      "Motor kipas (blower) membantu membuang panas di unit outdoor. Jika tidak berputar, sistem bisa overheat dan AC dapat mati otomatis untuk melindungi komponen.",
    solusi:
      "Periksa dan ganti motor blower outdoor yang tidak berfungsi. Bersihkan terlebih dahulu kipas dari kotoran sebelum memutuskan untuk mengganti motor.",
  },
  {
    kode: "K6",
    nama: "Overload pada kompresor",
    deskripsi:
      "Overload protector akan memutus arus saat kompresor terlalu panas/berbeban berat. Akibatnya AC bisa mati sendiri dan baru hidup lagi setelah suhu turun.",
    solusi:
      "Biarkan AC istirahat selama 30 menit agar overload protector reset. Periksa sirkulasi udara outdoor dan pastikan tidak ada hambatan. Jika sering terjadi, hubungi teknisi.",
  },
  {
    kode: "K7",
    nama: "Konektor atau pipa rusak",
    deskripsi:
      "Kerusakan pada sambungan pipa/konektor dapat menyebabkan kebocoran refrigerant atau aliran tidak normal. Dampaknya AC tidak dingin dan kadang muncul pembekuan.",
    solusi:
      "Periksa semua sambungan pipa dan konektor. Ganti komponen yang bocor atau rusak. Pastikan pipa terpasang dengan benar dan tidak ada kebocoran.",
  },
  {
    kode: "K8",
    nama: "Saluran drainase tersumbat",
    deskripsi:
      "Air kondensasi dari indoor seharusnya mengalir ke pembuangan. Jika drainase tersumbat, air akan meluap dan menetes dari unit indoor.",
    solusi:
      "Bersihkan saluran pembuangan air (drainase) dengan menyedot atau menyiram air bersih. Gunakan obat pembersih drainase jika tersumbat parah. Lakukan perawatan rutin setiap 3 bulan.",
  },
  {
    kode: "K9",
    nama: "Bearing kipas outdoor rusak",
    deskripsi:
      "Bearing yang aus/rusak membuat kipas outdoor berisik atau putarannya tidak lancar. Kondisi ini mengurangi pembuangan panas sehingga performa AC turun.",
    solusi:
      "Bersihkan bearing menggunakan pelumas khusus. Jika bearing sudah rusak parah, ganti bearing dengan yang baru. Pastikan kipas outdoor dapat berputar dengan lancar setelah penggantian.",
  },
  {
    kode: "K10",
    nama: "Sirip-sirip evaporator kotor",
    deskripsi:
      "Evaporator yang kotor menghambat aliran udara dan penyerapan panas. Akibatnya hembusan kurang merata dan ruangan menjadi kurang dingin.",
    solusi:
      "Bersihkan sirip-sirip evaporator menggunakan air yang dicampur dengan cairan pembersih khusus, lalu semprotkan menggunakan pompa steam. Lakukan pembersihan secara rutin setiap 3-6 bulan.",
  },
  {
    kode: "K11",
    nama: "Sirip-sirip kondensor kotor",
    deskripsi:
      "Kondensor outdoor yang kotor menghambat pelepasan panas. Ini dapat membuat kinerja AC menurun dan memicu temperatur tinggi pada unit outdoor.",
    solusi:
      "Bersihkan sirip-sirip kondensor unit outdoor menggunakan air yang dicampur cairan pembersih khusus, semprotkan menggunakan pompa steam. Pastikan tidak ada hambatan pada aliran udara kondensor.",
  },
  {
    kode: "K12",
    nama: "Kapasitor kipas outdoor rusak",
    deskripsi:
      "Kapasitor kipas yang rusak membuat putaran kipas outdoor lemah atau tidak stabil. Dampaknya pembuangan panas tidak maksimal dan AC bisa menjadi tidak dingin.",
    solusi:
      "Ganti kapasitor kipas outdoor dengan kapasitor baru yang sesuai ukuran dan spesifikasinya. Matikan daya listrik terlebih dahulu sebelum melakukan penggantian kapasitor.",
  },
];

export const rules: Rule[] = [
  { kode: "A1",  kodeKerusakan: "K1",  kodeGejala: ["G1", "G7", "G10"] },
  { kode: "A2",  kodeKerusakan: "K2",  kodeGejala: ["G2", "G4"] },
  { kode: "A3",  kodeKerusakan: "K3",  kodeGejala: ["G1", "G8"] },
  { kode: "A4",  kodeKerusakan: "K4",  kodeGejala: ["G3", "G6"] },
  { kode: "A5",  kodeKerusakan: "K5",  kodeGejala: ["G5", "G10"] },
  { kode: "A6",  kodeKerusakan: "K6",  kodeGejala: ["G1", "G10"] },
  { kode: "A7",  kodeKerusakan: "K7",  kodeGejala: ["G1", "G4"] },
  { kode: "A8",  kodeKerusakan: "K8",  kodeGejala: ["G9"] },
  { kode: "A9",  kodeKerusakan: "K9",  kodeGejala: ["G1", "G11", "G12"] },
  { kode: "A10", kodeKerusakan: "K10", kodeGejala: ["G2", "G13", "G14"] },
  { kode: "A11", kodeKerusakan: "K11", kodeGejala: ["G15"] },
  { kode: "A12", kodeKerusakan: "K12", kodeGejala: ["G1", "G16", "G17"] },
];

export const invertedIndex: InvertedIndex = buildInvertedIndex(gejalaDaftar);

export function forwardChaining(gejalaTerpilih: string[]): HasilDiagnosa[] {
  let bestFullMatch: HasilDiagnosa | null = null;
  let bestPartial: HasilDiagnosa | null = null;
  let bestPartialScore = 0;

  for (const rule of rules) {
    const gejalaCocok = rule.kodeGejala.filter((g) => gejalaTerpilih.includes(g));
    if (gejalaCocok.length === 0) continue;

    const kerusakan = kerusakanDaftar.find((k) => k.kode === rule.kodeKerusakan);
    if (!kerusakan) continue;

    const gejalaDetail = gejalaCocok
      .map((kg) => gejalaDaftar.find((g) => g.kode === kg))
      .filter(Boolean) as Gejala[];

    if (gejalaCocok.length === rule.kodeGejala.length) {
      bestFullMatch = { kerusakan, rule, gejalaCocok: gejalaDetail, isPartial: false };
      break;
    } else {
      const totalWeight = rule.kodeGejala.reduce(
        (sum, kode) => sum + (gejalaBobot[kode] ?? 1),
        0
      );
      const matchedWeight = gejalaCocok.reduce(
        (sum, kode) => sum + (gejalaBobot[kode] ?? 1),
        0
      );
      const score = totalWeight > 0 ? matchedWeight / totalWeight : 0;
      if (score > bestPartialScore) {
        bestPartialScore = score;
        bestPartial = { kerusakan, rule, gejalaCocok: gejalaDetail, isPartial: true };
      }
    }
  }

  if (bestFullMatch) return [bestFullMatch];
  if (bestPartial) return [bestPartial];
  return [];
}