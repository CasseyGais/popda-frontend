import { useState, useEffect } from "react";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Badge from "../../../components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../../components/ui/table";
import { EyeIcon, PencilIcon, TrashBinIcon } from "../../../icons";
import CrudModal, { ModalMode } from "../components/CrudModal";
import { userService, roleService, territoryService, User, Role, Territory } from "../service";
import { useAuth } from "../../../context/AuthContext";
import { sha256 } from "../../../utils/test-credentials";

const EMPTY_FORM = { name: "", email: "", password: "", is_active: true };

export default function UsersPage() {
  const { can } = useAuth();
  const [users, setUsers]           = useState<User[]>([]);
  const [roles, setRoles]           = useState<Role[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [search, setSearch]         = useState("");
  const [isOpen, setIsOpen]         = useState(false);
  const [mode, setMode]             = useState<ModalMode>("create");
  const [selected, setSelected]     = useState<User | null>(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleId, setSelectedRoleId]           = useState<number | "">("");
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<number | "">("");
  const [userRoles, setUserRoles]           = useState<Role[]>([]);
  const [userTerritories, setUserTerritories] = useState<Territory[]>([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [uRes, rRes, tRes] = await Promise.all([
        userService.getAll(),
        roleService.getAll(),
        territoryService.getAll(),
      ]);
      setUsers(uRes.data || []);
      setRoles(rRes.data || []);
      setTerritories(tRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openModal = async (m: ModalMode, user?: User) => {
    setMode(m);
    setSelected(user || null);
    setUserRoles([]);
    setUserTerritories([]);
    setSelectedRoleId("");
    setSelectedTerritoryId("");
    setShowPassword(false);

    if (m === "create") {
      setForm(EMPTY_FORM);
    } else if (user) {
      setForm({ name: user.name, email: user.email, password: "", is_active: user.is_active });
      // API returns array of IDs — resolve to objects from master lists
      try {
        const [rRes, tRes] = await Promise.all([
          userService.getRoleIds(user.id),
          userService.getTerritoryIds(user.id),
        ]);
        const roleIds: number[] = Array.isArray(rRes.data) ? rRes.data : [];
        const terrIds: number[] = Array.isArray(tRes.data) ? tRes.data : [];
        setUserRoles(roles.filter(r => roleIds.includes(r.id)));
        setUserTerritories(territories.filter(t => terrIds.includes(t.id)));
      } catch {}
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      setModalLoading(true);
      const hashedPassword = await sha256(form.password);
      // 1. Buat user dulu
      const createRes = await userService.create({ name: form.name, email: form.email, password: hashedPassword });
      const newUserId: number = createRes?.data?.id ?? createRes?.id;

      // 2. Assign role & territory jika dipilih (paralel)
      if (newUserId) {
        const tasks: Promise<any>[] = [];
        if (selectedRoleId)      tasks.push(userService.assignRole(newUserId, Number(selectedRoleId)));
        if (selectedTerritoryId) tasks.push(userService.assignTerritory(newUserId, Number(selectedTerritoryId)));
        if (tasks.length) await Promise.all(tasks);
      }

      setIsOpen(false);
      fetchAll();
    } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); }
    finally { setModalLoading(false); }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      setModalLoading(true);
      const payload: any = { name: form.name, email: form.email, is_active: form.is_active };
      if (form.password) {
        payload.password = await sha256(form.password);
      }
      await userService.update(selected.id, payload);
      setIsOpen(false);
      fetchAll();
    } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); }
    finally { setModalLoading(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      setModalLoading(true);
      await userService.delete(selected.id);
      setIsOpen(false);
      fetchAll();
    } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); }
    finally { setModalLoading(false); }
  };

  const handleAssignRole = async () => {
    if (!selected || !selectedRoleId) return;
    try {
      await userService.assignRole(selected.id, Number(selectedRoleId));
      const rRes = await userService.getRoleIds(selected.id);
      const roleIds: number[] = Array.isArray(rRes.data) ? rRes.data : [];
      setUserRoles(roles.filter(r => roleIds.includes(r.id)));
      setSelectedRoleId("");
    } catch (e: any) { alert("Gagal assign role: " + (e.response?.data?.message || e.message)); }
  };

  const handleRemoveRole = async (roleId: number) => {
    if (!selected) return;
    try {
      await userService.removeRole(selected.id, roleId);
      setUserRoles(prev => prev.filter(r => r.id !== roleId));
    } catch (e: any) { alert("Gagal hapus role: " + (e.response?.data?.message || e.message)); }
  };

  const handleAssignTerritory = async () => {
    if (!selected || !selectedTerritoryId) return;
    try {
      await userService.assignTerritory(selected.id, Number(selectedTerritoryId));
      const tRes = await userService.getTerritoryIds(selected.id);
      const terrIds: number[] = Array.isArray(tRes.data) ? tRes.data : [];
      setUserTerritories(territories.filter(t => terrIds.includes(t.id)));
      setSelectedTerritoryId("");
    } catch (e: any) { alert("Gagal assign territory: " + (e.response?.data?.message || e.message)); }
  };

  const handleRemoveTerritory = async (tId: number) => {
    if (!selected) return;
    try {
      await userService.removeTerritory(selected.id, tId);
      setUserTerritories(prev => prev.filter(t => t.id !== tId));
    } catch (e: any) { alert("Gagal hapus territory: " + (e.response?.data?.message || e.message)); }
  };

  const filtered = users.filter(u =>
    (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const renderForm = () => (
    <>
      <div>
        <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
        <Input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nama user" />
      </div>
      <div>
        <Label>Email <span className="text-red-500">*</span></Label>
        <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@domain.com" />
      </div>
      <div>
        <Label>{mode === "create" ? "Password *" : "Password Baru (kosongkan jika tidak diubah)"}</Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            placeholder="Min. 6 karakter"
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              /* Eye-off */
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.477 10.477A3 3 0 0013.52 13.52M6.343 6.343A9.953 9.953 0 002.458 12C3.732 15.943 7.523 18.75 12 18.75c1.761 0 3.41-.477 4.83-1.308M9.75 4.757A9.956 9.956 0 0112 4.5c4.477 0 8.268 2.557 9.542 6.5a9.978 9.978 0 01-1.965 3.286" />
              </svg>
            ) : (
              /* Eye */
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5.25 12 5.25c4.477 0 8.268 2.693 9.542 6.75-1.274 4.057-5.065 6.75-9.542 6.75-4.477 0-8.268-2.693-9.542-6.75z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">Password akan di-hash SHA-256 sebelum dikirim ke server.</p>
      </div>
      {mode === "edit" && (
        <div className="flex items-center gap-3">
          <input type="checkbox" id="is_active" checked={form.is_active}
            onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300 text-brand-500" />
          <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">Aktif</label>
        </div>
      )}

      {/* ── Role & Territory — tampil di create (sekali pilih) dan edit (assign/remove) ── */}
      <hr className="border-gray-200 dark:border-gray-700" />

      {mode === "create" ? (
        /* Form create: dropdown langsung pilih, di-assign saat Simpan */
        <>
          <div>
            <Label>Role <span className="text-gray-400 font-normal">(opsional)</span></Label>
            <select
              value={selectedRoleId}
              onChange={e => setSelectedRoleId(Number(e.target.value) || "")}
              className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900"
            >
              <option value="">-- Pilih Role --</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Territory <span className="text-gray-400 font-normal">(opsional)</span></Label>
            <select
              value={selectedTerritoryId}
              onChange={e => setSelectedTerritoryId(Number(e.target.value) || "")}
              className="w-full h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900"
            >
              <option value="">-- Pilih Territory --</option>
              {territories.map(t => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
            </select>
          </div>
        </>
      ) : (
        /* Form edit: assign/remove secara live */
        <>
          <div>
            <Label>Role</Label>
            <div className="flex gap-2 mb-2">
              <select value={selectedRoleId} onChange={e => setSelectedRoleId(Number(e.target.value) || "")}
                className="flex-1 h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900">
                <option value="">-- Pilih Role --</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <Button size="sm" onClick={handleAssignRole} disabled={!selectedRoleId}>Assign</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {userRoles.map(r => (
                <span key={r.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                  {r.name}<button onClick={() => handleRemoveRole(r.id)} className="hover:text-red-500 ml-1">×</button>
                </span>
              ))}
              {userRoles.length === 0 && <span className="text-xs text-gray-400">Belum ada role</span>}
            </div>
          </div>
          <div>
            <Label>Territory</Label>
            <div className="flex gap-2 mb-2">
              <select value={selectedTerritoryId} onChange={e => setSelectedTerritoryId(Number(e.target.value) || "")}
                className="flex-1 h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900">
                <option value="">-- Pilih Territory --</option>
                {territories.map(t => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
              </select>
              <Button size="sm" onClick={handleAssignTerritory} disabled={!selectedTerritoryId}>Assign</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {userTerritories.map(t => (
                <span key={t.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                  {t.name}<button onClick={() => handleRemoveTerritory(t.id)} className="hover:text-red-500 ml-1">×</button>
                </span>
              ))}
              {userTerritories.length === 0 && <span className="text-xs text-gray-400">Belum ada territory</span>}
            </div>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
            Setelah mengubah role/territory, user perlu login ulang agar perubahan berlaku.
          </p>
        </>
      )}
    </>
  );

  const renderView = () => (
    <>
      <div><Label>Nama</Label><p className="text-sm text-gray-800 dark:text-white mt-1">{selected?.name}</p></div>
      <div><Label>Email</Label><p className="text-sm text-gray-800 dark:text-white mt-1">{selected?.email}</p></div>
      <div><Label>Status</Label>
        <div className="mt-1">
          <Badge color={selected?.is_active ? "success" : "error"} variant="light">
            {selected?.is_active ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      </div>
      <div><Label>Role</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {userRoles.length > 0 ? userRoles.map(r => (
            <Badge key={r.id} color="primary" variant="light">{r.name}</Badge>
          )) : <span className="text-xs text-gray-400">Belum ada role</span>}
        </div>
      </div>
      <div><Label>Territory</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {userTerritories.length > 0 ? userTerritories.map(t => (
            <Badge key={t.id} color="light" variant="light">{t.name} <span className="opacity-60">({t.type})</span></Badge>
          )) : <span className="text-xs text-gray-400">Belum ada territory</span>}
        </div>
      </div>
      <div><Label>Dibuat</Label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {selected?.created_at ? new Date(selected.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"}
        </p>
      </div>
    </>
  );

  const getTitle = () => ({ view: "Detail User", create: "Tambah User Baru", edit: "Edit User", delete: "Hapus User" }[mode]);

  return (
    <>
      <PageMeta title="Manajemen Users" description="Kelola data user sistem" />
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Manajemen Users" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Kelola akun user dan hak akses</p>
          {can("user.create") && (
          <Button onClick={() => openModal("create")} className="bg-brand-500 text-white hover:bg-brand-600">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah User
            </span>
          </Button>
          )}
        </div>

        <SearchInput value={search} onChange={setSearch} placeholder="Cari nama atau email..." />

        <DataTable
          loading={loading}
          headers={["No", "Nama", "Email", "Status", "Aksi"]}
          empty={filtered.length === 0}
          emptyText={search ? "Tidak ada user ditemukan" : "Belum ada user"}
        >
          {filtered.map((u, i) => (
            <TableRow key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
              <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-200">{i + 1}</TableCell>
              <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white">{u.name}</TableCell>
              <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{u.email}</TableCell>
              <TableCell className="px-5 py-4">
                <Badge color={u.is_active ? "success" : "error"} variant="light" size="sm">
                  {u.is_active ? "Aktif" : "Nonaktif"}
                </Badge>
              </TableCell>
              <TableCell className="py-4 px-4">
                <ActionButtons
                  onView={() => openModal("view", u)}
                  onEdit={can("user.update") ? () => openModal("edit", u) : undefined}
                  onDelete={can("user.delete") ? () => openModal("delete", u) : undefined}
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
        deleteLabel={`user "${selected?.name}"`}
      >
        {mode === "view" ? renderView() : mode === "delete" ? null : renderForm()}
      </CrudModal>
    </>
  );
}

/* ── Shared sub-components ─────────────────────────────── */
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <svg className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500" width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="currentColor" />
        </svg>
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 shadow-theme-xs focus:outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
      />
    </div>
  );
}

export function DataTable({ loading, headers, empty, emptyText, children }: {
  loading: boolean; headers: string[]; empty: boolean; emptyText?: string; children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-900/80">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50">
            <TableRow>
              {headers.map(h => (
                <TableCell
                  key={h}
                  isHeader
                  className={`px-5 py-4 font-bold text-gray-900 text-sm dark:text-white tracking-wide ${
                    h === "Aksi" ? "text-center" : "text-start"
                  }`}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-700/50 bg-gray-50/90 dark:bg-gray-900/80">
            {loading ? (
              <TableRow>
                <TableCell colSpan={headers.length} className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
                    <span className="text-gray-500 dark:text-gray-400">Memuat data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : empty ? (
              <TableRow>
                <TableCell colSpan={headers.length} className="px-6 py-8 text-center">
                  <span className="text-gray-500 dark:text-gray-400">{emptyText || "Tidak ada data"}</span>
                </TableCell>
              </TableRow>
            ) : children}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function ActionButtons({ onView, onEdit, onDelete }: { onView?: () => void; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center justify-center gap-2.5">
      {onView && (
        <button onClick={onView} className="p-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200/70 dark:border-blue-800/40" title="Lihat">
          <EyeIcon className="w-4 h-4 fill-current" />
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} className="p-2.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors border border-green-200/70 dark:border-green-800/40" title="Edit">
          <PencilIcon className="w-4 h-4 fill-current" />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-red-200/70 dark:border-red-800/40" title="Hapus">
          <TrashBinIcon className="w-4 h-4 fill-current" />
        </button>
      )}
    </div>
  );
}
