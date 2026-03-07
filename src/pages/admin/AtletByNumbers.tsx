// src/pages/admin/AtletByNumbers.tsx
import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Select from "../../components/form/Select";

// Data dummy cabang olahraga dengan nomor pertandingan lengkap
const DUMMY_CABOR_EVENTS = [
  {
    id: 1,
    nama: "Atletik",
    putra: "100m, 200m, 400m, 800m, 1500m, 5000m, 5000m Jalan Cepat, LJ, LJ, LT, 4x100m, 4x400m, Tolak Peluru, Lempar Lembing, Lempar Cakram (putra & putri, bobot berbeda)",
    putri: "Sama dengan Putra kecuali: Tolak Peluru 4kg, Lempar Lembing 600g, Lempar Cakram 1kg",
    mix: null,
    total: 30
  },
  {
    id: 2,
    nama: "Angkat Besi",
    putra: "56kg, 60kg, 65kg, 71kg, +71kg",
    putri: "+44kg, 48kg, 53kg, 58kg, +58kg",
    mix: null,
    total: 10
  },
  {
    id: 3,
    nama: "Bola Basket",
    putra: "Beregu 5x5 Putra, Beregu 3x3 Putra",
    putri: "Beregu 5x5 Putri, Beregu 3x3 Putri",
    mix: null,
    total: 4
  },
  {
    id: 4,
    nama: "Bola Voli Indoor",
    putra: "Beregu Putra",
    putri: "Beregu Putri",
    mix: null,
    total: 2
  },
  {
    id: 5,
    nama: "Bola Voli Pasir",
    putra: "Beregu Putra",
    putri: "Beregu Putri",
    mix: null,
    total: 2
  },
  {
    id: 6,
    nama: "Bulutangkis",
    putra: "Tunggal Putra, Ganda Putra, Beregu Putra",
    putri: "Tunggal Putri, Ganda Putri, Beregu Putri",
    mix: "Ganda Campuran",
    total: 7
  },
  {
    id: 7,
    nama: "Catur",
    putra: "Cepat Beregu, Kilat Beregu, Standar Beregu",
    putri: "Cepat Beregu, Kilat Beregu, Standar Beregu",
    mix: "Mix Cepat, Mix Kilat, Mix Standar",
    total: 9
  },
  {
    id: 8,
    nama: "Dayung",
    putra: "K-1/C-1/Ergo/Dragon Boat/SUP Sprint (200m/500m/1000m/2000m)",
    putri: "K-1/C-1/Ergo/Dragon Boat/SUP Sprint (200m/500m/1000m/2000m)",
    mix: "Dragon Boat Mix",
    total: 28
  },
  {
    id: 9,
    nama: "Gulat",
    putra: "Gaya Bebas (8 kelas: 29-74kg)",
    putri: "Gaya Bebas (3 kelas: 37-48kg)",
    mix: null,
    total: 11
  },
  {
    id: 10,
    nama: "Hockey",
    putra: "Beregu Putra",
    putri: "Beregu Putri",
    mix: null,
    total: 2
  },
  {
    id: 11,
    nama: "Judo",
    putra: "50kg, 55kg, 60kg, 66kg, 81kg",
    putri: "52kg, 57kg, 63kg, +70kg, -48kg",
    mix: "Beregu Campuran",
    total: 11
  },
  {
    id: 12,
    nama: "Karate",
    putra: "Kata Perorangan, Kumite –50, –55, –61, –67, –76, +76kg, Kata Beregu, Kumite Beregu",
    putri: "Kata Perorangan, Kumite –42, –48, –53, –59, +59kg, Kata Beregu, Kumite Beregu",
    mix: null,
    total: 17
  },
  {
    id: 13,
    nama: "Kempo",
    putra: "Randori 50kg, 55kg, 60kg, Embu Pasangan Pa Kyu II/III",
    putri: "Randori 50kg, 55kg, 60kg, Embu Pasangan Pi Kyu II/III",
    mix: "Embu Pasangan Kyu I, Embu Beregu Kyu Kenshi, Embu Pasangan Campuran Kyu II/III, Tandoku Kyu Kenshi",
    total: 12
  },
  {
    id: 14,
    nama: "Menembak",
    putra: "10m Air Pistol Individu, 10m Air Rifle Individu, 25m Air Rifle BR HV, 18-41m Air Rifle MR",
    putri: "Sama dengan Putra",
    mix: "10m Air Pistol Mixed Team, 10m Air Rifle Mixed Team",
    total: 10
  },
  {
    id: 15,
    nama: "Panahan",
    putra: "Divisi Nasional (Total 2 Sesi, Perorangan, Beregu), Recurve Perorangan, Compound Perorangan, Barebow Perorangan",
    putri: "Sama dengan Putra",
    mix: "Nasional Mix Team, Recurve Mix Team, Compound Mix Team",
    total: 17
  },
  {
    id: 16,
    nama: "Panjat Tebing",
    putra: "Speed Perorangan, Lead Perorangan, Boulder Perorangan, Speed Classic Perorangan, Speed Classic Beregu, Speed Relay Team, Lead Team",
    putri: "Sama dengan Putra",
    mix: "Speed Classic Mix",
    total: 15
  },
  {
    id: 17,
    nama: "Pencak Silat",
    putra: "Jurus Tunggal, Ganda, Regu, Kelas A–I (39-75kg)",
    putri: "Jurus Tunggal, Ganda, Regu, Kelas A–H (39-71kg)",
    mix: null,
    total: 23
  },
  {
    id: 18,
    nama: "Renang",
    putra: "50/100/200m Bebas, Punggung, Dada, Kupu-kupu",
    putri: "Sama dengan Putra",
    mix: null,
    total: 20
  },
  {
    id: 19,
    nama: "Sepak Bola",
    putra: "Beregu Putra",
    putri: null,
    mix: null,
    total: 1
  },
  {
    id: 20,
    nama: "Sepaktakraw",
    putra: "Inter Regu, Double Event",
    putri: "Inter Regu, Double Event",
    mix: null,
    total: 4
  },
  {
    id: 21,
    nama: "Senam",
    putra: "Artistik: Lantai, Meja Lompat, Kuda Kuda Pelana, Serba Bisa, Beregu",
    putri: "Artistik: Lantai, Meja Lompat, Balok Keseimbangan, Beregu, Serba Bisa; Ritmik: Pita, Free Hand, Hoop, Serba Bisa",
    mix: null,
    total: 14
  },
  {
    id: 22,
    nama: "Tae Kwon Do",
    putra: "Poomsae Individual Recognized, Kyorugi kelas berat (Under 45kg sampai Over 78kg), Poomsae Free Style",
    putri: "Sama dengan Putra kecuali kelas berat disesuaikan",
    mix: null,
    total: 24
  },
  {
    id: 23,
    nama: "Tenis Lapangan",
    putra: "Tunggal, Ganda, Beregu",
    putri: "Tunggal, Ganda, Beregu",
    mix: "Ganda Campuran",
    total: 7
  },
  {
    id: 24,
    nama: "Tenis Meja",
    putra: "Tunggal, Ganda, Beregu",
    putri: "Tunggal, Ganda, Beregu",
    mix: "Ganda Campuran",
    total: 7
  },
  {
    id: 25,
    nama: "Tinju",
    putra: "Youth 45, 48, 51, 54, 57, 60, 63.5, 75kg",
    putri: "Youth 45, 48, 50, 52, 54, 60kg",
    mix: null,
    total: 14
  },
  {
    id: 26,
    nama: "Wushu (Sanda)",
    putra: "48, 52, 56, 60, 65kg",
    putri: "48, 52, 56, 60kg",
    mix: null,
    total: 9
  }
];

