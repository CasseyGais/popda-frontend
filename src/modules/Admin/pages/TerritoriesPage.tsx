import { useState, useEffect } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Badge from "../../../components/ui/badge/Badge";
import { TableCell, TableRow } from "../../../components/ui/table";
import CrudModal, { ModalMode } from "../components/CrudModal";
import { territoryService, Territory, TerritoryPayload } from "../service";
import { SearchInput, DataTable, ActionButtons } from "./UsersPage";
import { useAuth } from "../../../context/AuthContext";

const EMPTY_FORM: TerritoryPayload = { name: "", type: "KABUPATEN" };

const TYPE_COLORS: Record<string, "primary" | "success" | "warning"> = {
  PROVINSI: "primary",
  KABUPATEN: "success",
  KOTA: "warning",
};

export default function TerritoriesPage() {
  const { can } = useAuth();
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [search, setSearch]           = useState("");
  const [filterType, setFilterType]   = useState<"" | "PROVINSI" | "KABUPATEN" | "KOTA">("");
  const [isOpen, setIsOpen]           = useState(false);
  const [mode, setMode]               = useState<ModalMode>("create");
  const [selected, setSelected]       = useState<Territory | null>(null);
  const [form, setForm]               = useState<TerritoryPayload>(EMPTY_FORM);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try { setLoading(true); const res = await territoryService.getAll(); setTerritories(res.data || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openModal = (m: ModalMode, t?: Territory) => {
    setMode(m);
    setSelected(t || null);
    setForm(t ? { name: t.name, type: t.type } : EMPTY_FORM);
    setIsOpen(true);
  };

  const handleSave   = async () => { try { setModalLoading(true); await territoryService.create(form); setIsOpen(false); fetchAll(); } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); } finally { setModalLoading(false); } };
  const handleUpdate = async () => { if (!selected) return; try { setModalLoading(true); await territoryService.update(selected.id, form); setIsOpen(false); fetchAll(); } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); } finally { setModalLoading(false); } };
  const handleDelete = async () => { if (!selected) return; try { setModalLoading(true); await territoryService.delete(selected.id); setIsOpen(false); fetchAll(); } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); } finally { setModalLoading(false); } };

  const filtered = territories.filter(t =>
    (t.name ?? "").toLowerCase().includes(search.toLowerCase()) &&
    (filterType === "" || t.type === filterType)
  );

  const renderForm = () => (
    <>
      <div>
        <Label>Nama Territory</Label>
        <Input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Contoh: Kabupaten Tangerang" />
      </div>
      <div>
        <Label>Tipe</Label>
        <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as TerritoryPayload["type"] }))}
          className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900">
          <option value="PROVINSI">PROVINSI</option>
          <option value="KABUPATEN">KABUPATEN</option>
          <option value="KOTA">KOTA</option>
        </select>
      </div>
    </>
  );

  const renderView = () => (
    <>
      <div><Label>Nama</Label><p className="text-sm text-gray-800 dark:text-white mt-1">{selected?.name}</p></div>
      <div><Label>Tipe</Label>
        <div className="mt-1">
          <Badge color={TYPE_COLORS[selected?.type || "KABUPATEN"]} variant="light">{selected?.type}</Badge>
        </div>
      </div>
    </>
  );

  const getTitle = () => ({ view: "Detail Territory", create: "Tambah Territory", edit: "Edit Territory", delete: "Hapus Territory" }[mode]);

  // Stats
  const stats = { PROVINSI: territories.filter(t => t.type === "PROVINSI").length, KABUPATEN: territories.filter(t => t.type === "KABUPATEN").length, KOTA: territories.filter(t => t.type === "KOTA").length };

  return (
    <>
      <PageMeta title="Manajemen Territories" description="Kelola data wilayah" />
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Manajemen Territories" />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {(["PROVINSI", "KABUPATEN", "KOTA"] as const).map(type => (
            <div key={type} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center">
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats[type]}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{type}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Kelola data wilayah (provinsi, kabupaten, kota)</p>
          {can("territory.create") && (
          <Button onClick={() => openModal("create")} className="bg-brand-500 text-white hover:bg-brand-600">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Tambah Territory
            </span>
          </Button>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Cari nama territory..." /></div>
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)}
            className="h-11 rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900">
            <option value="">Semua Tipe</option>
            <option value="PROVINSI">PROVINSI</option>
            <option value="KABUPATEN">KABUPATEN</option>
            <option value="KOTA">KOTA</option>
          </select>
        </div>

        <DataTable loading={loading} headers={["No", "Nama Territory", "Tipe", "Aksi"]} empty={filtered.length === 0} emptyText="Belum ada territory">
          {filtered.map((t, i) => (
            <TableRow key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
              <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-200">{i + 1}</TableCell>
              <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white">{t.name}</TableCell>
              <TableCell className="px-5 py-4">
                <Badge color={TYPE_COLORS[t.type]} variant="light" size="sm">{t.type}</Badge>
              </TableCell>
              <TableCell className="py-4 px-4"><ActionButtons onView={() => openModal("view", t)} onEdit={can("territory.update") ? () => openModal("edit", t) : undefined} onDelete={can("territory.delete") ? () => openModal("delete", t) : undefined} /></TableCell>
            </TableRow>
          ))}
        </DataTable>
      </div>
      <CrudModal isOpen={isOpen} onClose={() => setIsOpen(false)} mode={mode} title={getTitle()} loading={modalLoading}
        onSave={handleSave} onUpdate={handleUpdate} onDelete={handleDelete} deleteLabel={`territory "${selected?.name}"`}>
        {mode === "view" ? renderView() : mode === "delete" ? null : renderForm()}
      </CrudModal>
    </>
  );
}
