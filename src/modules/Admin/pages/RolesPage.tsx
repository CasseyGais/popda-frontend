import { useState, useEffect } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Badge from "../../../components/ui/badge/Badge";
import { TableCell, TableRow } from "../../../components/ui/table";
import CrudModal, { ModalMode } from "../components/CrudModal";
import { roleService, permissionService, moduleService, Role, Permission, Module } from "../service";
import { SearchInput, DataTable, ActionButtons } from "./UsersPage";
import { useAuth } from "../../../context/AuthContext";

const EMPTY_FORM = { name: "", description: "" };

export default function RolesPage() {
  const { can } = useAuth();
  const [roles, setRoles]           = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modules, setModules]       = useState<Module[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [search, setSearch]         = useState("");
  const [isOpen, setIsOpen]         = useState(false);
  const [mode, setMode]             = useState<ModalMode>("create");
  const [selected, setSelected]     = useState<Role | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [rolePermIds, setRolePermIds] = useState<Set<number>>(new Set());

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [rRes, pRes, mRes] = await Promise.all([roleService.getAll(), permissionService.getAll(), moduleService.getAll()]);
      setRoles(rRes.data || []);
      setPermissions(pRes.data || []);
      setModules(mRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openModal = async (m: ModalMode, role?: Role) => {
    setMode(m);
    setSelected(role || null);
    setRolePermIds(new Set());
    setForm(role ? { name: role.name, description: role.description || "" } : EMPTY_FORM);

    if (role && (m === "edit" || m === "view")) {
      try {
        const res = await roleService.getPermissionIds(role.id);
        const permIds: number[] = Array.isArray(res.data) ? res.data : [];
        setRolePermIds(new Set(permIds));
      } catch {}
    }
    setIsOpen(true);
  };

  const handleSave   = async () => { try { setModalLoading(true); await roleService.create(form); setIsOpen(false); fetchAll(); } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); } finally { setModalLoading(false); } };
  const handleUpdate = async () => { if (!selected) return; try { setModalLoading(true); await roleService.update(selected.id, form); setIsOpen(false); fetchAll(); } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); } finally { setModalLoading(false); } };
  const handleDelete = async () => { if (!selected) return; try { setModalLoading(true); await roleService.delete(selected.id); setIsOpen(false); fetchAll(); } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); } finally { setModalLoading(false); } };

  const handleTogglePermission = async (permId: number, isChecked: boolean) => {
    if (!selected) return;
    try {
      if (isChecked) {
        await roleService.assignPermission(selected.id, permId);
        setRolePermIds(prev => new Set(prev).add(permId));
      } else {
        await roleService.removePermission(selected.id, permId);
        setRolePermIds(prev => {
          const next = new Set(prev);
          next.delete(permId);
          return next;
        });
      }
    } catch (e: any) {
      alert("Gagal: " + (e.response?.data?.message || e.message));
      // Revert on error
      if (isChecked) {
        setRolePermIds(prev => {
          const next = new Set(prev);
          next.delete(permId);
          return next;
        });
      } else {
        setRolePermIds(prev => new Set(prev).add(permId));
      }
    }
  };

  const filtered = roles.filter(r => (r.name ?? "").toLowerCase().includes(search.toLowerCase()));

  const renderForm = () => (
    <>
      <div>
        <Label>Nama Role</Label>
        <Input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Contoh: admin, superadmin" />
      </div>
      <div>
        <Label>Deskripsi</Label>
        <Input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Deskripsi role (opsional)" />
      </div>

      {mode === "edit" && (
        <>
          <hr className="border-gray-200 dark:border-gray-700 my-4" />
          <div>
            <Label className="mb-3 block">Permissions</Label>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {modules.map(module => {
                const modulePerms = permissions.filter(p => p.module_id === module.id);
                if (modulePerms.length === 0) return null;
                return (
                  <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">{module.label || module.name}</h4>
                    <div className="space-y-2">
                      {modulePerms.map(perm => (
                        <label key={perm.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-1.5 rounded">
                          <input
                            type="checkbox"
                            checked={rolePermIds.has(perm.id)}
                            onChange={e => handleTogglePermission(perm.id, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{perm.name}</span>
                          {perm.description && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">- {perm.description}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
              {permissions.filter(p => !p.module_id).length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">Tanpa Modul</h4>
                  <div className="space-y-2">
                    {permissions.filter(p => !p.module_id).map(perm => (
                      <label key={perm.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-1.5 rounded">
                        <input
                          type="checkbox"
                          checked={rolePermIds.has(perm.id)}
                          onChange={e => handleTogglePermission(perm.id, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{perm.name}</span>
                        {perm.description && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">- {perm.description}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">Total {rolePermIds.size} permission dipilih</p>
          </div>
        </>
      )}
    </>
  );

  const renderView = () => (
    <>
      <div><Label>Nama Role</Label><p className="text-sm text-gray-800 dark:text-white mt-1">{selected?.name}</p></div>
      <div><Label>Deskripsi</Label><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selected?.description || "—"}</p></div>
      <div>
        <Label>Permissions</Label>
        <div className="space-y-3 mt-2 max-h-96 overflow-y-auto">
          {modules.map(module => {
            const modulePerms = permissions.filter(p => p.module_id === module.id && rolePermIds.has(p.id));
            if (modulePerms.length === 0) return null;
            return (
              <div key={module.id}>
                <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{module.label || module.name}</h5>
                <div className="flex flex-wrap gap-1.5">
                  {modulePerms.map(p => (
                    <Badge key={p.id} color="primary" variant="light" size="sm">{p.name}</Badge>
                  ))}
                </div>
              </div>
            );
          })}
          {permissions.filter(p => !p.module_id && rolePermIds.has(p.id)).length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Tanpa Modul</h5>
              <div className="flex flex-wrap gap-1.5">
                {permissions.filter(p => !p.module_id && rolePermIds.has(p.id)).map(p => (
                  <Badge key={p.id} color="primary" variant="light" size="sm">{p.name}</Badge>
                ))}
              </div>
            </div>
          )}
          {rolePermIds.size === 0 && <span className="text-xs text-gray-400">Belum ada permission</span>}
        </div>
      </div>
    </>
  );

  const getTitle = () => ({ view: "Detail Role", create: "Tambah Role Baru", edit: "Edit Role", delete: "Hapus Role" }[mode]);

  return (
    <>
      <PageMeta title="Manajemen Roles" description="Kelola role dan permission" />
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Manajemen Roles" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Kelola role dan assign permission</p>
          {can("role.create") && (
          <Button onClick={() => openModal("create")} className="bg-brand-500 text-white hover:bg-brand-600">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Tambah Role
            </span>
          </Button>
          )}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Cari nama role..." />
        <DataTable loading={loading} headers={["No", "Nama Role", "Deskripsi", "Aksi"]} empty={filtered.length === 0} emptyText="Belum ada role">
          {filtered.map((r, i) => (
            <TableRow key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
              <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-200">{i + 1}</TableCell>
              <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white">{r.name}</TableCell>
              <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{r.description || "—"}</TableCell>
              <TableCell className="py-4 px-4"><ActionButtons onView={() => openModal("view", r)} onEdit={can("role.update") ? () => openModal("edit", r) : undefined} onDelete={can("role.delete") ? () => openModal("delete", r) : undefined} /></TableCell>
            </TableRow>
          ))}
        </DataTable>
      </div>
      <CrudModal isOpen={isOpen} onClose={() => setIsOpen(false)} mode={mode} title={getTitle()} loading={modalLoading}
        onSave={handleSave} onUpdate={handleUpdate} onDelete={handleDelete} deleteLabel={`role "${selected?.name}"`}>
        {mode === "view" ? renderView() : mode === "delete" ? null : renderForm()}
      </CrudModal>
    </>
  );
}
