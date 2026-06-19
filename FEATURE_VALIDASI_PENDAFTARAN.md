# Fitur: Validasi Pendaftaran — Backend Spec

> **Kelola:** Superadmin  
> **Lihat:** Admin kontingen (widget dashboard + halaman Rekap Pendaftaran, read-only)  
> **Tujuan:** Superadmin memvalidasi kelengkapan data tiap kontingen per tahap. Admin lihat hasilnya lewat widget dan halaman rekap.

---

## Ringkasan Fitur

Setelah kontingen submit tiap tahap, superadmin melakukan review data. Superadmin bisa memberi status **Valid** atau **Revisi** per tahap per kontingen, disertai catatan jika perlu revisi.

Admin kontingen mendapat dua cara untuk memantau status:
1. **Widget dashboard** — notifikasi cepat, selalu terlihat
2. **Halaman Rekap Pendaftaran** — tampilan lengkap semua data dalam satu halaman, bisa self-check sebelum/sesudah divalidasi

Alur umum:
```
Kontingen submit Tahap X
        ↓
Status otomatis → PENDING (menunggu review superadmin)
        ↓
Superadmin review di halaman Validasi Pendaftaran
        ↓
    ┌─────────────────────────┐
    │  VALID  │  REVISI       │
    └─────────────────────────┘
        ↓              ↓
  Widget admin     Widget admin
  tampil hijau     tampil kuning + catatan
                        ↓
               Admin buka Rekap Pendaftaran
               → lihat bagian mana yang bermasalah
                        ↓
               Admin perbaiki data di halaman tahap masing-masing
                        ↓
               Submit ulang → status kembali PENDING
                        ↓
               Superadmin review ulang
```

---

## Skema Tabel MySQL yang Diperlukan

### Tambah Kolom di Tabel `kontingen` yang Sudah Ada

Tidak perlu tabel baru. Cukup tambah kolom validasi di tabel `kontingen`:

```sql
ALTER TABLE kontingen
  ADD COLUMN tahap1_validasi_status  ENUM('PENDING','VALID','REVISI') NULL DEFAULT NULL AFTER tahap1_submitted_at,
  ADD COLUMN tahap1_validasi_catatan TEXT NULL DEFAULT NULL AFTER tahap1_validasi_status,
  ADD COLUMN tahap1_validasi_at      DATETIME NULL DEFAULT NULL AFTER tahap1_validasi_catatan,

  ADD COLUMN tahap2_validasi_status  ENUM('PENDING','VALID','REVISI') NULL DEFAULT NULL AFTER tahap2_submitted_at,
  ADD COLUMN tahap2_validasi_catatan TEXT NULL DEFAULT NULL AFTER tahap2_validasi_status,
  ADD COLUMN tahap2_validasi_at      DATETIME NULL DEFAULT NULL AFTER tahap2_validasi_catatan,

  ADD COLUMN tahap3_validasi_status  ENUM('PENDING','VALID','REVISI') NULL DEFAULT NULL AFTER tahap3_submitted_at,
  ADD COLUMN tahap3_validasi_catatan TEXT NULL DEFAULT NULL AFTER tahap3_validasi_status,
  ADD COLUMN tahap3_validasi_at      DATETIME NULL DEFAULT NULL AFTER tahap3_validasi_catatan;
```

### Penjelasan Status

| Status | Kapan | Artinya |
|--------|-------|---------|
| `NULL` | Sebelum kontingen submit | Belum ada data untuk divalidasi |
| `PENDING` | Otomatis saat kontingen submit | Menunggu review superadmin |
| `VALID` | Superadmin set | Data lengkap dan benar |
| `REVISI` | Superadmin set | Ada yang perlu diperbaiki, lihat catatan |

### Trigger Otomatis: Set PENDING saat Submit

Saat `POST /admin/tahap1/submit` berhasil, backend otomatis set:
```sql
UPDATE kontingen
SET tahap1_validasi_status = 'PENDING',
    tahap1_validasi_catatan = NULL,
    tahap1_validasi_at = NULL
WHERE id = :kontingen_id;
```

Berlaku sama untuk submit Tahap 2 dan Tahap 3.

---

## Aturan Bisnis

| No | Aturan |
|----|--------|
| 1 | Hanya superadmin yang bisa set status VALID atau REVISI |
| 2 | Status `PENDING` di-set otomatis backend saat kontingen submit, bukan oleh superadmin |
| 3 | Admin kontingen hanya bisa lihat statusnya (read-only, via widget dan halaman rekap) |
| 4 | Jika status REVISI → superadmin wajib isi `catatan` (tidak boleh kosong) |
| 5 | Jika kontingen submit ulang setelah REVISI → status kembali ke PENDING otomatis |
| 6 | VALID tidak otomatis — superadmin yang tentukan setelah cek manual |
| 7 | Superadmin bisa ubah dari VALID kembali ke REVISI jika ditemukan masalah |
| 8 | Superadmin bisa buka kembali tahap (via fitur Pengaturan Tahap) agar kontingen bisa revisi |

