import { useState, useEffect } from "react";
import { Modal as BaseModal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import type { CaborEntry } from "../pages/MainPage";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "view" | "add" | "edit";
  entry: CaborEntry;
  onSave: (updated: CaborEntry) => Promise<void>;
}

export default function CaborEntryModal({ isOpen, onClose, mode, entry, onSave }: Props) {
  const [form, setForm]       = useState<CaborEntry>(entry);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (isOpen) {
      setForm(entry);
      setError("");
    }
  }, [isOpen, entry]);

  const isView = mode === "view";

  const setNum = (field: "putra" | "putri" | "pelatih", val: string) => {
    const n = Math.max(0, parseInt(val) || 0);
    setForm(prev => {
      const updated = { ...prev, [field]: n };
      updated.total_atlet    = updated.putra + updated.putri;
      updated.total_personel = updated.total_atlet + updated.pelatih;
      return updated;
    });
  };

  const validate = (): string => {
    if (form.putra < 0 || form.putri < 0 || form.pelatih < 0)
      return "Jumlah tidak boleh negatif";
    if (form.max_putra > 0 && form.putra > form.max_putra)
      return `Putra melebihi kuota maksimal (${form.max_putra})`;
    if (form.max_putri > 0 && form.putri > form.max_putri)
      return `Putri melebihi kuota maksimal (${form.max_putri})`;
    if (form.max_pelatih > 0 && form.pelatih > form.max_pelatih)
      return `Pelatih melebihi kuota maksimal (${form.max_pelatih})`;
    return "";
  };

  const handleSave = async () => {
    const msg = validate();
    if (msg) { setError(msg); return; }
    setLoading(true);
    setError("");
    try {
      await onSave(form);
    } catch (e: any) {
      // Tangkap pesan dari DB trigger atau backend
      setError(e?.message || e?.data?.error || "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "add" ? "Tambah Cabor" : mode === "edit" ? "Edit Kuota" : "Detail Cabor";

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="w-full sm:max-w-sm m-4 p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{form.nama}</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Putra */}
        <div>
          <Label>
            Atlet Putra
            {form.max_putra > 0 && (
              <span className="ml-1 text-xs text-gray-400">(maks {form.max_putra})</span>
            )}
          </Label>
          <Input
            type="number"
            min="0"
            max={form.max_putra > 0 ? String(form.max_putra) : undefined}
            value={form.putra.toString()}
            onChange={e => setNum("putra", e.target.value)}
            disabled={isView || loading}
          />
        </div>

        {/* Putri */}
        <div>
          <Label>
            Atlet Putri
            {form.max_putri > 0 && (
              <span className="ml-1 text-xs text-gray-400">(maks {form.max_putri})</span>
            )}
          </Label>
          <Input
            type="number"
            min="0"
            max={form.max_putri > 0 ? String(form.max_putri) : undefined}
            value={form.putri.toString()}
            onChange={e => setNum("putri", e.target.value)}
            disabled={isView || loading}
          />
        </div>

        {/* Pelatih */}
        <div>
          <Label>
            Pelatih
            {form.max_pelatih > 0 && (
              <span className="ml-1 text-xs text-gray-400">(maks {form.max_pelatih})</span>
            )}
          </Label>
          <Input
            type="number"
            min="0"
            max={form.max_pelatih > 0 ? String(form.max_pelatih) : undefined}
            value={form.pelatih.toString()}
            onChange={e => setNum("pelatih", e.target.value)}
            disabled={isView || loading}
          />
        </div>

        {/* Ringkasan */}
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-4 py-3 flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Total Atlet</span>
          <span className="font-bold text-gray-800 dark:text-white">{form.total_atlet}</span>
        </div>
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-4 py-3 flex justify-between text-sm -mt-2">
          <span className="text-gray-500 dark:text-gray-400">Total Personel</span>
          <span className="font-bold text-gray-800 dark:text-white">{form.total_personel}</span>
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-6">
        {!isView && (
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        )}
      </div>
    </BaseModal>
  );
}
