# Tahap 2 — Pendaftaran Nomor Pertandingan

> **Base URL:** `http://localhost:8000`  
> **Auth:** Semua endpoint wajib kirim header:
> ```
> Authorization: Bearer <token>
> ```
> `kontingen_id` diambil **otomatis dari JWT token**.  
> Superadmin wajib kirim `?territory_id=X` di semua endpoint.

---

## Daftar Isi

1. [Keterkaitan dengan Tahap 1](#1-keterkaitan-dengan-tahap-1)
2. [Struktur Tabel](#2-struktur-tabel)
3. [Aturan Bisnis](#3-aturan-bisnis)
4. [Endpoints](#4-endpoints)
5. [Alur Frontend](#5-alur-frontend)
6. [Superadmin — Akses via Territory](#6-superadmin--akses-via-territory)
7. [Catatan Penting](#7-catatan-penting)

---

## 1. Keterkaitan dengan Tahap 1

Tahap 2 **bergantung pada Tahap 1**. Nomor yang tampil di tahap 2 difilter hanya dari cabor yang sudah dipilih kontingen di tahap 1.

```
Tahap 1: Kontingen pilih Cabor (trx_kontingen_cabor)
           ↓
Tahap 2: Backend ambil nomor dari cabor tersebut (master_nomor WHERE cabor_id IN ...)
         Kontingen centang nomor yang ingin diikuti (trx_kontingen_nomor)
```

**Syarat akses Tahap 2:**
- `tahap1_status` di tabel `kontingen` harus `SUBMITTED`
- Jika belum, GET akan return error: `"tahap 1 belum disubmit"`

---

## 2. Struktur Tabel

### `trx_kontingen_nomor`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint | Auto increment |
| `kontingen_id` | bigint | FK → `kontingen.id` |
| `nomor_id` | bigint | FK → `master_nomor.id` |
| `created_at` | timestamp | Auto isi saat insert |

> Tidak ada `updated_at` di tabel ini.

### `master_nomor` (referensi, read-only dari tahap 2)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint | Primary key |
| `cabor_id` | int | FK → `master_cabor.id` |
| `nama` | varchar(255) | Nama nomor, contoh: "Tunggal", "Ganda" |
| `jenis_kelamin` | enum | `PUTRA` / `PUTRI` / `CAMPURAN` |
| `tipe` | enum | `INDIVIDU` / `BEREGU` |
| `is_active` | tinyint | 1 = aktif, 0 = nonaktif |
| `created_at` | timestamp | Auto isi |

### Status Tahap 2 (di tabel `kontingen`)

| Kolom | Nilai |
|---|---|
| `tahap2_status` | `DRAFT` (default) atau `SUBMITTED` |
| `tahap2_submitted_at` | `null` atau timestamp saat submit |

---

## 3. Aturan Bisnis

| No | Aturan |
|---|---|
| 1 | **Tahap 1 wajib SUBMITTED** sebelum bisa akses tahap 2 |
| 2 | Nomor yang ditampilkan **hanya dari cabor yang dipilih di tahap 1** |
| 3 | Tidak bisa daftar nomor dari cabor yang tidak ada di tahap 1 |
| 4 | Setelah `tahap2_status = SUBMITTED`, semua operasi POST/DELETE ditolak |
| 5 | Submit hanya bisa dilakukan jika minimal ada **1 nomor** yang didaftarkan |
| 6 | Setiap nomor bersifat individual — daftar/batal per nomor, bukan bulk |

---

## 4. Endpoints

### `GET /admin/tahap2` 🔒

Ambil status tahap 2 beserta daftar semua nomor yang tersedia (dari cabor tahap 1), lengkap dengan info apakah kontingen sudah mendaftar di nomor tersebut.

**Query param opsional:**
- Superadmin: `?territory_id=2` (wajib)
- Admin biasa: tidak perlu

**Response 200:**
```json
{
  "success": true,
  "message": "Data tahap 2 berhasil diambil",
  "data": {
    "tahap2_status": "DRAFT",
    "tahap2_submitted_at": null,
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
      },
      {
        "nomor_id": 75,
        "cabor_id": 6,
        "nama_cabor": "Bulutangkis",
        "nama_nomor": "Ganda Campuran",
        "jenis_kelamin": "CAMPURAN",
        "tipe": "BEREGU",
        "terdaftar": false
      }
    ]
  }
}
```

> `nomor_list` diurutkan: nama cabor → jenis kelamin → nama nomor.  
> `terdaftar: true` = sudah ada di `trx_kontingen_nomor`.  
> `terdaftar: false` = tersedia tapi belum didaftarkan.

**Response error tahap 1 belum submit (400):**
```json
{ "success": false, "message": "tahap 1 belum disubmit" }
```

---

### `POST /admin/tahap2/nomor/:nomor_id` 🔒

Daftarkan satu nomor ke kontingen. Memasukkan satu row ke `trx_kontingen_nomor`.

Tidak perlu body — semua info diambil dari URL param dan JWT.

**Contoh:** `POST /admin/tahap2/nomor/69`

**Contoh request:**
```js
await fetch('http://localhost:8000/admin/tahap2/nomor/69', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
})
```

**Response 200:**
```json
{ "success": true, "message": "Nomor berhasil didaftarkan" }
```

**Response error nomor bukan dari cabor tahap 1 (400):**
```json
{ "success": false, "message": "nomor tidak termasuk dalam cabor yang didaftarkan di tahap 1" }
```

**Response error sudah submit (400):**
```json
{ "success": false, "message": "tahap 2 sudah disubmit, tidak dapat diubah" }
```

---

### `DELETE /admin/tahap2/nomor/:nomor_id` 🔒

Batalkan pendaftaran satu nomor dari kontingen. Menghapus row dari `trx_kontingen_nomor`.

**Contoh:** `DELETE /admin/tahap2/nomor/69`

**Contoh request:**
```js
await fetch('http://localhost:8000/admin/tahap2/nomor/69', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
})
```

**Response 200:**
```json
{ "success": true, "message": "Pendaftaran nomor berhasil dibatalkan" }
```

**Response error sudah submit (400):**
```json
{ "success": false, "message": "tahap 2 sudah disubmit, tidak dapat diubah" }
```

---

### `POST /admin/tahap2/submit` 🔒

Kunci tahap 2. Mengubah `tahap2_status` menjadi `SUBMITTED` dan mengisi `tahap2_submitted_at` di tabel `kontingen`.

Setelah submit, semua POST dan DELETE nomor akan ditolak.

Tidak perlu body.

**Response 200:**
```json
{ "success": true, "message": "Tahap 2 berhasil disubmit" }
```

**Response error belum pilih nomor (400):**
```json
{ "success": false, "message": "pilih minimal satu nomor pertandingan sebelum submit" }
```

**Response error sudah submit (400):**
```json
{ "success": false, "message": "tahap 2 sudah disubmit" }
```

---

## 5. Alur Frontend

### Saat halaman dibuka

```
GET /admin/tahap2

Jika error "tahap 1 belum disubmit":
  → Tampilkan pesan, redirect ke Tahap 1

Jika sukses:
  Cek tahap2_status:
  ├── "SUBMITTED" → render semua data read-only, sembunyikan tombol edit
  └── "DRAFT"    → render checklist nomor yang bisa dicentang/uncentang
```

### Render daftar nomor

`nomor_list` berisi semua nomor yang tersedia dari cabor tahap 1.
Kelompokkan berdasarkan `nama_cabor` untuk tampilan yang rapi:

```
Bulutangkis
  ├── ☑ Tunggal (PUTRA, INDIVIDU)        → terdaftar: true
  ├── ☐ Ganda (PUTRA, BEREGU)            → terdaftar: false
  ├── ☐ Tunggal (PUTRI, INDIVIDU)        → terdaftar: false
  └── ☐ Ganda Campuran (CAMPURAN, BEREGU)→ terdaftar: false

Atletik
  ├── ☑ 100 M (PUTRA, INDIVIDU)          → terdaftar: true
  └── ☐ 200 M (PUTRA, INDIVIDU)          → terdaftar: false
```

### Saat user centang nomor

```
User klik checkbox nomor yang belum terdaftar (terdaftar: false)
  → POST /admin/tahap2/nomor/:nomor_id
      ├── 200 OK   → update state: terdaftar = true
      └── 400 Error → tampilkan pesan error
```

### Saat user uncentang nomor

```
User klik checkbox nomor yang sudah terdaftar (terdaftar: true)
  → DELETE /admin/tahap2/nomor/:nomor_id
      ├── 200 OK   → update state: terdaftar = false
      └── 400 Error → tampilkan pesan error
```

### Saat user submit

```
User klik tombol "Submit Tahap 2"
  → Dialog konfirmasi: "Data tidak dapat diubah setelah disubmit. Lanjutkan?"
      └── Konfirmasi → POST /admin/tahap2/submit
            ├── 200 OK   → ubah UI ke mode read-only, tampilkan badge "SUBMITTED"
            └── 400 Error → tampilkan pesan error
```

---

## 6. Superadmin — Akses via Territory

Superadmin tidak punya `kontingen_id` di JWT. Semua endpoint wajib kirim `?territory_id=X`.

| Method | URL Superadmin | URL Admin Biasa |
|---|---|---|
| GET | `/admin/tahap2?territory_id=2` | `/admin/tahap2` |
| POST | `/admin/tahap2/nomor/69?territory_id=2` | `/admin/tahap2/nomor/69` |
| DELETE | `/admin/tahap2/nomor/69?territory_id=2` | `/admin/tahap2/nomor/69` |
| POST | `/admin/tahap2/submit?territory_id=2` | `/admin/tahap2/submit` |

**Error jika territory_id tidak dikirim (400):**
```json
{ "success": false, "message": "Superadmin wajib kirim query parameter territory_id" }
```

**Error jika territory tidak punya kontingen (404):**
```json
{ "success": false, "message": "Kontingen untuk territory ini tidak ditemukan" }
```

---

## 7. Catatan Penting

| Hal | Detail |
|---|---|
| **Syarat akses** | Tahap 1 wajib SUBMITTED |
| **Nomor yang tampil** | Hanya dari cabor yang dipilih di tahap 1 |
| **Validasi saat daftar** | Backend cek `nomor.cabor_id` ada di `trx_kontingen_cabor` kontingen |
| **Tidak ada body** | POST dan DELETE tidak perlu request body |
| **Status lock** | Setelah SUBMITTED, semua POST/DELETE ditolak |
| **Tidak ada bulk** | Daftar/batal per satu nomor — tidak ada endpoint daftar-semua |
| **territory_id** | Superadmin wajib, admin biasa tidak perlu |

---

## Ringkasan Endpoint

| Method | URL | Keterangan |
|---|---|---|
| `GET` | `/admin/tahap2` | Ambil status + daftar nomor dengan status terdaftar |
| `POST` | `/admin/tahap2/nomor/:nomor_id` | Daftarkan satu nomor |
| `DELETE` | `/admin/tahap2/nomor/:nomor_id` | Batalkan satu nomor |
| `POST` | `/admin/tahap2/submit` | Kunci tahap 2 (tidak bisa diurungkan) |
