# Sertifikat — Dokumentasi Frontend

> **Base URL:** `http://localhost:8000`  
> **Auth:** Wajib header `Authorization: Bearer <token>` di semua endpoint  
> **Akses:** Hanya **SUPERADMIN** (role id 1) dan **STAFF_LAPANGAN** (role id 3)  
> **ADMIN kontingen (role id 2) tidak bisa mengakses endpoint ini — langsung 403**

---

## Daftar Isi

1. [Hak Akses](#1-hak-akses)
2. [Konsep & Struktur Tabel](#2-konsep--struktur-tabel)
3. [Model Data](#3-model-data)
4. [Aturan Bisnis](#4-aturan-bisnis)
5. [Endpoints](#5-endpoints)
6. [Export PDF Sertifikat](#6-export-pdf-sertifikat)
7. [Error Responses](#7-error-responses)
8. [Contoh Implementasi](#8-contoh-implementasi)

---

## 1. Hak Akses

Semua endpoint `/admin/sertifikat` dijaga middleware `RolesAllowed("SUPERADMIN", "STAFF_LAPANGAN")`.

| Role | Role ID | Akses |
|---|---|---|
| `SUPERADMIN` | 1 | ✅ Full access |
| `ADMIN` | 2 | ❌ **403 Forbidden** |
| `STAFF_LAPANGAN` | 3 | ✅ Full access |

> Pengecekan role **case-insensitive** — `"SUPERADMIN"`, `"superadmin"`, `"Superadmin"` semua valid.

**Response jika role tidak diizinkan (403):**
```json
{
  "success": false,
  "message": "Akses ditolak — endpoint ini hanya untuk: SUPERADMIN, STAFF_LAPANGAN"
}
```

```typescript
// Sembunyikan menu jika tidak punya akses
const canAccessSertifikat = ["SUPERADMIN", "STAFF_LAPANGAN"].includes(
  currentUser.role.toUpperCase()
);
{canAccessSertifikat && <SidebarItem href="/sertifikat" label="Sertifikat" />}
```

---

## 2. Konsep & Struktur Tabel

Tabel `sertifikat` menyimpan sertifikat untuk **atlet**, **pelatih**, atau **official**. Setiap baris hanya boleh punya **satu** penerima.

Field `nama_penerima` **diisi otomatis oleh backend** dari `nama_lengkap` tabel master — **frontend tidak perlu dan tidak boleh mengirimnya**.

```
tipe_penerima = "ATLET"    → nama_penerima ← master_atlet.nama_lengkap    WHERE id = atlet_id
tipe_penerima = "PELATIH"  → nama_penerima ← master_pelatih.nama_lengkap  WHERE id = pelatih_id
tipe_penerima = "OFFICIAL" → nama_penerima ← master_official.nama_lengkap WHERE id = official_id
```

### Struktur Tabel

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint unsigned | Auto increment |
| `tipe_penerima` | enum | `ATLET` / `PELATIH` / `OFFICIAL` |
| `atlet_id` | bigint \| null | FK → `master_atlet.id` |
| `pelatih_id` | bigint \| null | FK → `master_pelatih.id` |
| `official_id` | bigint \| null | FK → `master_official.id` |
| `nama_penerima` | varchar(150) | **Otomatis dari `nama_lengkap` tabel master** |
| `judul` | varchar(255) | Judul/nama sertifikat, misal "Sertifikat Peserta POPDA 2026" |
| `nomor_sertifikat` | varchar(100) \| null | Nomor unik, misal "POPDA/2026/ATL/001" |
| `tanggal_terbit` | date | Format `YYYY-MM-DD` |
| `file_sertifikat` | varchar(255) \| null | Path file PDF yang diupload manual |
| `catatan` | text \| null | Catatan tambahan — muncul di PDF |
| `created_at` | timestamp | Auto |
| `updated_at` | timestamp | Auto update |

---

## 3. Model Data

### Response `Sertifikat`

```json
{
  "id": 1,
  "tipe_penerima": "ATLET",
  "atlet_id": 4,
  "pelatih_id": null,
  "official_id": null,
  "nama_penerima": "Joko",
  "judul": "Sertifikat Peserta POPDA 2026",
  "nomor_sertifikat": "POPDA/2026/ATL/001",
  "tanggal_terbit": "2026-08-15",
  "file_sertifikat": null,
  "catatan": null,
  "created_at": "2026-08-15T09:00:00Z",
  "updated_at": "2026-08-15T09:00:00Z"
}
```

### Response Dropdown Penerima

```json
{
  "success": true,
  "data": [
    {
      "id": 4,
      "nama_lengkap": "Joko",
      "kontingen_id": 3,
      "nama_kontingen": "Kabupaten Serang"
    }
  ]
}
```

---

## 4. Aturan Bisnis

| No | Aturan |
|---|---|
| 1 | Hanya **SUPERADMIN** dan **STAFF_LAPANGAN** — ADMIN kontingen **403** |
| 2 | Tepat **satu** dari `atlet_id` / `pelatih_id` / `official_id` diisi, dua lainnya `null` |
| 3 | `tipe_penerima` wajib konsisten dengan FK: `ATLET` → `atlet_id`, dst |
| 4 | `nama_penerima` **tidak dikirim dari frontend** — backend isi otomatis dari `nama_lengkap` tabel master |
| 5 | `nama_penerima` **tidak bisa diubah** via `PUT` setelah sertifikat dibuat |
| 6 | `tanggal_terbit` wajib format `YYYY-MM-DD` |
| 7 | `catatan` muncul di PDF jika diisi |
| 8 | Export PDF via `GET /admin/sertifikat/:id/export/pdf` — landscape A4, auto-generated |
| 9 | Export batch PDF via `GET /admin/sertifikat/export/batch/pdf` — semua sertifikat, satu file multi-halaman |
| 10 | Upload file manual (file custom) via `PUT /admin/sertifikat/:id/file` terpisah dari export |

---

## 5. Endpoints

> Semua endpoint hanya bisa diakses **SUPERADMIN** atau **STAFF_LAPANGAN**. ADMIN → **403**.

---

### `GET /admin/sertifikat` 🔒

List semua sertifikat, diurutkan terbaru dulu (`created_at DESC`).

**Query params opsional:**

| Param | Nilai | Keterangan |
|---|---|---|
| `tipe` | `ATLET` \| `PELATIH` \| `OFFICIAL` | Filter by tipe (case-insensitive) |
| `atlet_id` | number | Filter by atlet tertentu |
| `pelatih_id` | number | Filter by pelatih tertentu |
| `official_id` | number | Filter by official tertentu |

```
GET /admin/sertifikat
GET /admin/sertifikat?tipe=ATLET
GET /admin/sertifikat?atlet_id=4
```

---

### `GET /admin/sertifikat/:id` 🔒

Detail satu sertifikat by ID.

---

### `POST /admin/sertifikat` 🔒

Buat sertifikat baru. **Jangan kirim `nama_penerima`.**

**Content-Type:** `application/json`

**Field wajib:** `tipe_penerima`, `judul`, `tanggal_terbit`, + FK sesuai tipe

```json
{
  "tipe_penerima": "ATLET",
  "atlet_id": 4,
  "judul": "Sertifikat Peserta POPDA 2026",
  "nomor_sertifikat": "POPDA/2026/ATL/001",
  "tanggal_terbit": "2026-08-15",
  "catatan": null
}
```

**Response 201:** data sertifikat lengkap, `nama_penerima` sudah terisi otomatis.

---

### `PUT /admin/sertifikat/:id` 🔒

Update. Partial update — hanya field yang dikirim berubah.  
Field yang tidak bisa diubah: `nama_penerima`, `tipe_penerima`, semua FK.

```json
{
  "judul": "Sertifikat Juara 1 POPDA 2026",
  "nomor_sertifikat": "POPDA/2026/ATL/001/REV",
  "tanggal_terbit": "2026-08-20",
  "catatan": "Revisi tanggal terbit"
}
```

Kosongkan field pointer dengan `null`:
```json
{ "nomor_sertifikat": null, "catatan": null }
```

---

### `DELETE /admin/sertifikat/:id` 🔒

Hard delete. File PDF di storage **tidak** ikut terhapus.

---

### `PUT /admin/sertifikat/:id/file` 🔒

Upload file PDF manual (untuk kasus file custom/sudah ada).  
**Content-Type:** `multipart/form-data` | field: `file`

**Response 200:**
```json
{
  "success": true,
  "message": "File sertifikat berhasil diupload",
  "path": "/uploads/sertifikat/1717123456_sertifikat.pdf"
}
```

---

### `GET /admin/sertifikat/penerima/atlet` 🔒

Dropdown semua atlet dari semua kontingen. Dipakai untuk populate `<select>` saat form buat sertifikat.

```
GET /admin/sertifikat/penerima/atlet
GET /admin/sertifikat/penerima/pelatih
GET /admin/sertifikat/penerima/official
```

**Response 200:**
```json
{
  "success": true,
  "message": "Data atlet berhasil diambil",
  "data": [
    {
      "id": 4,
      "nama_lengkap": "Joko",
      "kontingen_id": 3,
      "nama_kontingen": "Kabupaten Serang"
    },
    {
      "id": 5,
      "nama_lengkap": "Ahmad Fauzi",
      "kontingen_id": 2,
      "nama_kontingen": "Kabupaten Tangerang"
    }
  ]
}
```

> Diurutkan `nama_kontingen ASC, nama_lengkap ASC`. Gunakan `nama_kontingen` sebagai group header di dropdown.

---

## 6. Export PDF Sertifikat

Backend generate PDF **landscape A4** (297×210mm) otomatis — tidak perlu upload file manual.

### Layout PDF

```
┌─────────────────────────────────────────────────────────────────┐  ← bingkai hijau tua
│  ┌──────────────────────────────────────────────────────────┐   │  ← bingkai emas
│  │                                                           │   │
│  │               PIAGAM PENGHARGAAN                         │   │
│  │           No. POPDA/2026/ATL/001                        │   │
│  │         ─────────────────────────                        │   │
│  │                  Diberikan kepada                         │   │
│  │                                                           │   │
│  │                    JOKO                                   │   │ ← nama besar
│  │              ───────────────────                         │   │
│  │                    Sebagai                                │   │
│  │                                                           │   │
│  │           Sertifikat Peserta POPDA 2026                  │   │ ← judul
│  │                      Atlet                               │   │ ← tipe
│  │                                                           │   │
│  │  Dalam Rangka POPDA Provinsi Banten Tahun 2026           │   │
│  │              Serang, 15 Agustus 2026                     │   │
│  │                                                           │   │
│  │  Ketua Pelaksana,          Kepala Dinas Dispora,         │   │
│  │  ___________________       ___________________           │   │
│  │  NIP. ...                  NIP. ...                      │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### `GET /admin/sertifikat/:id/export/pdf` 🔒

Generate PDF satu sertifikat berdasarkan ID.

```
GET /admin/sertifikat/1/export/pdf
```

**Response:** File PDF binary
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="sertifikat_Joko_2026-08-15.pdf"
Cache-Control: no-store
```

---

### `GET /admin/sertifikat/export/batch/pdf` 🔒

Generate PDF batch — satu file berisi banyak halaman sertifikat.  
Filter sama dengan `GET /admin/sertifikat`.

```
GET /admin/sertifikat/export/batch/pdf
GET /admin/sertifikat/export/batch/pdf?tipe=ATLET
GET /admin/sertifikat/export/batch/pdf?tipe=PELATIH
```

**Response:** File PDF multi-halaman
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="sertifikat_batch_2026-08-15.pdf"
```

**Response jika tidak ada data (404):**
```json
{ "success": false, "message": "Tidak ada data sertifikat untuk di-export" }
```

### Contoh implementasi frontend

```typescript
// Export satu sertifikat
const handleExportPDF = (id: number, namaPenerima: string) => {
  const url = `${BASE}/admin/sertifikat/${id}/export/pdf`;
  downloadFile(url, token, `sertifikat_${namaPenerima}.pdf`);
};

// Export batch semua atlet
const handleExportBatchAtlet = () => {
  const url = `${BASE}/admin/sertifikat/export/batch/pdf?tipe=ATLET`;
  downloadFile(url, token, `sertifikat_atlet_batch.pdf`);
};

// Helper download
async function downloadFile(url: string, token: string, filename: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal download");
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
```

---

## 7. Error Responses

| Kondisi | HTTP | Pesan |
|---|---|---|
| Role tidak diizinkan | 403 | `"Akses ditolak — endpoint ini hanya untuk: SUPERADMIN, STAFF_LAPANGAN"` |
| Sertifikat tidak ditemukan | 404 | `"sertifikat tidak ditemukan"` |
| Atlet tidak ditemukan | 404 | `"atlet tidak ditemukan"` |
| Pelatih tidak ditemukan | 404 | `"pelatih tidak ditemukan"` |
| Official tidak ditemukan | 404 | `"official tidak ditemukan"` |
| FK tidak konsisten | 400 | `"atlet_id wajib diisi jika tipe_penerima ATLET"` |
| tipe_penerima tidak valid | 400 | `"tipe_penerima harus ATLET, PELATIH, atau OFFICIAL"` |
| Field wajib kosong | 400 | `"Format request tidak valid"` |
| File tidak disertakan | 400 | `"File diperlukan (field: file)"` |
| Tidak ada data batch | 404 | `"Tidak ada data sertifikat untuk di-export"` |

---

## 8. Contoh Implementasi

### Types (TypeScript)

```typescript
export type TipePenerima = "ATLET" | "PELATIH" | "OFFICIAL";

export interface Sertifikat {
  id: number;
  tipe_penerima: TipePenerima;
  atlet_id: number | null;
  pelatih_id: number | null;
  official_id: number | null;
  nama_penerima: string;           // read-only — otomatis dari backend
  judul: string;
  nomor_sertifikat: string | null;
  tanggal_terbit: string;          // YYYY-MM-DD
  file_sertifikat: string | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface DropdownItem {
  id: number;
  nama_lengkap: string;
  kontingen_id: number;
  nama_kontingen: string;
}

export interface CreateSertifikatPayload {
  tipe_penerima: TipePenerima;
  atlet_id?: number;
  pelatih_id?: number;
  official_id?: number;
  judul: string;
  nomor_sertifikat?: string | null;
  tanggal_terbit: string;          // YYYY-MM-DD
  catatan?: string | null;
  // JANGAN kirim nama_penerima
}

export interface UpdateSertifikatPayload {
  judul?: string;
  nomor_sertifikat?: string | null;
  tanggal_terbit?: string;
  catatan?: string | null;
}
```

### Service Functions

```typescript
export const sertifikatService = {
  getAll: (params?: {
    tipe?: TipePenerima;
    atlet_id?: number;
    pelatih_id?: number;
    official_id?: number;
  }): Promise<Sertifikat[]> =>
    api.get("/admin/sertifikat", { params }).then(r => r.data.data),

  getByID: (id: number): Promise<Sertifikat> =>
    api.get(`/admin/sertifikat/${id}`).then(r => r.data.data),

  create: (payload: CreateSertifikatPayload): Promise<Sertifikat> =>
    api.post("/admin/sertifikat", payload).then(r => r.data.data),

  update: (id: number, payload: UpdateSertifikatPayload): Promise<Sertifikat> =>
    api.put(`/admin/sertifikat/${id}`, payload).then(r => r.data.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/admin/sertifikat/${id}`),

  uploadFile: (id: number, file: File): Promise<{ path: string }> => {
    const form = new FormData();
    form.append("file", file);
    return api
      .put(`/admin/sertifikat/${id}/file`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(r => r.data);
  },

  // Dropdown untuk form
  getAtletDropdown: (): Promise<DropdownItem[]> =>
    api.get("/admin/sertifikat/penerima/atlet").then(r => r.data.data),

  getPelatihDropdown: (): Promise<DropdownItem[]> =>
    api.get("/admin/sertifikat/penerima/pelatih").then(r => r.data.data),

  getOfficialDropdown: (): Promise<DropdownItem[]> =>
    api.get("/admin/sertifikat/penerima/official").then(r => r.data.data),

  // Export PDF
  exportPDF: (id: number, namaPenerima: string) =>
    downloadFile(
      `${BASE}/admin/sertifikat/${id}/export/pdf`,
      token!,
      `sertifikat_${namaPenerima}.pdf`
    ),

  exportBatchPDF: (tipe?: TipePenerima) => {
    const params = tipe ? `?tipe=${tipe}` : "";
    return downloadFile(
      `${BASE}/admin/sertifikat/export/batch/pdf${params}`,
      token!,
      `sertifikat_batch.pdf`
    );
  },
};
```

### Helper Build Payload

```typescript
function buildCreatePayload(
  tipe: TipePenerima,
  penerimaId: number,
  rest: Omit<CreateSertifikatPayload, "tipe_penerima" | "atlet_id" | "pelatih_id" | "official_id">
): CreateSertifikatPayload {
  return {
    tipe_penerima: tipe,
    ...(tipe === "ATLET"    && { atlet_id: penerimaId }),
    ...(tipe === "PELATIH"  && { pelatih_id: penerimaId }),
    ...(tipe === "OFFICIAL" && { official_id: penerimaId }),
    ...rest,
  };
}
```

### Komponen Dropdown Penerima

```tsx
// Dropdown dengan grouping per kontingen
function PenerimaSelect({
  tipe,
  value,
  onChange,
}: {
  tipe: TipePenerima;
  value: number | null;
  onChange: (id: number) => void;
}) {
  const { data: options = [] } = useQuery({
    queryKey: ["sertifikat-dropdown", tipe],
    queryFn: () => {
      if (tipe === "ATLET")    return sertifikatService.getAtletDropdown();
      if (tipe === "PELATIH")  return sertifikatService.getPelatihDropdown();
      return sertifikatService.getOfficialDropdown();
    },
  });

  // Group by nama_kontingen
  const grouped = options.reduce<Record<string, DropdownItem[]>>((acc, item) => {
    const key = item.nama_kontingen;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <select
      value={value ?? ""}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full border rounded p-2"
    >
      <option value="" disabled>Pilih {tipe.toLowerCase()}...</option>
      {Object.entries(grouped).map(([kontingen, items]) => (
        <optgroup key={kontingen} label={kontingen}>
          {items.map(item => (
            <option key={item.id} value={item.id}>
              {item.nama_lengkap}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
```

---

## Ringkasan Endpoint

| Method | URL | Keterangan |
|---|---|---|
| `GET` | `/admin/sertifikat` | List sertifikat (filter opsional) |
| `POST` | `/admin/sertifikat` | Buat sertifikat baru |
| `GET` | `/admin/sertifikat/export/batch/pdf` | Export batch PDF semua (atau filtered) |
| `GET` | `/admin/sertifikat/penerima/atlet` | Dropdown atlet untuk form |
| `GET` | `/admin/sertifikat/penerima/pelatih` | Dropdown pelatih untuk form |
| `GET` | `/admin/sertifikat/penerima/official` | Dropdown official untuk form |
| `GET` | `/admin/sertifikat/:id` | Detail satu sertifikat |
| `PUT` | `/admin/sertifikat/:id` | Update data (partial) |
| `DELETE` | `/admin/sertifikat/:id` | Hapus sertifikat |
| `PUT` | `/admin/sertifikat/:id/file` | Upload file PDF manual |
| `GET` | `/admin/sertifikat/:id/export/pdf` | Export PDF landscape satu sertifikat |

**Semua endpoint: ADMIN (role id 2) → 403.**

> **Urutan route penting:** Semua path statis (`/export/batch/pdf`, `/penerima/*`) terdaftar **sebelum** `/:id` di backend — sudah ditangani di `main.go`.