---

## Endpoints Baru yang Diperlukan

### `GET /admin/validasi-pendaftaran` 🔒 (Superadmin only)

Ambil semua kontingen beserta status validasi ketiga tahap. Dipakai di halaman Validasi Pendaftaran superadmin.

```
GET /admin/validasi-pendaftaran
GET /admin/validasi-pendaftaran?status=PENDING        ← filter by status
GET /admin/validasi-pendaftaran?tahap=1               ← filter by tahap
GET /admin/validasi-pendaftaran?territory_id=2        ← filter by territory
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "kontingen_id": 2,
      "territory_id": 1,
      "nama_kontingen": "Kabupaten Tangerang",
      "tahap1": {
        "submit_status": "SUBMITTED",
        "submitted_at": "2026-06-10T14:00:00Z",
        "validasi_status": "PENDING",
        "validasi_catatan": null,
        "validasi_at": null
      },
      "tahap2": {
        "submit_status": "SUBMITTED",
        "submitted_at": "2026-07-05T09:00:00Z",
        "validasi_status": "REVISI",
        "validasi_catatan": "Nomor ganda campuran belum didaftarkan padahal kuota masih ada",
        "validasi_at": "2026-07-06T11:00:00Z"
      },
      "tahap3": {
        "submit_status": "DRAFT",
        "submitted_at": null,
        "validasi_status": null,
        "validasi_catatan": null,
        "validasi_at": null
      }
    }
  ]
}
```

---

### `PUT /admin/validasi-pendaftaran/:kontingen_id/tahap/:tahap` 🔒 (Superadmin only)

Set status validasi satu tahap untuk satu kontingen.

```
PUT /admin/validasi-pendaftaran/2/tahap/1
Authorization: Bearer <token_superadmin>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "VALID",
  "catatan": null
}
```

atau jika REVISI:
```json
{
  "status": "REVISI",
  "catatan": "Jumlah atlet putra bulutangkis melebihi yang seharusnya. Harap perbaiki."
}
```

**Validasi request:**
- `status` wajib: `VALID` atau `REVISI`
- `catatan` wajib diisi jika `status = REVISI`
- `tahap` di URL wajib 1, 2, atau 3

**Response sukses 200:**
```json
{
  "success": true,
  "message": "Validasi Tahap 1 kontingen Kabupaten Tangerang berhasil disimpan",
  "data": {
    "kontingen_id": 2,
    "tahap": 1,
    "status": "VALID",
    "catatan": null,
    "validasi_at": "2026-06-11T09:00:00Z"
  }
}
```

**Response error — REVISI tanpa catatan (400):**
```json
{ "success": false, "message": "Catatan wajib diisi jika status REVISI" }
```

**Response error — tahap belum disubmit (400):**
```json
{ "success": false, "message": "Kontingen belum submit Tahap 1, tidak ada yang bisa divalidasi" }
```

---

### `GET /admin/validasi-pendaftaran/status` 🔒 (Semua Role)

Endpoint ringan — hanya return status validasi kontingen yang sedang login. Dipakai widget dashboard admin.

```
GET /admin/validasi-pendaftaran/status
Authorization: Bearer <token_admin>

# Superadmin (baca status kontingen tertentu):
GET /admin/validasi-pendaftaran/status?territory_id=2
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "kontingen_id": 2,
    "nama_kontingen": "Kabupaten Tangerang",
    "tahap1": {
      "validasi_status": "VALID",
      "validasi_catatan": null
    },
    "tahap2": {
      "validasi_status": "REVISI",
      "validasi_catatan": "Nomor ganda campuran belum didaftarkan"
    },
    "tahap3": {
      "validasi_status": null
    }
  }
}
```

---

### `GET /admin/rekap-pendaftaran` 🔒 (Semua Role)

Ambil semua data pendaftaran kontingen dalam satu response — untuk halaman Rekap Pendaftaran admin dan halaman detail validasi superadmin.

**Admin biasa:** data kontingen sendiri (dari JWT)  
**Superadmin:** wajib kirim `?territory_id=X`

