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

export const gejalaBobot: Record<string, number> = {
  // Gejala kritis (gangguan inti sistem)
  G3: 1.4,  
  G8: 1.4,  
  G5: 1.3,  
  G16: 1.3, 

  // Gejala penting (indikator kuat kerusakan tertentu)
  G4: 1.1,
  G10: 1.1,
  G14: 1.1,
  G15: 1.1,
  G12: 1.0,
  G17: 1.0,
  G6: 1.0,  

  // Gejala menengah (gejala umum/performa)
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
      "Kompresor adalah ‘jantung’ sistem pendingin. Jika rusak, AC biasanya tidak mampu mendinginkan dan dapat muncul suara tidak normal atau unit sering mati karena proteksi.",
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
  { kode: "A6",  kodeKerusakan: "K6",  kodeGejala: ["G1", "G10",] },
  { kode: "A7",  kodeKerusakan: "K7",  kodeGejala: ["G1", "G4"] },
  { kode: "A8",  kodeKerusakan: "K8",  kodeGejala: ["G9"] },
  { kode: "A9",  kodeKerusakan: "K9",  kodeGejala: ["G1", "G11", "G12"] },
  { kode: "A10", kodeKerusakan: "K10", kodeGejala: ["G2", "G13", "G14"] },
  { kode: "A11", kodeKerusakan: "K11", kodeGejala: ["G15"] },
  { kode: "A12", kodeKerusakan: "K12", kodeGejala: ["G1", "G16", "G17"] },
];

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