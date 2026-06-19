# Superadmin Panel — Dokumentasi CRUD Frontend

> **Base URL:** `http://localhost:8000`  
> **Auth:** Semua endpoint `/admin/*` wajib kirim header:
> ```
> Authorization: Bearer <token>
> Content-Type: application/json
> ```
> Superadmin **bypass semua permission check** secara otomatis.

---

## Daftar Isi

1. [Modules](#1-modules)
2. [Territories + User Territories](#2-territories--user-territories)
3. [Users + User Roles + User Territories](#3-users)
4. [Master Cabor](#4-master-cabor)
5. [Master Nomor](#5-master-nomor)
6. [Roles + Role Permissions](#6-roles--role-permissions)
7. [Permissions](#7-permissions)

---

## Konvensi Response

Semua endpoint mengembalikan format:
```json
{ "success": true, "message": "...", "data": { ... } }
```
Error:
```json
{ "success": false, "message": "pesan error" }
```

---

## 1. Modules

**Base path:** `/admin/modules`

### Model Response
```json
{
  "id": 1,
  "name": "cabor",
  "label": "Cabang Olahraga",
  "code": "CABOR",
  "url": "/master/cabor",
  "created_at": "2026-05-30T12:21:24Z",
  "updated_at": "2026-05-30T12:21:24Z"
}
```

### GET `/admin/modules`
Ambil semua module, diurutkan `id ASC`.

**Response:**
```json
{
  "success": true,
  "message": "Data modules berhasil diambil",
  "data": [ ...array of Module... ]
}
```

### GET `/admin/modules/:id`
Ambil module by ID.

### POST `/admin/modules`
Buat module baru.

**Request Body (JSON):**
```json
{
  "name": "laporan",
  "label": "Laporan",
  "code": "LAPORAN",
  "url": "/laporan"
}
```
> `name`, `label`, `code` wajib diisi. `code` harus unik — error jika sudah ada.

### PUT `/admin/modules/:id`
Update module. Semua field opsional — hanya field yang dikirim yang diupdate.

**Request Body (JSON):**
```json
{
  "name": "laporan",
  "label": "Laporan Kegiatan",
  "code": "LAPORAN",
  "url": "/laporan/kegiatan"
}
```

### DELETE `/admin/modules/:id`
Hapus module permanen (hard delete).

---

## 2. Territories + User Territories

**Base path:** `/admin/territories`

### Model Response
```json
{
  "id": 1,
  "name": "Kabupaten Tangerang",
  "type": "KABUPATEN"
}
```
> Tabel `territories` tidak punya `created_at` / `updated_at`.

### GET `/admin/territories`
Semua territory.

### GET `/admin/territories/:id`
Territory by ID.

### GET `/admin/territories/type/:type`
Filter by tipe. `:type` harus salah satu: `PROVINSI` | `KABUPATEN` | `KOTA`

### GET `/admin/territories/provinces`
Hanya yang bertipe `PROVINSI`.

### GET `/admin/territories/kabupatens`
Hanya yang bertipe `KABUPATEN`.

### GET `/admin/territories/kotas`
Hanya yang bertipe `KOTA`.

### GET `/admin/territories/user/:user_id`
Semua territory yang di-assign ke user tertentu.

### POST `/admin/territories`
Buat territory baru.

**Request Body (JSON):**
```json
{
  "name": "Kabupaten Tangerang",
  "type": "KABUPATEN"
}
```
> `name` dan `type` wajib. `type` harus: `PROVINSI` | `KABUPATEN` | `KOTA`

### PUT `/admin/territories/:id`
Update territory.

**Request Body (JSON):**
```json
{
  "name": "Kab. Tangerang",
  "type": "KABUPATEN"
}
```

### DELETE `/admin/territories/:id`
Hapus territory permanen.

### POST `/admin/territories/user/:user_id/:territory_id`
Assign territory ke user. Tidak perlu body.

**Contoh:** `POST /admin/territories/user/5/3`

### DELETE `/admin/territories/user/:user_id/:territory_id`
Hapus territory dari user.

---

## 3. Users

**Base path:** `/admin/users`

### Model Response
```json
{
  "id": 1,
  "name": "Admin Tangerang",
  "email": "tangerang@popda.id",
  "is_active": true,
  "avatar": "",
  "created_at": "2026-01-01T00:00:00Z"
}
```
> `password` **tidak pernah** dikembalikan dalam response (di-exclude dengan `json:"-"`).

### GET `/admin/users`
Semua user.

### GET `/admin/users/:id`
User by ID.

### GET `/admin/users/email/:email`
User by email.

### POST `/admin/users`
Buat user baru.

**Request Body (JSON):**
```json
{
  "name": "Admin Tangerang",
  "email": "tangerang@popda.id",
  "password": "min6karakter",
  "avatar": ""
}
```
> `name`, `email`, `password` wajib. `password` minimal 6 karakter. Email harus unik.  
> Password dikirim **plaintext** — backend yang hash dengan SHA-256.

### PUT `/admin/users/:id`
Update data user. Semua field opsional.

**Request Body (JSON):**
```json
{
  "name": "Admin Tangerang Baru",
  "email": "baru@popda.id"
}
```
> Jika `password` dikirim, minimal 6 karakter.

### DELETE `/admin/users/:id`
Hapus user permanen.

### PUT `/admin/users/:id/password`
Ganti password user.

**Request Body (JSON):**
```json
{
  "password": "passwordbaru123"
}
```
> `password` wajib, minimal 6 karakter.

### PUT `/admin/users/:id/status`
Aktifkan / nonaktifkan user.

**Request Body (JSON):**
```json
{
  "is_active": true
}
```
> `is_active` wajib (boolean).

### PUT `/admin/users/:id/avatar`
Update path avatar.

**Request Body (JSON):**
```json
{
  "avatar": "/avatar/namafile.jpg"
}
```

---

### User Roles

### GET `/admin/users/:id/roles`
Ambil role IDs yang di-assign ke user. Mengembalikan **array of number**.

**Response:**
```json
{
  "success": true,
  "message": "Data roles berhasil diambil",
  "data": [1, 2]
}
```

### POST `/admin/users/:id/roles/:role_id`
Assign role ke user. Tidak perlu body.

**Contoh:** `POST /admin/users/5/roles/2`

### DELETE `/admin/users/:id/roles/:role_id`
Hapus role dari user.

---

### User Territories (via Users endpoint)

### GET `/admin/users/:id/territories`
Ambil territory IDs milik user. Mengembalikan **array of number**.

**Response:**
```json
{
  "success": true,
  "message": "Data territories berhasil diambil",
  "data": [3, 7]
}
```

### POST `/admin/users/:id/territories/:territory_id`
Assign territory ke user. Tidak perlu body.

### DELETE `/admin/users/:id/territories/:territory_id`
Hapus territory dari user.

---

## 4. Master Cabor

**Base path:** `/admin/master/cabor`

### Model Response
```json
{
  "id": 6,
  "nama": "Bulutangkis",
  "max_putra": 5,
  "max_putri": 5,
  "max_pelatih": 2,
  "is_active": true,
  "created_at": "2026-02-11T08:25:14Z"
}
```
> Tabel `master_cabor` **tidak punya `updated_at`**.

### GET `/admin/master/cabor`
Ambil **semua cabor** (aktif dan nonaktif). Frontend bisa filter sendiri berdasarkan `is_active`.

### GET `/admin/master/cabor/:id`
Cabor by ID.

### POST `/admin/master/cabor`
Buat cabor baru.

**Request Body (JSON):**
```json
{
  "nama": "Bola Basket",
  "max_putra": 12,
  "max_putri": 12,
  "max_pelatih": 3
}
```
> `nama` wajib. `max_putra`, `max_putri`, `max_pelatih` opsional (default 0).

### PUT `/admin/master/cabor/:id`
Update cabor. Semua field opsional.

**Request Body (JSON):**
```json
{
  "nama": "Bola Basket",
  "max_putra": 16,
  "max_putri": 16,
  "max_pelatih": 4
}
```
> Field integer dengan nilai `0` tidak akan diupdate (backend skip jika `== 0`).

### DELETE `/admin/master/cabor/:id`
**Hard delete** — hapus permanen dari database.

---

## 5. Master Nomor

**Base path:** `/admin/master/nomor`

### Model Response
```json
{
  "id": 69,
  "cabor_id": 6,
  "nama": "Tunggal",
  "jenis_kelamin": "PUTRA",
  "tipe": "INDIVIDU",
  "is_active": true,
  "created_at": "2026-02-11T08:38:00Z",
  "cabor": {
    "id": 6,
    "nama": "Bulutangkis",
    "max_putra": 5,
    "max_putri": 5,
    "max_pelatih": 2,
    "is_active": true,
    "created_at": "2026-02-11T08:25:14Z"
  }
}
```
> Tabel `master_nomor` **tidak punya `updated_at`**.  
> Response selalu include object `cabor` (preloaded).

### GET `/admin/master/nomor`
Semua nomor yang `is_active = true`, include data cabor.

### GET `/admin/master/nomor/:id`
Nomor by ID, include data cabor.

### GET `/admin/master/nomor/cabor/:cabor_id`
Semua nomor untuk cabor tertentu yang aktif.

### POST `/admin/master/nomor`
Buat nomor baru.

**Request Body (JSON):**
```json
{
  "nama": "Tunggal Putra",
  "cabor_id": 6,
  "jenis_kelamin": "PUTRA",
  "tipe": "INDIVIDU"
}
```
> Semua field **wajib**.  
> `jenis_kelamin`: `PUTRA` | `PUTRI` | `CAMPURAN`  
> `tipe`: `INDIVIDU` | `BEREGU`

### PUT `/admin/master/nomor/:id`
Update nomor. Semua field opsional.

**Request Body (JSON):**
```json
{
  "nama": "Tunggal",
  "cabor_id": 6,
  "jenis_kelamin": "PUTRA",
  "tipe": "INDIVIDU"
}
```

### DELETE `/admin/master/nomor/:id`
**Hard delete** — hapus permanen dari database.

---

## 6. Roles + Role Permissions

**Base path:** `/admin/roles`

### Model Response
```json
{
  "id": 1,
  "name": "SUPERADMIN",
  "description": "Admin pusat Dispora Provinsi"
}
```
> Tabel `roles` **tidak punya `created_at` / `updated_at`**.

### GET `/admin/roles`
Semua role.

### GET `/admin/roles/:id`
Role by ID.

### GET `/admin/roles/user/:user_id`
Semua role yang di-assign ke user tertentu.

### POST `/admin/roles`
Buat role baru.

**Request Body (JSON):**
```json
{
  "name": "ADMIN_KONTINGEN",
  "description": "Admin yang mengelola data kontingen"
}
```
> `name` wajib, harus unik. `description` opsional.

### PUT `/admin/roles/:id`
Update role.

**Request Body (JSON):**
```json
{
  "name": "ADMIN_KONTINGEN",
  "description": "Deskripsi baru"
}
```

### DELETE `/admin/roles/:id`
Hapus role permanen.

---

### Role Permissions

### GET `/admin/roles/:id/permissions`
Ambil permission IDs yang di-assign ke role. Mengembalikan **array of number**.

**Response:**
```json
{
  "success": true,
  "message": "Data permissions berhasil diambil",
  "data": [2, 6, 14, 18, 22]
}
```

### POST `/admin/roles/:id/permissions/:permission_id`
Assign permission ke role. Tidak perlu body.

**Contoh:** `POST /admin/roles/2/permissions/14`

### DELETE `/admin/roles/:id/permissions/:permission_id`
Hapus permission dari role.

---

### Role Permissions (endpoint alternatif)

### GET `/admin/role-permissions/role/:id`
Semua relasi permission untuk role tertentu.

### POST `/admin/role-permissions`
Assign permission ke role via body.

**Request Body (JSON):**
```json
{
  "role_id": 2,
  "permission_id": 14
}
```

### DELETE `/admin/role-permissions/role/:id/permission/:permissionId`
Hapus satu relasi.

### DELETE `/admin/role-permissions/role/:id`
Hapus **semua** permission dari role.

---

## 7. Permissions

**Base path:** `/admin/permissions`

### Model Response
```json
{
  "id": 14,
  "module_id": 5,
  "name": "atlet.read",
  "description": "Melihat data atlet",
  "created_at": "2026-05-30T12:22:50Z",
  "updated_at": "2026-05-30T12:22:50Z"
}
```

### GET `/admin/permissions`
Semua permission, diurutkan `module_id ASC, id ASC`.

### GET `/admin/permissions/:id`
Permission by ID.

### GET `/admin/permissions/role/:role_id`
Semua permission yang di-assign ke role tertentu.

### GET `/admin/permissions/module/:module_id`
Semua permission untuk module tertentu.

### POST `/admin/permissions`
Buat permission baru.

**Request Body (JSON):**
```json
{
  "module_id": 5,
  "name": "atlet.export",
  "description": "Export data atlet ke Excel"
}
```
> `name` wajib, harus unik. `module_id` dan `description` opsional.  
> Konvensi nama: `<module_name>.<action>` — contoh: `cabor.read`, `atlet.create`

### PUT `/admin/permissions/:id`
Update permission.

**Request Body (JSON):**
```json
{
  "module_id": 5,
  "name": "atlet.export",
  "description": "Export data atlet"
}
```

### DELETE `/admin/permissions/:id`
Hapus permission permanen.

---

## Catatan Penting untuk Frontend

### Password Hashing
Password dikirim **plaintext** dari frontend. Backend hash dengan SHA-256 sebelum disimpan. Jangan hash di frontend.

### Partial Update
Semua endpoint `PUT` menggunakan partial update — hanya field yang dikirim yang diupdate. Field yang tidak dikirim tetap seperti semula.

**Pengecualian:** Field integer (`max_putra`, `max_putri`, `max_pelatih`) di cabor — nilai `0` dianggap "tidak diubah" oleh backend. Jika ingin set ke 0, perlu penanganan khusus.

### Soft Delete vs Hard Delete
| Resource | Delete Type | Keterangan |
|---|---|---|
| Cabor | **Hard** | Hapus permanen dari DB |
| Nomor | **Hard** | Hapus permanen dari DB |
| Sekolah | Hard | Hapus permanen dari DB |
| Users | Hard | Hapus permanen dari DB |
| Roles | Hard | Hapus permanen dari DB |
| Territories | Hard | Hapus permanen dari DB |
| Modules | Hard | Hapus permanen dari DB |
| Permissions | Hard | Hapus permanen dari DB |

### Kolom yang Tidak Ada di Tabel
Beberapa tabel tidak punya semua kolom timestamp:

| Tabel | Ada `created_at` | Ada `updated_at` |
|---|---|---|
| `master_cabor` | ✅ | ❌ |
| `master_nomor` | ✅ | ❌ |
| `master_sekolah` | ✅ | ❌ |
| `master_pelatih` | ✅ | ❌ |
| `master_official` | ✅ | ❌ |
| `roles` | ❌ | ❌ |
| `territories` | ❌ | ❌ |
| `modules` | ✅ | ✅ |
| `permissions` | ✅ | ✅ |
| `users` | ✅ | ❌ |

> Jangan tampilkan field yang tidak ada — akan `null` atau tidak muncul di response.

### Relasi User → Role → Permission
```
users
  └── user_roles (user_id, role_id)
        └── roles
              └── role_permissions (role_id, permission_id)
                    └── permissions
                          └── modules
```

Untuk assign role ke user: `POST /admin/users/:id/roles/:role_id`  
Untuk assign permission ke role: `POST /admin/roles/:id/permissions/:permission_id`

### Login Ulang Setelah Perubahan
Setelah superadmin mengubah role atau territory user, user tersebut perlu **login ulang** agar JWT token-nya diperbarui dengan data terbaru.

### Sekolah — Field `nama` vs `name`
Request body pakai key `"nama"` (bukan `"name"`):
```json
{ "nama": "SMP Negeri 1", "npsn": "12345678", "alamat": "...", "kabupaten": "..." }
```
Response juga pakai key `"nama"`.

---

## 8. Tahap 1 — Akses Superadmin via Territory

Superadmin tidak punya `kontingen_id` di JWT (nilainya `0`). Untuk akses data tahap 1 kontingen tertentu, **wajib kirim query parameter `territory_id`** di semua endpoint tahap 1.

Backend resolve otomatis: `territory_id` → cari `kontingen_id` di tabel `kontingen` (`WHERE territory_id = ?`).

### Perbedaan Admin Biasa vs Superadmin

| | Admin Biasa | Superadmin |
|---|---|---|
| `kontingen_id` di JWT | Ada (> 0) | Tidak ada (= 0) |
| Akses tahap 1 | Langsung, tidak perlu param tambahan | Wajib kirim `?territory_id=X` |
| Jumlah kontingen yang bisa diakses | Hanya miliknya | Semua, pilih via territory |

### Semua Endpoint Tahap 1 + territory_id

| Method | URL (Superadmin) | URL (Admin Biasa) |
|---|---|---|
| GET | `/admin/tahap1?territory_id=2` | `/admin/tahap1` |
| PUT | `/admin/tahap1?territory_id=2` | `/admin/tahap1` |
| DELETE | `/admin/tahap1/6?territory_id=2` | `/admin/tahap1/6` |
| POST | `/admin/tahap1/submit?territory_id=2` | `/admin/tahap1/submit` |

### GET `/admin/tahap1?territory_id=2` 🔒

**Response sukses:**
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

### PUT `/admin/tahap1?territory_id=2` 🔒

Tambah atau update satu cabor. **Content-Type: `multipart/form-data`**

| Field | Wajib | Keterangan |
|---|---|---|
| `cabor_id` | ✅ | ID dari `master_cabor` |
| `putra` | ❌ | Jumlah atlet putra (default 0) |
| `putri` | ❌ | Jumlah atlet putri (default 0) |
| `pelatih` | ❌ | Jumlah pelatih (default 0) |

> `total_atlet` dan `total_personel` dihitung otomatis — tidak perlu dikirim.

**Contoh (JavaScript):**
```js
const form = new FormData()
form.append('cabor_id', '6')
form.append('putra', '3')
form.append('putri', '2')
form.append('pelatih', '1')

fetch('http://localhost:8000/admin/tahap1?territory_id=2', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: form
})
```

### DELETE `/admin/tahap1/:cabor_id?territory_id=2` 🔒

Hapus satu cabor dari daftar tahap 1 kontingen tersebut.

**Contoh:** `DELETE /admin/tahap1/6?territory_id=2`

### POST `/admin/tahap1/submit?territory_id=2` 🔒

Kunci tahap 1 kontingen tersebut. Tidak perlu body.

### Response Error

**territory_id tidak dikirim (400):**
```json
{ "success": false, "message": "Superadmin wajib kirim query parameter territory_id" }
```

**Territory tidak punya kontingen (404):**
```json
{ "success": false, "message": "Kontingen untuk territory ini tidak ditemukan" }
```

**Sudah disubmit (400):**
```json
{ "success": false, "message": "Tahap 1 sudah disubmit, tidak dapat diubah" }
```

### Alur Frontend Superadmin

```
1. Superadmin pilih territory dari dropdown
   → GET /admin/territories/kabupatens
   → Simpan territory_id yang dipilih

2. Load data tahap 1 kontingen tersebut
   → GET /admin/tahap1?territory_id={id}
   → Cek tahap1_status: "DRAFT" → form aktif | "SUBMITTED" → read-only

3. Tambah cabor
   → PUT /admin/tahap1?territory_id={id}  (form-data)

4. Hapus cabor
   → DELETE /admin/tahap1/{cabor_id}?territory_id={id}

5. Submit
   → POST /admin/tahap1/submit?territory_id={id}
```

> Untuk detail lengkap alur dan aturan bisnis tahap 1, lihat `TAHAP1_DOCUMENTATION.md`.

---

## 9. Pengaturan Tahap — Buka/Tutup

Superadmin mengontrol kapan setiap tahap bisa diakses admin kontingen. Kontrol di `is_open` — tanggal hanya informatif.

**Base path:** `/admin/pengaturan-tahap`

### `GET /admin/pengaturan-tahap` 🔒 (Semua Role)

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "tahap": 1, "is_open": true, "tanggal_buka": "2026-06-01", "tanggal_tutup": "2026-06-30", "updated_at": "..." },
    { "id": 2, "tahap": 2, "is_open": false, "tanggal_buka": null, "tanggal_tutup": null, "updated_at": "..." },
    { "id": 3, "tahap": 3, "is_open": false, "tanggal_buka": null, "tanggal_tutup": null, "updated_at": "..." }
  ]
}
```

### `PUT /admin/pengaturan-tahap/:tahap` 🔒 (Superadmin Only)

`:tahap` harus `1`, `2`, atau `3`. Semua field opsional.

**Request Body:**
```json
{ "is_open": true, "tanggal_buka": "2026-06-01", "tanggal_tutup": "2026-06-30" }
```

Kirim string kosong `""` untuk hapus tanggal (set null):
```json
{ "tanggal_buka": "", "tanggal_tutup": "" }
```

**Response error — urutan tahap salah (400):**
```json
{ "success": false, "message": "Tahap 2 tidak bisa dibuka sebelum Tahap 1 pernah dibuka" }
```

> Lihat detail lengkap di `FEATURE_PENGATURAN_TAHAP_FRONTEND.md`

---

## 10. Validasi Pendaftaran

Superadmin memvalidasi data kontingen per tahap setelah submit. Admin kontingen melihat hasilnya di widget dan halaman Rekap.

### `GET /admin/validasi-pendaftaran` 🔒 (Superadmin Only)

List semua kontingen + status validasi. Tidak perlu `territory_id`.

**Query params opsional:** `?status=PENDING`, `?tahap=1`, `?territory_id=2`

```json
{
  "success": true,
  "data": [
    {
      "kontingen_id": 2,
      "territory_id": 1,
      "nama_kontingen": "Kabupaten Tangerang",
      "tahap1": { "submit_status": "SUBMITTED", "submitted_at": "...", "validasi_status": "PENDING", "validasi_catatan": null, "validasi_at": null },
      "tahap2": { "submit_status": "SUBMITTED", "submitted_at": "...", "validasi_status": "REVISI", "validasi_catatan": "Nomor ganda campuran belum didaftarkan", "validasi_at": "..." },
      "tahap3": { "submit_status": "DRAFT", "submitted_at": null, "validasi_status": null, "validasi_catatan": null, "validasi_at": null }
    }
  ]
}
```

### `PUT /admin/validasi-pendaftaran/:kontingen_id/tahap/:tahap` 🔒 (Superadmin Only)

Set VALID atau REVISI. Catatan wajib jika REVISI.

**Request Body:**
```json
{ "status": "VALID", "catatan": null }
```
```json
{ "status": "REVISI", "catatan": "Jumlah atlet putra melebihi kuota." }
```

**Response 200:**
```json
{
  "success": true,
  "message": "Validasi Tahap 1 kontingen Kabupaten Tangerang berhasil disimpan",
  "data": { "kontingen_id": 2, "nama_kontingen": "Kabupaten Tangerang", "tahap": 1, "status": "VALID", "catatan": null, "validasi_at": "..." }
}
```

### `GET /admin/validasi-pendaftaran/status` 🔒 (Semua Role)

Widget dashboard — hanya status validasi kontingen yang sedang login. Superadmin bisa pakai `?territory_id=X`.

```json
{
  "success": true,
  "data": {
    "kontingen_id": 2,
    "nama_kontingen": "Kabupaten Tangerang",
    "tahap1": { "validasi_status": "VALID", "validasi_catatan": null },
    "tahap2": { "validasi_status": "REVISI", "validasi_catatan": "Nomor ganda campuran belum didaftarkan" },
    "tahap3": { "validasi_status": null }
  }
}
```

### `GET /admin/rekap-pendaftaran` 🔒 (Semua Role)

Semua data pendaftaran kontingen dalam satu response. Admin biasa tidak perlu param, superadmin wajib `?territory_id=X`.

> Lihat detail lengkap di `FEATURE_VALIDASI_PENDAFTARAN_FRONTEND.md`

---

## Daftar Isi (Updated)

1. [Modules](#1-modules)
2. [Territories + User Territories](#2-territories--user-territories)
3. [Users + User Roles + User Territories](#3-users)
4. [Master Cabor](#4-master-cabor)
5. [Master Nomor](#5-master-nomor)
6. [Roles + Role Permissions](#6-roles--role-permissions)
7. [Permissions](#7-permissions)
8. [Tahap 1 — Akses Superadmin via Territory](#8-tahap-1--akses-superadmin-via-territory)
9. [Pengaturan Tahap — Buka/Tutup](#9-pengaturan-tahap--bukatutup) — **Baru**
10. [Validasi Pendaftaran](#10-validasi-pendaftaran) — **Baru**
