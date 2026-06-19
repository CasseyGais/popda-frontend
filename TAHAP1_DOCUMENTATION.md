# Tahap 1 — Pendaftaran Cabang Olahraga

> **Base URL:** `http://localhost:8000`  
> **Auth:** Semua endpoint wajib header `Authorization: Bearer <token>`  
> **Admin biasa:** `kontingen_id` otomatis dari JWT — tidak perlu kirim apapun  
> **Superadmin:** Wajib kirim `?territory_id=X` di semua endpoint

---

## Daftar Isi

1. [Konsep kontingen\_id & territory\_id](#1-konsep-kontingen_id--territory_id)
2. [Struktur Tabel](#2-struktur-tabel)
3. [Aturan Bisnis](#3-aturan-bisnis)
4. [Endpoints](#4-endpoints)
5. [Export PDF & Excel](#5-export-pdf--excel)
6. [Endpoint Pendukung](#6-endpoint-pendukung)
7. [Alur Frontend](#7-alur-frontend)
8. [Superadmin — Akses via Territory](#8-superadmin--akses-via-territory)
9. [Ringkasan Endpoint](#9-ringkasan-endpoint)

---

## 1. Konsep kontingen\_id & territory\_id

### Admin biasa

JWT berisi `kontingen_id` yang sudah terikat saat login. Backend langsung pakai nilainya — frontend tidak perlu kirim apapun.

### Superadmin

Backend menggunakan **3 lapis pendeteksian** untuk menentukan apakah request dari superadmin:

1. `claims.Role == "superadmin"` → cara utama, dari field role di JWT
2. `claims.KontingenID == 0` → fallback untuk token lama yang rolenya mungkin tidak ter-set
3. `?territory_id` ada di query → **selalu override JWT**, siapapun yang kirim akan dipakai

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

> **Kunci:** Jika `?territory_id` ada di query, nilainya **selalu dipakai** — mengabaikan `kontingen_id` dari JWT sepenuhnya. Ini mencegah bug di mana superadmin yang akunnya terhubung ke territory tetap dapat data kontingen miliknya sendiri.

### Contoh skenario

```
Superadmin punya KontingenID=2 di JWT (territory Kab. Tangerang)
Superadmin pilih territory Kota Cilegon (id=9) di UI

Request: GET /admin/tahap1?territory_id=9

Backend:
  1. territory_id=9 ada di query
  2. SELECT id FROM kontingen WHERE territory_id = 9 → dapat kontingen_id=15
  3. Return data milik Kota Cilegon (kontingen_id=15)
  ← JWT kontingen_id=2 DIABAIKAN
```

### Setup di frontend

```typescript
const { can } = useAuth();
const { currentTerritory } = useTerritory();

// Satu baris — berlaku untuk semua call di halaman ini
const territoryId = can("*") ? currentTerritory?.id : undefined;

// Superadmin: guard jika territory belum dipilih
if (can("*") && !currentTerritory) {
  return <div>Pilih territory terlebih dahulu</div>;
}
```

**Perbedaan admin vs superadmin:**

| | Admin Biasa | Superadmin |
|---|---|---|
| `territoryId` | `undefined` | `currentTerritory?.id` |
| Query param terkirim | Tidak ada | `?territory_id=X` |
| Backend resolve dari | JWT `KontingenID` | Lookup tabel kontingen |
| Bisa ganti kontingen? | ❌ Tidak | ✅ Ya, via territory selector |

---

## 2. Struktur Tabel

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
| `tahap1_validasi_status` | `null` / `PENDING` / `VALID` / `REVISI` |
| `tahap1_validasi_catatan` | `null` atau teks catatan dari superadmin |
| `tahap1_validasi_at` | `null` atau timestamp saat superadmin terakhir review |

> `tahap1_validasi_status` otomatis jadi `PENDING` saat submit. Superadmin yang set `VALID` atau `REVISI`.

### DB Trigger

Tabel `trx_kontingen_cabor` punya trigger **`BEFORE INSERT`** yang validasi kuota:
- `putra > max_putra` → error
- `putri > max_putri` → error
- `pelatih > max_pelatih` → error

> Trigger hanya aktif saat **INSERT**. Untuk **UPDATE**, validasi dilakukan di service layer backend.

---

## 3. Aturan Bisnis

| No | Aturan |
|---|---|
| 1 | Setelah `tahap1_status = SUBMITTED`, semua PUT dan DELETE **ditolak** |
| 2 | Jumlah `putra`, `putri`, `pelatih` tidak boleh melebihi kuota di `master_cabor` |
| 3 | Submit hanya bisa dilakukan jika minimal ada **1 cabor** yang dipilih |
| 4 | Satu kontingen + satu cabor hanya boleh punya **1 row** — PUT berlaku sebagai upsert |
| 5 | `total_atlet` dan `total_personel` dihitung otomatis, tidak perlu dikirim dari frontend |

---

## 4. Endpoints

### `GET /admin/tahap1` 🔒

Ambil status tahap 1 beserta daftar cabor yang sudah dipilih kontingen.

**Query param:**
- Admin biasa: tidak perlu
- Superadmin: `?territory_id=2` (wajib)

**Response 200:**
```json
{
  "success": true,
  "message": "Data tahap 1 berhasil diambil",
  "data": {
    "kontingen_id": 3,
    "territory_id": 2,
    "nama_kontingen": "Kabupaten Tangerang",
    "tahap1_status": "SUBMITTED",
    "tahap1_submitted_at": "2026-06-10T14:00:00Z",
    "tahap1_validasi_status": "REVISI",
    "tahap1_validasi_catatan": "Jumlah atlet putra melebihi yang seharusnya. Harap perbaiki.",
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

> `tahap1_validasi_status` bisa `null` (belum submit), `"PENDING"` (menunggu review), `"VALID"`, atau `"REVISI"`.  
> Jika `"REVISI"`, tampilkan banner dengan isi `tahap1_validasi_catatan` ke admin kontingen.

---

### `PUT /admin/tahap1` 🔒

Tambah atau update satu cabor. Jika `cabor_id` belum ada → INSERT, sudah ada → UPDATE.

**Content-Type:** `multipart/form-data`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `cabor_id` | number | ✅ | ID dari `master_cabor` |
| `putra` | number | ❌ | Jumlah atlet putra (default 0) |
| `putri` | number | ❌ | Jumlah atlet putri (default 0) |
| `pelatih` | number | ❌ | Jumlah pelatih (default 0) |

```javascript
const form = new FormData();
form.append("cabor_id", "6");
form.append("putra", "3");
form.append("putri", "2");
form.append("pelatih", "1");

await fetch(`${BASE}/admin/tahap1${territoryId ? `?territory_id=${territoryId}` : ""}`, {
  method: "PUT",
  headers: { Authorization: `Bearer ${token}` },
  body: form,
});
```

**Response sukses 200:**
```json
{ "success": true, "message": "Data cabor berhasil disimpan" }
```

**Response error:**
```json
{ "success": false, "message": "jumlah atlet putra melebihi kuota (5)" }
{ "success": false, "message": "Tahap 1 sudah disubmit, tidak dapat diubah" }
```

---

### `DELETE /admin/tahap1/:cabor_id` 🔒

Hapus satu cabor dari daftar tahap 1.

```
DELETE /admin/tahap1/6
DELETE /admin/tahap1/6?territory_id=2   ← superadmin
```

**Response sukses 200:**
```json
{ "success": true, "message": "Cabor berhasil dihapus dari daftar" }
```

---

### `POST /admin/tahap1/submit` 🔒

Kunci tahap 1 — set `tahap1_status = SUBMITTED`. Tidak bisa diurungkan.

```
POST /admin/tahap1/submit
POST /admin/tahap1/submit?territory_id=2   ← superadmin
```

**Response sukses 200:**
```json
{ "success": true, "message": "Tahap 1 berhasil disubmit" }
```

**Response error:**
```json
{ "success": false, "message": "pilih minimal satu cabang olahraga sebelum submit" }
{ "success": false, "message": "Tahap 1 sudah disubmit" }
```

---

## 5. Export PDF & Excel

Download rekap data tahap 1 dalam format PDF atau Excel. Kedua format mendukung superadmin via `?territory_id=X`.

### `GET /admin/tahap1/export/pdf` 🔒

```
GET /admin/tahap1/export/pdf
GET /admin/tahap1/export/pdf?territory_id=2   ← superadmin
```

**Response:** File PDF binary
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="tahap1_Kab_Tangerang_2026-06-03.pdf"
Cache-Control: no-store
```

**Isi file PDF:**
- Header: judul "REKAP ENTRY BY SPORT - POPDA 2026", nama kontingen, tanggal cetak, status (DRAFT/SUBMITTED)
- Tabel data:

| No | Cabang Olahraga | Atlet Putra | Atlet Putri | Pelatih | Total Atlet | Total Personel |
|---|---|---|---|---|---|---|

- Baris TOTAL di footer tabel

---

### `GET /admin/tahap1/export/excel` 🔒

```
GET /admin/tahap1/export/excel
GET /admin/tahap1/export/excel?territory_id=2   ← superadmin
```

**Response:** File XLSX binary
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="tahap1_Kab_Tangerang_2026-06-03.xlsx"
Cache-Control: no-store
```

**Isi file Excel:**
- 1 sheet bernama "Tahap 1"
- Header dokumen di baris 1-3: judul, nama kontingen, tanggal + status
- Header tabel di baris 5: No, Cabang Olahraga, Atlet Putra, Atlet Putri, Pelatih, Total Atlet, Total Personel
- Baris TOTAL di bawah data

**Contoh implementasi frontend:**
```typescript
const handleExportPDF = async () => {
  const url = territoryId
    ? `${BASE}/admin/tahap1/export/pdf?territory_id=${territoryId}`
    : `${BASE}/admin/tahap1/export/pdf`;
  await downloadExport(url, token!, `tahap1_${slug}_${today}.pdf`);
};
```

**Error jika tidak ada data (404):**
```json
{ "success": false, "message": "Tidak ada data untuk di-export" }
```

---

## 6. Endpoint Pendukung

### `GET /admin/master/cabor` 🔒

Ambil semua cabor aktif beserta kuota — untuk populate dropdown di form tahap 1.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 6,
      "nama": "Bulutangkis",
      "max_putra": 5,
      "max_putri": 5,
      "max_pelatih": 2,
      "is_active": true
    }
  ]
}
```

> Gunakan `max_putra`, `max_putri`, `max_pelatih` sebagai batas max di input form.

---

## 7. Alur Frontend

### Saat halaman dibuka

```typescript
const territoryId = can("*") ? currentTerritory?.id : undefined;

// Fetch data
const { data } = await tahap1Service.getData(territoryId);
const { data: caborMaster } = await caborService.getAll();

// Cek status validasi — tampilkan banner jika ada
if (data.tahap1_validasi_status === "REVISI") {
  // Tampilkan banner kuning dengan data.tahap1_validasi_catatan
}
if (data.tahap1_validasi_status === "PENDING") {
  // Tampilkan banner biru "menunggu validasi panitia"
}
if (data.tahap1_validasi_status === "VALID") {
  // Tampilkan badge hijau "data valid"
}

// Cek status submit
if (data.tahap1_status === "SUBMITTED") {
  // Render read-only, sembunyikan tombol edit/hapus/submit
}
```

### Saat user tambah/edit cabor

```
User pilih cabor + isi kuota → PUT /admin/tahap1
  ├── 200 → refresh data
  └── 400 → tampilkan pesan error
```

### Saat user submit

```
User klik "Submit Tahap 1"
  → Konfirmasi dialog
      → POST /admin/tahap1/submit
            ├── 200 → ubah UI ke read-only, badge "SUBMITTED"
            └── 400 → tampilkan error
```

---

## 8. Superadmin — Akses via Territory

Superadmin **selalu** pakai `territory_id` dari query param — JWT diabaikan untuk resolusi kontingen.

| Method | URL Superadmin | URL Admin Biasa |
|---|---|---|
| GET | `/admin/tahap1?territory_id=2` | `/admin/tahap1` |
| PUT | `/admin/tahap1?territory_id=2` | `/admin/tahap1` |
| DELETE | `/admin/tahap1/6?territory_id=2` | `/admin/tahap1/6` |
| POST | `/admin/tahap1/submit?territory_id=2` | `/admin/tahap1/submit` |
| GET | `/admin/tahap1/export/pdf?territory_id=2` | `/admin/tahap1/export/pdf` |
| GET | `/admin/tahap1/export/excel?territory_id=2` | `/admin/tahap1/export/excel` |

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
| `GET` | `/admin/tahap1` | Ambil status + daftar cabor |
| `PUT` | `/admin/tahap1` | Tambah atau update satu cabor (form-data) |
| `DELETE` | `/admin/tahap1/:cabor_id` | Hapus satu cabor |
| `POST` | `/admin/tahap1/submit` | Kunci tahap 1 |
| `GET` | `/admin/tahap1/export/pdf` | Download PDF rekap cabor |
| `GET` | `/admin/tahap1/export/excel` | Download Excel rekap cabor |
| `GET` | `/admin/master/cabor` | Daftar cabor aktif (untuk dropdown) |

> Semua endpoint support `?territory_id=X` untuk superadmin.
