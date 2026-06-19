/**
 * AtletSisiInput
 * Komponen untuk memilih atlet per sisi (A atau B) dari dropdown atlet terdaftar.
 * Sumber data: GET /dropdown/atlet?kontingen_id=X&cabor_id=X&nomor_id=X
 * (hanya atlet yang sudah trx_pendaftaran_atlet untuk cabor+nomor itu)
 *
 * Urutan item di array menentukan urutan dalam tim (index 0 = urutan 1).
 */

import type { AtletTerdaftarDropdownItem } from "../service";

interface Props {
  label: string;
  value: number[];                          // array atlet_id yang dipilih (urutan = urutan bertanding)
  onChange: (ids: number[]) => void;
  atletList: AtletTerdaftarDropdownItem[];  // dari GET /dropdown/atlet
  disabled?: boolean;
  loading?: boolean;
}

export default function AtletSisiInput({ label, value, onChange, atletList, disabled, loading }: Props) {
  const addSlot  = () => onChange([...value, 0]);

  const updateAt = (idx: number, atletId: number) => {
    const next = [...value];
    next[idx] = atletId;
    onChange(next);
  };

  const removeAt = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  // Atlet yang sudah dipilih di sisi ini — cegah duplikat
  const selectedSet = new Set(value.filter(id => id !== 0));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>

      {loading && (
        <p className="text-xs text-gray-400 italic">Memuat atlet...</p>
      )}

      {!loading && value.length === 0 && (
        <p className="text-xs text-gray-400 italic">
          Kosong — cukup kontingen (beregu)
        </p>
      )}

      {value.map((atletId, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-4 shrink-0">{idx + 1}.</span>
          <select
            value={atletId || ""}
            onChange={e => updateAt(idx, Number(e.target.value))}
            disabled={disabled || loading}
            className="flex-1 h-9 rounded-lg border border-gray-300 bg-transparent px-2 text-sm text-gray-800 dark:border-gray-700 dark:text-white dark:bg-gray-900 disabled:opacity-50"
          >
            <option value="">-- Pilih Atlet --</option>
            {atletList.length === 0 && (
              <option disabled value="">Tidak ada atlet terdaftar untuk nomor ini</option>
            )}
            {atletList.map(a => (
              <option
                key={a.atlet_id}
                value={a.atlet_id}
                disabled={selectedSet.has(a.atlet_id) && a.atlet_id !== atletId}
              >
                {a.nama_lengkap} ({a.nama_kontingen})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => removeAt(idx)}
            className="shrink-0 p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
            title="Hapus"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addSlot}
        disabled={disabled || loading}
        className="inline-flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Tambah Atlet
      </button>

      {disabled && !loading && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Pilih cabor, nomor, dan kontingen terlebih dahulu
        </p>
      )}
      {!disabled && !loading && atletList.length === 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Tidak ada atlet dari kontingen ini yang terdaftar di nomor ini
        </p>
      )}
    </div>
  );
}
