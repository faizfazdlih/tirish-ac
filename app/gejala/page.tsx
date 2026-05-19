import Link from "next/link";
import { gejalaDaftar } from "@/lib/knowledgeBase";

export default function GejalaPage() {
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
              <span className="text-slate-900 dark:text-white">Jenis Gejala</span>{" "}
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm">
              Total: {gejalaDaftar.length} gejala
            </p>
          </div>

          <Link
            href="/"
            className="border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 text-sm hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-sm"
          >
            ← Kembali
          </Link>
        </header>

        <div className="border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 rounded-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Daftar Gejala</p>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {gejalaDaftar.map((g) => (
              <div key={g.kode} className="p-4 flex items-start gap-4">
                <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-2 py-1 shrink-0">
                  {g.kode}
                </span>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{g.nama}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
