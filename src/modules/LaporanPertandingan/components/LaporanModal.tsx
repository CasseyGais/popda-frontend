import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import {
  laporanPertandinganService,
  formatTanggalIndo,
  getBabakLabel,
  getPemenangLabel,
  BABAK_OPTIONS,
  PEMENANG_OPTIONS,
  type LaporanDetail,
  type Babak,
  type Pemenang,
  type CreateLaporanPayload,
  type UpdateLaporanPayload,
  type KontingenDropdownItem,
  type CaborDropdownItem,
  type NomorDropdownItem,
  type AtletTerdaftarDropdownItem,
} from "../service";
import AtletSisiInput from "./AtletSisiInput";
import MediaUploadRow from "./MediaUploadRow";

// ─── Props ────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view";
  data: LaporanDetail | null;
  onSuccess: (result: LaporanDetail) => void;
}

const TODAY = new Date().toISOString().slice(0, 10);

// ─── Component ───────────────────────────────────────────

export default function LaporanModal({ isOpen, onClose, mode, data, onSuccess }: Props) {
  const isView = mode === "view";

  // ── Dropdown data ─────────────────────────────────────
  const [kontingenList, setKontingenList] = useState<KontingenDropdownItem[]>([]);
  const [caborList,     setCaborList]     = useState<CaborDropdownItem[]>([]);
  const [nomorList,     setNomorList]     = useState<NomorDropdownItem[]>([]);
  const [atletAList,    setAtletAList]    = useState<AtletTerdaftarDropdownItem[]>([]);
  const [atletBList,    setAtletBList]    = useState<AtletTerdaftarDropdownItem[]>([]);
  const [loadingDropdown, setLoadingDropdown] = useState(false);
  const [loadingAtletA,   setLoadingAtletA]   = useState(false);
  const [loadingAtletB,   setLoadingAtletB]   = useState(false);

  // ── Form fields ───────────────────────────────────────
  const [tanggal,      setTanggal]      = useState(TODAY);
  const [waktu,        setWaktu]        = useState("09:00");
  const [venue,        setVenue]        = useState("");
  const [caborId,      setCaborId]      = useState<number | "">("");
  const [nomorId,      setNomorId]      = useState<number | "">("");
  const [babak,        setBabak]        = useState<Babak>("PENYISIHAN");
  const [kontingenAId, setKontingenAId] = useState<number | "">("");
  const [kontingenBId, setKontingenBId] = useState<number | "">("");
  const [hasil,        setHasil]        = useState("");
  const [pemenang,     setPemenang]     = useState<Pemenang>("TIM_A");
  const [juaraKe,      setJuaraKe]      = useState<number | "">("");
  const [wasit,        setWasit]        = useState("");
  const [catatan,      setCatatan]      = useState("");

  // Atlet sisi A & B (array atlet_id)
  const [atletA, setAtletA] = useState<number[]>([]);
  const [atletB, setAtletB] = useState<number[]>([]);

  // Upload & save state
  const [localData,    setLocalData]    = useState<LaporanDetail | null>(null);
  const [anyUploading, setAnyUploading] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  const activeData = localData ?? data;

  // ── Load dropdown master saat modal dibuka ────────────
  useEffect(() => {
    if (!isOpen || isView) return;
    setLoadingDropdown(true);
    Promise.all([
      laporanPertandinganService.getKontingenDropdown(),
      laporanPertandinganService.getCaborDropdown(),
    ])
      .then(([kontingens, cabors]) => {
        setKontingenList(kontingens);
        setCaborList(cabors);
      })
      .finally(() => setLoadingDropdown(false));
  }, [isOpen, isView]);

  // ── Load nomor saat cabor berubah ─────────────────────
  useEffect(() => {
    if (!caborId) { setNomorList([]); setNomorId(""); return; }
    laporanPertandinganService.getNomorDropdown(Number(caborId)).then(setNomorList);
  }, [caborId]);

  // ── Load atlet A saat kontingen A / cabor / nomor berubah ──
  useEffect(() => {
    if (!kontingenAId || !caborId || !nomorId) { setAtletAList([]); return; }
    setLoadingAtletA(true);
    laporanPertandinganService
      .getAtletDropdown({
        kontingen_id: Number(kontingenAId),
        cabor_id:     Number(caborId),
        nomor_id:     Number(nomorId),
      })
      .then(setAtletAList)
      .finally(() => setLoadingAtletA(false));
  }, [kontingenAId, caborId, nomorId]);

  // ── Load atlet B saat kontingen B / cabor / nomor berubah ──
  useEffect(() => {
    if (!kontingenBId || !caborId || !nomorId) { setAtletBList([]); return; }
    setLoadingAtletB(true);
    laporanPertandinganService
      .getAtletDropdown({
        kontingen_id: Number(kontingenBId),
        cabor_id:     Number(caborId),
        nomor_id:     Number(nomorId),
      })
      .then(setAtletBList)
      .finally(() => setLoadingAtletB(false));
  }, [kontingenBId, caborId, nomorId]);

  // ── Populate form saat modal dibuka ──────────────────
  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setLocalData(null);
    if (data && mode !== "create") {
      setTanggal(data.tanggal_pertandingan);
      setWaktu(data.waktu_pertandingan.slice(0, 5));
      setVenue(data.venue);
      setCaborId(data.cabor_id);
      setNomorId(data.nomor_id);
      setBabak(data.babak);
      setKontingenAId(data.kontingen_a_id);
      setKontingenBId(data.kontingen_b_id ?? "");
      setHasil(data.hasil_pertandingan);
      setPemenang(data.pemenang);
      setJuaraKe(data.juara_ke ?? "");
      setWasit(data.wasit);
      setCatatan(data.catatan_khusus ?? "");
      setAtletA(data.atlet_a.map(a => a.atlet_id));
      setAtletB(data.atlet_b.map(a => a.atlet_id));
    } else {
      setTanggal(TODAY);
      setWaktu("09:00");
      setVenue("");
      setCaborId("");
      setNomorId("");
      setBabak("PENYISIHAN");
      setKontingenAId("");
      setKontingenBId("");
      setHasil("");
      setPemenang("TIM_A");
      setJuaraKe("");
      setWasit("");
      setCatatan("");
      setAtletA([]);
      setAtletB([]);
    }
  }, [isOpen, data, mode]);

  // ── Save ──────────────────────────────────────────────
  const handleSave = async () => {
    if (!tanggal || !waktu || !venue || caborId === "" || nomorId === "" ||
        !babak || kontingenAId === "" || !hasil || !pemenang || !wasit) {
      setError("Field bertanda * wajib diisi");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let result: LaporanDetail;
      if (mode === "create") {
        const atletAFinal = atletA.filter(id => id !== 0);
        const atletBFinal = atletB.filter(id => id !== 0);
        const payload: CreateLaporanPayload = {
          tanggal_pertandingan: tanggal,
          waktu_pertandingan:   waktu.length === 5 ? waktu + ":00" : waktu,
          venue,
          cabor_id:             Number(caborId),
          nomor_id:             Number(nomorId),
          babak,
          kontingen_a_id:       Number(kontingenAId),
          ...(kontingenBId !== "" && { kontingen_b_id: Number(kontingenBId) }),
          hasil_pertandingan:   hasil,
          pemenang,
          ...(juaraKe !== "" && { juara_ke: Number(juaraKe) }),
          wasit,
          ...(catatan && { catatan_khusus: catatan }),
          // kirim array atlet hanya jika ada isinya
          ...(atletAFinal.length > 0 && { atlet_a: atletAFinal }),
          ...(atletBFinal.length > 0 && { atlet_b: atletBFinal }),
        };
        result = await laporanPertandinganService.create(payload);
      } else {
        const atletAFinal = atletA.filter(id => id !== 0);
        const atletBFinal = atletB.filter(id => id !== 0);
        const payload: UpdateLaporanPayload = {
          tanggal_pertandingan: tanggal,
          waktu_pertandingan:   waktu.length === 5 ? waktu + ":00" : waktu,
          venue,
          cabor_id:             Number(caborId),
          nomor_id:             Number(nomorId),
          babak,
          kontingen_a_id:       Number(kontingenAId),
          kontingen_b_id:       kontingenBId !== "" ? Number(kontingenBId) : null,
          hasil_pertandingan:   hasil,
          pemenang,
          juara_ke:             juaraKe !== "" ? Number(juaraKe) : null,
          wasit,
          catatan_khusus:       catatan || null,
          // kirim array atlet hanya jika ada perubahan
          ...(atletAFinal.length > 0 && { atlet_a: atletAFinal }),
          ...(atletBFinal.length > 0 && { atlet_b: atletBFinal }),
        };
        result = await laporanPertandinganService.update(data!.id, payload);
      }
      onSuccess(result);
      onClose();
    } catch (e: any) {
      setError(e.message || "Gagal menyimpan laporan");
    } finally {
      setLoading(false);
    }
  };

  // ── Upload foto/video ─────────────────────────────────
  const handleUploadFoto = async (file: File) => {
    const id = (localData ?? data)!.id;
    setAnyUploading(true);
    try {
      const res = await laporanPertandinganService.uploadFoto(id, file);
      setLocalData(prev => ({ ...(prev ?? data!), foto_bukti: res.path }));
    } finally {
      setAnyUploading(false);
    }
  };

  const handleUploadVideo = async (file: File) => {
    const id = (localData ?? data)!.id;
    setAnyUploading(true);
    try {
      const res = await laporanPertandinganService.uploadVideo(id, file);
      setLocalData(prev => ({ ...(prev ?? data!), video_bukti: res.path }));
    } finally {
      setAnyUploading(false);
    }
  };

  // ── Display helpers ───────────────────────────────────
  // formatTanggalIndo dari service — strip timezone sebelum parse, tidak akan Invalid Date
  const BABAK_LABEL = (v: string) => getBabakLabel(v);
  const PEMENANG_LABEL = (v: string) => getPemenangLabel(v);

  const atletDisabledA = !kontingenAId || !caborId || !nomorId;
  const atletDisabledB = !kontingenBId || !caborId || !nomorId;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[720px] m-4">
      <div className="no-scrollbar relative w-full overflow-y-auto rounded-3xl bg-white dark:bg-gray-900 p-6 lg:p-8">

        {/* Header */}
        <div className="mb-5 pr-8">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white">
            {mode === "create" ? "Tambah Laporan Pertandingan"
              : mode === "edit" ? "Edit Laporan Pertandingan"
              : "Detail Laporan Pertandingan"}
          </h4>
          {activeData && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              #{activeData.id} · {activeData.nama_cabor} — {activeData.nama_nomor}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="custom-scrollbar max-h-[72vh] overflow-y-auto space-y-6 pr-1">

          {/* ── Informasi Pertandingan ── */}
          <section>
            <h5 className="section-title">Informasi Pertandingan</h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tanggal <span className="text-red-500">*</span></Label>
                {isView
                  ? <p className="view-text">{formatTanggalIndo(activeData!.tanggal_pertandingan)}</p>
                  : <Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} />
                }
              </div>
              <div>
                <Label>Waktu <span className="text-red-500">*</span></Label>
                {isView
                  ? <p className="view-text">{activeData!.waktu_pertandingan?.slice(0,5)} WIB</p>
                  : <Input type="time" value={waktu} onChange={e => setWaktu(e.target.value)} />
                }
              </div>
              <div className="col-span-2">
                <Label>Venue / Lapangan <span className="text-red-500">*</span></Label>
                {isView
                  ? <p className="view-text">{activeData!.venue}</p>
                  : <Input type="text" value={venue} onChange={e => setVenue(e.target.value)} placeholder="GOR Pemuda Serang" />
                }
              </div>
            </div>
          </section>

          {/* ── Cabor & Nomor ── */}
          <section>
            <h5 className="section-title">Cabang Olahraga</h5>
            {isView ? (
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Cabor</Label><p className="view-text">{activeData!.nama_cabor}</p></div>
                <div><Label>Nomor / Kelas</Label><p className="view-text">{activeData!.nama_nomor}</p></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cabor <span className="text-red-500">*</span></Label>
                  {loadingDropdown ? <p className="text-xs text-gray-400 mt-1">Memuat...</p> : (
                    <select
                      value={caborId}
                      onChange={e => { setCaborId(Number(e.target.value)); setNomorId(""); setAtletA([]); setAtletB([]); }}
                      className="select-field"
                    >
                      <option value="">-- Pilih Cabor --</option>
                      {caborList.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <Label>Nomor / Kelas <span className="text-red-500">*</span></Label>
                  <select
                    value={nomorId}
                    onChange={e => { setNomorId(Number(e.target.value)); setAtletA([]); setAtletB([]); }}
                    disabled={!caborId}
                    className="select-field disabled:opacity-50"
                  >
                    <option value="">-- Pilih Nomor --</option>
                    {nomorList.map(n => (
                      <option key={n.id} value={n.id}>
                        {n.nama} — {n.jenis_kelamin} ({n.tipe})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* ── Babak & Tim ── */}
          <section>
            <h5 className="section-title">Babak & Tim</h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Babak <span className="text-red-500">*</span></Label>
                {isView
                  ? <p className="view-text">{BABAK_LABEL(activeData!.babak)}</p>
                  : (
                    <select value={babak} onChange={e => setBabak(e.target.value as Babak)} className="select-field">
                      {BABAK_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  )
                }
              </div>
              <div>
                <Label>Tim A (Kontingen) <span className="text-red-500">*</span></Label>
                {isView
                  ? <p className="view-text">{activeData!.nama_kontingen_a}</p>
                  : (
                    <select
                      value={kontingenAId}
                      onChange={e => { setKontingenAId(Number(e.target.value)); setAtletA([]); }}
                      className="select-field"
                    >
                      <option value="">-- Pilih Tim A --</option>
                      {kontingenList.map(k => <option key={k.id} value={k.id}>{k.nama_kontingen}</option>)}
                    </select>
                  )
                }
              </div>
              <div>
                <Label>Tim B (Kontingen)</Label>
                {isView
                  ? <p className="view-text">{activeData!.nama_kontingen_b ?? "—"}</p>
                  : (
                    <select
                      value={kontingenBId}
                      onChange={e => { setKontingenBId(e.target.value ? Number(e.target.value) : ""); setAtletB([]); }}
                      className="select-field"
                    >
                      <option value="">-- Tanpa lawan --</option>
                      {kontingenList.map(k => <option key={k.id} value={k.id}>{k.nama_kontingen}</option>)}
                    </select>
                  )
                }
              </div>
            </div>
          </section>

          {/* ── Atlet Sisi A & B ── */}
          <section>
            <h5 className="section-title">Atlet Bertanding</h5>
            {isView ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Atlet Sisi A</Label>
                  {activeData!.atlet_a.length === 0
                    ? <p className="text-xs text-gray-400 mt-1">Tidak ada (beregu)</p>
                    : (
                      <ul className="mt-1 space-y-1">
                        {activeData!.atlet_a.map(a => (
                          <li key={a.id} className="text-sm text-gray-800 dark:text-white">
                            <span className="text-gray-500">{a.urutan}.</span> {a.nama_lengkap}
                            {a.nama_nomor && (
                              <span className="ml-1 text-xs text-gray-400">({a.nama_nomor})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )
                  }
                </div>
                <div>
                  <Label>Atlet Sisi B</Label>
                  {activeData!.atlet_b.length === 0
                    ? <p className="text-xs text-gray-400 mt-1">Tidak ada (beregu)</p>
                    : (
                      <ul className="mt-1 space-y-1">
                        {activeData!.atlet_b.map(a => (
                          <li key={a.id} className="text-sm text-gray-800 dark:text-white">
                            <span className="text-gray-500">{a.urutan}.</span> {a.nama_lengkap}
                            {a.nama_nomor && (
                              <span className="ml-1 text-xs text-gray-400">({a.nama_nomor})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )
                  }
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <AtletSisiInput
                    label="Atlet Sisi A"
                    value={atletA}
                    onChange={setAtletA}
                    atletList={atletAList}
                    disabled={atletDisabledA}
                    loading={loadingAtletA}
                  />
                  <AtletSisiInput
                    label="Atlet Sisi B"
                    value={atletB}
                    onChange={setAtletB}
                    atletList={atletBList}
                    disabled={atletDisabledB}
                    loading={loadingAtletB}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Hanya atlet yang sudah terdaftar di cabor+nomor ini yang muncul.
                  Kosongkan untuk pertandingan beregu (cukup kontingen).
                </p>
              </>
            )}
          </section>

          {/* ── Hasil & Pemenang ── */}
          <section>
            <h5 className="section-title">Hasil Pertandingan</h5>
            <div className="space-y-4">
              <div>
                <Label>Hasil Pertandingan <span className="text-red-500">*</span></Label>
                {isView
                  ? <p className="view-text">{activeData!.hasil_pertandingan}</p>
                  : <Input type="text" value={hasil} onChange={e => setHasil(e.target.value)} placeholder="21-18, 18-21, 21-15" />
                }
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pemenang <span className="text-red-500">*</span></Label>
                  {isView
                    ? <p className="view-text">{PEMENANG_LABEL(activeData!.pemenang)}</p>
                    : (
                      <select value={pemenang} onChange={e => setPemenang(e.target.value as Pemenang)} className="select-field">
                        {PEMENANG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    )
                  }
                </div>
                <div>
                  <Label>Juara Ke</Label>
                  {isView
                    ? <p className="view-text">{activeData!.juara_ke ? `Juara ${activeData!.juara_ke}` : "—"}</p>
                    : (
                      <Input
                        type="number"
                        value={juaraKe}
                        onChange={e => setJuaraKe(e.target.value ? Number(e.target.value) : "")}
                        placeholder="1 / 2 / 3 (opsional)"
                      />
                    )
                  }
                </div>
              </div>
            </div>
          </section>

          {/* ── Wasit & Catatan ── */}
          <section>
            <h5 className="section-title">Wasit & Catatan</h5>
            <div className="space-y-4">
              <div>
                <Label>Wasit / Juri <span className="text-red-500">*</span></Label>
                {isView
                  ? <p className="view-text">{activeData!.wasit}</p>
                  : <Input type="text" value={wasit} onChange={e => setWasit(e.target.value)} placeholder="Nama wasit" />
                }
              </div>
              <div>
                <Label>Catatan Khusus</Label>
                {isView
                  ? <p className="view-text">{activeData!.catatan_khusus || "—"}</p>
                  : (
                    <textarea
                      value={catatan}
                      onChange={e => setCatatan(e.target.value)}
                      rows={2}
                      placeholder="Opsional"
                      className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900 resize-none"
                    />
                  )
                }
              </div>
            </div>
          </section>

          {/* ── Foto & Video Bukti ── */}
          {(mode === "edit" || mode === "view") && activeData && (
            <section>
              <h5 className="section-title">Bukti Media</h5>
              <div className="space-y-3">
                <MediaUploadRow
                  label="Foto Bukti"
                  currentPath={activeData.foto_bukti}
                  accept="image/*"
                  readonly={isView}
                  onUpload={mode === "edit" ? handleUploadFoto : undefined}
                  uploading={anyUploading}
                />
                <MediaUploadRow
                  label="Video Bukti"
                  currentPath={activeData.video_bukti}
                  accept="video/*"
                  readonly={isView}
                  onUpload={mode === "edit" ? handleUploadVideo : undefined}
                  uploading={anyUploading}
                />
              </div>
            </section>
          )}

          {mode === "create" && (
            <p className="text-xs text-gray-400">
              Foto dan video dapat diupload setelah laporan tersimpan melalui menu Edit.
            </p>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button size="sm" variant="outline" onClick={onClose} disabled={loading || anyUploading}>
            {isView ? "Tutup" : "Batal"}
          </Button>
          {!isView && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading || anyUploading}
              className="bg-brand-500 hover:bg-brand-600 text-white"
            >
              {loading ? "Menyimpan..." : mode === "create" ? "Simpan" : "Perbarui"}
            </Button>
          )}
        </div>
      </div>

      {/* Inline styles untuk class utility yang dipakai di atas */}
      <style>{`
        .section-title {
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #9ca3af;
          margin-bottom: 0.75rem;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 0.375rem;
        }
        .dark .section-title { color: #6b7280; border-color: #1f2937; }
        .view-text { font-size: 0.875rem; color: #1f2937; margin-top: 0.25rem; }
        .dark .view-text { color: #f9fafb; }
        .select-field {
          width: 100%; height: 2.75rem; border-radius: 0.5rem;
          border: 1px solid #d1d5db; background: transparent;
          padding: 0 0.75rem; font-size: 0.875rem; color: #1f2937;
        }
        .dark .select-field { border-color: #374151; color: #f9fafb; background: #111827; }
      `}</style>
    </Modal>
  );
}
