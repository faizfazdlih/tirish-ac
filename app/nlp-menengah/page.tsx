"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { forwardChaining, gejalaDaftar, HasilDiagnosa, kerusakanDaftar, rules } from "@/lib/knowledgeBase";
import { useTheme } from "../theme-provider";

type Suggestion = {
  kode: string;
  nama: string;
  score: number;
  reasons: string[];
};

const STOPWORDS = new Set([
  "ac",
  "unit",
  "indoor",
  "outdoor",
  "ruangan",
  "pada",
  "yang",
  "dari",
  "atau",
  "dan",
  "di",
  "ke",
  "dengan",
  "untuk",
  "tidak",
  "kurang",
  "secara",
  "terlalu",
  "saat",
  "ini",
]);

const SYNONYM_GROUPS: Array<{ canonical: string; variants: string[] }> = [
  { canonical: "dingin", variants: ["sejuk", "adem"] },
  { canonical: "berisik", variants: ["bising", "ribut", "berdengung", "dengung"] },
  { canonical: "mati", variants: ["padam", "off", "shutdown"] },
  { canonical: "menetes", variants: ["bocor", "tetes", "rembes"] },
  { canonical: "berputar", variants: ["mutar", "spin", "berputar"] },
  { canonical: "kipas", variants: ["fan", "blower", "kipas"] },
  { canonical: "indikator", variants: ["lampu", "led", "indikator"] },
  { canonical: "kompresor", variants: ["compressor", "kompresor"] },
  { canonical: "kondensor", variants: ["condenser", "kondensor"] },
  { canonical: "evaporator", variants: ["evaporator", "evap"] },
  { canonical: "gembung", variants: ["bengkak", "gembung"] },
  { canonical: "pecah", variants: ["retak", "pecah"] },
  { canonical: "lemah", variants: ["lemot", "pelan", "lemah"] },
  { canonical: "tersumbat", variants: ["mampet", "tersumbat", "sumbat"] },
  { canonical: "berkedip", variants: ["blink", "kedip", "berkedip"] },
  { canonical: "berputar", variants: ["berputar", "berputarnya"] },
];

const SYNONYM_MAP = new Map<string, string>();
for (const group of SYNONYM_GROUPS) {
  for (const variant of group.variants) {
    SYNONYM_MAP.set(variant, group.canonical);
  }
}

