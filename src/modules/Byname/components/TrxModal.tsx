/**
 * TrxModal — Modal pendaftaran transaksi
 *
 * Dropdown cabor hanya menampilkan cabor yang sudah dipilih kontingen di Tahap 1.
 * Dropdown nomor hanya menampilkan nomor yang sudah dicentang kontingen di Tahap 2.
 *
 * Endpoints (sesuai TAHAP3_DOCUMENTATION.md section 4):
 * - GET /admin/tahap3/cabor        → cabor terpilih dari tahap 1 (filter dropdown)
 * - GET /admin/tahap3/nomor        → nomor terdaftar dari tahap 2 (dropdown assign atlet)
 * - GET /admin/tahap3             → existing trx list
 * - POST /admin/tahap3/trx/atlet  → daftarkan atlet ke cabor+nomor
 * - POST /admin/master/pelatih/trx → daftarkan pelatih ke cabor
 * - POST /admin/master/official/trx → daftarkan official
 * - DELETE /admin/tahap3/trx/atlet/:id
 * - DELETE /admin/master/pelatih/trx/:id
 * - DELETE /admin/master/official/trx/:id
 */
import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Label from "../../../components/form/Label";
import api from "../../../lib/api";
import {
  MasterAtlet, MasterPelatih, MasterOfficial,
  TrxAtlet, TrxPelatih, TrxOfficial,
  daftarAtlet, daftarPelatih, daftarOfficial,
  batalDaftarAtlet, batalDaftarPelatih, batalDaftarOfficial,
} from "../service";

// ─── Local types ──────────────────────────────────────────

/** Cabor terpilih dari GET /admin/tahap3/cabor */
interface CaborTerpilih {
  cabor_id: number;
  nama_cabor: string;
}

/** Nomor terdaftar dari GET /admin/tahap3/nomor */
interface NomorTerdaftar {
  nomor_id: number;
  cabor_id: number;
  nama_cabor: string;
  nama_nomor: string;
  jenis_kelamin: "PUTRA" | "PUTRI" | "CAMPURAN";
  tipe: "INDIVIDU" | "BEREGU";
}

// ─── API helpers ──────────────────────────────────────────

/**
 * GET /admin/tahap3/cabor
 * Cabor yang dipilih kontingen di Tahap 1. Untuk filter dropdown.
 * Sesuai TAHAP3_DOCUMENTATION.md section 4.
 */
const getTahap3Cabor = (territoryId?: number): Promise<{ data: CaborTerpilih[] }> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.get("/admin/tahap3/cabor", { params }).then(r => r.data);
};

/**
 * GET /admin/tahap3/nomor
 * Nomor yang dicentang kontingen di Tahap 2. Untuk dropdown assign atlet.
 * Sesuai TAHAP3_DOCUMENTATION.md section 4.
 */
const getTahap3Nomor = (territoryId?: number): Promise<{ data: NomorTerdaftar[] }> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.get("/admin/tahap3/nomor", { params }).then(r => r.data);
};

/**
 * GET /admin/tahap3 — untuk ambil existing trx list.
 * territoryId wajib untuk superadmin.
 */
const getTahap3Overview = (territoryId?: number): Promise<{
  data: {
    trx_atlets: TrxAtlet[];
    trx_pelatihs: TrxPelatih[];
    trx_officials: TrxOfficial[];
  };
}> => {
  const params = territoryId ? { territory_id: territoryId } : {};
  return api.get("/admin/tahap3", { params }).then(r => r.data);
};

// ─── Props ───────────────────────────────────────────────

type TrxType = "atlet" | "pelatih" | "official";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: TrxType;
  person: MasterAtlet | MasterPelatih | MasterOfficial;
  /** undefined = admin biasa (JWT), number = superadmin (territory) */
  territoryId?: number;
}

// ─── Component ───────────────────────────────────────────

