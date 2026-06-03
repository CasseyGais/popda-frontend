import { useState, useEffect } from "react";

import PageMeta from "../../../components/common/PageMeta";

import PageBreadcrumb from "../../../components/common/PageBreadCrumb";

import Button from "../../../components/ui/button/Button";

import Input from "../../../components/form/input/InputField";

import Label from "../../../components/form/Label";

import Badge from "../../../components/ui/badge/Badge";

import { TableCell, TableRow } from "../../../components/ui/table";

import CrudModal, { ModalMode } from "../components/CrudModal";

import { moduleService, Module, ModulePayload } from "../service";

import { SearchInput, DataTable, ActionButtons } from "./UsersPage";



const EMPTY_FORM: ModulePayload = { name: "", label: "", code: "", url: "" };



export default function ModulesPage() {

  const [modules, setModules]         = useState<Module[]>([]);

  const [loading, setLoading]         = useState(true);

  const [modalLoading, setModalLoading] = useState(false);

  const [search, setSearch]           = useState("");

  const [isOpen, setIsOpen]           = useState(false);

  const [mode, setMode]               = useState<ModalMode>("create");

  const [selected, setSelected]       = useState<Module | null>(null);

  const [form, setForm]               = useState<ModulePayload>(EMPTY_FORM);



  useEffect(() => { fetchAll(); }, []);



  const fetchAll = async () => {

    try { setLoading(true); const res = await moduleService.getAll(); setModules(res.data || []); }

    catch (e) { console.error(e); }

    finally { setLoading(false); }

  };



  const openModal = (m: ModalMode, mod?: Module) => {

    setMode(m);

    setSelected(mod || null);

    setForm(mod

      ? { name: mod.name, label: mod.label, code: mod.code, url: mod.url || "" }

      : EMPTY_FORM

    );

    setIsOpen(true);

  };



  const handleSave   = async () => { try { setModalLoading(true); await moduleService.create(form); setIsOpen(false); fetchAll(); } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); } finally { setModalLoading(false); } };

  const handleUpdate = async () => { if (!selected) return; try { setModalLoading(true); await moduleService.update(selected.id, form); setIsOpen(false); fetchAll(); } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); } finally { setModalLoading(false); } };

  const handleDelete = async () => { if (!selected) return; try { setModalLoading(true); await moduleService.delete(selected.id); setIsOpen(false); fetchAll(); } catch (e: any) { alert("Gagal: " + (e.response?.data?.message || e.message)); } finally { setModalLoading(false); } };



  const filtered = modules.filter(m =>

    (m.name ?? "").toLowerCase().includes(search.toLowerCase()) ||

    (m.label ?? "").toLowerCase().includes(search.toLowerCase()) ||

    (m.code ?? "").toLowerCase().includes(search.toLowerCase())

  );



  const renderForm = () => (

    <>

      <div>

        <Label>Nama <span className="text-red-500">*</span></Label>

        <Input type="text" value={form.name}

          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}

          placeholder="Contoh: cabor, atlet, dashboard" />

        <p className="mt-1 text-xs text-gray-400">Huruf kecil, tanpa spasi</p>

      </div>

      <div>

        <Label>Label <span className="text-red-500">*</span></Label>

        <Input type="text" value={form.label}

          onChange={e => setForm(p => ({ ...p, label: e.target.value }))}

          placeholder="Contoh: Cabor, Atlet, Dashboard" />

        <p className="mt-1 text-xs text-gray-400">Nama tampilan di UI</p>

      </div>

      <div>

        <Label>Code <span className="text-red-500">*</span></Label>

        <Input type="text" value={form.code}

          onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}

          placeholder="Contoh: CABOR, ATLET, DASHBOARD" />

        <p className="mt-1 text-xs text-gray-400">Huruf besar, unik</p>

      </div>

      <div>

        <Label>URL</Label>

        <Input type="text" value={form.url || ""}

          onChange={e => setForm(p => ({ ...p, url: e.target.value }))}

          placeholder="Contoh: /master/cabor, /admin/atlet" />

        <p className="mt-1 text-xs text-gray-400">Path URL frontend (opsional)</p>

      </div>

    </>

  );



  const renderView = () => (

    <>

      <div>

        <Label>Code</Label>

        <div className="mt-1">

          <Badge color="primary" variant="solid" size="sm">{selected?.code}</Badge>

        </div>

      </div>

      <div>

        <Label>Label</Label>

        <p className="text-sm font-medium text-gray-800 dark:text-white mt-1">{selected?.label}</p>

      </div>

      <div>

        <Label>Name</Label>

        <code className="block mt-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-lg">

          {selected?.name}

        </code>

      </div>

      <div>

        <Label>URL</Label>

        <code className="block mt-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-2 rounded-lg">

          {selected?.url || "—"}

        </code>

      </div>

      <div>

        <Label>Dibuat</Label>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">

          {selected && new Date(selected.created_at).toLocaleDateString("id-ID", {

            day: "numeric", month: "long", year: "numeric",

          })}

        </p>

      </div>

    </>

  );



  const getTitle = () => ({ view: "Detail Modul", create: "Tambah Modul", edit: "Edit Modul", delete: "Hapus Modul" }[mode]);



  return (

    <>

      <PageMeta title="Manajemen Modules" description="Kelola modul sistem" />

      <div className="space-y-6">

        <PageBreadcrumb pageTitle="Manajemen Modules" />



        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <p className="text-sm text-gray-500 dark:text-gray-400">

            Total <strong>{modules.length}</strong> modul terdaftar

          </p>

          <Button onClick={() => openModal("create")} className="bg-brand-500 text-white hover:bg-brand-600">

            <span className="flex items-center gap-2">

              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />

              </svg>

              Tambah Modul

            </span>

          </Button>

        </div>



        <SearchInput value={search} onChange={setSearch} placeholder="Cari nama, label, atau code modul..." />



        <DataTable

          loading={loading}

          headers={["No", "Code", "Label", "Name", "URL", "Aksi"]}

          empty={filtered.length === 0}

          emptyText="Belum ada modul"

        >

          {filtered.map((m, i) => (

            <TableRow key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">

              <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{i + 1}</TableCell>

              <TableCell className="px-5 py-4">

                <Badge color="primary" variant="light" size="sm">{m.code}</Badge>

              </TableCell>

              <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white">{m.label}</TableCell>

              <TableCell className="px-5 py-4">

                <code className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">

                  {m.name}

                </code>

              </TableCell>

              <TableCell className="px-5 py-4">

                <code className="text-xs text-gray-400 dark:text-gray-500">{m.url || "—"}</code>

              </TableCell>

              <TableCell className="py-4 px-4">

                <ActionButtons

                  onView={() => openModal("view", m)}

                  onEdit={() => openModal("edit", m)}

                  onDelete={() => openModal("delete", m)}

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

        deleteLabel={`modul "${selected?.label}"`}

      >

        {mode === "view" ? renderView() : mode === "delete" ? null : renderForm()}

      </CrudModal>

    </>

  );

}

