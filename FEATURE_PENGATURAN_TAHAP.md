# Fitur: Pengaturan Tahap (Buka/Tutup) — Backend Spec

> **Kelola:** Superadmin  
> **Dampak:** Admin kontingen tidak bisa akses tahap yang belum dibuka  
> **Tujuan:** Superadmin mengontrol kapan Tahap 1, Tahap 2, dan Tahap 3 bisa diakses oleh semua kontingen

---

## Ringkasan Fitur

Setiap tahap pendaftaran (By Sport, By Number, By Name) punya jadwal tersendiri yang diatur superadmin. Jika superadmin belum membuka tahap, admin kontingen akan melihat pesan "Tahap X belum dibuka" dan tidak bisa melakukan input apapun.

Superadmin bisa:
- Set tanggal buka dan tanggal tutup per tahap
- Toggle manual buka/tutup (override tanggal)
- Lihat status semua tahap sekaligus

---

## Skema Tabel MySQL yang Diperlukan

### Tabel Baru: `pengaturan_tahap`

```sql
CREATE TABLE IF NOT EXISTS pengaturan_tahap (
  id            TINYINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tahap         TINYINT UNSIGNED NOT NULL,
  is_open       TINYINT(1) NOT NULL DEFAULT 0,
  tanggal_buka  DATE NULL DEFAULT NULL,
  tanggal_tutup DATE NULL DEFAULT NULL,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tahap (tahap)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO pengaturan_tahap (tahap, is_open) VALUES (1, 0), (2, 0), (3, 0);
```

> **Catatan:** Tidak perlu tambah kolom di tabel `kontingen`. Pengaturan tahap bersifat **global** — berlaku untuk semua kontingen sekaligus, bukan per kontingen.

---

## Aturan Bisnis

| No | Aturan |
|----|--------|
| 1 | Hanya superadmin yang bisa buka/tutup tahap |
| 2 | Jika `is_open = 0` → semua endpoint Tahap X ditolak dengan `403` |
| 3 | `tanggal_buka` dan `tanggal_tutup` bersifat informatif — `is_open` adalah kontrol utama |
| 4 | Superadmin bisa paksa tutup meski masih dalam rentang tanggal (override manual) |
| 5 | Tahap 2 hanya bisa dibuka jika Tahap 1 sudah pernah dibuka (tidak wajib masih buka) |
| 6 | Tahap 3 hanya bisa dibuka jika Tahap 2 sudah pernah dibuka |
| 7 | Admin biasa tidak bisa lihat atau ubah pengaturan ini |

---

## Dampak ke Endpoint yang Sudah Ada

Semua endpoint Tahap 1/2/3 perlu dicek `is_open` sebelum proses:

```
Request masuk ke GET/PUT/POST/DELETE /admin/tahap1 (atau tahap2, tahap3)
        ↓
Cek pengaturan_tahap WHERE tahap = 1 AND is_open = 1
        ↓
    is_open = 0 → return 403: "Tahap 1 belum dibuka oleh superadmin"
        ↓
    is_open = 1 → lanjut proses normal
```

**Endpoint yang terdampak:**

| Endpoint | Tahap dicek |
|----------|-------------|
| `GET/PUT/DELETE /admin/tahap1` | Tahap 1 |
| `POST /admin/tahap1/submit` | Tahap 1 |
| `GET/POST/DELETE /admin/tahap2` | Tahap 2 |
| `POST /admin/tahap2/submit` | Tahap 2 |
| `GET/POST/DELETE /admin/tahap3/atlet` | Tahap 3 |
| `GET/POST/DELETE /admin/master/pelatih` | Tahap 3 |
| `GET/POST/DELETE /admin/master/official` | Tahap 3 |
| `POST /admin/tahap3/submit` | Tahap 3 |
| `GET /admin/tahap1/export/*` | Tahap 1 |
| `GET /admin/tahap2/export/*` | Tahap 2 |
| `GET /admin/tahap3/export/*` | Tahap 3 |

> **Pengecualian:** `GET /admin/tahap1` boleh tetap bisa diakses untuk baca-saja meskipun tutup, supaya admin bisa lihat data yang sudah diinput sebelumnya. Yang diblokir adalah operasi tulis (PUT, POST, DELETE).

---

## Endpoints Baru yang Diperlukan

### `GET /admin/pengaturan-tahap` 🔒 (Semua Role)