const PHRASE_HINTS: Record<string, string[]> = {
  G1: ["tidak dingin", "panas", "tidak sejuk"],
  G2: ["kurang dingin", "kurang sejuk", "dinginnya kurang"],
  G3: ["tidak menyala", "tidak hidup", "mati total"],
  G4: ["pipa kecil beku", "pipa beku", "es pada pipa"],
  G5: ["kipas outdoor tidak berputar", "kipas luar mati"],
  G6: ["lampu indikator berkedip", "lampu berkedip", "indikator blink"],
  G7: ["suara dengung", "dengung"],
  G8: ["kompresor tidak bekerja", "kompresor mati"],
  G9: ["air menetes", "bocor", "air keluar"],
  G10: ["mati otomatis", "mati sendiri"],
  G11: ["kipas berisik", "suara kipas berisik"],
  G12: ["putaran kipas tidak lancar", "kipas tersendat"],
  G13: ["hembusan blower terhambat", "angin tidak merata", "angin lemah"],
  G14: ["evaporator tersumbat", "evaporator kotor"],
  G15: ["kondensor tersumbat", "kondensor kotor"],
  "616": ["kapasitor kipas gembung", "kapasitor pecah"],
  G17: ["putaran kipas lemah", "kipas lemah"],
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stem(token: string) {
  let t = token;
  const suffixes = ["nya", "lah", "kah", "pun", "ku", "mu", "kan", "an", "i"];
  for (const suf of suffixes) {
    if (t.length > 4 && t.endsWith(suf)) {
      t = t.slice(0, -suf.length);
      break;
    }
  }
  return t;
}

function normalizeToken(token: string) {
  const base = SYNONYM_MAP.get(token) ?? token;
  return stem(base);
}

function tokenize(text: string) {
  const raw = normalize(text).split(" ").filter(Boolean);
  const tokens: string[] = [];
  for (const t of raw) {
    if (STOPWORDS.has(t)) continue;
    const norm = normalizeToken(t);
    if (norm && !STOPWORDS.has(norm)) {
      tokens.push(norm);
    }
  }
  return tokens;
}

function toTokenSet(text: string) {
  return new Set(tokenize(text));
}

function getNameTokens(name: string) {
  return Array.from(new Set(tokenize(name)));
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a || !b) return Math.max(a.length, b.length);
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

function isSimilarToken(a: string, b: string) {
  if (a.length < 4 || b.length < 4) return false;
  return levenshtein(a, b) <= 1;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildHighlightNodes(input: string, phrases: string[], tokens: string[]) {
  const patterns = Array.from(new Set([...phrases, ...tokens].filter(Boolean)));
  if (!input || patterns.length === 0) return [input];

  const sorted = patterns.sort((a, b) => b.length - a.length);
  const regex = new RegExp(`(${sorted.map(escapeRegExp).join("|")})`, "gi");
  const parts = input.split(regex);
  const patternSet = new Set(sorted.map((p) => p.toLowerCase()));

  return parts.map((part, index) => {
    if (!part) return null;
    const isMatch = patternSet.has(part.toLowerCase());
    if (!isMatch) return <span key={`t-${index}`}>{part}</span>;
    return (
      <mark
        key={`m-${index}`}
        className="bg-cyan-200/70 dark:bg-cyan-500/30 text-slate-900 dark:text-cyan-100 px-0.5 rounded-sm"
      >
        {part}
      </mark>
    );
  });
}

function buildSuggestions(text: string): Suggestion[] {
  const normalized = normalize(text);
  const tokens = toTokenSet(text);
  const rawTokens = tokenize(text);

  return gejalaDaftar
    .map((g) => {
      const reasons: string[] = [];
      let score = 0;

      const phrases = PHRASE_HINTS[g.kode] ?? [];
      for (const phrase of phrases) {
        const p = normalize(phrase);
        if (p && normalized.includes(p)) {
          score += 1.4;
          reasons.push(`cocok frasa: "${phrase}"`);
        }
      }

      for (const token of getNameTokens(g.nama)) {
        if (tokens.has(token)) {
          score += 0.35;
          reasons.push(`cocok kata: ${token}`);
          continue;
        }

        const fuzzyHit = rawTokens.some((t) => isSimilarToken(t, token));
        if (fuzzyHit) {
          score += 0.2;
          reasons.push(`mendekati kata: ${token}`);
        }
      }

      return { kode: g.kode, nama: g.nama, score, reasons };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
}

export default function NlpMenengahPage() {
  const { toggleTheme } = useTheme();
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [hasil, setHasil] = useState<HasilDiagnosa[]>([]);
  const [detectedTokens, setDetectedTokens] = useState<string[]>([]);
  const [detectedPhrases, setDetectedPhrases] = useState<string[]>([]);

  const canDetect = text.trim().length >= 6;

  const selectedGejala = useMemo(
    () =>
      selected
        .map((kode) => gejalaDaftar.find((g) => g.kode === kode))
        .filter(Boolean),
    [selected]
  );

  const matchedRules = useMemo(() => {
    if (selected.length === 0) return [];
    const kerusakanMap = new Map(kerusakanDaftar.map((k) => [k.kode, k] as const));
    const gejalaMap = new Map(gejalaDaftar.map((g) => [g.kode, g] as const));

    return rules
      .map((rule) => {
        const matched = rule.kodeGejala.filter((g) => selected.includes(g));
        if (matched.length === 0) return null;
        const score = matched.length / rule.kodeGejala.length;
        return {
          rule,
          matched,
          allGejala: rule.kodeGejala.map((kode) => ({
            kode,
            nama: gejalaMap.get(kode)?.nama ?? "",
            isMatched: matched.includes(kode),
          })),
          score,
          kerusakan: kerusakanMap.get(rule.kodeKerusakan),
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));
  }, [selected]);

  const highlightedInput = useMemo(
    () => buildHighlightNodes(text, detectedPhrases, detectedTokens),
    [text, detectedPhrases, detectedTokens]
  );

  const handleDetect = () => {
    const next = buildSuggestions(text);
    setSuggestions(next);

    const normalized = normalize(text);
    const rawWords = normalize(text).split(" ").filter(Boolean);
    const phraseHits = Object.values(PHRASE_HINTS)
      .flat()
      .filter((phrase) => normalized.includes(normalize(phrase)));
    const tokenSet = new Set(tokenize(text));
    const tokenHits = rawWords.filter((w) => tokenSet.has(normalizeToken(w)));
    setDetectedPhrases(Array.from(new Set(phraseHits)));
    setDetectedTokens(Array.from(new Set(tokenHits)));

    if (next.length === 0) {
      setSelected([]);
      setHasil([]);
      setDetectedPhrases([]);
      setDetectedTokens([]);
      return;
    }

    const top = next.filter((s) => s.score >= 1.2).map((s) => s.kode);
    const fallback = next.slice(0, 3).map((s) => s.kode);
    const picked = top.length > 0 ? top : fallback;
    setSelected(picked);
    setHasil(forwardChaining(picked));
  };

  const isNoMatch = hasil.length === 0;
  const onlyPartial = hasil.length > 0 && hasil.every((h) => h.isPartial);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white font-mono overflow-x-hidden">
      <div className="relative max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-cyan-400" />
              <span className="text-cyan-600 dark:text-cyan-400 text-xs tracking-[0.3em] uppercase">
                NLP
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-none">
              <span className="text-slate-900 dark:text-white">Diagnosa</span>{" "}
              <span className="text-cyan-400">Berbasis Teks</span>
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm max-w-xl">
              Masukkan keluhan dalam kalimat bebas. Sistem akan mencocokkan frasa kunci, sinonim,
              dan kata penting untuk menyarankan gejala.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 text-sm hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm"
            >
              ← Kembali
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 p-2 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm"
              aria-label="Ganti mode tema"
              title="Ganti mode tema"
            >
              <span className="hidden dark:inline">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </span>
              <span className="inline dark:hidden">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </span>
            </button>
          </div>
        </header>

        <div className="space-y-6">
          <div className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-4 rounded-sm">
            <label className="text-xs text-slate-500 uppercase tracking-wider">Deskripsi Keluhan</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Contoh: AC tidak dingin, kipas outdoor berisik, dan kadang mati sendiri"
              className="mt-2 w-full bg-transparent border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 rounded-sm focus:outline-none focus:border-cyan-400"
            />
            {text.trim().length > 0 && (detectedPhrases.length > 0 || detectedTokens.length > 0) && (
              <div className="mt-3 border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-3 rounded-sm">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Highlight deteksi</p>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {highlightedInput}
                </p>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleDetect}
                disabled={!canDetect}
                className={`px-4 py-2 text-sm font-bold tracking-[0.18em] uppercase transition-colors ${
                  canDetect
                    ? "bg-cyan-400 text-slate-900 hover:bg-cyan-300"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                Deteksi Gejala
              </button>
              <div className="text-xs text-slate-500 self-center">
                Hasil akan muncul otomatis setelah deteksi.
              </div>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 rounded-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Saran Gejala</p>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {suggestions.length === 0 && (
                <div className="p-4 text-sm text-slate-600 dark:text-slate-400">
                  Belum ada saran. Tulis keluhan lalu klik "Deteksi Gejala".
                </div>
              )}
              {suggestions.map((s) => (
                <div key={s.kode} className="p-4 flex items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-2 py-1">
                        {s.kode}
                      </span>
                      <span className="text-sm text-slate-800 dark:text-slate-100">{s.nama}</span>
                      <span className="text-xs text-slate-500">score {s.score.toFixed(2)}</span>
                    </div>
                    {s.reasons.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">{s.reasons.join(" · ")}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 rounded-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Hasil Diagnosa</p>
            </div>
            <div className="p-4">
              {selectedGejala.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedGejala.map((g) => (
                    <span
                      key={g?.kode}
                      className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1"
                    >
                      <span className="text-cyan-400 font-bold">{g?.kode}</span> · {g?.nama}
                    </span>
                  ))}
                </div>
              )}

              {hasil.length === 0 && selected.length === 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-400">Masukkan keluhan lalu klik Deteksi Gejala.</p>
              )}

              {hasil.length === 0 && selected.length > 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {isNoMatch
                    ? "Belum ada kerusakan yang teridentifikasi untuk gejala yang dipilih."
                    : ""}
                </p>
              )}

              {hasil.map((item) => {
                const solusiSteps = item.kerusakan.solusi
                  .split(/\.\s+/)
                  .map(s => s.trim())
                  .filter(Boolean);

                return (
                  <div key={item.rule.kode} className="border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium bg-cyan-400/10 text-cyan-600 dark:text-cyan-400 border border-cyan-400/30 px-2 py-0.5 rounded-sm">
                        {item.kerusakan.kode}
                      </span>
                      <span className="text-lg font-medium text-slate-900 dark:text-white">
                        {item.kerusakan.nama}
                      </span>
                      <span className="text-xs text-slate-400">Aturan: {item.rule.kode}</span>
                      {item.isPartial && (
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/50 px-2 py-0.5 rounded-sm">
                          ⚠ Kemungkinan
                        </span>
                      )}
                    </div>

                    <div className="px-4 py-4 space-y-5">
                      {/* Penjelasan */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                          <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Penjelasan</span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          {item.kerusakan.deskripsi}
                        </p>
                      </div>

                      {/* Solusi */}
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                          <span className="text-xs font-medium uppercase tracking-widest text-slate-400">Langkah Perbaikan</span>
                        </div>
                        <ol className="space-y-2.5">
                          {solusiSteps.map((step, i) => (
                            <li key={i} className="flex gap-3 items-start">
                              <span className="min-w-[22px] h-[22px] rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-600 dark:text-cyan-400 text-xs font-medium flex items-center justify-center mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                {step}{!step.endsWith('.') ? '.' : ''}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                );
              })}

              {onlyPartial && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs text-cyan-600 dark:text-cyan-400">
                    Hasil di atas merupakan kemungkinan tertinggi karena gejala belum lengkap.
                  </p>
                  <div className="border border-cyan-400/30 dark:border-cyan-400/20 bg-cyan-50/50 dark:bg-cyan-950/20 rounded-sm overflow-hidden">
                    <div className="p-3 border-b border-cyan-400/20 dark:border-cyan-400/15">
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                        Rule yang cocok dengan keluhan
                      </p>
                    </div>
                    <div className="divide-y divide-cyan-400/15 dark:divide-cyan-400/10">
                      {matchedRules.length === 0 && (
                        <div className="p-3 text-xs text-slate-600 dark:text-slate-400">
                          Tidak ada rule yang cocok.
                        </div>
                      )}
                      {matchedRules.map((item) => (
                        <div key={item?.rule.kode} className="p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs bg-cyan-400/10 text-cyan-600 dark:text-cyan-400 border border-cyan-400/30 px-2 py-0.5 rounded-sm">
                              {item?.rule.kode}
                            </span>
                            <span className="text-xs text-slate-400">→</span>
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {item?.rule.kodeKerusakan}
                              {item?.kerusakan ? ` · ${item.kerusakan.nama}` : ""}
                            </span>
                            <span className="text-xs text-cyan-600/70 dark:text-cyan-400/60">
                              kecocokan {((item?.score ?? 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Gejala cocok: {item?.matched.join(", ")}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item?.allGejala.map((g) => (
                              <span
                                key={`${item?.rule.kode}-${g.kode}`}
                                className={`text-xs border px-2 py-1 rounded-sm ${
                                  g.isMatched
                                    ? "bg-cyan-400/10 text-cyan-600 dark:text-cyan-400 border-cyan-400/30"
                                    : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                }`}
                              >
                                {g.isMatched ? "✓" : "○"} {g.kode}{g.nama ? ` · ${g.nama}` : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
