import { useState, useEffect } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Badge from "../../../components/ui/badge/Badge";
import { TableCell, TableRow } from "../../../components/ui/table";
import CrudModal, { ModalMode } from "../components/CrudModal";
import { nomorService, caborService, Nomor, NomorPayload, Cabor } from "../service";
import { SearchInput, DataTable, ActionButtons } from "./UsersPage";
import { useAuth } from "../../../context/AuthContext";

const EMPTY_FORM: NomorPayload = {
  nama: "", cabor_id: 0, jenis_kelamin: "PUTRA", tipe: "INDIVIDU",
};

const KELAMIN_COLOR: Record<string, "primary" | "error" | "warning"> = {
  PUTRA: "primary", PUTRI: "error", CAMPURAN: "warning",
};

export default function NomorPage() {
  const { can } = useAuth();
  const [nomors, setNomors]           = useState<Nomor[]>([]);
  const [cabors, setCabors]           = useState<Cabor[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [search, setSearch]           = useState("");
  const [filterCabor, setFilterCabor] = useState<number | "">("");
  const [isOpen, setIsOpen]           = useState(false);
  const [mode, setMode]               = useState<ModalMode>("create");
  const [selected, setSelected]       = useState<Nomor | null>(null);
  const [form, setForm]               = useState<NomorPayload>(EMPTY_FORM);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [nRes, cRes] = await Promise.all([nomorService.getAll(), caborService.getAll()]);
      setNomors(nRes.data || []);
      setCabors(cRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchByCabor = async (caborId: number) => {
    try {
      setLoading(true);
      const res = await nomorService.getByCabor(caborId);
      setNomors(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleFilterCabor = (val: number | "") => {
    setFilterCabor(val);
    if (val === "") fetchAll();
    else fetchByCabor(Number(val));
  };

  const openModal = (m: ModalMode, n?: Nomor) => {
    setMode(m);
    setSelected(n || null);
    setForm(n
      ? { nama: n.nama, cabor_id: n.cabor_id, jenis_kelamin: n.jenis_kelamin, tipe: n.tipe }
      : { ...EMPTY_FORM, cabor_id: filterCabor !== "" ? Number(filterCabor) : 0 }
    );
    setIsOpen(true);
  };

  const handleSave   = async () => { try { setModalLoading(true); await nomorService.create(form); setIsOpen(false); filterCabor !== "" ? fetchByCabor(Number(filterCabor)) : fetchAll(); } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); } finally { setModalLoading(false); } };
  const handleUpdate = async () => { if (!selected) return; try { setModalLoading(true); await nomorService.update(selected.id, form); setIsOpen(false); filterCabor !== "" ? fetchByCabor(Number(filterCabor)) : fetchAll(); } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); } finally { setModalLoading(false); } };
  const handleDelete = async () => { if (!selected) return; try { setModalLoading(true); await nomorService.delete(selected.id); setIsOpen(false); filterCabor !== "" ? fetchByCabor(Number(filterCabor)) : fetchAll(); } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); } finally { setModalLoading(false); } };

  const getCaborName = (id: number) => cabors.find(c => c.id === id)?.nama ?? "—";

  const filtered = nomors.filter(n =>
    (n.nama ?? "").toLowerCase().includes(search.toLowerCase()) ||
    getCaborName(n.cabor_id).toLowerCase().includes(search.toLowerCase())
  );

  const renderForm = () => (
    <>
      <div>
        <Label>Cabor <span className="text-red-500">*</span></Label>
        <select
          value={form.cabor_id}
          onChange={e => setForm(p => ({ ...p, cabor_id: Number(e.target.value) }))}
          className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900"
        >
          <option value={0}>-- Pilih Cabor --</option>
          {cabors.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
        </select>
      </div>
      <div>
        <Label>Nama Nomor <span className="text-red-500">*</span></Label>
        <Input type="text" value={form.nama}
          onChange={e => setForm(p => ({ ...p, nama: e.target.value }))}
          placeholder="Contoh: Tunggal Putra, 100M" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Jenis Kelamin</Label>
          <select
            value={form.jenis_kelamin}
            onChange={e => setForm(p => ({ ...p, jenis_kelamin: e.target.value as NomorPayload["jenis_kelamin"] }))}
            className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900"
          >
            <option value="PUTRA">PUTRA</option>
            <option value="PUTRI">PUTRI</option>
            <option value="CAMPURAN">CAMPURAN</option>
          </select>
        </div>
        <div>
          <Label>Tipe</Label>
          <select
            value={form.tipe}
            onChange={e => setForm(p => ({ ...p, tipe: e.target.value as NomorPayload["tipe"] }))}
            className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900"
          >
            <option value="INDIVIDU">INDIVIDU</option>
            <option value="BEREGU">BEREGU</option>
          </select>
        </div>
      </div>
    </>
  );

  const renderView = () => (
    <>
      <div>
        <Label>Cabor</Label>
        <p className="text-sm font-medium text-gray-800 dark:text-white mt-1">
          {selected ? getCaborName(selected.cabor_id) : "—"}
        </p>
      </div>
      <div>
        <Label>Nama Nomor</Label>
        <p className="text-sm font-medium text-gray-800 dark:text-white mt-1">{selected?.nama}</p>
      </div>
      <div className="flex gap-3">
        <div>
          <Label>Jenis Kelamin</Label>
          <div className="mt-1">
            <Badge color={KELAMIN_COLOR[selected?.jenis_kelamin || "PUTRA"]} variant="light">
              {selected?.jenis_kelamin}
            </Badge>
          </div>
        </div>
        <div>
          <Label>Tipe</Label>
          <div className="mt-1">
            <Badge color={selected?.tipe === "BEREGU" ? "warning" : "info"} variant="light">
              {selected?.tipe}
            </Badge>
          </div>
        </div>
      </div>
    </>
  );

  const getTitle = () => ({ view: "Detail Nomor", create: "Tambah Nomor Baru", edit: "Edit Nomor", delete: "Hapus Nomor" }[mode]);

  return (
    <>
      <PageMeta title="Master Nomor" description="Kelola nomor pertandingan" />
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Master Nomor" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total <strong>{nomors.length}</strong> nomor pertandingan
            {filterCabor !== "" && <> untuk <strong>{getCaborName(Number(filterCabor))}</strong></>}
          </p>
          {can("nomor.create") && (
          <Button onClick={() => openModal("create")} className="bg-brand-500 text-white hover:bg-brand-600">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Nomor
            </span>
          </Button>
          )}
        </div>

        {/* Search + filter cabor */}
        <div className="flex gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Cari nama nomor atau cabor..." />
          </div>
          <select
            value={filterCabor}
            onChange={e => handleFilterCabor(e.target.value ? Number(e.target.value) : "")}
            className="h-11 rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900 min-w-[160px]"
          >
            <option value="">Semua Cabor</option>
            {cabors.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
          </select>
        </div>

        <DataTable
          loading={loading}
          headers={["No", "Cabor", "Nama Nomor", "Jenis Kelamin", "Tipe", "Aksi"]}
          empty={filtered.length === 0}
          emptyText={filterCabor !== "" ? `Belum ada nomor untuk ${getCaborName(Number(filterCabor))}` : "Belum ada nomor"}
        >
          {filtered.map((n, i) => (
            <TableRow key={n.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
              <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{i + 1}</TableCell>
              <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                {getCaborName(n.cabor_id)}
              </TableCell>
              <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white">{n.nama}</TableCell>
              <TableCell className="px-5 py-4">
                <Badge color={KELAMIN_COLOR[n.jenis_kelamin]} variant="light" size="sm">
                  {n.jenis_kelamin}
                </Badge>
              </TableCell>
              <TableCell className="px-5 py-4">
                <Badge color={n.tipe === "BEREGU" ? "warning" : "info"} variant="light" size="sm">
                  {n.tipe}
                </Badge>
              </TableCell>
              <TableCell className="py-4 px-4">
                <ActionButtons
                  onView={() => openModal("view", n)}
                  onEdit={can("nomor.update") ? () => openModal("edit", n) : undefined}
                  onDelete={can("nomor.delete") ? () => openModal("delete", n) : undefined}
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
        deleteLabel={`nomor "${selected?.nama}"`}
      >
        {mode === "view" ? renderView() : mode === "delete" ? null : renderForm()}
      </CrudModal>
    </>
  );
}