Ambil status semua tahap. Dipakai frontend untuk tampilkan banner "Tahap X belum dibuka".

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "tahap": 1,
      "is_open": true,
      "tanggal_buka": "2026-06-01",
      "tanggal_tutup": "2026-06-30",
      "updated_at": "2026-06-01T08:00:00Z"
    },
    {
      "tahap": 2,
      "is_open": false,
      "tanggal_buka": "2026-07-01",
      "tanggal_tutup": "2026-07-31",
      "updated_at": "2026-05-20T10:00:00Z"
    },
    {
      "tahap": 3,
      "is_open": false,
      "tanggal_buka": null,
      "tanggal_tutup": null,
      "updated_at": "2026-05-20T10:00:00Z"
    }
  ]
}
```

---

### `PUT /admin/pengaturan-tahap/:tahap` 🔒 (Superadmin only)

Update pengaturan satu tahap. Superadmin bisa toggle buka/tutup dan set tanggal.

```
PUT /admin/pengaturan-tahap/1
Authorization: Bearer <token_superadmin>
Content-Type: application/json
```

**Request Body (semua field opsional, kirim yang mau diubah saja):**
```json
{
  "is_open": true,
  "tanggal_buka": "2026-06-01",
  "tanggal_tutup": "2026-06-30"
}
```

**Response sukses 200:**
```json
{
  "success": true,
  "message": "Pengaturan Tahap 1 berhasil diupdate",
  "data": {
    "tahap": 1,
    "is_open": true,
    "tanggal_buka": "2026-06-01",
    "tanggal_tutup": "2026-06-30",
    "updated_at": "2026-06-01T08:00:00Z"
  }
}
```

**Response error — bukan superadmin (403):**
```json
{ "success": false, "message": "Hanya superadmin yang bisa mengubah pengaturan tahap" }
```

**Response error — urutan tahap salah (400):**
```json
{ "success": false, "message": "Tahap 2 tidak bisa dibuka sebelum Tahap 1 pernah dibuka" }
```

---

## Alur di Frontend (Referensi)

### Saat halaman Tahap 1/2/3 dibuka

```
1. Frontend fetch GET /admin/pengaturan-tahap
2. Cek is_open untuk tahap yang relevan
3. Jika is_open = false:
   → Tampilkan banner kuning: "Tahap 1 belum dibuka. Hubungi panitia."
   → Sembunyikan tombol tambah/edit/submit
   → Tidak perlu fetch data tahap (opsional)
4. Jika is_open = true:
   → Lanjut fetch data normal
```

### Banner yang ditampilkan ke admin kontingen

```
┌─────────────────────────────────────────────────────┐
│  ⚠  Tahap 2 belum dibuka.                           │
│     Pendaftaran nomor pertandingan akan dibuka pada  │
│     1 Juli 2026. Hubungi panitia jika ada pertanyaan.│
└─────────────────────────────────────────────────────┘
```

### Halaman pengaturan di panel superadmin (Settings)

Tampilan tabel dengan toggle switch per tahap:

```
Tahap 1 — Entry By Sport     [BUKA ●──]  01 Jun - 30 Jun 2026  [Edit Tanggal]
Tahap 2 — Entry By Number    [TUTUP ──○] 01 Jul - 31 Jul 2026  [Edit Tanggal]
Tahap 3 — Entry By Name      [TUTUP ──○] (belum diset)         [Edit Tanggal]
```

---

## Error Response untuk Endpoint Tahap saat Tutup

Semua endpoint tahap yang diblokir mengembalikan:

```json
{
  "success": false,
  "message": "Tahap 1 belum dibuka. Silakan hubungi panitia.",
  "error_code": "TAHAP_CLOSED"
}
```

HTTP Status: `403 Forbidden`

---

## Ringkasan Endpoint Baru

| Method | URL | Auth | Keterangan |
|--------|-----|------|------------|
| `GET` | `/admin/pengaturan-tahap` | Semua | Status semua tahap |
| `PUT` | `/admin/pengaturan-tahap/1` | Superadmin | Update Tahap 1 |
| `PUT` | `/admin/pengaturan-tahap/2` | Superadmin | Update Tahap 2 |
| `PUT` | `/admin/pengaturan-tahap/3` | Superadmin | Update Tahap 3 |

---

## Checklist Implementasi Backend

- [ ] Buat tabel `pengaturan_tahap` + seed 3 row awal
- [ ] Buat middleware/guard `checkTahapOpen(tahap int)` yang baca tabel ini
- [ ] Pasang guard ke semua endpoint tahap yang melakukan operasi tulis
- [ ] Buat handler `GET /admin/pengaturan-tahap`
- [ ] Buat handler `PUT /admin/pengaturan-tahap/:tahap` dengan validasi superadmin
- [ ] Unit test: akses tahap tutup → 403, akses tahap buka → 200
