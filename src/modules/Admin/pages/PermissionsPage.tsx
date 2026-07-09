import { useState, useEffect } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Badge from "../../../components/ui/badge/Badge";
import CrudModal, { ModalMode } from "../components/CrudModal";
import { permissionService, moduleService, Permission, Module } from "../service";
import { SearchInput, DataTable, ActionButtons } from "./UsersPage";
import { useAuth } from "../../../context/AuthContext";

const EMPTY_FORM = { module_id: "" as number | "", name: "", description: "" };

export default function PermissionsPage() {
  const { can } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modules, setModules]         = useState<Module[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [search, setSearch]           = useState("");
  const [filterModule, setFilterModule] = useState<number | "">("");
  const [isOpen, setIsOpen]           = useState(false);
  const [mode, setMode]               = useState<ModalMode>("create");
  const [selected, setSelected]       = useState<Permission | null>(null);
  const [form, setForm]               = useState(EMPTY_FORM);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [pRes, mRes] = await Promise.all([
        permissionService.getAll(),
        moduleService.getAll(),
      ]);
      setPermissions(pRes.data || []);
      setModules(mRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openModal = (m: ModalMode, p?: Permission) => {
    setMode(m);
    setSelected(p || null);
    setForm(p
      ? { module_id: p.module_id ?? "", name: p.name, description: p.description || "" }
      : EMPTY_FORM
    );
    setIsOpen(true);
  };

  const buildPayload = () => ({
    module_id: form.module_id !== "" ? Number(form.module_id) : null,
    name: form.name,
    description: form.description,
  });

  const handleSave   = async () => { try { setModalLoading(true); await permissionService.create(buildPayload()); setIsOpen(false); fetchAll(); } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); } finally { setModalLoading(false); } };
  const handleUpdate = async () => { if (!selected) return; try { setModalLoading(true); await permissionService.update(selected.id, buildPayload()); setIsOpen(false); fetchAll(); } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); } finally { setModalLoading(false); } };
  const handleDelete = async () => { if (!selected) return; try { setModalLoading(true); await permissionService.delete(selected.id); setIsOpen(false); fetchAll(); } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); } finally { setModalLoading(false); } };

  // Helper: cari label modul dari id
  const getModuleLabel = (moduleId: number | null) => {
    if (!moduleId) return null;
    return modules.find(m => m.id === moduleId)?.label ?? null;
  };

  const filtered = permissions.filter(p => {
    const matchSearch = (p.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.description ? p.description.toLowerCase().includes(search.toLowerCase()) : false);
    const matchModule = filterModule === "" || p.module_id === filterModule;
    return matchSearch && matchModule;
  });

  // Group permissions by module untuk tampilan grouped
  const grouped = modules.map(m => ({
    module: m,
    items: filtered.filter(p => p.module_id === m.id),
  })).filter(g => g.items.length > 0);

  // Permissions tanpa modul
  const unassigned = filtered.filter(p => !p.module_id);

  const renderForm = () => (
    <>
      <div>
        <Label>Modul</Label>
        <select
          value={form.module_id}
          onChange={e => setForm(p => ({ ...p, module_id: e.target.value ? Number(e.target.value) : "" }))}
          className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900"
        >
          <option value="">-- Tanpa Modul --</option>
          {modules.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>
      <div>
        <Label>Nama Permission</Label>
        <Input
          type="text"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          placeholder="Contoh: cabor.view, atlet.manage"
        />
        <p className="mt-1 text-xs text-gray-400">Format: modul.aksi — contoh: cabor.view, atlet.manage</p>
      </div>
      <div>
        <Label>Deskripsi</Label>
        <Input
          type="text"
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="Deskripsi singkat permission"
        />
      </div>
    </>
  );

  const renderView = () => (
    <>
      <div>
        <Label>Modul</Label>
        <div className="mt-1">
          {selected?.module_id
            ? <Badge color="primary" variant="light">{getModuleLabel(selected.module_id)}</Badge>
            : <span className="text-xs text-gray-400">Tanpa modul</span>
          }
        </div>
      </div>
      <div>
        <Label>Nama Permission</Label>
        <code className="block mt-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-lg">
          {selected?.name}
        </code>
      </div>
      <div>
        <Label>Deskripsi</Label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selected?.description || "—"}</p>
      </div>
    </>
  );

  const getTitle = () => ({ view: "Detail Permission", create: "Tambah Permission", edit: "Edit Permission", delete: "Hapus Permission" }[mode]);

  return (
    <>
      <PageMeta title="Manajemen Permissions" description="Kelola permission sistem" />
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Manajemen Permissions" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total <strong>{permissions.length}</strong> permission di <strong>{modules.length}</strong> modul
          </p>
          {can("permission.create") && (
          <Button onClick={() => openModal("create")} className="bg-brand-500 text-white hover:bg-brand-600">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Permission
            </span>
          </Button>
          )}
        </div>

        {/* Search + filter modul */}
        <div className="flex gap-3">
          <div className="flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Cari nama atau deskripsi..." />
          </div>
          <select
            value={filterModule}
            onChange={e => setFilterModule(e.target.value ? Number(e.target.value) : "")}
            className="h-11 rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900"
          >
            <option value="">Semua Modul</option>
            {modules.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Tabel grouped by modul */}
        {loading ? (
          <DataTable loading headers={["No", "Permission", "Deskripsi", "Aksi"]} empty={false}>
            {null}
          </DataTable>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Tidak ada permission ditemukan
          </div>
        ) : (
          <div className="space-y-4">
            {/* Grouped by module */}
            {grouped.map(({ module: m, items }) => (
              <div key={m.id} className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                {/* Module header */}
                <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <Badge color="primary" variant="light" size="sm">{m.code}</Badge>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{m.label}</span>
                  {m.url && (
                    <code className="text-xs text-gray-400 dark:text-gray-500">{m.url}</code>
                  )}
                  <span className="ml-auto text-xs text-gray-400">{items.length} permission</span>
                </div>

                {/* Permissions in this module */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50 bg-white dark:bg-gray-900">
                  {items.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                      <span className="text-xs text-gray-400 w-6 shrink-0">{i + 1}</span>
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded flex-1">
                        {p.name}
                      </code>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex-1 hidden sm:block">
                        {p.description || "—"}
                      </span>
                      <ActionButtons
                        onView={() => openModal("view", p)}
                        onEdit={can("permission.update") ? () => openModal("edit", p) : undefined}
                        onDelete={can("permission.delete") ? () => openModal("delete", p) : undefined}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Unassigned permissions */}
            {unassigned.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <Badge color="light" variant="light" size="sm">—</Badge>
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Tanpa Modul</span>
                  <span className="ml-auto text-xs text-gray-400">{unassigned.length} permission</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50 bg-white dark:bg-gray-900">
                  {unassigned.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                      <span className="text-xs text-gray-400 w-6 shrink-0">{i + 1}</span>
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded flex-1">
                        {p.name}
                      </code>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex-1 hidden sm:block">
                        {p.description || "—"}
                      </span>
                      <ActionButtons
                        onView={() => openModal("view", p)}
                        onEdit={can("permission.update") ? () => openModal("edit", p) : undefined}
                        onDelete={can("permission.delete") ? () => openModal("delete", p) : undefined}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
        deleteLabel={`permission "${selected?.name}"`}
      >
        {mode === "view" ? renderView() : mode === "delete" ? null : renderForm()}
      </CrudModal>
    </>
  );
}