```
GET /admin/rekap-pendaftaran
GET /admin/rekap-pendaftaran?territory_id=2   ← superadmin
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "kontingen_id": 2,
    "territory_id": 1,
    "nama_kontingen": "Kabupaten Tangerang",

    "validasi": {
      "tahap1": { "status": "VALID", "catatan": null },
      "tahap2": { "status": "REVISI", "catatan": "Nomor ganda campuran belum didaftarkan" },
      "tahap3": { "status": "PENDING", "catatan": null }
    },

    "cabor_terpilih": [
      {
        "cabor_id": 6,
        "nama_cabor": "Bulutangkis",
        "putra": 2,
        "putri": 1,
        "pelatih": 1,
        "total_atlet": 3
      }
    ],

    "nomor_terdaftar": [
      {
        "nomor_id": 69,
        "cabor_id": 6,
        "nama_cabor": "Bulutangkis",
        "nama_nomor": "Tunggal",
        "jenis_kelamin": "PUTRA",
        "tipe": "INDIVIDU"
      },
      {
        "nomor_id": 70,
        "cabor_id": 6,
        "nama_cabor": "Bulutangkis",
        "nama_nomor": "Ganda",
        "jenis_kelamin": "PUTRA",
        "tipe": "BEREGU"
      }
    ],

    "atlets": [
      {
        "id": 1,
        "nama_lengkap": "Grayson O'Brien",
        "jenis_kelamin": "L",
        "tanggal_lahir": "2010-03-15",
        "nisn": "1232143214",
        "sekolah": "SMPN 1 Serang",
        "kelas_jurusan": "VIII A",
        "kabupaten_kota": "Kab. Serang",
        "no_hp": "08123456789",
        "status": "terdaftar",
        "trx": [
          {
            "cabor_id": 6,
            "nama_cabor": "Bulutangkis",
            "nomor_id": 69,
            "nama_nomor": "Tunggal",
            "jenis_kelamin": "PUTRA",
            "tipe": "INDIVIDU"
          }
        ]
      }
    ],

    "pelatihs": [
      {
        "id": 1,
        "nama_lengkap": "Budi Santoso",
        "jenis_kelamin": "L",
        "jabatan": "Pelatih Kepala",
        "no_hp": "08198765432",
        "status": "terdaftar",
        "trx": [
          { "cabor_id": 6, "nama_cabor": "Bulutangkis" }
        ]
      }
    ],

    "officials": [
      {
        "id": 1,
        "nama_lengkap": "Siti Rahayu",
        "jenis_kelamin": "P",
        "jabatan": "Manajer Tim",
        "no_hp": "08187654321",
        "status": "terdaftar",
        "trx": [
          { "keterangan": "Terdaftar sebagai official kontingen" }
        ]
      }
    ]
  }
}
```

> **Catatan:** Field `trx` di dalam setiap atlet/pelatih/official menunjukkan cabor/nomor yang sudah didaftarkan. Ini memungkinkan admin cek langsung dari satu halaman apakah semua atlet sudah punya nomor pertandingan.

---

## Perubahan di Endpoint yang Sudah Ada

### Submit Tahap — Otomatis Set PENDING

Saat `POST /admin/tahap1/submit` sukses, tambahkan logika:

```go
// Setelah set tahap1_status = SUBMITTED
kontingen.Tahap1ValidasiStatus = "PENDING"
kontingen.Tahap1ValidasiCatatan = nil
kontingen.Tahap1ValidasiAt = nil
db.Save(&kontingen)
```

Berlaku sama untuk `POST /admin/tahap2/submit` dan `POST /admin/tahap3/submit`.

### Response GET Tahap — Sertakan Status Validasi

Tambahkan field validasi di response `GET /admin/tahap1`, `GET /admin/tahap2`, `GET /admin/tahap3`:

```json
{
  "success": true,
  "data": {
    "tahap1_status": "SUBMITTED",
    "tahap1_validasi_status": "REVISI",
    "tahap1_validasi_catatan": "Jumlah atlet putra melebihi yang seharusnya",
    ...
  }
}
```

Frontend menampilkan banner REVISI jika ada catatan.

---

## Tampilan di Frontend (Referensi)

### Widget Dashboard Admin (read-only)

```
┌─────────────────────────────────────────────────┐
│  Status Pendaftaran                              │
│                                                  │
│  Tahap 1 (Entry By Sport)                        │
│  ✓ SUBMITTED  ●  VALID                           │
│                                                  │
│  Tahap 2 (Entry By Number)                       │
│  ✓ SUBMITTED  ⚠  REVISI                         │
│  "Nomor ganda campuran belum didaftarkan"        │
│                                                  │
│  Tahap 3 (Entry By Name)                         │
│  ○ DRAFT      —  Belum disubmit                  │
└─────────────────────────────────────────────────┘
```

### Halaman Rekap Pendaftaran (Admin — read-only)

Halaman dedicated di sidebar admin, mengumpulkan semua data dalam satu view:

```
Rekap Pendaftaran — Kabupaten Tangerang
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[STATUS VALIDASI]
  Tahap 1 (By Sport)  : ✓ VALID
  Tahap 2 (By Number) : ⚠ REVISI
                        "Nomor ganda campuran belum didaftarkan"
  Tahap 3 (By Name)   : ⏳ PENDING

[CABOR & NOMOR TERDAFTAR]
  Bulutangkis — Putra: 2 | Putri: 1 | Pelatih: 1
    ✓ Tunggal Putra  (INDIVIDU)
    ✓ Ganda Putra    (BEREGU)
    ✗ Ganda Campuran (BEREGU) ← belum didaftar di Tahap 2

[ATLET (3 orang)]
  No | Nama              | JK | NISN       | Sekolah          | Nomor Pertandingan
   1 | Grayson O'Brien   | L  | 1232143214 | SMPN 1 Serang    | Bulutangkis / Tunggal Putra
   2 | ...

[PELATIH (1 orang)]
  No | Nama         | Jabatan        | Cabor
   1 | Budi Santoso | Pelatih Kepala | Bulutangkis

[OFFICIAL (1 orang)]
  No | Nama        | Jabatan
   1 | Siti Rahayu | Manajer Tim
```

> **Halaman ini read-only.** Untuk edit data, admin tetap ke halaman Tahap 1/2/3 masing-masing.  
> Tombol shortcut tersedia: "Edit di Tahap 1", "Edit di Tahap 2", "Edit di Tahap 3"

### Banner REVISI di Halaman Tahap

```
┌─────────────────────────────────────────────────────┐
│  ⚠  Data Tahap 2 perlu direvisi                     │
│     Catatan panitia: "Nomor ganda campuran belum    │
│     didaftarkan padahal kuota masih ada"            │
│                                                     │
│     Silakan perbaiki data dan submit ulang.         │
└─────────────────────────────────────────────────────┘
```

### Halaman Validasi Pendaftaran (Superadmin)

Tabel semua kontingen dengan filter dan tombol aksi validasi:

```
[ Filter: Semua ▼ ] [ Tahap: Semua ▼ ] [ Status: PENDING ▼]

Nama Kontingen        | Tahap 1    | Tahap 2    | Tahap 3    | Aksi
──────────────────────|────────────|────────────|────────────|──────
Kab. Tangerang        | ✓ VALID    | ⚠ REVISI   | — Belum    | [Detail/Validasi]
Kab. Serang           | ⏳ PENDING  | — Belum    | — Belum    | [Detail/Validasi]
Kota Cilegon          | ✓ VALID    | ✓ VALID    | ⏳ PENDING  | [Detail/Validasi]
Kab. Lebak            | — Belum    | — Belum    | — Belum    | —
```

Tombol **[Detail/Validasi]** membuka halaman Rekap Pendaftaran untuk territory tersebut (`GET /admin/rekap-pendaftaran?territory_id=X`), dengan tambahan form validasi di bagian atas.

---

## Ringkasan Endpoint

| Method | URL | Auth | Keterangan |
|--------|-----|------|------------|
| `GET` | `/admin/validasi-pendaftaran` | Superadmin | List semua kontingen + status validasi |
| `PUT` | `/admin/validasi-pendaftaran/:id/tahap/:tahap` | Superadmin | Set VALID atau REVISI |
| `GET` | `/admin/validasi-pendaftaran/status` | Semua | Status validasi kontingen sendiri (widget) |
| `GET` | `/admin/rekap-pendaftaran` | Semua | Semua data kontingen dalam satu response (halaman rekap) |

---

## Checklist Implementasi Backend

- [ ] Jalankan `ALTER TABLE kontingen` untuk tambah 12 kolom validasi baru
- [ ] Update handler `POST /admin/tahap1/submit` → auto-set `tahap1_validasi_status = 'PENDING'`
- [ ] Update handler `POST /admin/tahap2/submit` → auto-set `tahap2_validasi_status = 'PENDING'`
- [ ] Update handler `POST /admin/tahap3/submit` → auto-set `tahap3_validasi_status = 'PENDING'`
- [ ] Update response `GET /admin/tahap1` → sertakan field `tahap1_validasi_status` dan `tahap1_validasi_catatan`
- [ ] Update response `GET /admin/tahap2` → sertakan field validasi
- [ ] Update response `GET /admin/tahap3` → sertakan field validasi
- [ ] Buat handler `GET /admin/validasi-pendaftaran` (list semua, superadmin only)
- [ ] Buat handler `PUT /admin/validasi-pendaftaran/:id/tahap/:tahap` (set status, superadmin only)
- [ ] Buat handler `GET /admin/validasi-pendaftaran/status` (status kontingen sendiri, semua role)
- [ ] Buat handler `GET /admin/rekap-pendaftaran` (semua data dalam satu response, semua role)
- [ ] Validasi: REVISI wajib ada catatan
- [ ] Validasi: tidak bisa validasi tahap yang belum disubmit
