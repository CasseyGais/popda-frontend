import { useState, useEffect, useCallback } from "react";
import {
  identitasService,
  kontingenService,
  kontingenIdentitasService,
  fotoUrl,
  type Identitas,
} from "../service";
import { useAuth } from "../../../context/AuthContext";
import { useTerritory } from "../../../context/TerritoryContext";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserMetaCard";
import UserAddressCard from "../components/UserAddressCard";
import IdentitasEditModal from "../components/IdentitasEditModal";
import KontingenCreateModal from "../components/KontingenCreateModal";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import FileInput from "../../../components/form/input/FileInput";
import PhoneInput from "../../../components/form/group-input/PhoneInput";

function checkSuperAdmin(user: ReturnType<typeof useAuth>["user"]): boolean {
  if (!user) return false;
  const roleName = (user.role?.name ?? "").toLowerCase();
  if (roleName === "superadmin") return true;
  if (user.territories && user.territories.length > 5) return true;
  return false;
}

const EMPTY_FORM = {
  kepala_nama: "", kepala_jabatan: "", kepala_nip: "", kepala_telepon: "",
  pic_nama: "", pic_jabatan: "", pic_telepon: "",
  alamat: "", email_instansi: "", phone_instansi: "",
};

export default function MainPage() {
  const { user } = useAuth();
  const { currentTerritory } = useTerritory();
  const isSuperAdmin = checkSuperAdmin(user);

  const [identitas, setIdentitas]               = useState<Identitas | null>(null);
  const [kontingenId, setKontingenId]           = useState<number | null>(null);
  const [kontingenTidakAda, setKontingenTidakAda] = useState(false);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState<string | null>(null);
  const [editOpen, setEditOpen]                 = useState(false);
  const [createOpen, setCreateOpen]             = useState(false);

  // Inline form state — dipakai saat data belum ada
  const [form, setForm]                         = useState(EMPTY_FORM);
  const [kepalaFotoFile, setKepalaFotoFile]     = useState<File | null>(null);
  const [picFotoFile, setPicFotoFile]           = useState<File | null>(null);
  const [kepalaPreview, setKepalaPreview]       = useState<string>(fotoUrl(null));
  const [picPreview, setPicPreview]             = useState<string>(fotoUrl(null));
  const [saving, setSaving]                     = useState(false);
  const [saveError, setSaveError]               = useState("");

  // ── Fetch ───────────────────────────────────────────

  const fetchAsAdmin = useCallback(async () => {
    setLoading(true); setError(null); setIdentitas(null); setKontingenId(null);
    try {
      const res = await identitasService.get();
      if (res.data) { setIdentitas(res.data); setKontingenId(res.data.kontingen_id); }
      else           { setIdentitas(null); setKontingenId(-1); }
    } catch (err: any) {
      if (err.response?.status === 404) { setIdentitas(null); setKontingenId(-1); }
      else setError(err.response?.data?.message || err.message || "Gagal memuat data.");
    } finally { setLoading(false); }
  }, []);

  const fetchAsSuperAdmin = useCallback(async (territoryId: number) => {
    setLoading(true); setError(null); setIdentitas(null);
    setKontingenId(null); setKontingenTidakAda(false);
    try {
      let kontingen;
      try {
        const res = await kontingenService.getByTerritoryId(territoryId);
        kontingen = res.data;
      } catch (err: any) {
        if (err.response?.status === 404) { setKontingenTidakAda(true); return; }
        throw err;
      }
      if (!kontingen?.id) { setKontingenTidakAda(true); return; }
      setKontingenId(kontingen.id);
      try {
        const res = await kontingenIdentitasService.getByKontingenId(kontingen.id);
        const raw = res.data;
        setIdentitas(Array.isArray(raw) ? (raw.length > 0 ? raw[0] : null) : ((raw as Identitas) ?? null));
      } catch (err: any) {
        if (err.response?.status === 404) setIdentitas(null);
        else throw err;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Gagal memuat data.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) { if (currentTerritory?.id) fetchAsSuperAdmin(currentTerritory.id); }
    else fetchAsAdmin();
  }, [isSuperAdmin, currentTerritory?.id, fetchAsSuperAdmin, fetchAsAdmin]);

  // Reset inline form saat tidak ada data
  useEffect(() => {
    if (!identitas) {
      setForm(EMPTY_FORM);
      setKepalaFotoFile(null); setPicFotoFile(null);
      setKepalaPreview(fotoUrl(null)); setPicPreview(fotoUrl(null));
      setSaveError("");
    }
  }, [identitas]);

  const handleUpdateSuccess = (updated: Identitas) => {
    setIdentitas(updated);
    if (updated.kontingen_id) setKontingenId(updated.kontingen_id);
  };

  // ── Save inline form ──────────────────────────────────

  const handleInlineSave = async () => {
    setSaving(true); setSaveError("");
    try {
      let result: Identitas;
      if (isSuperAdmin) {
        if (!kontingenId) { setSaveError("Kontingen belum terdaftar."); return; }
        const payload = { ...form };
        const res = await kontingenIdentitasService.create({ kontingen_id: kontingenId, ...payload });
        result = res.data;
        // upload foto setelah create
        if (kepalaFotoFile) {
          const fd = new FormData(); fd.append("foto", kepalaFotoFile);
          const r = await kontingenIdentitasService.updateKepalaFoto(result.id, fd);
          if (r.foto) result = { ...result, kepala_foto: r.foto };
        }
        if (picFotoFile) {
          const fd = new FormData(); fd.append("foto", picFotoFile);
          const r = await kontingenIdentitasService.updatePicFoto(result.id, fd);
          if (r.foto) result = { ...result, pic_foto: r.foto };
        }
      } else {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        if (kepalaFotoFile) fd.append("kepala_foto", kepalaFotoFile);
        if (picFotoFile)    fd.append("pic_foto",    picFotoFile);
        const res = await identitasService.update(fd);
        result = res.data;
        result = {
          ...result,
          kepala_foto: result.kepala_foto ?? null,
          pic_foto:    result.pic_foto    ?? null,
        };
      }
      setIdentitas(result);
      if (result.kontingen_id) setKontingenId(result.kontingen_id);
    } catch (err: any) {
      setSaveError(err.response?.data?.message || err.message || "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  // ── Guards ────────────────────────────────────────────

  if (isSuperAdmin && !currentTerritory) return (
    <>
      <PageMeta title="Identitas Kontingen" description="Kelola data identitas kontingen" />
      <PageBreadcrumb pageTitle="Identitas Kontingen" />
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Pilih wilayah dari selector di atas.</p>
      </div>
    </>
  );

  if (loading) return (
    <>
      <PageMeta title="Identitas Kontingen" description="Kelola data identitas kontingen" />
      <PageBreadcrumb pageTitle="Identitas Kontingen" />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Memuat data{currentTerritory ? ` ${currentTerritory.name}` : ""}...</p>
        </div>
      </div>
    </>
  );

  if (error) return (
    <>
      <PageMeta title="Identitas Kontingen" description="Kelola data identitas kontingen" />
      <PageBreadcrumb pageTitle="Identitas Kontingen" />
      <div className="text-center py-20 px-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => isSuperAdmin && currentTerritory ? fetchAsSuperAdmin(currentTerritory.id) : fetchAsAdmin()}
          className="px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm">Coba Lagi</button>
      </div>
    </>
  );

  if (kontingenTidakAda) return (
    <>
      <PageMeta title="Identitas Kontingen" description="Kelola data identitas kontingen" />
      <PageBreadcrumb pageTitle="Identitas Kontingen" />
      <div className="text-center py-20 px-4">
        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-2">Kontingen Belum Terdaftar</h3>
        <p className="text-sm text-gray-500 mb-6">Wilayah <strong>{currentTerritory?.name}</strong> belum terdaftar.</p>
        <button onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Daftarkan Kontingen
        </button>
      </div>
      <KontingenCreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)}
        territoryId={currentTerritory!.id} territoryName={currentTerritory!.name}
        onSuccess={(i) => { setKontingenTidakAda(false); setKontingenId(i.kontingen_id); setIdentitas(i); }} />
    </>
  );

  // ── Belum ada data → inline form ─────────────────────

  if (!identitas) return (
    <>
      <PageMeta title="Identitas Kontingen" description="Kelola data identitas kontingen" />
      <div className="space-y-6 pb-10">
        <PageBreadcrumb pageTitle="Identitas Kontingen" />
        {currentTerritory && (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{currentTerritory.name}</p>
        )}

        <div className="rounded-xl border border-brand-200 dark:border-brand-800/40 bg-brand-50 dark:bg-brand-900/10 px-5 py-3">
          <p className="text-sm text-brand-700 dark:text-brand-400">
            Data identitas kontingen belum diisi. Lengkapi form di bawah dan klik <strong>Simpan Data Identitas</strong>.
          </p>
        </div>

        {saveError && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20 px-5 py-3">
            <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
          </div>
        )}

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">

          {/* ── Ketua Kontingen ── */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <h5 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">Ketua Kontingen</h5>
            <div className="flex flex-col items-center mb-5">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 mb-2">
                <img src={kepalaPreview} alt="Foto Ketua" className="w-full h-full object-cover"
                  onError={e => { e.currentTarget.src = "/images/user/placeholder.jpg"; }} />
              </div>
              <FileInput onChange={e => {
                const f = e.target.files?.[0]; if (!f) return;
                setKepalaFotoFile(f); setKepalaPreview(URL.createObjectURL(f));
              }} className="max-w-xs" />
              <p className="text-xs text-gray-400 mt-1">JPG / PNG • Opsional</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nama Lengkap</Label>
                <Input type="text" value={form.kepala_nama}
                  onChange={e => setForm(p => ({ ...p, kepala_nama: e.target.value }))}
                  placeholder="Nama ketua kontingen" />
              </div>
              <div>
                <Label>Jabatan</Label>
                <Input type="text" value={form.kepala_jabatan}
                  onChange={e => setForm(p => ({ ...p, kepala_jabatan: e.target.value }))}
                  placeholder="Ketua Kontingen" />
              </div>
              <div>
                <Label>NIP</Label>
                <Input type="text" value={form.kepala_nip}
                  onChange={e => setForm(p => ({ ...p, kepala_nip: e.target.value }))}
                  placeholder="NIP (opsional)" />
              </div>
              <div className="sm:col-span-2">
                <Label>Nomor Telepon</Label>
                <PhoneInput selectPosition="start" countries={[{ code: "ID", label: "+62" }]}
                  value={form.kepala_telepon}
                  onChange={v => setForm(p => ({ ...p, kepala_telepon: v }))}
                  placeholder="8123456789" />
              </div>
            </div>
          </div>

          {/* ── PIC / Operator ── */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <h5 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">PIC / Operator</h5>
            <div className="flex flex-col items-center mb-5">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 mb-2">
                <img src={picPreview} alt="Foto PIC" className="w-full h-full object-cover"
                  onError={e => { e.currentTarget.src = "/images/user/placeholder.jpg"; }} />
              </div>
              <FileInput onChange={e => {
                const f = e.target.files?.[0]; if (!f) return;
                setPicFotoFile(f); setPicPreview(URL.createObjectURL(f));
              }} className="max-w-xs" />
              <p className="text-xs text-gray-400 mt-1">JPG / PNG • Opsional</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nama Lengkap</Label>
                <Input type="text" value={form.pic_nama}
                  onChange={e => setForm(p => ({ ...p, pic_nama: e.target.value }))}
                  placeholder="Nama PIC / operator" />
              </div>
              <div>
                <Label>Jabatan</Label>
                <Input type="text" value={form.pic_jabatan}
                  onChange={e => setForm(p => ({ ...p, pic_jabatan: e.target.value }))}
                  placeholder="Staff / Koordinator" />
              </div>
              <div>
                <Label>Nomor Telepon</Label>
                <PhoneInput selectPosition="start" countries={[{ code: "ID", label: "+62" }]}
                  value={form.pic_telepon}
                  onChange={v => setForm(p => ({ ...p, pic_telepon: v }))}
                  placeholder="8123456789" />
              </div>
            </div>
          </div>

          {/* ── Instansi ── */}
          <div className="px-6 py-5">
            <h5 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">Informasi Instansi</h5>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Alamat</Label>
                <Input type="text" value={form.alamat}
                  onChange={e => setForm(p => ({ ...p, alamat: e.target.value }))}
                  placeholder="Jl. Merdeka No. 1" />
              </div>
              <div>
                <Label>Email Instansi</Label>
                <Input type="email" value={form.email_instansi}
                  onChange={e => setForm(p => ({ ...p, email_instansi: e.target.value }))}
                  placeholder="dinas@kab.go.id" />
              </div>
              <div>
                <Label>Telepon Instansi</Label>
                <PhoneInput selectPosition="start" countries={[{ code: "ID", label: "+62" }]}
                  value={form.phone_instansi}
                  onChange={v => setForm(p => ({ ...p, phone_instansi: v }))}
                  placeholder="2112345678" />
              </div>
            </div>
          </div>
        </div>

        {/* Tombol simpan */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleInlineSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Menyimpan...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg> Simpan Data Identitas</>
            )}
          </button>
        </div>
      </div>
    </>
  );

  // ── Sudah ada data → tampilkan cards + tombol edit (modal) ──

  return (
    <>
      <PageMeta title="Identitas Kontingen" description="Kelola data identitas kontingen" />
      <PageBreadcrumb pageTitle="Identitas Kontingen" />
      <div className="space-y-6 pb-10">

        <div className="flex items-center justify-between">
          <div>
            {currentTerritory && (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{currentTerritory.name}</p>
            )}
            {identitas.updated_at && (
              <p className="text-xs text-gray-400 mt-0.5">
                Terakhir diperbarui: {new Date(identitas.updated_at).toLocaleString("id-ID", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            )}
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.05]"
          >
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-current">
              <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z" />
            </svg>
            Edit Identitas
          </button>
        </div>

        <UserMetaCard role="ketua" data={identitas} />
        <UserMetaCard role="operator" data={identitas} />
        <UserAddressCard data={identitas} />
      </div>

      <IdentitasEditModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        data={identitas}
        kontingenId={kontingenId === -1 ? null : kontingenId}
        isSuperAdmin={isSuperAdmin}
        onSuccess={handleUpdateSuccess}
      />
    </>
  );
}
