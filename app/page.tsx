"use client";

import Link from "next/link";
import { useState } from "react";
import {
  gejalaDaftar,
  kerusakanDaftar,
  rules,
  forwardChaining,
  HasilDiagnosa,
} from "@/lib/knowledgeBase";
import { useTheme } from "./theme-provider";

type Step = "intro" | "diagnosa" | "hasil";

export default function Home() {
  const { toggleTheme } = useTheme();
  const [step, setStep] = useState<Step>("intro");
  const [gejalaTerpilih, setGejalaTerpilih] = useState<string[]>([]);
  const [hasil, setHasil] = useState<HasilDiagnosa[]>([]);

  const toggleGejala = (kode: string) => {
    setGejalaTerpilih((prev) =>
      prev.includes(kode) ? prev.filter((g) => g !== kode) : [...prev, kode]
    );
  };

  const handleAnalisis = () => {
    const result = forwardChaining(gejalaTerpilih);
    setHasil(result);
    setStep("hasil");
  };

  const handleReset = () => {
    setGejalaTerpilih([]);
    setHasil([]);
    setStep("intro");
  };

  const isNoFullMatch = hasil.length > 0 && hasil.every((r) => r.isPartial);
  const isTotalNoMatch = hasil.length === 0;

  const stats = [
    { num: String(gejalaDaftar.length), label: "Jenis Gejala", href: "/gejala" },
    { num: String(kerusakanDaftar.length), label: "Jenis Kerusakan", href: "/kerusakan" },
    { num: String(rules.length), label: "Basis Aturan", href: "/aturan" },
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white font-mono overflow-x-hidden">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(56,189,248,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(56,189,248,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.03)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-150 h-100 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 py-8">
        <header className="mb-10">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-cyan-400" />
              <span className="text-cyan-600 dark:text-cyan-400 text-xs tracking-[0.3em] uppercase">
                Ratapan Oslo
              </span>
            </div>
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
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-none">
            <span className="text-slate-900 dark:text-white">TIRISH</span>{" "}
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm max-w-md">
            Sistem pakar menganalisa kerusakan AC menggunakan metode Forward Chaining
          </p>

          <div className="flex items-center gap-2 mt-6">
            {(["intro", "diagnosa", "hasil"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s
                      ? "bg-cyan-400 text-slate-900"
                      : (["intro", "diagnosa", "hasil"] as Step[]).indexOf(step) > i
                      ? "bg-cyan-100 text-cyan-700 border border-cyan-400 dark:bg-cyan-900 dark:text-cyan-400"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-600"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`w-8 h-px ${
                      (["intro", "diagnosa", "hasil"] as Step[]).indexOf(step) > i
                        ? "bg-cyan-400"
                        : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  />
                )}
              </div>
            ))}
            <span className="ml-2 text-xs text-slate-500 capitalize">
              {step === "intro" ? "Mulai" : step === "diagnosa" ? "Pilih Gejala" : "Hasil"}
            </span>
          </div>
        </header>

        {step === "intro" && (
          <div className="space-y-6">
            <div className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-6 rounded-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-cyan-400">◆</span> Petunjuk Penggunaan
              </h2>
              <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex gap-3">
                  <span className="text-cyan-400 font-bold shrink-0">01.</span>
                  <span>Pilih semua gejala yang sesuai dengan kondisi AC Anda saat ini.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-cyan-400 font-bold shrink-0">02.</span>
                  <span>Sistem akan menganalisa menggunakan metode Forward Chaining berdasarkan basis pengetahuan.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-cyan-400 font-bold shrink-0">03.</span>
                  <span>Hasil diagnosa menampilkan kemungkinan kerusakan beserta solusi penanganannya.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-cyan-400 font-bold shrink-0">04.</span>
                  <span>
                    Jika tidak ada kerusakan yang teridentifikasi secara penuh, sistem akan menampilkan
                    <span className="text-amber-400 font-semibold"> kemungkinan kerusakan</span> berdasarkan
                    kemiripan gejala sebagai referensi tambahan.
                  </span>
                </li>
              </ol>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {stats.map(({ num, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  title={`Klik untuk melihat ${label.toLowerCase()}`}
                  className="group border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-4 rounded-sm text-center cursor-pointer hover:border-cyan-400/70 dark:hover:border-cyan-400/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950"
                >
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                    <span>{label}</span>
                    <span className="text-cyan-400/70 group-hover:text-cyan-400 transition-colors">→</span>
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    Klik untuk lihat
                  </div>
                </Link>
              ))}
            </div>

            <button
              onClick={() => setStep("diagnosa")}
              className="w-full bg-cyan-400 text-slate-900 font-bold py-4 text-sm tracking-[0.2em] uppercase hover:bg-cyan-300 transition-colors"
            >
              Mulai Diagnosa →
            </button>
          </div>
        )}

        {step === "diagnosa" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-cyan-400">◆</span> Pilih Gejala yang Dialami
              </h2>
              <span className="text-xs text-slate-500">{gejalaTerpilih.length} dipilih</span>
            </div>

            <div className="grid gap-2">
              {gejalaDaftar.map((gejala) => {
                const selected = gejalaTerpilih.includes(gejala.kode);
                return (
                  <button
                    key={gejala.kode}
                    onClick={() => toggleGejala(gejala.kode)}
                    className={`flex items-center gap-4 p-4 border text-left transition-all duration-150 rounded-sm ${
                      selected
                        ? "border-cyan-400 bg-cyan-400/10 text-slate-900 dark:text-white"
                        : "border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 border flex items-center justify-center shrink-0 transition-all ${
                        selected ? "border-cyan-400 bg-cyan-400" : "border-slate-600"
                      }`}
                    >
                      {selected && (
                        <svg
                          className="w-3 h-3 text-slate-900"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold shrink-0 ${
                        selected ? "text-cyan-400" : "text-slate-600"
                      }`}
                    >
                      {gejala.kode}
                    </span>
                    <span className="text-sm">{gejala.nama}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("intro")}
                className="border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400 py-3 px-6 text-sm hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ← Kembali
              </button>
              <button
                onClick={handleAnalisis}
                disabled={gejalaTerpilih.length === 0}
                className={`flex-1 py-3 text-sm font-bold tracking-[0.2em] uppercase transition-all ${
                  gejalaTerpilih.length > 0
                    ? "bg-cyan-400 text-slate-900 hover:bg-cyan-300"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                Analisa Kerusakan →
              </button>
            </div>
          </div>
        )}

        {step === "hasil" && (
          <div className="space-y-6">
            <div className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-4 rounded-sm">
              <p className="text-xs text-slate-500 mb-2">
                Gejala yang dipilih ({gejalaTerpilih.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {gejalaTerpilih.map((kode) => {
                  const g = gejalaDaftar.find((g) => g.kode === kode);
                  return (
                    <span
                      key={kode}
                      className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <span className="text-cyan-400 font-bold">{kode}</span> · {g?.nama}
                    </span>
                  );
                })}
              </div>
            </div>

            {isTotalNoMatch && (
              <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 rounded-sm overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-red-200 dark:border-red-900/30 bg-red-100/50 dark:bg-red-950/30">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 dark:bg-red-500/20 border border-red-300 dark:border-red-500/50 flex items-center justify-center text-red-500 dark:text-red-400 text-sm font-bold shrink-0">
                    ✕
                  </div>
                  <div>
                    <h3 className="text-red-500 dark:text-red-400 font-bold text-sm">Kerusakan Tidak Teridentifikasi</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Tidak ada aturan yang cocok dengan kombinasi gejala yang dipilih</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    Gejala yang Anda pilih tidak cocok dengan basis aturan yang tersedia. Hal ini dapat terjadi karena:
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    {[
                      "Kombinasi gejala yang dipilih belum tercakup dalam basis pengetahuan sistem",
                      "Kemungkinan ada gejala lain yang belum dipilih namun relevan",
                      "Kerusakan bersifat kompleks dan memerlukan pemeriksaan langsung",
                    ].map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-red-500 dark:text-red-400 shrink-0 mt-0.5">▸</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-sm mt-2">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">💡 Saran</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Coba tambahkan atau ubah kombinasi gejala yang dipilih, atau konsultasikan langsung
                      dengan teknisi AC profesional untuk pemeriksaan menyeluruh.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isNoFullMatch && (
              <div className="space-y-4">
                <div className="border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-sm flex gap-3">
                  <div className="text-amber-700 dark:text-amber-400 text-lg shrink-0">⚠</div>
                  <div>
                    <p className="text-amber-700 dark:text-amber-400 font-bold text-sm">
                      Tidak Ada Kerusakan yang Teridentifikasi Secara Penuh
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Gejala yang dipilih tidak cukup untuk memenuhi semua syarat aturan yang ada.
                      Berikut adalah <span className="text-amber-700 dark:text-amber-400 font-semibold">kemungkinan kerusakan</span> berdasarkan
                      kemiripan gejala tertinggi sebagai referensi. Lengkapi gejala atau konsultasikan
                      dengan teknisi untuk hasil yang lebih akurat.
                    </p>
                  </div>
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-amber-400">◆</span>
                  Kemungkinan Kerusakan
                  <span className="text-sm font-normal text-slate-500">— {hasil.length} kandidat</span>
                </h2>

                {hasil.map((item, idx) => (
                  <PartialCard key={item.rule.kode} item={item} idx={idx} />
                ))}
              </div>
            )}

            {!isTotalNoMatch && !isNoFullMatch && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-cyan-400">◆</span>
                  Hasil Diagnosa
                  <span className="text-sm font-normal text-slate-500">
                    — {hasil.length} kerusakan teridentifikasi
                  </span>
                </h2>

                {hasil.map((item, idx) => (
                  <FullMatchCard key={item.rule.kode} item={item} idx={idx} />
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("diagnosa")}
                className="border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400 py-3 px-6 text-sm hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ← Ubah Gejala
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-cyan-400 text-slate-900 font-bold py-3 text-sm tracking-[0.2em] uppercase hover:bg-cyan-300 transition-colors"
              >
                Diagnosa Ulang
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-600 text-center border-t border-slate-200 dark:border-slate-800 pt-4">
              Hasil diagnosa bersifat rekomendasi. Untuk kerusakan serius, selalu konsultasikan dengan teknisi AC profesional.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function FullMatchCard({ item, idx }: { item: HasilDiagnosa; idx: number }) {
  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 rounded-sm overflow-hidden">
      <div className="flex items-start justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-600">#{idx + 1}</span>
            <span className="text-xs bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 px-2 py-0.5">
              {item.kerusakan.kode}
            </span>
            <span className="text-xs text-slate-600">Aturan: {item.rule.kode}</span>
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900/50 px-2 py-0.5">
              ✓ Terdiagnosa
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.kerusakan.nama}</h3>
        </div>
      </div>

      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Penjelasan:</p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item.kerusakan.deskripsi}</p>
      </div>

      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Gejala yang cocok:</p>
        <div className="flex flex-wrap gap-2">
          {item.gejalaCocok.map((g) => (
            <span
              key={g.kode}
              className="text-xs bg-green-50 border border-green-200 text-green-700 dark:bg-green-950/50 dark:border-green-900 dark:text-green-400 px-2 py-1"
            >
              ✓ {g.kode} · {g.nama}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Rekomendasi Solusi:</p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item.kerusakan.solusi}</p>
      </div>
    </div>
  );
}

function PartialCard({ item, idx }: { item: HasilDiagnosa; idx: number }) {
  return (
    <div className="border border-amber-200 dark:border-amber-900/40 bg-white/70 dark:bg-slate-900/50 rounded-sm overflow-hidden">
      <div className="flex items-start justify-between p-4 border-b border-amber-200 dark:border-amber-900/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-600">#{idx + 1}</span>
            <span className="text-xs bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2 py-0.5">
              {item.kerusakan.kode}
            </span>
            <span className="text-xs text-slate-600">Aturan: {item.rule.kode}</span>
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/50 px-2 py-0.5">
              ⚠ Kemungkinan
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.kerusakan.nama}</h3>
        </div>
      </div>

      <div className="p-4 border-b border-amber-200 dark:border-amber-900/20">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Penjelasan:</p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item.kerusakan.deskripsi}</p>
      </div>

      <div className="p-4 border-b border-amber-200 dark:border-amber-900/20">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Gejala yang cocok:</p>
        <div className="flex flex-wrap gap-2">
          {item.gejalaCocok.map((g) => (
            <span
              key={g.kode}
              className="text-xs bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300 px-2 py-1"
            >
              ✓ {g.kode} · {g.nama}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-2">
          Gejala terpenuhi: {item.gejalaCocok.length} dari {item.rule.kodeGejala.length} syarat aturan
        </p>
      </div>

      <div className="p-4">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Rekomendasi Solusi (jika terkonfirmasi):</p>
        <p className="text-sm text-slate-700 dark:text-slate-400 leading-relaxed">{item.kerusakan.solusi}</p>
      </div>
    </div>
  );
}