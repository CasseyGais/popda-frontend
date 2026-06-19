# Tahap 3 — Entry By Name: Master Pelatih & Master Official

> **Base URL:** `http://localhost:8000`  
> **Auth:** Semua endpoint wajib header `Authorization: Bearer <token>`  
> **Admin biasa:** Tidak perlu kirim apapun — `kontingen_id` otomatis dari JWT  
> **Superadmin:** Wajib kirim `?territory_id=X` di semua endpoint

---

## Daftar Isi

1. [Konsep kontingen\_id & territory\_id](#1-konsep-kontingen_id--territory_id)
2. [Isolasi Data & Validasi Kepemilikan](#2-isolasi-data--validasi-kepemilikan)
3. [Implementasi Frontend — Admin vs Superadmin](#3-implementasi-frontend--admin-vs-superadmin)
4. [Overview Tahap 3 — GET & Referensi](#4-overview-tahap-3--get--referensi)
5. [Master Pelatih — CRUD](#5-master-pelatih--crud)
6. [Master Pelatih — Upload File](#6-master-pelatih--upload-file)
7. [Master Pelatih — Transaksi Pendaftaran](#7-master-pelatih--transaksi-pendaftaran)
8. [Master Official — CRUD](#8-master-official--crud)
9. [Master Official — Upload File](#9-master-official--upload-file)
10. [Master Official — Transaksi Pendaftaran](#10-master-official--transaksi-pendaftaran)
11. [Alur Otomatis ke Transaksi](#11-alur-otomatis-ke-transaksi)
12. [Export PDF & Excel](#12-export-pdf--excel)
13. [Ringkasan Endpoint](#13-ringkasan-endpoint)
14. [Struktur Data](#14-struktur-data)
15. [Error Handling](#15-error-handling)

---

## 1. Konsep kontingen\_id & territory\_id

Ini adalah konsep paling penting yang harus dipahami sebelum mengintegrasikan endpoint manapun.

### Apa itu kontingen\_id?

`kontingen_id` adalah identifier unik untuk satu kontingen (kabupaten/kota). Semua data pelatih, official, atlet, dan pendaftaran selalu terikat ke satu `kontingen_id`.

### Apa itu territory\_id?

`territory_id` adalah identifier wilayah (kabupaten/kota) dalam tabel `territories`. Satu territory punya tepat satu kontingen. Hubungannya:

```
territory (kabupaten/kota)
    └── kontingen (satu per territory)
            ├── master_pelatih
            ├── master_official
            ├── trx_pendaftaran_pelatih
            └── trx_pendaftaran_official
```

### Bagaimana backend tahu kontingen siapa?

Backend menggunakan **3 lapis pendeteksian** (defense in depth) untuk menentukan `kontingen_id` yang aktif:

```
1. claims.Role == "superadmin"   → cara utama (JWT punya field role)
2. claims.KontingenID == 0       → fallback token lama / superadmin tanpa kontingen
3. ?territory_id ada di query    → selalu override JWT (fix untuk bug territory)
```

**Alur prioritas backend:**
```
Ada ?territory_id di query?
        │
       YA → SELECT id FROM kontingen WHERE territory_id = X → pakai
        │
       TIDAK
        │
       Superadmin? (role=="superadmin" ATAU KontingenID==0)
        │
       YA  → error 400: "wajib kirim territory_id"
        │
       TIDAK → admin biasa → pakai KontingenID dari JWT
```

> **Kunci penting:** Jika `?territory_id` ada di query, nilainya **selalu dipakai** terlepas dari nilai `kontingen_id` di JWT. Ini mencegah superadmin yang akunnya terhubung ke territory tetap mendapat data miliknya sendiri saat sudah pilih territory lain di UI.

**Contoh skenario nyata:**
```
Superadmin login → JWT berisi KontingenID=2 (Kab. Tangerang)
Superadmin pilih territory Kota Cilegon (id=9) di territory selector

Request: GET /admin/tahap3/atlet?territory_id=9

Backend:
  1. territory_id=9 ada di query → langsung pakai
  2. SELECT id FROM kontingen WHERE territory_id = 9 → kontingen_id=15
  3. Return atlet milik Kota Cilegon
  ← KontingenID=2 dari JWT TIDAK DIPAKAI
```

### Admin biasa

JWT berisi `kontingen_id` yang sudah terikat saat login. Tidak perlu kirim `territory_id`.

```
Admin biasa request → GET /admin/tahap3/atlet
                           ↓
          claims.KontingenID = 5 (dari JWT)
                           ↓
     SELECT * FROM master_atlet WHERE kontingen_id = 5
```

### Superadmin

Wajib kirim `?territory_id=X` di semua request. Jika tidak → `400 Bad Request`.

```typescript
// Di TerritoryContext — territory yang dipilih superadmin
const { currentTerritory } = useTerritory();

// Superadmin: territory_id dari selector, admin biasa: undefined
const territoryId = can("*") ? currentTerritory?.id : undefined;
```

**Admin biasa:**
- JWT berisi `kontingen_id` yang sudah terikat saat login
- Backend langsung pakai nilai itu — tidak perlu kirim apapun dari frontend
- Tidak bisa akses data kontingen lain

**Superadmin:**
- JWT tidak berisi `kontingen_id` (nilainya 0)
- Wajib kirim `?territory_id=X` di setiap request
- Backend cari `kontingen_id` berdasarkan territory itu
- Bisa ganti territory sesuai kontingen yang ingin diakses

### Dari mana frontend dapat territory\_id?

Frontend menyimpan territory yang sedang dipilih di `TerritoryContext`. Superadmin memilih territory lewat territory selector di UI, nilainya tersimpan sebagai `currentTerritory.id`.

```typescript
// Di AuthContext — superadmin terdeteksi dari permission "*"
const isSuperAdmin = can("*");

// Di TerritoryContext — territory yang sedang dipilih superadmin
const { currentTerritory } = useTerritory();

// Gabungkan — ini yang dikirim ke service
const territoryId = isSuperAdmin ? currentTerritory?.id : undefined;
```

Admin biasa → `territoryId = undefined` → tidak ada query param → backend pakai JWT  
Superadmin → `territoryId = 3` → `?territory_id=3` → backend cari kontingen dari territory 3

---

## 2. Isolasi Data & Validasi Kepemilikan

### GET selalu difilter

`GET /admin/master/pelatih` tidak pernah mengembalikan semua data global. Backend selalu filter berdasarkan `kontingen_id` yang aktif — baik dari JWT maupun dari territory resolution.

### PUT/DELETE/upload divalidasi kepemilikan

Setiap operasi modifikasi memverifikasi bahwa data yang diubah memang milik kontingen yang sedang request:

| Operasi | Yang dicek | Error jika gagal |
|---|---|---|
| `PUT /:id` | `pelatih.kontingen_id == kontingen_aktif` | `403 Forbidden` |
| `DELETE /:id` | `pelatih.kontingen_id == kontingen_aktif` | `403 Forbidden` |
| `PUT /:id/foto` | `pelatih.kontingen_id == kontingen_aktif` | `403 Forbidden` |
| `PUT /:id/file/:kolom` | `pelatih.kontingen_id == kontingen_aktif` | `403 Forbidden` |
| `POST /trx` (body pelatih_id) | `pelatih.kontingen_id == kontingen_aktif` | `403 Forbidden` |

Ini mencegah satu admin mengubah data kontingen lain meskipun tahu ID-nya.

### kontingen\_id tidak perlu dikirim di body

`kontingen_id` **tidak perlu dan tidak boleh** dikirim di body POST/PUT. Backend mengisinya otomatis dari JWT/territory resolution. Jika tetap dikirim, nilainya akan diabaikan.

---

## 3. Implementasi Frontend — Admin vs Superadmin

Semua service function menerima parameter opsional `territoryId?: number`. Pattern ini identik dengan `identitasService`.

```typescript
// Helper di service file
function tq(territoryId?: number): string {
  return territoryId ? `?territory_id=${territoryId}` : "";
}

function tp(territoryId?: number): Record<string, unknown> {
  return territoryId ? { territory_id: territoryId } : {};
}
```

### Setup di Komponen

```typescript
import { useAuth } from "../../context/AuthContext";
import { useTerritory } from "../../context/TerritoryContext";
import { masterPelatihService, masterOfficialService } from "./service";

const { can } = useAuth();
const { currentTerritory } = useTerritory();

// Satu baris ini menentukan admin atau superadmin
const territoryId = can("*") ? currentTerritory?.id : undefined;
```

### Cara Panggil Service

Setelah dapat `territoryId`, semua call tinggal pass nilainya. Admin biasa otomatis undefined, superadmin dapat angka dari territory selector.

```typescript
// GET — admin biasa: tidak ada query param, superadmin: ?territory_id=X
const { data: pelatihs } = await masterPelatihService.getAll(territoryId);

// POST — kontingen_id TIDAK perlu di payload, otomatis dari JWT/territory
await masterPelatihService.create(
  { nama_lengkap: "Budi", jenis_kelamin: "L", ... },
  territoryId
);

// PUT — partial update
await masterPelatihService.update(1, { jabatan: "Asisten" }, territoryId);

// DELETE
await masterPelatihService.delete(1, territoryId);

// Upload foto
await masterPelatihService.uploadFoto(1, fileInput, territoryId);

// Daftarkan pelatih ke cabor
await masterPelatihService.createTrx(pelatihId, caborId, territoryId);

// Daftarkan official (tidak perlu cabor_id)
await masterOfficialService.createTrx(officialId, territoryId);
```

### Perbedaan Admin vs Superadmin

| Aspek | Admin Biasa | Superadmin |
|---|---|---|
| `territoryId` | `undefined` | `currentTerritory?.id` (angka) |
| Query param terkirim | Tidak ada | `?territory_id=X` |
| Backend resolve kontingen dari | JWT claims | Lookup tabel kontingen |
| Bisa ganti kontingen? | Tidak | Ya, via territory selector |
| Data yang muncul di GET | Hanya milik sendiri | Milik territory yang dipilih |

### Contoh Lengkap Halaman Pelatih

```typescript
export default function PelatihPage() {
  const { can } = useAuth();
  const { currentTerritory } = useTerritory();
  const [pelatihs, setPelatihs] = useState<MasterPelatih[]>([]);

  // Satu baris — berlaku untuk semua call di halaman ini
  const territoryId = can("*") ? currentTerritory?.id : undefined;

  useEffect(() => {
    // Superadmin: tunggu currentTerritory tersedia dulu
    if (can("*") && !currentTerritory) return;

    masterPelatihService.getAll(territoryId).then(res => {
      setPelatihs(res.data);
    });
  }, [territoryId]); // re-fetch saat territory berubah

  const handleCreate = async (payload: CreatePelatihPayload) => {
    // TIDAK perlu tambah kontingen_id ke payload
    await masterPelatihService.create(payload, territoryId);
    // reload data
    const res = await masterPelatihService.getAll(territoryId);
    setPelatihs(res.data);
  };

  const handleDelete = async (id: number) => {
    await masterPelatihService.delete(id, territoryId);
    setPelatihs(prev => prev.filter(p => p.id !== id));
  };

  // ...
}
```

### Catatan untuk Superadmin — Territory Selector

Superadmin harus memilih territory dulu sebelum bisa akses data. Jika `currentTerritory` belum dipilih (`null`), jangan panggil API karena akan error `400`.

```typescript
// Guard di komponen
if (can("*") && !currentTerritory) {
  return <div>Pilih territory terlebih dahulu</div>;
}
```

---

## 4. Overview Tahap 3 — GET & Referensi

### `GET /admin/tahap3` 🔒

Ambil semua data tahap 3 sekaligus: status, referensi dari tahap sebelumnya, dan semua master data.

```
GET /admin/tahap3
GET /admin/tahap3?territory_id=2   ← superadmin
```

**Response 200:**
```json
{
  "success": true,
  "message": "Data tahap 3 berhasil diambil",
  "data": {
    "kontingen_id": 3,
    "territory_id": 2,
    "nama_kontingen": "Kabupaten Tangerang",
    "tahap3_status": "SUBMITTED",
    "tahap3_submitted_at": "2026-08-01T10:00:00Z",
    "tahap3_validasi_status": "PENDING",
    "tahap3_validasi_catatan": null,

    "cabor_terpilih": [
      { "cabor_id": 6, "nama_cabor": "Bulutangkis" },
      { "cabor_id": 1, "nama_cabor": "Atletik" }
    ],

    "nomor_terdaftar": [
      {
        "nomor_id": 69,
        "cabor_id": 6,
        "nama_cabor": "Bulutangkis",
        "nama_nomor": "Tunggal",
        "jenis_kelamin": "PUTRA",
        "tipe": "INDIVIDU"
      }
    ],

    "atlets":    [ ... ],
    "pelatihs":  [ ... ],
    "officials": [ ... ],

    "trx_atlets":    [ ... ],
    "trx_pelatihs":  [ ... ],
    "trx_officials": [ ... ]
  }
}
```

> `tahap3_validasi_status` bisa `null`, `"PENDING"`, `"VALID"`, atau `"REVISI"`.  
> Jika `"REVISI"`, tampilkan banner dengan isi `tahap3_validasi_catatan`.

**Field penting:**

| Field | Keterangan | Kegunaan di Frontend |
|---|---|---|
| `cabor_terpilih` | Cabor yang dipilih di tahap 1 | Filter dropdown cabor saat input atlet/pelatih |
| `nomor_terdaftar` | Nomor yang dicentang di tahap 2 | Dropdown saat assign atlet ke nomor pertandingan |
| `atlets` | Semua master atlet kontingen | List atlet yang sudah diinput |
| `pelatihs` | Semua master pelatih kontingen | List pelatih yang sudah diinput |
| `officials` | Semua master official kontingen | List official yang sudah diinput |
| `trx_atlets` | Pendaftaran atlet ke nomor | Track status pendaftaran |
| `trx_pelatihs` | Pendaftaran pelatih ke cabor | Track status pendaftaran |
| `trx_officials` | Pendaftaran official | Track status pendaftaran |

> **Penting:** Gunakan `cabor_terpilih` dan `nomor_terdaftar` sebagai sumber data untuk dropdown/filter — **jangan** tampilkan semua cabor atau semua nomor. Hanya yang sudah dipilih di tahap 1 dan tahap 2.

---

### `GET /admin/tahap3/cabor` 🔒

Ambil **hanya** daftar cabor yang dipilih kontingen di tahap 1. Endpoint dedicated — tanpa perlu load seluruh data tahap 3.

```
GET /admin/tahap3/cabor
GET /admin/tahap3/cabor?territory_id=2   ← superadmin
```

**Response 200:**
```json
{
  "success": true,
  "message": "Daftar cabor terpilih berhasil diambil",
  "data": [
    { "cabor_id": 6, "nama_cabor": "Bulutangkis" },
    { "cabor_id": 1, "nama_cabor": "Atletik" }
  ]
}
```

> Pakai ini sebagai **filter cabor** di halaman input atlet/pelatih — jangan tampilkan cabor yang tidak ada di sini.

---

### `GET /admin/tahap3/nomor` 🔒

Ambil **hanya** daftar nomor pertandingan yang dicentang kontingen di tahap 2.

```
GET /admin/tahap3/nomor
GET /admin/tahap3/nomor?territory_id=2   ← superadmin
```

**Response 200:**
```json
{
  "success": true,
  "message": "Daftar nomor terdaftar berhasil diambil",
  "data": [
    {
      "nomor_id": 69,
      "cabor_id": 6,
      "nama_cabor": "Bulutangkis",
      "nama_nomor": "Tunggal",
      "jenis_kelamin": "PUTRA",
      "tipe": "INDIVIDU"
    },
    {
      "nomor_id": 72,
      "cabor_id": 6,
      "nama_cabor": "Bulutangkis",
      "nama_nomor": "Ganda",
      "jenis_kelamin": "PUTRA",
      "tipe": "BEREGU"
    }
  ]
}
```

> Pakai ini sebagai **dropdown nomor** saat assign atlet ke nomor — **jangan** tampilkan nomor lain yang tidak terdaftar.

---

### `POST /admin/tahap3/submit` 🔒

Kunci tahap 3. Bulk insert semua atlet/pelatih/official ke tabel transaksi, lalu set `tahap3_status = SUBMITTED`.

```
POST /admin/tahap3/submit
POST /admin/tahap3/submit?territory_id=2   ← superadmin
```

**Response 200:**
```json
{
  "success": true,
  "message": "Tahap 3 berhasil disubmit. Semua atlet, pelatih, dan official telah didaftarkan."
}
```

**Response error:**
```json
{ "success": false, "message": "minimal harus ada 1 atlet sebelum submit" }
{ "success": false, "message": "tahap 3 sudah disubmit" }
```

---

## 5. Master Pelatih — CRUD

Ambil semua pelatih milik kontingen yang sedang login. Hasil sudah difilter — tidak ada data kontingen lain.

```
GET /admin/master/pelatih
Authorization: Bearer <token>

# Superadmin:
GET /admin/master/pelatih?territory_id=2
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Data pelatih berhasil diambil",
  "data": [
    {
      "id": 1,
      "kontingen_id": 5,
      "nama_lengkap": "Budi Santoso",
      "jenis_kelamin": "L",
      "tanggal_lahir": "1985-03-15",
      "tempat_lahir": "Jakarta",
      "nik": "3174012345678901",
      "sekolah_asal": "SMP N 1 Tangerang",
      "profesi": "Guru",
      "jabatan": "Pelatih Kepala",
      "alamat": "Jl. Merdeka No. 1",
      "kabupaten_kota": "Kab. Tangerang",
      "no_hp": "081234567890",
      "email": "budi@email.com",
      "nama_istri_suami": "Siti",
      "status": "draft",
      "foto": "",
      "file_ktp": "",
      "file_surat_tugas": "",
      "file_sertifikat_pelatih": "",
      "prestasi_sebelumnya": "",
      "catatan": "",
      "created_at": "2026-06-03T09:00:00+07:00",
      "updated_at": "2026-06-03T09:00:00+07:00"
    }
  ]
}
```

---

### `GET /admin/master/pelatih/:id` 🔒

```
GET /admin/master/pelatih/1
Authorization: Bearer <token>
```

---

### `POST /admin/master/pelatih` 🔒

Buat pelatih baru. **Jangan kirim `kontingen_id`** di body — otomatis dari JWT.

```
POST /admin/master/pelatih
Authorization: Bearer <token>
Content-Type: application/json

# Superadmin:
POST /admin/master/pelatih?territory_id=2
```

**Request Body:**
```json
{
  "nama_lengkap": "Budi Santoso",
  "jenis_kelamin": "L",
  "tanggal_lahir": "1985-03-15",
  "tempat_lahir": "Jakarta",
  "nik": "3174012345678901",
  "sekolah_asal": "SMP N 1 Tangerang",
  "profesi": "Guru",
  "jabatan": "Pelatih Kepala",
  "alamat": "Jl. Merdeka No. 1",
  "kabupaten_kota": "Kab. Tangerang",
  "no_hp": "081234567890",
  "email": "budi@email.com",
  "nama_istri_suami": "Siti",
  "prestasi_sebelumnya": "",
  "catatan": ""
}
```

**Field wajib:** `nama_lengkap`, `jenis_kelamin` (L/P), `kabupaten_kota`, `no_hp`

**Response:** `201 Created` + data pelatih yang dibuat (termasuk `kontingen_id` yang terisi otomatis)

---

### `PUT /admin/master/pelatih/:id` 🔒

Update data pelatih. Partial update — hanya field yang dikirim yang berubah.

```
PUT /admin/master/pelatih/1
Authorization: Bearer <token>

# Superadmin:
PUT /admin/master/pelatih/1?territory_id=2
```

**Request Body (hanya field yang ingin diubah):**
```json
{
  "jabatan": "Asisten Pelatih",
  "no_hp": "089876543210"
}
```

> Backend memvalidasi bahwa pelatih ID 1 milik kontingen yang sedang request. Jika bukan → `403 Forbidden`.

---

### `DELETE /admin/master/pelatih/:id` 🔒

Hapus pelatih beserta semua entri `trx_pendaftaran_pelatih` yang terkait (cascade manual).

```
DELETE /admin/master/pelatih/1
Authorization: Bearer <token>

# Superadmin:
DELETE /admin/master/pelatih/1?territory_id=2
```

> Backend memvalidasi kepemilikan sebelum hapus. Jika bukan miliknya → `403 Forbidden`.

---

## 6. Master Pelatih — Upload File

### `PUT /admin/master/pelatih/:id/foto` 🔒

Upload foto pelatih sebagai `multipart/form-data`.

```
PUT /admin/master/pelatih/1/foto
Authorization: Bearer <token>
Content-Type: multipart/form-data

# field: foto = <file gambar>
```

**Response `200`:**
```json
{ "success": true, "message": "Foto pelatih berhasil diupdate", "path": "/uploads/pelatih/1717123456_foto.jpg" }
```

---

### `PUT /admin/master/pelatih/:id/file/:kolom` 🔒

Upload dokumen. Nilai `:kolom` yang valid:

| Kolom | Keterangan |
|---|---|
| `file_ktp` | Scan KTP |
| `file_surat_tugas` | Surat tugas dari instansi |
| `file_sertifikat_pelatih` | Sertifikat kepelatihan |

```
PUT /admin/master/pelatih/1/file/file_ktp
Authorization: Bearer <token>
Content-Type: multipart/form-data

# field: file = <file PDF/gambar>
```

---

## 7. Master Pelatih — Transaksi Pendaftaran

Mendaftarkan pelatih ke tabel `trx_pendaftaran_pelatih` (pelatih terdaftar di cabor tertentu).

> **Alternatif lebih mudah:** Gunakan `POST /admin/tahap3/submit` untuk bulk insert otomatis semua pelatih ke semua cabor yang dipilih kontingen sekaligus.

### `GET /admin/master/pelatih/trx` 🔒

Ambil semua transaksi pendaftaran pelatih milik kontingen.

```
GET /admin/master/pelatih/trx
Authorization: Bearer <token>

# Superadmin:
GET /admin/master/pelatih/trx?territory_id=2
```

**Response `200`:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "pelatih_id": 1, "cabor_id": 3, "created_at": "...", "updated_at": "..." }
  ]
}
```

---

### `POST /admin/master/pelatih/trx` 🔒

Daftarkan pelatih ke cabor tertentu. Backend memvalidasi `pelatih_id` milik kontingen yang request.

```
POST /admin/master/pelatih/trx
Authorization: Bearer <token>

# Superadmin:
POST /admin/master/pelatih/trx?territory_id=2
```

**Request Body:**
```json
{
  "pelatih_id": 1,
  "cabor_id": 3
}
```

**Response:** `201 Created` + data trx

> Jika `pelatih_id` bukan milik kontingen yang sedang request → `403 Forbidden`.

---

### `DELETE /admin/master/pelatih/trx/:id` 🔒

Batalkan pendaftaran pelatih dari cabor.

```
DELETE /admin/master/pelatih/trx/1
Authorization: Bearer <token>
```

---

## 8. Master Official — CRUD

### `GET /admin/master/official` 🔒

Ambil semua official milik kontingen yang sedang login.

```
GET /admin/master/official
Authorization: Bearer <token>

# Superadmin:
GET /admin/master/official?territory_id=2
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Data official berhasil diambil",
  "data": [
    {
      "id": 1,
      "kontingen_id": 5,
      "nama_lengkap": "Siti Rahayu",
      "jenis_kelamin": "P",
      "tanggal_lahir": "1990-07-20",
      "tempat_lahir": "Tangerang",
      "nik": "3601012345678901",
      "sekolah_asal": "SMP N 2 Tangerang",
      "jabatan": "Manajer Tim",
      "alamat": "Jl. Sudirman No. 5",
      "kabupaten_kota": "Kab. Tangerang",
      "no_hp": "082345678901",
      "email": "siti@email.com",
      "status": "draft",
      "foto": "",
      "file_ktp": "",
      "file_surat_tugas": "",
      "catatan": "",
      "created_at": "2026-06-03T09:00:00+07:00",
      "updated_at": "2026-06-03T09:00:00+07:00"
    }
  ]
}
```

---

### `GET /admin/master/official/:id` 🔒

```
GET /admin/master/official/1
Authorization: Bearer <token>
```

---

### `POST /admin/master/official` 🔒

Buat official baru. **Jangan kirim `kontingen_id`** — otomatis dari JWT.

```
POST /admin/master/official
Authorization: Bearer <token>
Content-Type: application/json

# Superadmin:
POST /admin/master/official?territory_id=2
```

**Request Body:**
```json
{
  "nama_lengkap": "Siti Rahayu",
  "jenis_kelamin": "P",
  "tanggal_lahir": "1990-07-20",
  "tempat_lahir": "Tangerang",
  "nik": "3601012345678901",
  "sekolah_asal": "SMP N 2 Tangerang",
  "jabatan": "Manajer Tim",
  "alamat": "Jl. Sudirman No. 5",
  "kabupaten_kota": "Kab. Tangerang",
  "no_hp": "082345678901",
  "email": "siti@email.com",
  "catatan": ""
}
```

**Field wajib:** `nama_lengkap`, `jenis_kelamin` (L/P), `jabatan`, `kabupaten_kota`, `no_hp`

---

### `PUT /admin/master/official/:id` 🔒

Partial update. Superadmin kirim `?territory_id=X`.

> Backend memvalidasi kepemilikan. Jika bukan milik kontingen yang request → `403 Forbidden`.

---

### `DELETE /admin/master/official/:id` 🔒

Hapus official beserta semua entri `trx_pendaftaran_official` yang terkait.

> Backend memvalidasi kepemilikan sebelum hapus. Jika bukan miliknya → `403 Forbidden`.

---

## 9. Master Official — Upload File

### `PUT /admin/master/official/:id/foto` 🔒

```
PUT /admin/master/official/1/foto
Content-Type: multipart/form-data
field: foto = <file gambar>
```

---

### `PUT /admin/master/official/:id/file/:kolom` 🔒

Nilai `:kolom` yang valid:

| Kolom | Keterangan |
|---|---|
| `file_ktp` | Scan KTP |
| `file_surat_tugas` | Surat tugas |

```
PUT /admin/master/official/1/file/file_ktp
Content-Type: multipart/form-data
field: file = <file PDF/gambar>
```

---

## 10. Master Official — Transaksi Pendaftaran

Mendaftarkan official ke `trx_pendaftaran_official`. Official tidak terikat ke cabor tertentu — berlaku untuk seluruh kontingen.

### `GET /admin/master/official/trx` 🔒

```
GET /admin/master/official/trx
Authorization: Bearer <token>

# Superadmin:
GET /admin/master/official/trx?territory_id=2
```

**Response `200`:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "official_id": 1, "created_at": "...", "updated_at": "..." }
  ]
}
```

---

### `POST /admin/master/official/trx` 🔒

Daftarkan official. Backend memvalidasi `official_id` milik kontingen yang request.

```
POST /admin/master/official/trx
Authorization: Bearer <token>

# Superadmin:
POST /admin/master/official/trx?territory_id=2
```

**Request Body:**
```json
{
  "official_id": 1
}
```

> Jika `official_id` bukan milik kontingen yang sedang request → `403 Forbidden`.

---

### `DELETE /admin/master/official/trx/:id` 🔒

```
DELETE /admin/master/official/trx/1
Authorization: Bearer <token>
```

---

## 11. Alur Otomatis ke Transaksi

### Opsi A — Submit Tahap 3 (Bulk, Direkomendasikan)

`POST /admin/tahap3/submit` akan secara otomatis:
1. Insert semua pelatih kontingen ke `trx_pendaftaran_pelatih` (cross dengan semua cabor yang dipilih di tahap 1)
2. Insert semua official kontingen ke `trx_pendaftaran_official`
3. Set `tahap3_status = SUBMITTED` di tabel kontingen

```
POST /admin/tahap3/submit
Authorization: Bearer <token>

# Superadmin:
POST /admin/tahap3/submit?territory_id=2
```

Operasi ini idempoten — pelatih/official yang sudah terdaftar di trx tidak akan diinsert ulang.

### Opsi B — Manual Satu per Satu

Gunakan `POST /admin/master/pelatih/trx` dan `POST /admin/master/official/trx` untuk daftarkan secara individual sebelum submit.

---

## 12. Export PDF & Excel

### `GET /admin/tahap3/export/pdf` 🔒

Download semua data tahap 3 (atlet + pelatih + official) dalam satu file PDF dengan 3 halaman terpisah.

```
GET /admin/tahap3/export/pdf
GET /admin/tahap3/export/pdf?territory_id=2   ← superadmin
```

**Response:** File PDF binary
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="tahap3_Kab_Tangerang_2026-06-03.pdf"
Cache-Control: no-store
```

**Isi file:**
- Halaman 1: Daftar Atlet — kolom: No, Nama Lengkap, JK, Tgl Lahir, NISN, Sekolah, Kelas, Kab/Kota, No. HP
- Halaman 2: Daftar Pelatih — kolom: No, Nama Lengkap, JK, Tgl Lahir, Jabatan, No. HP, Email, Kab/Kota
- Halaman 3: Daftar Official — kolom: No, Nama Lengkap, JK, Tgl Lahir, Jabatan, No. HP, Email, Kab/Kota

---

### `GET /admin/tahap3/export/excel` 🔒

Download semua data tahap 3 dalam satu file Excel dengan 3 sheet terpisah.

```
GET /admin/tahap3/export/excel
GET /admin/tahap3/export/excel?territory_id=2   ← superadmin
```

**Response:** File XLSX binary
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="tahap3_Kab_Tangerang_2026-06-03.xlsx"
```

**Sheet:**
- `Atlet` — No, Nama Lengkap, JK, Tanggal Lahir, NISN, Sekolah, Kelas/Jurusan, Kab/Kota, No. HP
- `Pelatih` — No, Nama Lengkap, JK, Tanggal Lahir, NIK, Jabatan, No. HP, Email, Kab/Kota
- `Official` — No, Nama Lengkap, JK, Tanggal Lahir, NIK, Jabatan, No. HP, Email, Kab/Kota

---

### Export Per Sub-Data (Opsional)

Jika halaman hanya menampilkan satu sub-data, gunakan endpoint per sub-data:

| Method | URL | Format | Keterangan |
|---|---|---|---|
| `GET` | `/admin/tahap3/atlet/export/pdf` | PDF | Hanya daftar atlet |
| `GET` | `/admin/tahap3/atlet/export/excel` | XLSX | Hanya daftar atlet |
| `GET` | `/admin/tahap3/pelatih/export/pdf` | PDF | Hanya daftar pelatih |
| `GET` | `/admin/tahap3/pelatih/export/excel` | XLSX | Hanya daftar pelatih |
| `GET` | `/admin/tahap3/official/export/pdf` | PDF | Hanya daftar official |
| `GET` | `/admin/tahap3/official/export/excel` | XLSX | Hanya daftar official |

Semua mendukung `?territory_id=X` untuk superadmin.

**Konvensi nama file:**
```
tahap3_Kab_Tangerang_2026-06-03.pdf
tahap3_atlet_Kab_Tangerang_2026-06-03.xlsx
tahap3_pelatih_Kota_Serang_2026-06-03.pdf
```

**Error jika tidak ada data (404):**
```json
{ "success": false, "message": "Tidak ada data untuk di-export" }
```

---

## 13. Ringkasan Endpoint

### Overview & Referensi

| Method | URL | Keterangan |
|---|---|---|
| `GET` | `/admin/tahap3` | Semua data tahap 3 + referensi cabor & nomor |
| `GET` | `/admin/tahap3/cabor` | Cabor terpilih dari tahap 1 (untuk filter UI) |
| `GET` | `/admin/tahap3/nomor` | Nomor terdaftar dari tahap 2 (untuk dropdown) |
| `POST` | `/admin/tahap3/submit` | Kunci tahap 3, bulk insert ke trx |

### Master Pelatih

| Method | URL | Keterangan |
|---|---|---|
| `GET` | `/admin/master/pelatih` | List pelatih (filtered by kontingen) |
| `GET` | `/admin/master/pelatih/trx` | List trx pendaftaran |
| `POST` | `/admin/master/pelatih/trx` | Daftarkan pelatih ke cabor |
| `DELETE` | `/admin/master/pelatih/trx/:id` | Batalkan pendaftaran |
| `GET` | `/admin/master/pelatih/:id` | Detail pelatih |
| `POST` | `/admin/master/pelatih` | Buat pelatih baru |
| `PUT` | `/admin/master/pelatih/:id` | Update data pelatih |
| `DELETE` | `/admin/master/pelatih/:id` | Hapus pelatih + trx-nya |
| `PUT` | `/admin/master/pelatih/:id/foto` | Upload foto |
| `PUT` | `/admin/master/pelatih/:id/file/:kolom` | Upload dokumen |

> **Urutan route penting:** `/trx` terdaftar sebelum `/:id` di backend agar tidak conflict.

### Master Official

| Method | URL | Keterangan |
|---|---|---|
| `GET` | `/admin/master/official` | List official (filtered by kontingen) |
| `GET` | `/admin/master/official/trx` | List trx pendaftaran |
| `POST` | `/admin/master/official/trx` | Daftarkan official |
| `DELETE` | `/admin/master/official/trx/:id` | Batalkan pendaftaran |
| `GET` | `/admin/master/official/:id` | Detail official |
| `POST` | `/admin/master/official` | Buat official baru |
| `PUT` | `/admin/master/official/:id` | Update data official |
| `DELETE` | `/admin/master/official/:id` | Hapus official + trx-nya |
| `PUT` | `/admin/master/official/:id/foto` | Upload foto |
| `PUT` | `/admin/master/official/:id/file/:kolom` | Upload dokumen |

### Export

| Method | URL | Format | Keterangan |
|---|---|---|---|
| `GET` | `/admin/tahap3/export/pdf` | PDF | Semua: atlet + pelatih + official (3 halaman) |
| `GET` | `/admin/tahap3/export/excel` | XLSX | 3 sheet: Atlet, Pelatih, Official |
| `GET` | `/admin/tahap3/atlet/export/pdf` | PDF | Hanya atlet |
| `GET` | `/admin/tahap3/atlet/export/excel` | XLSX | Hanya atlet |
| `GET` | `/admin/tahap3/pelatih/export/pdf` | PDF | Hanya pelatih |
| `GET` | `/admin/tahap3/pelatih/export/excel` | XLSX | Hanya pelatih |
| `GET` | `/admin/tahap3/official/export/pdf` | PDF | Hanya official |
| `GET` | `/admin/tahap3/official/export/excel` | XLSX | Hanya official |

> Semua endpoint support `?territory_id=X` untuk superadmin.

---

## 14. Struktur Data

### Tabel `master_pelatih`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uint | Primary key |
| `kontingen_id` | uint | FK ke tabel kontingen — diisi otomatis dari JWT |
| `nama_lengkap` | string | Wajib |
| `jenis_kelamin` | enum(L,P) | Wajib |
| `tanggal_lahir` | date | Format YYYY-MM-DD |
| `tempat_lahir` | string | |
| `nik` | string | |
| `sekolah_asal` | string | |
| `profesi` | string | |
| `jabatan` | string | |
| `alamat` | text | |
| `kabupaten_kota` | string | Wajib |
| `no_hp` | string | Wajib |
| `email` | string | |
| `nama_istri_suami` | string | |
| `status` | enum | draft / terdaftar / terverifikasi / ditolak |
| `foto` | string | Path file |
| `file_ktp` | string | Path file |
| `file_surat_tugas` | string | Path file |
| `file_sertifikat_pelatih` | string | Path file |
| `prestasi_sebelumnya` | text | |
| `catatan` | text | |

### Tabel `trx_pendaftaran_pelatih`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uint | Primary key |
| `pelatih_id` | uint | FK ke master_pelatih |
| `cabor_id` | uint | FK ke master_cabor |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### Tabel `master_official`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uint | Primary key |
| `kontingen_id` | uint | FK ke tabel kontingen — diisi otomatis dari JWT |
| `nama_lengkap` | string | Wajib |
| `jenis_kelamin` | enum(L,P) | Wajib |
| `tanggal_lahir` | date | |
| `tempat_lahir` | string | |
| `nik` | string | |
| `sekolah_asal` | string | |
| `jabatan` | string | Wajib |
| `alamat` | text | |
| `kabupaten_kota` | string | Wajib |
| `no_hp` | string | Wajib |
| `email` | string | |
| `status` | enum | draft / terdaftar / terverifikasi / ditolak |
| `foto` | string | Path file |
| `file_ktp` | string | Path file |
| `file_surat_tugas` | string | Path file |
| `catatan` | text | |

### Tabel `trx_pendaftaran_official`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uint | Primary key |
| `official_id` | uint | FK ke master_official |
| `created_at` | datetime | |
| `updated_at` | datetime | |

> Tidak ada `cabor_id` di `trx_pendaftaran_official` — official berlaku untuk seluruh kontingen, bukan per cabor.

---

## 15. Error Handling

| Status | Kondisi | Pesan |
|---|---|---|
| `400` | Superadmin tidak kirim `territory_id` | `"Superadmin wajib kirim query parameter territory_id"` |
| `400` | Field wajib tidak diisi | `"Format request tidak valid"` + detail |
| `400` | `jenis_kelamin` bukan L atau P | `"Format request tidak valid"` |
| `400` | Kolom file tidak valid | `"Nama kolom tidak valid"` |
| `403` | PUT/DELETE data milik kontingen lain | `"tidak diizinkan mengubah data pelatih kontingen lain"` |
| `403` | Daftarkan trx milik kontingen lain | `"tidak diizinkan mendaftarkan pelatih kontingen lain"` |
| `404` | ID tidak ditemukan | `"pelatih tidak ditemukan"` / `"official tidak ditemukan"` |
| `404` | Territory tidak punya kontingen | `"Kontingen untuk territory ini tidak ditemukan"` |
| `500` | Gagal simpan ke DB | `"gagal membuat pelatih"` / `"gagal membuat official"` |

---

## Catatan Penting untuk Frontend

1. **`kontingen_id` tidak perlu dikirim** di body POST/PUT — diisi otomatis dari token. Lihat [section 1](#1-konsep-kontingen_id--territory_id) untuk penjelasan lengkap.
2. **Admin biasa** cukup panggil service tanpa `territoryId` → `undefined` → tidak ada query param
3. **Superadmin** kirim `currentTerritory?.id` sebagai `territoryId` ke semua service call
4. `const territoryId = can("*") ? currentTerritory?.id : undefined;` — satu baris ini untuk semua halaman
5. Upload foto/file gunakan `multipart/form-data`, bukan JSON
6. Saat `DELETE` pelatih/official, entri trx terkait **ikut terhapus otomatis**
7. Route `/trx` terdaftar **sebelum** `/:id` di backend — jangan ubah urutan call
8. Superadmin yang belum pilih territory → `currentTerritory = null` → jangan panggil API (guard dulu)
9. **Filter cabor di form atlet/pelatih** — pakai `GET /admin/tahap3/cabor`, bukan semua cabor dari master. Hanya tampilkan cabor yang sudah dipilih di tahap 1
10. **Dropdown nomor saat assign atlet** — pakai `GET /admin/tahap3/nomor`, bukan semua nomor dari master. Hanya tampilkan nomor yang dicentang di tahap 2
11. **Export semua sub-data** — `GET /admin/tahap3/export/pdf` menghasilkan PDF 3 halaman, `export/excel` menghasilkan XLSX 3 sheet
12. **Export per sub-data** — gunakan `/admin/tahap3/atlet/export/pdf`, `/pelatih/export/pdf`, `/official/export/pdf` jika halaman hanya menampilkan satu sub-data
13. **Status validasi** — setelah submit berhasil, `tahap3_validasi_status` otomatis jadi `"PENDING"`. Cek field ini di response `GET /admin/tahap3` untuk tampilkan banner validasi:
    - `"REVISI"` → banner kuning dengan isi `tahap3_validasi_catatan`
    - `"PENDING"` → banner biru "menunggu validasi panitia"
    - `"VALID"` → badge hijau "data valid"
    - `null` → tidak perlu tampilkan banner (belum submit)