export default function TrxModal({ isOpen, onClose, type, person, territoryId }: Props) {
  // Cabor terpilih dari tahap 1 — via GET /admin/tahap3/cabor
  const [cabors, setCabors]   = useState<CaborTerpilih[]>([]);
  // Semua nomor terdaftar dari tahap 2 — via GET /admin/tahap3/nomor
  const [allNomors, setAllNomors] = useState<NomorTerdaftar[]>([]);
  // Nomor yang difilter berdasarkan cabor yang dipilih di dropdown
  const [filteredNomors, setFilteredNomors] = useState<NomorTerdaftar[]>([]);
  const [trxList, setTrxList] = useState<(TrxAtlet | TrxPelatih | TrxOfficial)[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const [selCabor, setSelCabor] = useState<number>(0);
  const [selNomor, setSelNomor] = useState<number>(0);

  // ── Load saat modal dibuka ────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSelCabor(0);
    setSelNomor(0);
    setFilteredNomors([]);
    loadAll();
  }, [isOpen, type, person.id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      // Sesuai TAHAP3_DOCUMENTATION.md section 4:
      // - /admin/tahap3/cabor  → cabor terpilih dari tahap 1
      // - /admin/tahap3/nomor  → nomor terdaftar dari tahap 2
      // - /admin/tahap3        → trx list
      const [caborRes, nomorRes, overviewRes] = await Promise.all([
        getTahap3Cabor(territoryId),
        getTahap3Nomor(territoryId),
        getTahap3Overview(territoryId),
      ]);

      setCabors(caborRes.data || []);
      setAllNomors(nomorRes.data || []);

      // Filter trx berdasarkan person.id
      const ov = overviewRes.data;
      if (type === "atlet") {
        setTrxList((ov.trx_atlets || []).filter(t => t.atlet_id === person.id));
      } else if (type === "pelatih") {
        setTrxList((ov.trx_pelatihs || []).filter(t => t.pelatih_id === person.id));
      } else {
        setTrxList((ov.trx_officials || []).filter(t => t.official_id === person.id));
      }
    } catch (e: any) {
      setError(e.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  // ── Filter nomor saat cabor dipilih di dropdown ───────
  const handleCaborChange = (caborId: number) => {
    setSelCabor(caborId);
    setSelNomor(0);
    if (!caborId) {
      setFilteredNomors([]);
      return;
    }
    // Filter dari nomor yang sudah terdaftar di tahap 2, sesuai cabor yang dipilih
    const filtered = allNomors.filter(n => n.cabor_id === caborId);
    setFilteredNomors(filtered);
  };

  // ── Daftarkan ─────────────────────────────────────────
  const handleDaftar = async () => {
    setError("");
    if (type === "atlet" && (!selCabor || !selNomor)) {
      setError("Pilih cabor dan nomor terlebih dahulu"); return;
    }
    if (type === "pelatih" && !selCabor) {
      setError("Pilih cabor terlebih dahulu"); return;
    }
    setSaving(true);
    try {
      if (type === "atlet")        await daftarAtlet(person.id, selCabor, selNomor, territoryId);
      else if (type === "pelatih") await daftarPelatih(person.id, selCabor, territoryId);
      else                         await daftarOfficial(person.id, territoryId);

      await loadAll();
      setSelCabor(0);
      setSelNomor(0);
      setFilteredNomors([]);
    } catch (e: any) {
      setError(e.message || "Gagal mendaftarkan");
    } finally {
      setSaving(false);
    }
  };

  // ── Batalkan ──────────────────────────────────────────
  const handleBatal = async (trxId: number) => {
    if (!confirm("Batalkan pendaftaran ini?")) return;
    setSaving(true);
    try {
      if (type === "atlet")        await batalDaftarAtlet(trxId, territoryId);
      else if (type === "pelatih") await batalDaftarPelatih(trxId, territoryId);
      else                         await batalDaftarOfficial(trxId, territoryId);
      setTrxList(prev => prev.filter(t => t.id !== trxId));
    } catch (e: any) {
      setError(e.message || "Gagal membatalkan");
    } finally {
      setSaving(false);
    }
  };

  // ── Lookup helpers ────────────────────────────────────
  const getCaborName = (id: number) =>
    cabors.find(c => c.cabor_id === id)?.nama_cabor ?? `Cabor #${id}`;

  const getNomorLabel = (nomorId: number) => {
    const n = allNomors.find(x => x.nomor_id === nomorId);
    if (!n) return `Nomor #${nomorId}`;
    return `${n.nama_nomor} — ${n.jenis_kelamin} (${n.tipe})`;
  };

  const title = type === "atlet"   ? "Daftarkan Atlet ke Nomor"
    : type === "pelatih" ? "Daftarkan Pelatih ke Cabor"
    :                      "Daftarkan Official";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[480px] m-4">
      <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white dark:bg-gray-900 p-6 lg:p-8">

        <div className="mb-5 pr-8">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{person.nama_lengkap}</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brand-500" />
          </div>
        ) : (
          <div className="space-y-5">

            {/* ── Form pendaftaran baru ── */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
              <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Tambah Pendaftaran
              </h5>

              {type === "official" && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Official didaftarkan tanpa cabor spesifik.
                </p>
              )}

              {/* Dropdown cabor — dari GET /admin/tahap3/cabor */}
              {(type === "atlet" || type === "pelatih") && (
                <div>
                  <Label>
                    Cabor <span className="text-red-500">*</span>
                    <span className="ml-1 text-xs font-normal text-gray-400">(dari Tahap 1)</span>
                  </Label>
                  {cabors.length === 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Belum ada cabor terpilih di Tahap 1. Selesaikan Tahap 1 terlebih dahulu.
                    </p>
                  ) : (
                    <select value={selCabor}
                      onChange={e => handleCaborChange(Number(e.target.value))}
                      className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900">
                      <option value={0}>-- Pilih Cabor --</option>
                      {cabors.map(c => <option key={c.cabor_id} value={c.cabor_id}>{c.nama_cabor}</option>)}
                    </select>
                  )}
                </div>
              )}

              {/* Dropdown nomor — dari GET /admin/tahap3/nomor, difilter per cabor */}
              {type === "atlet" && selCabor > 0 && (
                <div>
                  <Label>
                    Nomor Pertandingan <span className="text-red-500">*</span>
                    <span className="ml-1 text-xs font-normal text-gray-400">(dari Tahap 2)</span>
                  </Label>
                  {filteredNomors.length === 0 ? (
                    <p className="text-xs text-gray-400 mt-1">
                      Tidak ada nomor terdaftar untuk cabor ini di Tahap 2.
                    </p>
                  ) : (
                    <select value={selNomor}
                      onChange={e => setSelNomor(Number(e.target.value))}
                      className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900">
                      <option value={0}>-- Pilih Nomor --</option>
                      {filteredNomors.map(n => (
                        <option key={n.nomor_id} value={n.nomor_id}>
                          {n.nama_nomor} — {n.jenis_kelamin} ({n.tipe})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <Button size="sm" onClick={handleDaftar} disabled={saving || (type !== "official" && cabors.length === 0)}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-40">
                {saving ? "Menyimpan..." : "Daftarkan"}
              </Button>
            </div>

            {/* ── Daftar trx yang sudah ada ── */}
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                Sudah Terdaftar ({trxList.length})
              </h5>
              {trxList.length === 0 ? (
                <p className="text-xs text-gray-400">Belum ada pendaftaran.</p>
              ) : (
                <div className="space-y-2">
                  {trxList.map(trx => (
                    <div key={trx.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 gap-3">
                      <div className="min-w-0">
                        {type === "atlet" && (
                          <>
                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                              {getCaborName((trx as TrxAtlet).cabor_id)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {getNomorLabel((trx as TrxAtlet).nomor_id)}
                            </p>
                          </>
                        )}
                        {type === "pelatih" && (
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            {getCaborName((trx as TrxPelatih).cabor_id)}
                          </p>
                        )}
                        {type === "official" && (
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            Terdaftar sebagai Official
                          </p>
                        )}
                      </div>
                      <button type="button" onClick={() => handleBatal(trx.id)} disabled={saving}
                        className="shrink-0 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-40">
                        Batalkan
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button size="sm" variant="outline" onClick={onClose} disabled={saving}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
