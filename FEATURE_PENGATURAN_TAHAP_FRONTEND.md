# Pengaturan Tahap — Dokumentasi Frontend

> **Base URL:** `http://localhost:8000`  
> **Auth:** Wajib header `Authorization: Bearer <token>` di semua endpoint  
> **GET:** Bisa diakses semua role (admin biasa & superadmin)  
> **PUT:** Hanya superadmin — akan return `403` jika bukan superadmin

---

## Daftar Isi

1. [Konsep & Aturan Bisnis](#1-konsep--aturan-bisnis)
2. [Model Data](#2-model-data)
3. [Endpoints](#3-endpoints)
4. [Error Responses](#4-error-responses)
5. [Dampak ke Endpoint Tahap yang Sudah Ada](#5-dampak-ke-endpoint-tahap-yang-sudah-ada)
6. [Alur Frontend — Admin Kontingen](#6-alur-frontend--admin-kontingen)
7. [Alur Frontend — Superadmin Panel](#7-alur-frontend--superadmin-panel)
8. [Contoh Implementasi](#8-contoh-implementasi)

---

## 1. Konsep & Aturan Bisnis

Superadmin mengontrol kapan Tahap 1, 2, dan 3 bisa diakses oleh admin kontingen. Kontrol utamanya ada di field **`is_open`** — bukan otomatis dari tanggal.

| Kondisi | Yang terjadi |
|---|---|
| `is_open = false` | Semua operasi **tulis** (PUT/POST/DELETE) di endpoint tahap itu ditolak `403` |
| `is_open = true` | Endpoint tahap berjalan normal |
| Superadmin request | **Selalu lolos** meskipun tahap tutup |

**Aturan urutan buka tahap:**
- Tahap 2 tidak bisa dibuka sebelum Tahap 1 **pernah** dibuka
- Tahap 3 tidak bisa dibuka sebelum Tahap 2 **pernah** dibuka

> **Penting:** `tanggal_buka` dan `tanggal_tutup` bersifat **informatif saja** — dipakai untuk tampilkan jadwal ke admin kontingen. Buka/tutup yang sesungguhnya dikendalikan oleh `is_open`.

> **Catatan Role:** Backend mendeteksi superadmin secara **case-insensitive**. Role `"SUPERADMIN"` dari DB sama dengan `"superadmin"`. Frontend tidak perlu khawatir soal ini.

---

## 2. Model Data

### Response `PengaturanTahap`

```json
{
  "id": 1,
  "tahap": 1,
  "is_open": true,
  "tanggal_buka": "2026-06-01",
  "tanggal_tutup": "2026-06-30",
  "updated_at": "2026-06-01T08:00:00Z"
}
```

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | number | Primary key (1, 2, 3 — fixed) |
| `tahap` | number | Nomor tahap: `1`, `2`, atau `3` |
| `is_open` | boolean | `true` = dibuka, `false` = ditutup |
| `tanggal_buka` | string \| null | Format `YYYY-MM-DD`. Informatif saja |
| `tanggal_tutup` | string \| null | Format `YYYY-MM-DD`. Informatif saja |
| `updated_at` | string | Waktu terakhir diubah |

---

## 3. Endpoints

### `GET /admin/pengaturan-tahap` 🔒 (Semua Role)

Ambil status semua tahap sekaligus. Dipakai untuk tampilkan banner dan status di halaman tahap 1/2/3.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tahap": 1,
      "is_open": true,
      "tanggal_buka": "2026-06-01",
      "tanggal_tutup": "2026-06-30",
      "updated_at": "2026-06-01T08:00:00Z"
    },
    {
      "id": 2,
      "tahap": 2,
      "is_open": false,
      "tanggal_buka": "2026-07-01",
      "tanggal_tutup": "2026-07-31",
      "updated_at": "2026-05-20T10:00:00Z"
    },
    {
      "id": 3,
      "tahap": 3,
      "is_open": false,
      "tanggal_buka": null,
      "tanggal_tutup": null,
      "updated_at": "2026-05-20T10:00:00Z"
    }
  ]
}
```

> Response selalu berisi tepat 3 item, diurutkan tahap ascending.

---

### `PUT /admin/pengaturan-tahap/:tahap` 🔒 (Superadmin Only)

Update pengaturan satu tahap. `:tahap` harus `1`, `2`, atau `3`.

**Content-Type:** `application/json`

**Request Body — semua field opsional, kirim yang mau diubah saja:**

```json
{
  "is_open": true,
  "tanggal_buka": "2026-06-01",
  "tanggal_tutup": "2026-06-30"
}
```

Toggle saja tanpa ubah tanggal:
```json
{ "is_open": false }
```

Ubah tanggal saja tanpa ubah status:
```json
{
  "tanggal_buka": "2026-07-01",
  "tanggal_tutup": "2026-07-31"
}
```

Hapus tanggal (set ke null) — kirim string kosong:
```json
{
  "tanggal_buka": "",
  "tanggal_tutup": ""
}
```

**Response sukses 200:**
```json
{
  "success": true,
  "message": "Pengaturan Tahap 1 berhasil diupdate",
  "data": {
    "id": 1,
    "tahap": 1,
    "is_open": true,
    "tanggal_buka": "2026-06-01",
    "tanggal_tutup": "2026-06-30",
    "updated_at": "2026-06-01T08:00:00Z"
  }
}
```

---

## 4. Error Responses

### Bukan superadmin (403)
```json
{ "success": false, "message": "Hanya superadmin yang bisa mengubah pengaturan tahap" }
```

### Parameter tahap tidak valid (400)
```json
{ "success": false, "message": "Parameter tahap tidak valid (harus 1, 2, atau 3)" }
```

### Melanggar urutan buka tahap (400)
```json
{ "success": false, "message": "Tahap 2 tidak bisa dibuka sebelum Tahap 1 pernah dibuka" }
```
```json
{ "success": false, "message": "Tahap 3 tidak bisa dibuka sebelum Tahap 2 pernah dibuka" }
```

### Tahap ditutup — saat admin kontingen akses endpoint tulis (403)
```json
{
  "success": false,
  "message": "Tahap 1 belum dibuka. Silakan hubungi panitia.",
  "error_code": "TAHAP_CLOSED"
}
```

> Deteksi dari `error_code === "TAHAP_CLOSED"` untuk tampilkan banner yang tepat di frontend.

---

## 5. Dampak ke Endpoint Tahap yang Sudah Ada

Semua operasi **tulis** di endpoint tahap sekarang dicek `is_open` sebelum diproses. Operasi **baca** (GET) tidak diblokir. **Superadmin selalu bypass**.

### Endpoint yang Terblokir saat Tahap Tutup (Admin Kontingen Saja)

**Tahap 1:**
| Method | Endpoint |
|---|---|
| `PUT` | `/admin/tahap1` |
| `DELETE` | `/admin/tahap1/:cabor_id` |
| `POST` | `/admin/tahap1/submit` |

**Tahap 2:**
| Method | Endpoint |
|---|---|
| `POST` | `/admin/tahap2/nomor/:nomor_id` |
| `DELETE` | `/admin/tahap2/nomor/:nomor_id` |
| `POST` | `/admin/tahap2/submit` |

**Tahap 3 (termasuk master pelatih & official karena bagian dari tahap 3):**
| Method | Endpoint |
|---|---|
| `POST` | `/admin/tahap3/atlet` |
| `PUT` | `/admin/tahap3/atlet/:id` |
| `DELETE` | `/admin/tahap3/atlet/:id` |
| `PUT` | `/admin/tahap3/atlet/:id/foto` |
| `PUT` | `/admin/tahap3/atlet/:id/file/:kolom` |
| `POST` | `/admin/tahap3/pelatih` |
| `PUT` | `/admin/tahap3/pelatih/:id` |
| `DELETE` | `/admin/tahap3/pelatih/:id` |
| `PUT` | `/admin/tahap3/pelatih/:id/file/:kolom` |
| `POST` | `/admin/tahap3/official` |
| `PUT` | `/admin/tahap3/official/:id` |
| `DELETE` | `/admin/tahap3/official/:id` |
| `PUT` | `/admin/tahap3/official/:id/file/:kolom` |
| `POST` | `/admin/master/pelatih` |
| `PUT` | `/admin/master/pelatih/:id` |
| `DELETE` | `/admin/master/pelatih/:id` |
| `PUT` | `/admin/master/pelatih/:id/foto` |
| `PUT` | `/admin/master/pelatih/:id/file/:kolom` |
| `POST` | `/admin/master/pelatih/trx` |
| `DELETE` | `/admin/master/pelatih/trx/:id` |
| `POST` | `/admin/master/official` |
| `PUT` | `/admin/master/official/:id` |
| `DELETE` | `/admin/master/official/:id` |
| `PUT` | `/admin/master/official/:id/foto` |
| `PUT` | `/admin/master/official/:id/file/:kolom` |
| `POST` | `/admin/master/official/trx` |
| `DELETE` | `/admin/master/official/trx/:id` |
| `POST` | `/admin/tahap3/submit` |
| `POST` | `/admin/tahap3/trx/atlet` |
| `DELETE` | `/admin/tahap3/trx/atlet/:id` |
| `POST` | `/admin/tahap3/trx/pelatih` |
| `DELETE` | `/admin/tahap3/trx/pelatih/:id` |
| `POST` | `/admin/tahap3/trx/official` |
| `DELETE` | `/admin/tahap3/trx/official/:id` |

### Endpoint yang Tidak Terblokir (GET semua tetap bisa diakses)

```
GET /admin/tahap1
GET /admin/tahap2
GET /admin/tahap3
GET /admin/tahap1/export/pdf
GET /admin/tahap1/export/excel
GET /admin/tahap2/export/pdf
GET /admin/tahap2/export/excel
GET /admin/tahap3/export/pdf
GET /admin/tahap3/export/excel
GET /admin/master/pelatih
GET /admin/master/official
GET /admin/pengaturan-tahap
```

---

## 6. Alur Frontend — Admin Kontingen

### Saat halaman Tahap 1/2/3 dibuka

```
1. Fetch: GET /admin/pengaturan-tahap
2. Cek tahap yang relevan:
   const setting = data.find(d => d.tahap === 1)
3. is_open === false → tampilkan banner, sembunyikan tombol edit/submit
4. is_open === true  → fetch data normal, tampilkan form
```

### Banner Tahap Tutup

```
┌───────────────────────────────────────────────────────────┐
│  ⚠  Tahap 1 belum dibuka.                                 │
│     Pendaftaran akan dibuka pada 1 Juni 2026.             │
│     Hubungi panitia jika ada pertanyaan.                  │
└───────────────────────────────────────────────────────────┘
```

Jika `tanggal_buka` null: `"Tahap X belum dibuka. Hubungi panitia untuk informasi jadwal."`

### Menangani Error `TAHAP_CLOSED` dari API

Jika frontend tidak sempat cek `is_open` dan langsung melakukan operasi tulis:

```typescript
axios.interceptors.response.use(
  response => response,
  error => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.error_code === "TAHAP_CLOSED"
    ) {
      toast.warning(error.response.data.message);
      refetchPengaturanTahap();
    }
    return Promise.reject(error);
  }
);
```

---

## 7. Alur Frontend — Superadmin Panel

### Halaman Pengaturan Tahap

```
Tahap 1 — Entry By Sport     [BUKA ●──]  01 Jun - 30 Jun 2026  [Edit Tanggal]
Tahap 2 — Entry By Number    [TUTUP ──○] 01 Jul - 31 Jul 2026  [Edit Tanggal]
Tahap 3 — Entry By Name      [TUTUP ──○] (belum diset)         [Edit Tanggal]
```

### Toggle buka/tutup

```
1. Klik toggle Tahap 2 → ON
2. PUT /admin/pengaturan-tahap/2  →  { "is_open": true }
3. Sukses → toast "Tahap 2 berhasil dibuka"
4. Error 400 → kembalikan toggle ke semula, tampilkan pesan error
```

### Update tanggal

```
PUT /admin/pengaturan-tahap/1
{ "tanggal_buka": "2026-06-01", "tanggal_tutup": "2026-06-30" }
```

### Hapus tanggal

```
PUT /admin/pengaturan-tahap/1
{ "tanggal_buka": "", "tanggal_tutup": "" }
```

---

## 8. Contoh Implementasi

### Types (TypeScript)

```typescript
export interface PengaturanTahap {
  id: number;
  tahap: number;
  is_open: boolean;
  tanggal_buka: string | null;
  tanggal_tutup: string | null;
  updated_at: string;
}

export interface UpdatePengaturanTahapPayload {
  is_open?: boolean;
  tanggal_buka?: string;  // "" untuk hapus (set null)
  tanggal_tutup?: string; // "" untuk hapus (set null)
}
```

### Service Functions

```typescript
export const pengaturanTahapService = {
  getAll: (): Promise<PengaturanTahap[]> =>
    api.get("/admin/pengaturan-tahap").then(r => r.data.data),

  update: (tahap: 1 | 2 | 3, payload: UpdatePengaturanTahapPayload): Promise<PengaturanTahap> =>
    api.put(`/admin/pengaturan-tahap/${tahap}`, payload).then(r => r.data.data),

  toggleOpen: (tahap: 1 | 2 | 3, isOpen: boolean): Promise<PengaturanTahap> =>
    api.put(`/admin/pengaturan-tahap/${tahap}`, { is_open: isOpen }).then(r => r.data.data),
};
```

### Hook (Semua Role)

```typescript
export function usePengaturanTahap() {
  const { data } = useQuery({
    queryKey: ["pengaturan-tahap"],
    queryFn: pengaturanTahapService.getAll,
    staleTime: 60_000,
  });

  const isOpen = (tahap: 1 | 2 | 3): boolean =>
    data?.find(d => d.tahap === tahap)?.is_open ?? false;

  const getTahap = (tahap: 1 | 2 | 3) =>
    data?.find(d => d.tahap === tahap) ?? null;

  return { data, isOpen, getTahap };
}
```

### Komponen Banner Tahap Tutup

```tsx
function BannerTahapTutup({ tahap, tanggalBuka }: { tahap: number; tanggalBuka: string | null }) {
  const pesan = tanggalBuka
    ? `Pendaftaran akan dibuka pada ${formatDate(tanggalBuka)}.`
    : "Hubungi panitia untuk informasi jadwal.";

  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex gap-3">
      <span className="text-yellow-600 text-xl">⚠</span>
      <div>
        <p className="font-semibold text-yellow-800">Tahap {tahap} belum dibuka</p>
        <p className="text-yellow-700 text-sm mt-1">{pesan}</p>
      </div>
    </div>
  );
}
```

### Komponen Toggle (Superadmin)

```tsx
function PengaturanTahapRow({ setting }: { setting: PengaturanTahap }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleToggle = async (newValue: boolean) => {
    setLoading(true);
    try {
      await pengaturanTahapService.toggleOpen(setting.tahap as 1 | 2 | 3, newValue);
      queryClient.invalidateQueries({ queryKey: ["pengaturan-tahap"] });
      toast.success(`Tahap ${setting.tahap} berhasil ${newValue ? "dibuka" : "ditutup"}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Gagal mengubah pengaturan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr>
      <td>Tahap {setting.tahap}</td>
      <td>
        <Toggle checked={setting.is_open} onChange={handleToggle} disabled={loading} />
      </td>
      <td>{setting.tanggal_buka ?? "–"} s/d {setting.tanggal_tutup ?? "–"}</td>
      <td><EditTanggalButton setting={setting} /></td>
    </tr>
  );
}
```

---

## Ringkasan Endpoint

| Method | URL | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/admin/pengaturan-tahap` | Semua | Status semua tahap (array 3 item) |
| `PUT` | `/admin/pengaturan-tahap/1` | Superadmin | Update Tahap 1 |
| `PUT` | `/admin/pengaturan-tahap/2` | Superadmin | Update Tahap 2 |
| `PUT` | `/admin/pengaturan-tahap/3` | Superadmin | Update Tahap 3 |