export default function AtletByNumbers() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [selectedCabor, setSelectedCabor] = useState<string>("");
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSubmitFinal = async () => {
    alert("Tahap 2 berhasil disubmit dan terkunci!");
    setSubmitted(true);
    setSubmittedAt(new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }));
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-400">Memuat data...</div>;
  }

  return (
    <>
      <PageMeta
        title="SPORTIF - Tahap II: Entry By Number"
        description="Pilih nomor/event yang diikuti kontingen POPDA XII 2026"
      />

      <PageBreadcrumb pageTitle="Tahap II: Entry By Number" />

      <div className="min-h-[calc(100vh-180px)] rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 flex items-center justify-center">
        {submitted ? (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Sudah Disubmit
            </h3>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
              Silahkan lanjut ke Tahap III (Entry By Name)
            </p>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
              Disubmit pada <span className="font-medium">{submittedAt}</span>
            </p>
          </div>
        ) : (
          <div className="w-full max-w-none space-y-10">
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                Pilih Nomor/Event yang Diikuti
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Pilih cabang olahraga terlebih dahulu, kemudian centang nomor/event yang akan diikuti
              </p>
            </div>

            <div className="w-full max-w-xs">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pilih Cabang Olahraga
              </label>
              <Select
                options={DUMMY_CABOR_EVENTS.map(cabor => ({
                  value: cabor.id.toString(),
                  label: cabor.nama
                }))}
                placeholder="Pilih Cabang Olahraga"
                onChange={(value) => setSelectedCabor(value)}
                defaultValue={selectedCabor}
              />
            </div>

            {selectedCabor && (() => {
              const cabor = DUMMY_CABOR_EVENTS.find(c => c.id.toString() === selectedCabor);
              if (!cabor) return null;

              // Generate dummy events untuk cabor yang dipilih
              const dummyEvents = [];
              if (cabor.putra) {
                const putraEvents = cabor.putra.split(',').map((e, idx) => ({
                  event_id: cabor.id * 1000 + idx,
                  nama_event: e.trim(),
                  jenis_kelamin: 'Putra'
                }));
                dummyEvents.push(...putraEvents);
              }
              if (cabor.putri) {
                const putriEvents = cabor.putri.split(',').map((e, idx) => ({
                  event_id: cabor.id * 2000 + idx,
                  nama_event: e.trim(),
                  jenis_kelamin: 'Putri'
                }));
                dummyEvents.push(...putriEvents);
              }
              if (cabor.mix) {
                const mixEvents = cabor.mix.split(',').map((e, idx) => ({
                  event_id: cabor.id * 3000 + idx,
                  nama_event: e.trim(),
                  jenis_kelamin: 'Campuran'
                }));
                dummyEvents.push(...mixEvents);
              }

              return (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                  <div className="max-w-full overflow-x-auto">
                    <div className="mb-8">
                      <div className="bg-gray-50 px-6 py-4 dark:bg-gray-800/50">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                          {cabor.nama}
                        </h4>
                      </div>

                      <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                          <TableRow>
                            <TableCell
                              isHeader
                              className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-16"
                            >
                              No
                            </TableCell>
                            <TableCell
                              isHeader
                              className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                              Nomor Pertandingan
                            </TableCell>
                            <TableCell
                              isHeader
                              className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-24"
                            >
                              Ikut
                            </TableCell>
                          </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                          {dummyEvents.map((event, idx) => (
                            <TableRow key={event.event_id}>
                              <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                                {event.nama_event} ({event.jenis_kelamin})
                              </TableCell>
                              <TableCell className="px-5 py-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedEvents.includes(event.event_id)}
                                  onChange={() => {
                                    setSelectedEvents((prev) =>
                                      prev.includes(event.event_id)
                                        ? prev.filter((id) => id !== event.event_id)
                                        : [...prev, event.event_id]
                                    );
                                  }}
                                  className="h-5 w-5 rounded border-gray-600 text-teal-600 focus:ring-teal-500 dark:bg-gray-800"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-between">
              <Badge size="sm" color="success">
                Nomor Pertandingan dipilih: {selectedEvents.length}
              </Badge>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-end">
              <Button size="md" variant="outline" onClick={() => { }}>
                Simpan Sementara
              </Button>
              <Button
                size="md"
                variant="primary"
                onClick={handleSubmitFinal}
                disabled={false}
              >
                Submit Final & Kunci Data
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}