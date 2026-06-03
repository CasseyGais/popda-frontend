# Tahap 3 — Pendaftaran Atlet, Pelatih & Official

> **Base URL:** `http://localhost:8000`  
> **Auth:** Semua endpoint wajib kirim header:
> ```
> Authorization: Bearer <token>
> ```
>
> **Penting — Superadmin vs Admin Biasa:**
> | | Admin Biasa | Superadmin |
> |---|---|---|
> | `kontingen_id` di JWT | Ada (> 0) | Tidak ada (= 0) |
> | Cara akses | Otomatis dari token | Wajib kirim `?territory_id=X` |
>
> Superadmin **tidak** menggunakan `kontingen_id` dari JWT — selalu dari `territory_id` query param.

---

## Daftar Isi

1. [Struktur Tabel](#1-struktur-tabel)
2. [Konsep: Master vs Transaksi](#2-konsep-master-vs-transaksi)
3. [Overview — GET /admin/tahap3](#3-overview)
4. [CRUD Atlet](#4-crud-atlet)
5. [CRUD Pelatih](#5-crud-pelatih)
6. [CRUD Official](#6-crud-official)
7. [Transaksi Pendaftaran (Manual)](#7-transaksi-pendaftaran)
8. [Submit Tahap 3](#8-submit-tahap-3)
9. [Superadmin — Akses via Territory](#9-superadmin--akses-via-territory)
10. [Ringkasan Endpoint](#10-ringkasan-endpoint)

---

## 1. Struktur Tabel

### `master_atlet`

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `id` | bigint | auto | Primary key |
| `kontingen_id` | bigint | ✅ | FK → `kontingen.id` |
| `nama_lengkap` | varchar(150) | ✅ | |
| `jenis_kelamin` | enum('L','P') | ✅ | L = Laki-laki, P = Perempuan |
| `tanggal_lahir` | date | ✅ | Format: `YYYY-MM-DD` |
| `tempat_lahir` | varchar(100) | ❌ | |
| `nisn` | varchar(20) | ✅ | **Unique** |
| `nis` | varchar(20) | ❌ | |
| `sekolah` | varchar(150) | ✅ | |
| `kelas_jurusan` | varchar(50) | ❌ | |
| `alamat` | text | ❌ | |
| `kabupaten_kota` | varchar(100) | ✅ | |
| `no_hp` | varchar(20) | ❌ | |
| `nama_ortu_wali` | varchar(150) | ❌ | |
| `status` | enum | auto | `draft` / `terdaftar` / `terverifikasi` / `ditolak` |
| `foto` | varchar(255) | ❌ | Path file upload |
| `file_kartu_pelajar` | varchar(255) | ❌ | Path file upload |
| `file_akte_kelahiran` | varchar(255) | ❌ | Path file upload |
| `file_kk` | varchar(255) | ❌ | Path file upload |
| `file_surat_keterangan_sekolah` | varchar(255) | ❌ | Path file upload |
| `file_surat_izin_ortu` | varchar(255) | ❌ | Path file upload |
| `prestasi_sebelumnya` | text | ❌ | |
| `catatan` | text | ❌ | |
| `created_at` | timestamp | auto | |
| `updated_at` | timestamp | auto | |

### `master_pelatih`

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `id` | bigint | auto | |
| `kontingen_id` | bigint | ✅ | |
| `nama_lengkap` | varchar(150) | ✅ | |
| `jenis_kelamin` | enum('L','P') | ✅ | |
| `tanggal_lahir` | date | ❌ | |
| `tempat_lahir` | varchar(100) | ❌ | |
| `nik` | varchar(20) | ❌ | **Unique** |
| `sekolah_asal` | varchar(150) | ❌ | |
| `profesi` | varchar(100) | ❌ | |
| `jabatan` | varchar(100) | ❌ | |
| `alamat` | text | ❌ | |
| `kabupaten_kota` | varchar(100) | ✅ | |
| `no_hp` | varchar(20) | ✅ | |
| `email` | varchar(100) | ❌ | |
| `nama_istri_suami` | varchar(150) | ❌ | |
| `status` | enum | auto | `draft` / `terdaftar` / `terverifikasi` / `ditolak` |
| `foto` | varchar(255) | ❌ | |
| `file_ktp` | varchar(255) | ❌ | |
| `file_surat_tugas` | varchar(255) | ❌ | |
| `file_sertifikat_pelatih` | varchar(255) | ❌ | |
| `prestasi_sebelumnya` | text | ❌ | |
| `catatan` | text | ❌ | |

### `master_official`

| Kolom | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `id` | bigint | auto | |
| `kontingen_id` | bigint | ✅ | |
| `nama_lengkap` | varchar(150) | ✅ | |
| `jenis_kelamin` | enum('L','P') | ✅ | |
| `tanggal_lahir` | date | ❌ | |
| `tempat_lahir` | varchar(100) | ❌ | |
| `nik` | varchar(20) | ❌ | **Unique** |
| `sekolah_asal` | varchar(150) | ❌ | |
| `jabatan` | varchar(100) | ✅ | |
| `alamat` | text | ❌ | |
| `kabupaten_kota` | varchar(100) | ✅ | |
| `no_hp` | varchar(20) | ✅ | |
| `email` | varchar(100) | ❌ | |
| `status` | enum | auto | `draft` / `terdaftar` / `terverifikasi` / `ditolak` |
| `foto` | varchar(255) | ❌ | |
| `file_ktp` | varchar(255) | ❌ | |
| `file_surat_tugas` | varchar(255) | ❌ | |
| `catatan` | text | ❌ | |

### `trx_pendaftaran_atlet`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint | Primary key |
| `atlet_id` | bigint | FK → `master_atlet.id` |
| `cabor_id` | int | FK → `master_cabor.id` |
| `nomor_id` | bigint | FK → `master_nomor.id` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

> Tidak ada `kontingen_id` langsung — diakses via JOIN ke `master_atlet`.

### `trx_pendaftaran_pelatih`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint | Primary key |
| `pelatih_id` | bigint | FK → `master_pelatih.id` |
| `cabor_id` | int | FK → `master_cabor.id` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### `trx_pendaftaran_official`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint | Primary key |
| `official_id` | bigint | FK → `master_official.id` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### Status di tabel `kontingen`

| Kolom | Nilai |
|---|---|
| `tahap3_status` | `DRAFT` (default) atau `SUBMITTED` |
| `tahap3_submitted_at` | `null` atau timestamp saat submit |

> Tabel `kontingen` sekarang punya kolom lengkap untuk semua tahap:
> `tahap1_status`, `tahap1_submitted_at`, `tahap2_status`, `tahap2_submitted_at`, `tahap3_status`, `tahap3_submitted_at`

---

## 2. Konsep: Master vs Transaksi

Tahap 3 terbagi dua bagian:

**Master Data** — Data biodata lengkap per orang:
- `master_atlet` → data diri atlet milik kontingen
- `master_pelatih` → data diri pelatih milik kontingen
- `master_official` → data diri official milik kontingen

**Transaksi Pendaftaran** — Menghubungkan person ke kompetisi:
- `trx_pendaftaran_atlet` → atlet didaftarkan ke cabor + nomor tertentu
- `trx_pendaftaran_pelatih` → pelatih didaftarkan ke cabor
- `trx_pendaftaran_official` → official didaftarkan (tanpa cabor spesifik)

Ada **dua cara** mengisi transaksi:

**Cara 1 — Manual (per orang):**
```
POST /tahap3/trx/atlet   → daftarkan satu atlet ke satu nomor
POST /tahap3/trx/pelatih → daftarkan satu pelatih ke satu cabor
POST /tahap3/trx/official → daftarkan satu official
```

**Cara 2 — Otomatis saat Submit (direkomendasikan):**
```
POST /tahap3/submit
→ Semua atlet/pelatih/official yang ada di master langsung di-insert ke trx_pendaftaran_*
→ tahap3_status di tabel kontingen → SUBMITTED
```

```
Alur yang disarankan:
1. Tambah biodata atlet → master_atlet (POST /tahap3/atlet)
2. Upload dokumen → (PUT /tahap3/atlet/:id/foto, /file/:kolom)
3. Tambah pelatih dan official yang sama
4. Klik Submit → POST /tahap3/submit
   Backend otomatis insert ke trx_pendaftaran_atlet/pelatih/official
```

---

## 3. Overview

### `GET /admin/tahap3` 🔒

Ambil semua data tahap 3 milik kontingen dalam satu request.

**Query param:** Superadmin wajib kirim `?territory_id=X`

**Response 200:**
```json
{
  "success": true,
  "message": "Data tahap 3 berhasil diambil",
  "data": {
    "kontingen": {
      "id": 3,
      "nama_kontingen": "Kontingen 3",
      "tahap1_status": "SUBMITTED",
      "tahap1_submitted_at": "2026-06-02T14:54:34Z",
      "tahap2_status": "SUBMITTED",
      "tahap2_submitted_at": "2026-06-02T17:09:46Z",
      "tahap3_status": "DRAFT",
      "tahap3_submitted_at": null
    },
    "atlets": [ ...array of MasterAtlet... ],
    "pelatihs": [ ...array of MasterPelatih... ],
    "officials": [ ...array of MasterOfficial... ],
    "trx_atlets": [ ...array of TrxPendaftaranAtlet... ],
    "trx_pelatihs": [ ...array of TrxPendaftaranPelatih... ],
    "trx_officials": [ ...array of TrxPendaftaranOfficial... ]
  }
}
```

---

## 4. CRUD Atlet

### `GET /admin/tahap3/atlet` 🔒
Daftar semua atlet milik kontingen.

**Query param:** Superadmin wajib `?territory_id=X`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kontingen_id": 3,
      "nama_lengkap": "Ahmad Fauzi",
      "jenis_kelamin": "L",
      "tanggal_lahir": "2008-05-15",
      "tempat_lahir": "Tangerang",
      "nisn": "1234567890",
      "nis": "2024001",
      "sekolah": "SMP Negeri 1 Tangerang",
      "kelas_jurusan": "VIII A",
      "alamat": "Jl. Contoh No. 1",
      "kabupaten_kota": "Kabupaten Tangerang",
      "no_hp": "08123456789",
      "nama_ortu_wali": "Bapak Fauzi",
      "status": "draft",
      "foto": null,
      "file_kartu_pelajar": null,
      "file_akte_kelahiran": null,
      "file_kk": null,
      "file_surat_keterangan_sekolah": null,
      "file_surat_izin_ortu": null,
      "prestasi_sebelumnya": null,
      "catatan": null,
      "created_at": "2026-06-03T10:00:00Z",
      "updated_at": "2026-06-03T10:00:00Z"
    }
  ]
}
```

---

### `GET /admin/tahap3/atlet/:id` 🔒
Detail satu atlet by ID. Tidak perlu `territory_id`.

---

### `POST /admin/tahap3/atlet` 🔒
Tambah atlet baru. `kontingen_id` diisi otomatis dari token (atau dari `territory_id` untuk superadmin).

**Query param:** Superadmin wajib `?territory_id=X`

**Request Body (JSON):**
```json
{
  "nama_lengkap": "Ahmad Fauzi",
  "jenis_kelamin": "L",
  "tanggal_lahir": "2008-05-15",
  "tempat_lahir": "Tangerang",
  "nisn": "1234567890",
  "nis": "2024001",
  "sekolah": "SMP Negeri 1 Tangerang",
  "kelas_jurusan": "VIII A",
  "alamat": "Jl. Contoh No. 1",
  "kabupaten_kota": "Kabupaten Tangerang",
  "no_hp": "08123456789",
  "nama_ortu_wali": "Bapak Fauzi",
  "prestasi_sebelumnya": "",
  "catatan": ""
}
```

**Field wajib:** `nama_lengkap`, `jenis_kelamin` (`L`/`P`), `tanggal_lahir`, `nisn`, `sekolah`, `kabupaten_kota`

> `status` otomatis diisi `draft` oleh backend — tidak perlu dikirim.  
> `kontingen_id` tidak perlu dikirim — diambil dari token/territory.

**Response 201:**
```json
{
  "success": true,
  "message": "Atlet berhasil dibuat",
  "data": { ...MasterAtlet... }
}
```

---

### `PUT /admin/tahap3/atlet/:id` 🔒
Update data atlet. Semua field opsional — hanya yang dikirim yang diupdate.

**Request Body (JSON):** Sama dengan POST, semua field opsional.

---

### `DELETE /admin/tahap3/atlet/:id` 🔒
Hapus atlet permanen (**hard delete**). Tidak perlu `territory_id`.

---

### `PUT /admin/tahap3/atlet/:id/foto` 🔒
Upload foto atlet.

**Content-Type:** `multipart/form-data`  
**Field:** `foto` (file gambar)

**Response 200:**
```json
{
  "success": true,
  "message": "Foto atlet berhasil diupload",
  "path": "/uploads/atlet/1717123456789_foto.jpg"
}
```

---

### `PUT /admin/tahap3/atlet/:id/file/:kolom` 🔒
Upload dokumen atlet. Satu endpoint untuk semua jenis dokumen.

**Content-Type:** `multipart/form-data`  
**Field:** `file` (file dokumen)

**`:kolom` yang valid:**
| Nilai `:kolom` | Keterangan |
|---|---|
| `file_kartu_pelajar` | Kartu pelajar |
| `file_akte_kelahiran` | Akta kelahiran |
| `file_kk` | Kartu Keluarga |
| `file_surat_keterangan_sekolah` | Surat keterangan dari sekolah |
| `file_surat_izin_ortu` | Surat izin orang tua |

**Contoh:** `PUT /admin/tahap3/atlet/1/file/file_kartu_pelajar`

**Response 200:**
```json
{
  "success": true,
  "message": "File berhasil diupload",
  "path": "/uploads/atlet/docs/1717123456789_kartu.jpg"
}
```

---

## 5. CRUD Pelatih

### `GET /admin/tahap3/pelatih` 🔒
Daftar semua pelatih milik kontingen. Superadmin wajib `?territory_id=X`.

### `GET /admin/tahap3/pelatih/:id` 🔒
Detail satu pelatih.

### `POST /admin/tahap3/pelatih` 🔒
Tambah pelatih baru. Superadmin wajib `?territory_id=X`.

**Request Body (JSON):**
```json
{
  "nama_lengkap": "Budi Pelatih",
  "jenis_kelamin": "L",
  "tanggal_lahir": "1985-03-20",
  "tempat_lahir": "Jakarta",
  "nik": "3271234567890001",
  "sekolah_asal": "SMA Negeri 1",
  "profesi": "Pelatih Profesional",
  "jabatan": "Pelatih Kepala",
  "alamat": "Jl. Pelatih No. 5",
  "kabupaten_kota": "Kota Tangerang",
  "no_hp": "08111111111",
  "email": "budi@popda.id",
  "nama_istri_suami": "Siti",
  "prestasi_sebelumnya": "",
  "catatan": ""
}
```

**Field wajib:** `nama_lengkap`, `jenis_kelamin` (`L`/`P`), `kabupaten_kota`, `no_hp`

### `PUT /admin/tahap3/pelatih/:id` 🔒
Update data pelatih. Semua field opsional.

### `DELETE /admin/tahap3/pelatih/:id` 🔒
Hapus pelatih permanen (**hard delete**).

### `PUT /admin/tahap3/pelatih/:id/file/:kolom` 🔒
Upload dokumen pelatih.

**Content-Type:** `multipart/form-data`  
**Field:** `file`

**`:kolom` yang valid:**
| Nilai `:kolom` | Keterangan |
|---|---|
| `foto` | Foto pelatih |
| `file_ktp` | Scan KTP |
| `file_surat_tugas` | Surat tugas |
| `file_sertifikat_pelatih` | Sertifikat pelatih |

**Contoh:** `PUT /admin/tahap3/pelatih/1/file/foto`

---

## 6. CRUD Official

### `GET /admin/tahap3/official` 🔒
Daftar semua official milik kontingen. Superadmin wajib `?territory_id=X`.

### `GET /admin/tahap3/official/:id` 🔒
Detail satu official.

### `POST /admin/tahap3/official` 🔒
Tambah official baru. Superadmin wajib `?territory_id=X`.

**Request Body (JSON):**
```json
{
  "nama_lengkap": "Siti Official",
  "jenis_kelamin": "P",
  "tanggal_lahir": "1990-07-10",
  "tempat_lahir": "Serang",
  "nik": "3271234567890002",
  "sekolah_asal": "SMA Negeri 2",
  "jabatan": "Manajer Tim",
  "alamat": "Jl. Official No. 3",
  "kabupaten_kota": "Kota Serang",
  "no_hp": "08222222222",
  "email": "siti@popda.id",
  "catatan": ""
}
```

**Field wajib:** `nama_lengkap`, `jenis_kelamin` (`L`/`P`), `jabatan`, `kabupaten_kota`, `no_hp`

### `PUT /admin/tahap3/official/:id` 🔒
Update data official. Semua field opsional.

### `DELETE /admin/tahap3/official/:id` 🔒
Hapus official permanen (**hard delete**).

### `PUT /admin/tahap3/official/:id/file/:kolom` 🔒
Upload dokumen official.

**Content-Type:** `multipart/form-data`  
**Field:** `file`

**`:kolom` yang valid:**
| Nilai `:kolom` | Keterangan |
|---|---|
| `foto` | Foto official |
| `file_ktp` | Scan KTP |
| `file_surat_tugas` | Surat tugas |

---

## 7. Transaksi Pendaftaran (Manual)

Selain submit otomatis, bisa juga daftar manual per orang sebelum submit.

### `POST /admin/tahap3/trx/atlet` 🔒
Daftarkan atlet ke cabor dan nomor tertentu.

**Request Body (JSON):**
```json
{
  "atlet_id": 1,
  "cabor_id": 6,
  "nomor_id": 69
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Atlet berhasil didaftarkan",
  "data": {
    "id": 1,
    "atlet_id": 1,
    "cabor_id": 6,
    "nomor_id": 69,
    "created_at": "2026-06-03T10:00:00Z",
    "updated_at": "2026-06-03T10:00:00Z"
  }
}
```

---

### `DELETE /admin/tahap3/trx/atlet/:id` 🔒
Batalkan pendaftaran atlet. `:id` adalah ID dari `trx_pendaftaran_atlet`.

**Response 200:**
```json
{ "success": true, "message": "Pendaftaran atlet berhasil dihapus" }
```

---

### `POST /admin/tahap3/trx/pelatih` 🔒
Daftarkan pelatih ke cabor.

**Request Body (JSON):**
```json
{
  "pelatih_id": 1,
  "cabor_id": 6
}
```

---

### `DELETE /admin/tahap3/trx/pelatih/:id` 🔒
Batalkan pendaftaran pelatih.

---

### `POST /admin/tahap3/trx/official` 🔒
Daftarkan official.

**Request Body (JSON):**
```json
{
  "official_id": 1
}
```

---

### `DELETE /admin/tahap3/trx/official/:id` 🔒
Batalkan pendaftaran official.

---

## 8. Submit Tahap 3

### `POST /admin/tahap3/submit` 🔒

Kunci tahap 3. Saat di-submit, backend otomatis melakukan:

1. **Validasi** — minimal ada 1 atlet di `master_atlet` kontingen
2. **Bulk insert atlet** → semua atlet di `master_atlet` di-insert ke `trx_pendaftaran_atlet` (skip yang sudah ada)
3. **Bulk insert pelatih** → semua pelatih di `master_pelatih` di-insert ke `trx_pendaftaran_pelatih`
4. **Bulk insert official** → semua official di `master_official` di-insert ke `trx_pendaftaran_official`
5. **Update status** → `tahap3_status = SUBMITTED`, `tahap3_submitted_at = NOW()` di tabel `kontingen`

**Query param:** Superadmin wajib kirim `?territory_id=X`

Tidak perlu body.

**Response 200:**
```json
{
  "success": true,
  "message": "Tahap 3 berhasil disubmit. Semua atlet, pelatih, dan official telah didaftarkan."
}
```

**Response error belum ada atlet (400):**
```json
{ "success": false, "message": "minimal harus ada 1 atlet sebelum submit" }
```

**Response error sudah submit (400):**
```json
{ "success": false, "message": "tahap 3 sudah disubmit" }
```

### Apa yang terjadi di database saat submit

```
Sebelum submit:
  master_atlet: Ahmad Fauzi (kontingen_id=3)
  master_pelatih: Budi Pelatih (kontingen_id=3)
  master_official: Siti Official (kontingen_id=3)
  trx_pendaftaran_atlet: (kosong)
  trx_pendaftaran_pelatih: (kosong)
  trx_pendaftaran_official: (kosong)
  kontingen.tahap3_status: DRAFT

Setelah submit:
  trx_pendaftaran_atlet:
    ┌─────┬──────────┬──────────┬──────────┐
    │ id  │ atlet_id │ cabor_id │ nomor_id │
    ├─────┼──────────┼──────────┼──────────┤
    │  1  │    1     │    6     │   69     │
    └─────┴──────────┴──────────┴──────────┘
  
  trx_pendaftaran_pelatih:
    ┌─────┬────────────┬──────────┐
    │ id  │ pelatih_id │ cabor_id │
    ├─────┼────────────┼──────────┤
    │  1  │     1      │    6     │
    └─────┴────────────┴──────────┘
  
  trx_pendaftaran_official:
    ┌─────┬─────────────┐
    │ id  │ official_id │
    ├─────┼─────────────┤
    │  1  │      1      │
    └─────┴─────────────┘
  
  kontingen.tahap3_status: SUBMITTED
  kontingen.tahap3_submitted_at: 2026-06-03 10:00:00
```

> Data atlet di-pasangkan ke cabor+nomor dari `trx_kontingen_cabor` dan `trx_kontingen_nomor` yang dipilih di Tahap 1 & 2.  
> Setelah SUBMITTED, tidak bisa submit lagi.

---

## 9. Superadmin — Akses via Territory

Superadmin memiliki `kontingen_id = 0` di JWT. Backend **tidak menggunakan** `kontingen_id` dari token untuk superadmin.

Semua endpoint yang butuh `kontingen_id` (GET list, POST create) wajib kirim `?territory_id=X`.

Endpoint yang **tidak** butuh `territory_id` (karena pakai ID langsung):
- `GET /tahap3/atlet/:id`
- `PUT /tahap3/atlet/:id`
- `DELETE /tahap3/atlet/:id`
- `PUT /tahap3/atlet/:id/foto`
- `PUT /tahap3/atlet/:id/file/:kolom`
- Dan equivalent untuk pelatih & official
- Semua endpoint `trx` (pakai `atlet_id`/`pelatih_id`/`official_id` langsung)

### Contoh lengkap superadmin

```js
const territoryId = 3  // Kabupaten Serang

// GET daftar atlet
fetch(`http://localhost:8000/admin/tahap3/atlet?territory_id=${territoryId}`, {
  headers: { Authorization: `Bearer ${token}` }
})

// POST tambah atlet
fetch(`http://localhost:8000/admin/tahap3/atlet?territory_id=${territoryId}`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nama_lengkap: 'Ahmad Fauzi',
    jenis_kelamin: 'L',
    tanggal_lahir: '2008-05-15',
    nisn: '1234567890',
    sekolah: 'SMP Negeri 1',
    kabupaten_kota: 'Kabupaten Serang'
  })
})

// PUT update (tidak perlu territory_id)
fetch(`http://localhost:8000/admin/tahap3/atlet/1`, {
  method: 'PUT',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ nama_lengkap: 'Ahmad Fauzi Updated' })
})

// DELETE (tidak perlu territory_id)
fetch(`http://localhost:8000/admin/tahap3/atlet/1`, {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${token}` }
})
```

**Error jika superadmin lupa kirim territory_id (400):**
```json
{ "success": false, "message": "Superadmin wajib kirim query parameter territory_id" }
```

**Error territory tidak punya kontingen (404):**
```json
{ "success": false, "message": "Kontingen untuk territory ini tidak ditemukan" }
```

---

## 10. Ringkasan Endpoint

### Master Data

| Method | URL | `territory_id` | Keterangan |
|---|---|---|---|
| GET | `/admin/tahap3` | Superadmin | Overview semua data |
| **POST** | **`/admin/tahap3/submit`** | **Superadmin** | **Kunci tahap 3 + auto insert trx** |
| GET | `/admin/tahap3/atlet` | Superadmin | Daftar atlet kontingen |
| GET | `/admin/tahap3/atlet/:id` | ❌ | Detail atlet |
| POST | `/admin/tahap3/atlet` | Superadmin | Tambah atlet |
| PUT | `/admin/tahap3/atlet/:id` | ❌ | Update atlet |
| DELETE | `/admin/tahap3/atlet/:id` | ❌ | Hapus atlet |
| PUT | `/admin/tahap3/atlet/:id/foto` | ❌ | Upload foto |
| PUT | `/admin/tahap3/atlet/:id/file/:kolom` | ❌ | Upload dokumen |
| GET | `/admin/tahap3/pelatih` | Superadmin | Daftar pelatih |
| GET | `/admin/tahap3/pelatih/:id` | ❌ | Detail pelatih |
| POST | `/admin/tahap3/pelatih` | Superadmin | Tambah pelatih |
| PUT | `/admin/tahap3/pelatih/:id` | ❌ | Update pelatih |
| DELETE | `/admin/tahap3/pelatih/:id` | ❌ | Hapus pelatih |
| PUT | `/admin/tahap3/pelatih/:id/file/:kolom` | ❌ | Upload file pelatih |
| GET | `/admin/tahap3/official` | Superadmin | Daftar official |
| GET | `/admin/tahap3/official/:id` | ❌ | Detail official |
| POST | `/admin/tahap3/official` | Superadmin | Tambah official |
| PUT | `/admin/tahap3/official/:id` | ❌ | Update official |
| DELETE | `/admin/tahap3/official/:id` | ❌ | Hapus official |
| PUT | `/admin/tahap3/official/:id/file/:kolom` | ❌ | Upload file official |

### Transaksi

| Method | URL | `territory_id` | Keterangan |
|---|---|---|---|
| POST | `/admin/tahap3/trx/atlet` | ❌ | Daftarkan atlet ke cabor+nomor |
| DELETE | `/admin/tahap3/trx/atlet/:id` | ❌ | Batalkan pendaftaran atlet |
| POST | `/admin/tahap3/trx/pelatih` | ❌ | Daftarkan pelatih ke cabor |
| DELETE | `/admin/tahap3/trx/pelatih/:id` | ❌ | Batalkan pendaftaran pelatih |
| POST | `/admin/tahap3/trx/official` | ❌ | Daftarkan official |
| DELETE | `/admin/tahap3/trx/official/:id` | ❌ | Batalkan pendaftaran official |

> `territory_id` kolom: **Superadmin** = wajib kirim, **❌** = tidak diperlukan sama sekali.

### Nilai enum yang valid

| Field | Nilai |
|---|---|
| `jenis_kelamin` | `L` (Laki-laki) atau `P` (Perempuan) |
| `status` (master) | `draft` / `terdaftar` / `terverifikasi` / `ditolak` |

> `status` diisi otomatis `draft` saat create — tidak perlu dikirim dari frontend.

### Path file upload

| Jenis | Folder | Contoh path |
|---|---|---|
| Foto atlet | `uploads/atlet/` | `/uploads/atlet/123456_foto.jpg` |
| Dokumen atlet | `uploads/atlet/docs/` | `/uploads/atlet/docs/123456_kk.pdf` |
| File pelatih | `uploads/pelatih/` | `/uploads/pelatih/123456_ktp.jpg` |
| File official | `uploads/official/` | `/uploads/official/123456_surat.pdf` |
