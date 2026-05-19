import Link from "next/link";
import { gejalaDaftar, kerusakanDaftar, rules } from "@/lib/knowledgeBase";

export default function AturanPage() {
  const gejalaMap = new Map(gejalaDaftar.map((g) => [g.kode, g] as const));
  const kerusakanMap = new Map(kerusakanDaftar.map((k) => [k.kode, k] as const));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white font-mono overflow-x-hidden">
      <div className="relative max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-cyan-400" />
              <span className="text-cyan-600 dark:text-cyan-400 text-xs tracking-[0.3em] uppercase">
                Data
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight leading-none">
              <span className="text-slate-900 dark:text-white">Basis Aturan</span>{" "}
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm">Total: {rules.length} aturan</p>
          </div>

          <Link
            href="/"
            className="border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 text-sm hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm"
          >
            ← Kembali
          </Link>
        </header>

        <div className="space-y-3">
          {rules.map((r) => {
            const kerusakan = kerusakanMap.get(r.kodeKerusakan);
            return (
              <div
                key={r.kode}
                className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 rounded-sm overflow-hidden"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-2 py-1">
                      {r.kode}
                    </span>
                    <span className="text-xs text-slate-500">→</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1">
                      {r.kodeKerusakan}{kerusakan ? ` · ${kerusakan.nama}` : ""}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Gejala Syarat</p>
                  <div className="flex flex-wrap gap-2">
                    {r.kodeGejala.map((kg) => {
                      const g = gejalaMap.get(kg);
                      return (
                        <span
                          key={kg}
                          className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1"
                        >
                          <span className="text-cyan-400 font-bold">{kg}</span>
                          {g ? ` · ${g.nama}` : ""}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
