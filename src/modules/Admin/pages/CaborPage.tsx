import { useState, useEffect } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Badge from "../../../components/ui/badge/Badge";
import { TableCell, TableRow } from "../../../components/ui/table";
import CrudModal, { ModalMode } from "../components/CrudModal";
import { caborService, Cabor, CaborPayload } from "../service";
import { SearchInput, DataTable, ActionButtons } from "./UsersPage";
import { useAuth } from "../../../context/AuthContext";

const EMPTY_FORM: CaborPayload = {
  nama: "", max_putra: 0, max_putri: 0, max_pelatih: 0,
};

export default function CaborPage() {
  const { can } = useAuth();
  const [cabors, setCabors]             = useState<Cabor[]>([]);
  const [loading, setLoading]           = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [search, setSearch]             = useState("");
  // Filter aktif: "all" | "active" | "inactive"
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [isOpen, setIsOpen]             = useState(false);
  const [mode, setMode]                 = useState<ModalMode>("create");
  const [selected, setSelected]         = useState<Cabor | null>(null);
  const [form, setForm]                 = useState<CaborPayload>(EMPTY_FORM);

  useEffect(() => { fetchAll(); }, []);

  // GET /admin/master/cabor — backend return semua cabor (aktif + nonaktif)
  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await caborService.getAll();
      setCabors(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openModal = (m: ModalMode, c?: Cabor) => {
    setMode(m);
    setSelected(c || null);
    setForm(c
      ? { nama: c.nama, max_putra: c.max_putra, max_putri: c.max_putri, max_pelatih: c.max_pelatih }
      : EMPTY_FORM
    );
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      setModalLoading(true);
      await caborService.create(form);
      setIsOpen(false);
      fetchAll();
    } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); }
    finally { setModalLoading(false); }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      setModalLoading(true);
      await caborService.update(selected.id, form);
      setIsOpen(false);
      fetchAll();
    } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); }
    finally { setModalLoading(false); }
  };

  // DELETE = hard delete permanen sesuai docs
  const handleDelete = async () => {
    if (!selected) return;
    try {
      setModalLoading(true);
      await caborService.delete(selected.id);
      setIsOpen(false);
      fetchAll();
    } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); }
    finally { setModalLoading(false); }
  };

  const numField = (key: keyof CaborPayload, val: string) => {
    const n = parseInt(val) || 0;
    setForm(p => ({ ...p, [key]: n < 0 ? 0 : n }));
  };

  // Filter di frontend: GET sudah return semua, kita filter sendiri
  const filtered = cabors.filter(c => {
    const matchSearch = (c.nama ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all"      ? true :
      filterStatus === "active"   ? c.is_active :
                                    !c.is_active;
    return matchSearch && matchStatus;
  });

  const renderForm = () => (
    <>
      <div>
        <Label>Nama Cabor <span className="text-red-500">*</span></Label>
        <Input type="text" value={form.nama}
          onChange={e => setForm(p => ({ ...p, nama: e.target.value }))}
          placeholder="Contoh: Bulutangkis, Atletik" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Max Putra</Label>
          <Input type="number" min="0" value={form.max_putra.toString()}
            onChange={e => numField("max_putra", e.target.value)} />
        </div>
        <div>
          <Label>Max Putri</Label>
          <Input type="number" min="0" value={form.max_putri.toString()}
            onChange={e => numField("max_putri", e.target.value)} />
        </div>
        <div>
          <Label>Max Pelatih</Label>
          <Input type="number" min="0" value={form.max_pelatih.toString()}
            onChange={e => numField("max_pelatih", e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-gray-400">
        Catatan: nilai 0 pada field integer tidak akan diupdate oleh backend (partial update).
      </p>
    </>
  );

  const renderView = () => (
    <>
      <div>
        <Label>Nama Cabor</Label>
        <p className="text-sm font-medium text-gray-800 dark:text-white mt-1">{selected?.nama}</p>
      </div>
      <div>
        <Label>Status</Label>
        <div className="mt-1">
          <Badge color={selected?.is_active ? "success" : "error"} variant="light">
            {selected?.is_active ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Max Putra</Label>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">{selected?.max_putra}</p>
        </div>
        <div>
          <Label>Max Putri</Label>
          <p className="text-lg font-bold text-pink-600 dark:text-pink-400 mt-1">{selected?.max_putri}</p>
        </div>
        <div>
          <Label>Max Pelatih</Label>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">{selected?.max_pelatih}</p>
        </div>
      </div>
      <div>
        <Label>Total Kuota Atlet</Label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {(selected?.max_putra || 0) + (selected?.max_putri || 0)} atlet
        </p>
      </div>
      <div>
        <Label>Dibuat</Label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {selected?.created_at
            ? new Date(selected.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
            : "—"}
        </p>
      </div>
    </>
  );

  const getTitle = () => (
    { view: "Detail Cabor", create: "Tambah Cabor Baru", edit: "Edit Cabor", delete: "Hapus Cabor" }[mode]
  );

  // Stats dari semua data (bukan hanya filtered)
  const totalAktif    = cabors.filter(c => c.is_active).length;
  const totalNonaktif = cabors.filter(c => !c.is_active).length;
  const totalKuota    = cabors.filter(c => c.is_active).reduce((s, c) => s + c.max_putra + c.max_putri, 0);

  return (
    <>
      <PageMeta title="Master Cabor" description="Kelola data cabang olahraga" />
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Master Cabor" />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Cabor</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{cabors.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Aktif</p>
            <p className="text-2xl font-bold text-success-600 dark:text-success-400">{totalAktif}</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nonaktif</p>
            <p className="text-2xl font-bold text-error-600 dark:text-error-400">{totalNonaktif}</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Kuota Atlet</p>
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{totalKuota}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Menampilkan <strong>{filtered.length}</strong> dari <strong>{cabors.length}</strong> cabor
          </p>
          {can("cabor.create") && (
          <Button onClick={() => openModal("create")} className="bg-brand-500 text-white hover:bg-brand-600">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Cabor
            </span>
          </Button>
          )}
        </div>

        {/* Search + filter status */}
        <div className="flex gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Cari nama cabor..." />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
            className="h-11 rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900 min-w-[130px]"
          >
            <option value="all">Semua</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        <DataTable
          loading={loading}
          headers={["No", "Nama Cabor", "Max Putra", "Max Putri", "Max Pelatih", "Status", "Aksi"]}
          empty={filtered.length === 0}
          emptyText="Belum ada cabor"
        >
          {filtered.map((c, i) => (
            <TableRow key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
              <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{i + 1}</TableCell>
              <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white">{c.nama}</TableCell>
              <TableCell className="px-5 py-4 text-sm text-center text-blue-600 dark:text-blue-400 font-semibold">{c.max_putra}</TableCell>
              <TableCell className="px-5 py-4 text-sm text-center text-pink-600 dark:text-pink-400 font-semibold">{c.max_putri}</TableCell>
              <TableCell className="px-5 py-4 text-sm text-center text-purple-600 dark:text-purple-400 font-semibold">{c.max_pelatih}</TableCell>
              <TableCell className="px-5 py-4">
                <Badge color={c.is_active ? "success" : "error"} variant="light" size="sm">
                  {c.is_active ? "Aktif" : "Nonaktif"}
                </Badge>
              </TableCell>
              <TableCell className="py-4 px-4">
                <ActionButtons
                  onView={() => openModal("view", c)}
                  onEdit={can("cabor.update") ? () => openModal("edit", c) : undefined}
                  onDelete={can("cabor.delete") ? () => openModal("delete", c) : undefined}
                />
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      </div>

      <CrudModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        mode={mode}
        title={getTitle()}
        loading={modalLoading}
        onSave={handleSave}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        deleteLabel={`cabor "${selected?.nama}"`}
      >
        {mode === "view" ? renderView() : mode === "delete" ? null : renderForm()}
      </CrudModal>
    </>
  );
}
