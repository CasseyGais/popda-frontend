# Tahap 2 — Pendaftaran Nomor Pertandingan

> **Base URL:** `http://localhost:8000`  
> **Auth:** Semua endpoint wajib header `Authorization: Bearer <token>`  
> **Admin biasa:** `kontingen_id` otomatis dari JWT — tidak perlu kirim apapun  
> **Superadmin:** Wajib kirim `?territory_id=X` di semua endpoint

---

## Daftar Isi

1. [Konsep kontingen\_id & territory\_id](#1-konsep-kontingen_id--territory_id)
2. [Keterkaitan dengan Tahap 1](#2-keterkaitan-dengan-tahap-1)
3. [Struktur Tabel](#3-struktur-tabel)
4. [Aturan Bisnis](#4-aturan-bisnis)
5. [Endpoints](#5-endpoints)
6. [Export PDF & Excel](#6-export-pdf--excel)
7. [Alur Frontend](#7-alur-frontend)
8. [Superadmin — Akses via Territory](#8-superadmin--akses-via-territory)
9. [Ringkasan Endpoint](#9-ringkasan-endpoint)

---

## 1. Konsep kontingen\_id & territory\_id

### Admin biasa

JWT berisi `kontingen_id` yang sudah terikat saat login. Backend langsung pakai nilainya.

### Superadmin

Backend menggunakan **3 lapis pendeteksian** untuk menentukan apakah request dari superadmin:

1. `claims.Role == "superadmin"` → cara utama
2. `claims.KontingenID == 0` → fallback token lama
3. `?territory_id` ada di query → **selalu override JWT**

**Prioritas resolusi:**
```
Ada ?territory_id di query?
        │
       YA → SELECT id FROM kontingen WHERE territory_id = X → pakai hasilnya
        │
       TIDAK
        │
       Apakah superadmin? (role == "superadmin" ATAU KontingenID == 0)
        │
       YA  → error 400: "wajib kirim territory_id"
        │
       TIDAK → admin biasa → pakai KontingenID dari JWT
```

> **Penting:** Jika `?territory_id` ada di query, nilainya **selalu dipakai** mengabaikan JWT — ini fix untuk bug di mana superadmin mendapat data kontingen sendiri meski sudah pilih territory lain.

### Setup di frontend

```typescript
const { can } = useAuth();
const { currentTerritory } = useTerritory();

const territoryId = can("*") ? currentTerritory?.id : undefined;

// Guard untuk superadmin
if (can("*") && !currentTerritory) {
  return <div>Pilih territory terlebih dahulu</div>;
}
```

| | Admin Biasa | Superadmin |
|---|---|---|
| `territoryId` | `undefined` | `currentTerritory?.id` |
| Query param terkirim | Tidak ada | `?territory_id=X` |
| Backend resolve dari | JWT `KontingenID` | Lookup tabel kontingen |
| Bisa ganti kontingen? | ❌ | ✅ Via territory selector |

---

## 2. Keterkaitan dengan Tahap 1

Tahap 2 **bergantung pada Tahap 1**. Nomor yang tampil hanya dari cabor yang dipilih di tahap 1.

```
Tahap 1: Kontingen pilih Cabor (trx_kontingen_cabor)
           ↓
Tahap 2: Backend ambil nomor dari cabor tersebut (master_nomor WHERE cabor_id IN ...)
         Kontingen centang nomor yang ingin diikuti (trx_kontingen_nomor)
```

**Syarat akses:** `tahap1_status = SUBMITTED`. Jika belum → `400: "tahap 1 belum disubmit"`.

---

## 3. Struktur Tabel

### `trx_kontingen_nomor`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint | Auto increment |
| `kontingen_id` | bigint | FK → `kontingen.id` |
| `nomor_id` | bigint | FK → `master_nomor.id` |
| `created_at` | timestamp | Auto isi saat insert |

### `master_nomor` (referensi, read-only)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint | Primary key |
| `cabor_id` | int | FK → `master_cabor.id` |
| `nama` | varchar | Nama nomor, contoh: "Tunggal", "Ganda" |
| `jenis_kelamin` | enum | `PUTRA` / `PUTRI` / `CAMPURAN` |
| `tipe` | enum | `INDIVIDU` / `BEREGU` |
| `is_active` | tinyint | 1 = aktif |

### Status (di tabel `kontingen`)

| Kolom | Nilai |
|---|---|
| `tahap2_status` | `DRAFT` atau `SUBMITTED` |
| `tahap2_submitted_at` | `null` atau timestamp |
| `tahap2_validasi_status` | `null` / `PENDING` / `VALID` / `REVISI` |
| `tahap2_validasi_catatan` | `null` atau teks catatan dari superadmin |
| `tahap2_validasi_at` | `null` atau timestamp saat superadmin terakhir review |

> `tahap2_validasi_status` otomatis jadi `PENDING` saat submit. Superadmin yang set `VALID` atau `REVISI`.

---

## 4. Aturan Bisnis

| No | Aturan |
|---|---|
| 1 | **Tahap 1 wajib SUBMITTED** sebelum bisa akses tahap 2 |
| 2 | Nomor yang tampil **hanya dari cabor yang dipilih di tahap 1** |
| 3 | Tidak bisa daftar nomor dari cabor yang tidak ada di tahap 1 |
| 4 | Setelah `tahap2_status = SUBMITTED`, semua POST/DELETE ditolak |
| 5 | Submit hanya bisa jika minimal ada **1 nomor** yang didaftarkan |
| 6 | Daftar/batal per nomor — tidak ada bulk action |

---

## 5. Endpoints

### `GET /admin/tahap2` 🔒

Ambil status tahap 2 + semua nomor yang tersedia dari cabor tahap 1, beserta status terdaftar tiap nomor.

```
GET /admin/tahap2
GET /admin/tahap2?territory_id=2   ← superadmin
```

**Response 200:**
```json
{
  "success": true,
  "message": "Data tahap 2 berhasil diambil",
  "data": {
    "kontingen_id": 3,
    "territory_id": 2,
    "nama_kontingen": "Kabupaten Tangerang",
    "tahap2_status": "SUBMITTED",
    "tahap2_submitted_at": "2026-07-05T09:00:00Z",
    "tahap2_validasi_status": "PENDING",
    "tahap2_validasi_catatan": null,
    "nomor_list": [
      {
        "nomor_id": 69,
        "cabor_id": 6,
        "nama_cabor": "Bulutangkis",
        "nama_nomor": "Tunggal",
        "jenis_kelamin": "PUTRA",
        "tipe": "INDIVIDU",
        "terdaftar": true
      },
      {
        "nomor_id": 70,
        "cabor_id": 6,
        "nama_cabor": "Bulutangkis",
        "nama_nomor": "Ganda",
        "jenis_kelamin": "PUTRA",
        "tipe": "BEREGU",
        "terdaftar": false
      }
    ]
  }
}
```

> `terdaftar: true` = sudah ada di `trx_kontingen_nomor`.  
> `terdaftar: false` = tersedia tapi belum dicentang.  
> `tahap2_validasi_status` bisa `null`, `"PENDING"`, `"VALID"`, atau `"REVISI"`.  
> Jika `"REVISI"`, tampilkan banner dengan isi `tahap2_validasi_catatan`.

**Response error:**
```json
{ "success": false, "message": "tahap 1 belum disubmit" }
```

---

### `POST /admin/tahap2/nomor/:nomor_id` 🔒

Daftarkan satu nomor. Tidak perlu body.

```
POST /admin/tahap2/nomor/69
POST /admin/tahap2/nomor/69?territory_id=2   ← superadmin
```

**Response 200:**
```json
{ "success": true, "message": "Nomor berhasil didaftarkan" }
```

**Response error:**
```json
{ "success": false, "message": "nomor tidak termasuk dalam cabor yang didaftarkan di tahap 1" }
{ "success": false, "message": "tahap 2 sudah disubmit, tidak dapat diubah" }
```

---

### `DELETE /admin/tahap2/nomor/:nomor_id` 🔒

Batalkan pendaftaran satu nomor.

```
DELETE /admin/tahap2/nomor/69
DELETE /admin/tahap2/nomor/69?territory_id=2   ← superadmin
```

**Response 200:**
```json
{ "success": true, "message": "Pendaftaran nomor berhasil dibatalkan" }
```

---

### `POST /admin/tahap2/submit` 🔒

Kunci tahap 2. Tidak bisa diurungkan.

```
POST /admin/tahap2/submit
POST /admin/tahap2/submit?territory_id=2   ← superadmin
```

**Response 200:**
```json
{ "success": true, "message": "Tahap 2 berhasil disubmit" }
```

**Response error:**
```json
{ "success": false, "message": "pilih minimal satu nomor pertandingan sebelum submit" }
{ "success": false, "message": "tahap 2 sudah disubmit" }
```

---

## 6. Export PDF & Excel

Download rekap nomor pertandingan yang sudah didaftarkan kontingen. Syarat: tahap 1 harus sudah SUBMITTED.

### `GET /admin/tahap2/export/pdf` 🔒

```
GET /admin/tahap2/export/pdf
GET /admin/tahap2/export/pdf?territory_id=2   ← superadmin
```

**Response:** File PDF binary
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="tahap2_Kab_Tangerang_2026-06-03.pdf"
Cache-Control: no-store
```

**Isi file PDF:**
- Header: judul "REKAP ENTRY BY NUMBER - POPDA 2026", nama kontingen, tanggal cetak, status
- Tabel data (diurutkan per cabor):

| No | Cabang Olahraga | Nomor Pertandingan | Jenis Kelamin | Tipe |
|---|---|---|---|---|

- Jenis kelamin ditampilkan sebagai `PUTRA` / `PUTRI` / `CAMPURAN`
- Ringkasan "Total Nomor Terdaftar: N" di bawah tabel

---

### `GET /admin/tahap2/export/excel` 🔒

```
GET /admin/tahap2/export/excel
GET /admin/tahap2/export/excel?territory_id=2   ← superadmin
```

**Response:** File XLSX binary
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="tahap2_Kab_Tangerang_2026-06-03.xlsx"
Cache-Control: no-store
```

**Isi file Excel:**
- 1 sheet bernama "Tahap 2"
- Header dokumen di baris 1-3: judul, nama kontingen, tanggal + status
- Header tabel di baris 5: No, Cabang Olahraga, Nomor Pertandingan, Jenis Kelamin, Tipe
- Ringkasan total nomor di bawah data

**Contoh implementasi frontend:**
```typescript
const handleExportPDF = async () => {
  const url = territoryId
    ? `${BASE}/admin/tahap2/export/pdf?territory_id=${territoryId}`
    : `${BASE}/admin/tahap2/export/pdf`;
  await downloadExport(url, token!, `tahap2_${slug}_${today}.pdf`);
};
```

**Error jika tidak ada data (404):**
```json
{ "success": false, "message": "Tidak ada data untuk di-export" }
```

**Error jika tahap 1 belum SUBMITTED (400):**
```json
{ "success": false, "message": "tahap 1 belum disubmit" }
```

---

## 7. Alur Frontend

### Saat halaman dibuka

```typescript
const territoryId = can("*") ? currentTerritory?.id : undefined;

const res = await tahap2Service.getData(territoryId);

if (res berisi error "tahap 1 belum disubmit") {
  // Tampilkan pesan, arahkan ke Tahap 1
}

// Cek status validasi — tampilkan banner jika ada
if (data.tahap2_validasi_status === "REVISI") {
  // Tampilkan banner kuning dengan data.tahap2_validasi_catatan
}
if (data.tahap2_validasi_status === "PENDING") {
  // Tampilkan banner biru "menunggu validasi panitia"
}

if (data.tahap2_status === "SUBMITTED") {
  // Render read-only
} else {
  // Render checklist nomor
}
```

### Render daftar nomor

Kelompokkan `nomor_list` berdasarkan `nama_cabor`:

```
Bulutangkis
  ├── ☑ Tunggal Putra  (INDIVIDU)     terdaftar: true
  ├── ☐ Ganda Putra    (BEREGU)       terdaftar: false
  └── ☐ Ganda Campuran (BEREGU)       terdaftar: false

Atletik
  ├── ☑ 100 M Putra    (INDIVIDU)     terdaftar: true
  └── ☐ 200 M Putra    (INDIVIDU)     terdaftar: false
```

### Saat centang/uncentang nomor

```
terdaftar: false → centang → POST /admin/tahap2/nomor/:nomor_id
terdaftar: true  → uncentang → DELETE /admin/tahap2/nomor/:nomor_id
  ├── 200 → update state lokal (toggle terdaftar)
  └── 400 → tampilkan error
```

### Saat submit

```
POST /admin/tahap2/submit
  ├── 200 → UI ke read-only, badge "SUBMITTED"
  └── 400 → tampilkan error
```

---

## 8. Superadmin — Akses via Territory

Superadmin **selalu** pakai `territory_id` dari query param — bukan dari JWT.

| Method | URL Superadmin | URL Admin Biasa |
|---|---|---|
| GET | `/admin/tahap2?territory_id=2` | `/admin/tahap2` |
| POST | `/admin/tahap2/nomor/69?territory_id=2` | `/admin/tahap2/nomor/69` |
| DELETE | `/admin/tahap2/nomor/69?territory_id=2` | `/admin/tahap2/nomor/69` |
| POST | `/admin/tahap2/submit?territory_id=2` | `/admin/tahap2/submit` |
| GET | `/admin/tahap2/export/pdf?territory_id=2` | `/admin/tahap2/export/pdf` |
| GET | `/admin/tahap2/export/excel?territory_id=2` | `/admin/tahap2/export/excel` |

**Error jika superadmin tidak kirim territory\_id (400):**
```json
{ "success": false, "message": "Superadmin wajib kirim query parameter territory_id" }
```

**Error jika territory tidak punya kontingen (404):**
```json
{ "success": false, "message": "Kontingen untuk territory ini tidak ditemukan" }
```

---

## 9. Ringkasan Endpoint

| Method | URL | Keterangan |
|---|---|---|
| `GET` | `/admin/tahap2` | Ambil status + daftar nomor |
| `POST` | `/admin/tahap2/nomor/:nomor_id` | Daftarkan satu nomor |
| `DELETE` | `/admin/tahap2/nomor/:nomor_id` | Batalkan satu nomor |
| `POST` | `/admin/tahap2/submit` | Kunci tahap 2 |
| `GET` | `/admin/tahap2/export/pdf` | Download PDF rekap nomor |
| `GET` | `/admin/tahap2/export/excel` | Download Excel rekap nomor |

> Semua endpoint support `?territory_id=X` untuk superadmin.
