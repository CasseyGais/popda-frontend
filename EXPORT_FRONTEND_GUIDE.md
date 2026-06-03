# Export PDF & Excel — Panduan Integrasi Frontend

> **Base URL:** `http://localhost:8000`  
> **Auth:** Semua endpoint wajib kirim header `Authorization: Bearer <token>`  
> **Response sukses:** File binary (bukan JSON)  
> **Response error:** JSON `{ "success": false, "message": "..." }`

---

## Daftar Isi

1. [Ringkasan Endpoint](#1-ringkasan-endpoint)
2. [Tahap 1 — Entry By Sport](#2-tahap-1--entry-by-sport)
3. [Tahap 2 — Entry By Number](#3-tahap-2--entry-by-number)
4. [Tahap 3 — Entry By Name](#4-tahap-3--entry-by-name)
5. [Aturan Superadmin](#5-aturan-superadmin)
6. [Isi File yang Dihasilkan](#6-isi-file-yang-dihasilkan)
7. [Implementasi Frontend](#7-implementasi-frontend)
8. [Error Handling](#8-error-handling)

---

## 1. Ringkasan Endpoint

### Tahap 1

| Method | URL | Format | Keterangan |
|---|---|---|---|
| `GET` | `/admin/tahap1/export/pdf` | PDF | Rekap cabang olahraga terdaftar |
| `GET` | `/admin/tahap1/export/excel` | XLSX | Rekap cabang olahraga terdaftar |

### Tahap 2

| Method | URL | Format | Keterangan |
|---|---|---|---|
| `GET` | `/admin/tahap2/export/pdf` | PDF | Daftar nomor pertandingan terdaftar |
| `GET` | `/admin/tahap2/export/excel` | XLSX | Daftar nomor pertandingan terdaftar |

### Tahap 3

| Method | URL | Format | Keterangan |
|---|---|---|---|
| `GET` | `/admin/tahap3/export/pdf` | PDF | Semua: atlet + pelatih + official (3 halaman) |
| `GET` | `/admin/tahap3/export/excel` | XLSX | 3 sheet: Atlet, Pelatih, Official |
| `GET` | `/admin/tahap3/export/atlet/pdf` | PDF | Hanya data atlet |
| `GET` | `/admin/tahap3/export/atlet/excel` | XLSX | Hanya data atlet |
| `GET` | `/admin/tahap3/export/pelatih/pdf` | PDF | Hanya data pelatih |
| `GET` | `/admin/tahap3/export/pelatih/excel` | XLSX | Hanya data pelatih |
| `GET` | `/admin/tahap3/export/official/pdf` | PDF | Hanya data official |
| `GET` | `/admin/tahap3/export/official/excel` | XLSX | Hanya data official |

> Semua endpoint memerlukan autentikasi. Superadmin wajib tambahkan `?territory_id=X`.

---

## 2. Tahap 1 — Entry By Sport

### `GET /admin/tahap1/export/pdf`

```
GET /admin/tahap1/export/pdf
Authorization: Bearer <token>

# Superadmin:
GET /admin/tahap1/export/pdf?territory_id=2
```

**Response sukses:**
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="tahap1_Kab_Tangerang_2026-06-03.pdf"
Cache-Control: no-store
```

---

### `GET /admin/tahap1/export/excel`

```
GET /admin/tahap1/export/excel
Authorization: Bearer <token>
```

**Response sukses:**
```
HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="tahap1_Kab_Tangerang_2026-06-03.xlsx"
Cache-Control: no-store
```

---

## 3. Tahap 2 — Entry By Number

> **Syarat:** Tahap 1 harus sudah `SUBMITTED`. Jika belum, backend kembalikan `400`.

### `GET /admin/tahap2/export/pdf`

```
GET /admin/tahap2/export/pdf
Authorization: Bearer <token>

# Superadmin:
GET /admin/tahap2/export/pdf?territory_id=2
```

---

### `GET /admin/tahap2/export/excel`

```
GET /admin/tahap2/export/excel
Authorization: Bearer <token>
```

---

## 4. Tahap 3 — Entry By Name

### Export Gabungan (Rekomendasi)

```
GET /admin/tahap3/export/pdf
GET /admin/tahap3/export/excel
Authorization: Bearer <token>

# Superadmin:
GET /admin/tahap3/export/pdf?territory_id=2
```

PDF gabungan berisi **3 halaman** (atlet → pelatih → official).  
Excel gabungan berisi **3 sheet** (`Atlet`, `Pelatih`, `Official`).

---

### Export Per Sub-Data (Opsional)

Gunakan jika halaman hanya menampilkan salah satu sub-data:

```
GET /admin/tahap3/export/atlet/pdf
GET /admin/tahap3/export/atlet/excel
GET /admin/tahap3/export/pelatih/pdf
GET /admin/tahap3/export/pelatih/excel
GET /admin/tahap3/export/official/pdf
GET /admin/tahap3/export/official/excel
```

---

## 5. Aturan Superadmin

Admin biasa tidak perlu kirim query param apapun — kontingen sudah terikat ke token JWT.

Superadmin **wajib** kirim `?territory_id=X` di semua endpoint export:

```
GET /admin/tahap1/export/pdf?territory_id=3
GET /admin/tahap2/export/excel?territory_id=3
GET /admin/tahap3/export/pdf?territory_id=3
```

Jika superadmin lupa kirim `territory_id`:
```json
{ "success": false, "message": "Superadmin wajib kirim query parameter territory_id" }
```

---

## 6. Isi File yang Dihasilkan

### Tahap 1 — PDF & Excel

**Header dokumen:** Judul REKAP ENTRY BY SPORT, nama kontingen, tanggal cetak, status (DRAFT/SUBMITTED)

**Kolom tabel:**

| No | Cabang Olahraga | Atlet Putra | Atlet Putri | Pelatih | Total Atlet | Total Personel |
|---|---|---|---|---|---|---|

**Baris total** di bawah tabel.

---

### Tahap 2 — PDF & Excel

**Header dokumen:** Judul REKAP ENTRY BY NUMBER, nama kontingen, tanggal cetak, status

**Kolom tabel:**

| No | Cabang Olahraga | Nomor Pertandingan | Jenis Kelamin | Tipe |
|---|---|---|---|---|

Jenis kelamin ditampilkan sebagai `PUTRA` / `PUTRI`.

**Ringkasan:** Total nomor terdaftar di bawah tabel.

---

### Tahap 3 — PDF

Tiga halaman terpisah dalam satu file:

**Halaman 1 — Atlet**

| No | Nama Lengkap | JK | NISN | Tgl Lahir | Sekolah | Kelas/Jurusan | Kab/Kota |
|---|---|---|---|---|---|---|---|

**Halaman 2 — Pelatih**

| No | Nama Lengkap | JK | Tgl Lahir | Jabatan | No. HP | Email | Kab/Kota |
|---|---|---|---|---|---|---|---|

**Halaman 3 — Official**

| No | Nama Lengkap | JK | Tgl Lahir | Jabatan | No. HP | Email | Kab/Kota |
|---|---|---|---|---|---|---|---|

---

### Tahap 3 — Excel

Tiga sheet dalam satu file `.xlsx`:

**Sheet "Atlet":** No, Nama Lengkap, JK, Tanggal Lahir, NISN, Sekolah, Kelas/Jurusan, Kab/Kota, No. HP

**Sheet "Pelatih":** No, Nama Lengkap, JK, Tanggal Lahir, NIK, Jabatan, No. HP, Email, Kab/Kota

**Sheet "Official":** No, Nama Lengkap, JK, Tanggal Lahir, NIK, Jabatan, No. HP, Email, Kab/Kota

---

### Konvensi Nama File

```
<prefix>_<nama_kontingen_spasi_jadi_underscore>_<YYYY-MM-DD>.<ext>
```

Contoh:
```
tahap1_Kab_Tangerang_2026-06-03.pdf
tahap2_Kota_Serang_2026-06-03.xlsx
tahap3_Kab_Lebak_2026-06-03.pdf
tahap3_atlet_Kab_Tangerang_2026-06-03.xlsx
tahap3_pelatih_Kota_Tangerang_2026-06-03.pdf
```

---

## 7. Implementasi Frontend

### Utility Function

Buat satu helper untuk semua kebutuhan export:

```typescript
// src/utils/exportHelper.ts

/**
 * Download file dari endpoint export backend.
 * Menggunakan Blob API — tidak perlu library tambahan.
 */
export async function downloadExport(
  url: string,
  token: string,
  filename: string
): Promise<void> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    // Backend mengembalikan JSON saat error
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Export gagal (${res.status})`);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}
```

---

### Contoh Pemakaian — Tahap 1

```typescript
// src/pages/Bysport/MainPage.tsx
import { downloadExport } from "../../../utils/exportHelper";
import { useAuth } from "../../../context/AuthContext";

const { token, user } = useAuth();
const BASE = "http://localhost:8000";

// Untuk superadmin, ambil territory_id dari state/context
// Untuk admin biasa, tidak perlu territory_id
const buildUrl = (path: string) => {
  if (user?.isSuperadmin && territoryId) {
    return `${BASE}${path}?territory_id=${territoryId}`;
  }
  return `${BASE}${path}`;
};

const today = new Date().toISOString().split("T")[0]; // "2026-06-03"
const slug = kontingenName.replace(/ /g, "_");

const handleExportPDF = async () => {
  await downloadExport(
    buildUrl("/admin/tahap1/export/pdf"),
    token!,
    `tahap1_${slug}_${today}.pdf`
  );
};

const handleExportExcel = async () => {
  await downloadExport(
    buildUrl("/admin/tahap1/export/excel"),
    token!,
    `tahap1_${slug}_${today}.xlsx`
  );
};
```

---

### Contoh Pemakaian — Tahap 2

```typescript
const handleExportPDF = async () => {
  await downloadExport(
    buildUrl("/admin/tahap2/export/pdf"),
    token!,
    `tahap2_${slug}_${today}.pdf`
  );
};

const handleExportExcel = async () => {
  await downloadExport(
    buildUrl("/admin/tahap2/export/excel"),
    token!,
    `tahap2_${slug}_${today}.xlsx`
  );
};
```

---

### Contoh Pemakaian — Tahap 3

```typescript
// Export gabungan (semua sub-data)
const handleExportAllPDF = async () => {
  await downloadExport(
    buildUrl("/admin/tahap3/export/pdf"),
    token!,
    `tahap3_${slug}_${today}.pdf`
  );
};

const handleExportAllExcel = async () => {
  await downloadExport(
    buildUrl("/admin/tahap3/export/excel"),
    token!,
    `tahap3_${slug}_${today}.xlsx`
  );
};

// Export per sub-data (jika dibutuhkan)
const handleExportAtletPDF = async () => {
  await downloadExport(
    buildUrl("/admin/tahap3/export/atlet/pdf"),
    token!,
    `tahap3_atlet_${slug}_${today}.pdf`
  );
};

const handleExportPelatihExcel = async () => {
  await downloadExport(
    buildUrl("/admin/tahap3/export/pelatih/excel"),
    token!,
    `tahap3_pelatih_${slug}_${today}.xlsx`
  );
};
```

---

### Tombol Export di UI

Taruh tombol export di header halaman, tampilkan hanya jika ada data:

```tsx
{!loading && hasData && (
  <div className="flex items-center gap-2">
    {/* Tombol PDF */}
    <button
      onClick={handleExportPDF}
      disabled={exporting}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800/40 dark:hover:bg-red-900/20 text-sm font-medium transition-colors disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      {exporting ? "..." : "PDF"}
    </button>

    {/* Tombol Excel */}
    <button
      onClick={handleExportExcel}
      disabled={exporting}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800/40 dark:hover:bg-green-900/20 text-sm font-medium transition-colors disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 10h18M3 14h18M10 3v18M14 3v18M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
      </svg>
      {exporting ? "..." : "Excel"}
    </button>
  </div>
)}
```

---

### State Loading untuk Export

```typescript
const [exporting, setExporting] = useState(false);

const handleExport = async (format: "pdf" | "excel") => {
  setExporting(true);
  try {
    const path = `/admin/tahap1/export/${format}`;
    const ext = format === "pdf" ? "pdf" : "xlsx";
    await downloadExport(buildUrl(path), token!, `tahap1_${slug}_${today}.${ext}`);
  } catch (err: any) {
    // Tampilkan toast/alert sesuai UI library yang dipakai
    alert("Export gagal: " + (err.message || "Coba lagi"));
  } finally {
    setExporting(false);
  }
};
```

---

## 8. Error Handling

Saat error, backend mengembalikan **JSON** (bukan binary):

| Status | Kondisi | Pesan |
|---|---|---|
| `400` | Superadmin tidak kirim `territory_id` | `"Superadmin wajib kirim query parameter territory_id"` |
| `400` | Export tahap 2 tapi tahap 1 belum submit | `"tahap 1 belum disubmit"` |
| `404` | Tidak ada data sama sekali | `"Tidak ada data untuk di-export"` |
| `404` | Territory tidak punya kontingen | `"Kontingen untuk territory ini tidak ditemukan"` |
| `500` | Gagal generate file di server | `"Gagal membuat file export"` |
| `401` | Token tidak valid / expired | Dari middleware auth |

> Fungsi `downloadExport` di atas sudah menangani parsing JSON error secara otomatis dan melempar `Error` dengan pesan yang bisa langsung ditampilkan ke user.

---

*Dokumen ini mencakup semua endpoint export yang tersedia di backend POPDA 2026.*
