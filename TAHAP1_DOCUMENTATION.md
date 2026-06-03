# Tahap 1 — Pendaftaran Cabang Olahraga

> **Base URL:** `http://localhost:8000`  
> **Auth:** Semua endpoint wajib kirim header:
> ```
> Authorization: Bearer <token>
> ```
> `kontingen_id` diambil **otomatis dari JWT token** — tidak perlu dikirim di body.

---

## Daftar Isi

1. [Struktur Tabel](#1-struktur-tabel)
2. [Aturan Bisnis](#2-aturan-bisnis)
3. [Endpoints](#3-endpoints)
4. [Endpoint Pendukung](#4-endpoint-pendukung)
5. [Alur Frontend](#5-alur-frontend)
6. [Catatan Penting](#6-catatan-penting)

---

## 1. Struktur Tabel

### `trx_kontingen_cabor`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint | Auto increment |
| `kontingen_id` | bigint | FK → `kontingen.id` |
| `cabor_id` | int | FK → `master_cabor.id` |
| `putra` | int | Jumlah atlet putra (default 0) |
| `putri` | int | Jumlah atlet putri (default 0) |
| `pelatih` | int | Jumlah pelatih (default 0) |
| `total_atlet` | int | `putra + putri` — dihitung otomatis backend |
| `total_personel` | int | `total_atlet + pelatih` — dihitung otomatis backend |
| `created_at` | timestamp | Auto isi saat insert |

> Tidak ada `updated_at` di tabel ini.

### Status di tabel `kontingen`

| Kolom | Nilai |
|---|---|
| `tahap1_status` | `DRAFT` (default) atau `SUBMITTED` |
| `tahap1_submitted_at` | `null` atau timestamp saat submit |

### DB Trigger

Tabel `trx_kontingen_cabor` memiliki trigger **`BEFORE INSERT`** yang memvalidasi kuota:

```sql
-- Jika putra > max_putra  → error: "Jumlah atlet putra melebihi kuota"
-- Jika putri > max_putri  → error: "Jumlah atlet putri melebihi kuota"
-- Jika pelatih > max_pelatih → error: "Jumlah pelatih melebihi kuota"
```

> Trigger hanya aktif saat **INSERT**. Untuk operasi **UPDATE**, validasi dilakukan di service layer backend.

---

## 2. Aturan Bisnis

| No | Aturan |
|---|---|
| 1 | Setelah `tahap1_status = SUBMITTED`, semua operasi edit (PUT, DELETE) **ditolak** |
| 2 | Jumlah `putra`, `putri`, `pelatih` tidak boleh melebihi kuota di `master_cabor` |
| 3 | Submit hanya bisa dilakukan jika minimal ada **1 cabor** yang dipilih |
| 4 | Satu kontingen + satu cabor hanya boleh punya **1 row** — PUT berlaku sebagai upsert (insert atau update) |
| 5 | `total_atlet` dan `total_personel` dihitung otomatis, tidak perlu dikirim dari frontend |

---

## 3. Endpoints

### `GET /admin/tahap1` 🔒

Ambil status tahap 1 beserta daftar cabor yang sudah dipilih kontingen.

**Response 200:**
```json
{
  "success": true,
  "message": "Data tahap 1 berhasil diambil",
  "data": {
    "tahap1_status": "DRAFT",
    "tahap1_submitted_at": null,
    "cabor_list": [
      {
        "id": 1,
        "kontingen_id": 3,
        "cabor_id": 6,
        "putra": 3,
        "putri": 2,
        "pelatih": 1,
        "total_atlet": 5,
        "total_personel": 6,
        "created_at": "2026-06-01T10:00:00Z"
      }
    ]
  }
}
```

> `cabor_list` berupa array kosong `[]` jika belum ada cabor yang dipilih.

**Response error (500):**
```json
{ "success": false, "message": "kontingen tidak ditemukan" }
```

---

### `PUT /admin/tahap1` 🔒

Tambah atau update satu cabor di daftar tahap 1.

- Jika `cabor_id` **belum ada** untuk kontingen ini → **INSERT** baru
- Jika `cabor_id` **sudah ada** → **UPDATE** kuotanya

**Content-Type:** `multipart/form-data` *(bukan JSON)*

**Form fields:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `cabor_id` | number | ✅ | ID cabor dari tabel `master_cabor` |
| `putra` | number | ❌ | Jumlah atlet putra (default 0) |
| `putri` | number | ❌ | Jumlah atlet putri (default 0) |
| `pelatih` | number | ❌ | Jumlah pelatih (default 0) |

> **Jangan kirim** `total_atlet` dan `total_personel` — dihitung otomatis di backend.

**Contoh request (JavaScript):**
```js
const form = new FormData()
form.append('cabor_id', '6')
form.append('putra', '3')
form.append('putri', '2')
form.append('pelatih', '1')

const res = await fetch('http://localhost:8000/admin/tahap1', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  // Jangan set Content-Type — biarkan browser set otomatis untuk FormData
  body: form
})
```

**Response sukses (200):**
```json
{ "success": true, "message": "Data cabor berhasil disimpan" }
```

**Response error kuota (400):**
```json
{ "success": false, "message": "jumlah atlet putra melebihi kuota (5)" }
```

**Response error cabor tidak ditemukan (400):**
```json
{ "success": false, "message": "cabor tidak ditemukan" }
```

**Response error sudah submit (400):**
```json
{ "success": false, "message": "Tahap 1 sudah disubmit, tidak dapat diubah" }
```

---

### `DELETE /admin/tahap1/:cabor_id` 🔒

Hapus satu cabor dari daftar tahap 1.

**Contoh:** `DELETE /admin/tahap1/6`

**Contoh request:**
```js
await fetch('http://localhost:8000/admin/tahap1/6', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
})
```

**Response sukses (200):**
```json
{ "success": true, "message": "Cabor berhasil dihapus dari daftar" }
```

**Response error sudah submit (400):**
```json
{ "success": false, "message": "Tahap 1 sudah disubmit, tidak dapat diubah" }
```

---

### `POST /admin/tahap1/submit` 🔒

Kunci tahap 1. Mengubah `tahap1_status` menjadi `SUBMITTED` dan mengisi `tahap1_submitted_at` di tabel `kontingen`.

Setelah submit, semua operasi PUT dan DELETE di tahap 1 akan ditolak.

**Tidak perlu body.**

**Contoh request:**
```js
await fetch('http://localhost:8000/admin/tahap1/submit', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
})
```

**Response sukses (200):**
```json
{ "success": true, "message": "Tahap 1 berhasil disubmit" }
```

**Response error belum pilih cabor (400):**
```json
{ "success": false, "message": "pilih minimal satu cabang olahraga sebelum submit" }
```

**Response error sudah submit (400):**
```json
{ "success": false, "message": "Tahap 1 sudah disubmit" }
```

---

## 4. Endpoint Pendukung

Frontend perlu memanggil endpoint ini untuk menampilkan daftar cabor yang bisa dipilih.

### `GET /admin/master/cabor` 🔒

Ambil semua cabor yang aktif beserta batas kuota.

**Response 200:**
```json
{
  "success": true,
  "message": "Data cabang olahraga berhasil diambil",
  "data": [
    {
      "id": 6,
      "nama": "Bulutangkis",
      "max_putra": 5,
      "max_putri": 5,
      "max_pelatih": 2,
      "is_active": true,
      "created_at": "2026-02-11T08:25:14Z"
    },
    {
      "id": 1,
      "nama": "Atletik",
      "max_putra": 26,
      "max_putri": 26,
      "max_pelatih": 4,
      "is_active": true,
      "created_at": "2026-02-11T08:25:14Z"
    }
  ]
}
```

> Gunakan `max_putra`, `max_putri`, `max_pelatih` untuk set batas maksimum input di form.

---

## 5. Alur Frontend

### Saat halaman dibuka

```
GET /admin/tahap1        → ambil status + cabor yang sudah dipilih
GET /admin/master/cabor  → ambil semua cabor aktif untuk ditampilkan

Jika tahap1_status === "SUBMITTED":
  → Render semua data sebagai read-only
  → Sembunyikan tombol tambah, edit, hapus, dan submit

Jika tahap1_status === "DRAFT":
  → Render form yang bisa diedit
```

### Saat user tambah atau edit cabor

```
User pilih cabor dari dropdown + isi jumlah putra/putri/pelatih
  → PUT /admin/tahap1 (form-data)
      ├── 200 OK   → refresh daftar cabor (GET /admin/tahap1 atau update state lokal)
      └── 400 Error → tampilkan pesan dari response.message ke user
```

### Saat user hapus cabor

```
User klik tombol hapus pada baris cabor
  → Dialog konfirmasi
      └── Konfirmasi → DELETE /admin/tahap1/:cabor_id
            ├── 200 OK   → hapus baris dari tampilan
            └── 400 Error → tampilkan pesan error
```

### Saat user submit

```
User klik tombol "Submit Tahap 1"
  → Dialog konfirmasi: "Data tidak dapat diubah setelah disubmit. Lanjutkan?"
      └── Konfirmasi → POST /admin/tahap1/submit
            ├── 200 OK   → ubah semua UI ke mode read-only, tampilkan badge "SUBMITTED"
            └── 400 Error → tampilkan pesan error
```

---

## 6. Catatan Penting

| Hal | Detail |
|---|---|
| **Content-Type** | PUT wajib `multipart/form-data`, bukan `application/json` |
| **kontingen_id** | Tidak perlu dikirim — diambil otomatis dari JWT token |
| **total_atlet** | Tidak perlu dikirim — `putra + putri`, dihitung di backend |
| **total_personel** | Tidak perlu dikirim — `total_atlet + pelatih`, dihitung di backend |
| **Validasi kuota INSERT** | Dilakukan oleh DB trigger `before_insert_trx_kontingen_cabor` |
| **Validasi kuota UPDATE** | Dilakukan di service layer Go (trigger tidak aktif saat UPDATE) |
| **Status lock** | Setelah `SUBMITTED`, semua PUT dan DELETE ditolak dengan error 400 |
| **Upsert behavior** | PUT berfungsi sebagai insert jika cabor belum ada, update jika sudah ada |
| **cabor_list kosong** | Normal — artinya kontingen belum pilih cabor apapun |

---

## Ringkasan Endpoint

| Method | URL | Keterangan |
|---|---|---|
| `GET` | `/admin/tahap1` | Ambil status + daftar cabor |
| `PUT` | `/admin/tahap1` | Tambah atau update satu cabor (form-data) |
| `DELETE` | `/admin/tahap1/:cabor_id` | Hapus satu cabor |
| `POST` | `/admin/tahap1/submit` | Kunci tahap 1 (tidak bisa diurungkan) |
| `GET` | `/admin/master/cabor` | Ambil semua cabor aktif (untuk dropdown) |
