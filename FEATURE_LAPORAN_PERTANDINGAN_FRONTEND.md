# Laporan Pertandingan — Dokumentasi Frontend

> **Base URL:** `http://localhost:8000`  
> **Auth:** Wajib header `Authorization: Bearer <token>` di semua endpoint  
> **Akses:** Semua role yang sudah login (SUPERADMIN, ADMIN, STAFF_LAPANGAN)  
> **`created_by`:** Otomatis dari JWT — tidak perlu dikirim dari frontend

---

## Daftar Isi

1. [Konsep & Struktur Data](#1-konsep--struktur-data)
2. [Nilai Enum yang Valid](#2-nilai-enum-yang-valid)
3. [Model Response](#3-model-response)
4. [Endpoint Dropdown](#4-endpoint-dropdown)
5. [Endpoints CRUD](#5-endpoints-crud)
6. [Upload Foto & Video Bukti](#6-upload-foto--video-bukti)
7. [Export PDF](#7-export-pdf)
8. [Tanda Tangan Lewat Web](#8-tanda-tangan-lewat-web)
9. [Error Responses](#9-error-responses)
10. [Contoh Implementasi](#10-contoh-implementasi)

---

## 1. Konsep & Struktur Data

### Dua tabel yang terlibat

```
laporan_pertandingan              ← 1 record per babak pertandingan
  └── laporan_pertandingan_atlet  ← N record (1 per atlet yang bertanding)
```

### Konsep Sisi A dan Sisi B

Atlet dikelompokkan per **sisi** (A atau B). Urutan dalam sisi ditentukan oleh urutan array yang dikirim:

| Format | Sisi | Total rows atlet |
|---|---|---|
| Tunggal (1v1) | A=1 atlet, B=1 atlet | 2 rows |
| Ganda (2v2) | A=2 atlet, B=2 atlet | 4 rows |
| Beregu (5v5) | A=5 atlet, B=5 atlet | 10 rows |
| Nomor tunggal tanpa lawan | A=1 atlet, B kosong | 1 row |

Index 0 di array = urutan 1, index 1 = urutan 2, dst.

### Field `created_by`

Diisi otomatis dari `UserID` JWT. Frontend **tidak perlu dan tidak bisa** mengirim field ini.

### Sumber data atlet

Atlet yang bisa dipilih untuk sisi A/B diambil dari tabel `trx_pendaftaran_atlet` (bukan `master_atlet` langsung), sehingga hanya atlet yang **sudah terdaftar** di cabor+nomor tersebut yang muncul di dropdown. Ini menjamin konsistensi data pertandingan dengan data pendaftaran.

---

## 2. Nilai Enum yang Valid

### `babak`

| Nilai di API | Label di UI |
|---|---|
| `PENYISIHAN` | Penyisihan |
| `8_BESAR` | 8 Besar |
| `PEREMPAT_FINAL` | Perempat Final |
| `SEMIFINAL` | Semifinal |
| `FINAL` | Final |
| `PEREBUTAN_TEMPAT_3` | Perebutan Tempat 3 |
| `LAINNYA` | Lainnya |

### `pemenang`

| Nilai di API | Label di UI |
|---|---|
| `TIM_A` | Tim A |
| `TIM_B` | Tim B |
| `DRAW` | Seri |

> **Case-insensitive** — backend melakukan `strings.ToUpper` sebelum validasi. Frontend boleh kirim `"Final"`, `"FINAL"`, atau `"final"` — semuanya diterima.  
> Validasi ada di **service layer** (bukan binding tag), sehingga error message lebih deskriptif.

---

## 3. Model Response

### `LaporanDetail` — Response GET

```json
{
  "id": 1,
  "tanggal_pertandingan": "2026-08-10",
  "waktu_pertandingan": "09:00:00",
  "venue": "GOR Pemuda Serang",
  "cabor_id": 6,
  "nomor_id": 71,
  "babak": "FINAL",
  "kontingen_a_id": 3,
  "kontingen_b_id": 2,
  "hasil_pertandingan": "21-18,21-17,21-19",
  "pemenang": "TIM_A",
  "juara_ke": 1,
  "wasit": "Budi Santoso",
  "catatan_khusus": null,
  "foto_bukti": null,
  "video_bukti": null,
  "created_by": 1,
  "created_at": "2026-06-12T08:28:46Z",
  "updated_at": "2026-06-12T08:28:46Z",

  "nama_cabor": "Bulutangkis",
  "nama_nomor": "Beregu",
  "nama_kontingen_a": "Kabupaten Serang",
  "nama_kontingen_b": "Kabupaten Tangerang",

  "atlet_a": [
    {
      "id": 1, "atlet_id": 5, "nama_lengkap": "Adi Pratama",
      "cabor_id": 6, "nama_cabor": "Bulutangkis",
      "nomor_id": 71, "nama_nomor": "Beregu",
      "urutan": 1
    }
  ],
  "atlet_b": [
    {
      "id": 3, "atlet_id": 6, "nama_lengkap": "Candra Wijaya",
      "cabor_id": 6, "nama_cabor": "Bulutangkis",
      "nomor_id": 71, "nama_nomor": "Beregu",
      "urutan": 1
    }
  ]
}
```

> **`tanggal_pertandingan`** selalu berformat `"YYYY-MM-DD"` (plain date, bukan ISO timestamp).  
> Backend menggunakan custom type `TanggalDate` yang strip timezone offset dari MariaDB.  
> Frontend bisa langsung pakai value ini untuk `<input type="date" value="2026-08-10">`.

**Field tambahan hasil JOIN:**

| Field | Sumber |
|---|---|
| `nama_cabor` | `master_cabor.nama` |
| `nama_nomor` | `master_nomor.nama` |
| `nama_kontingen_a` | `kontingen.nama_kontingen` WHERE id = kontingen_a_id |
| `nama_kontingen_b` | `kontingen.nama_kontingen` WHERE id = kontingen_b_id, `null` jika tidak ada |
| `atlet_a` / `atlet_b` | `laporan_pertandingan_atlet` JOIN `master_atlet` JOIN `trx_pendaftaran_atlet` → `master_cabor` + `master_nomor` |

> `atlet_a` dan `atlet_b` **selalu array** (tidak pernah null) — bisa `[]`.  
> `juara_ke` bisa `null`.  
> `cabor_id`/`nomor_id` di dalam item atlet bisa `0`, `nama_*` bisa `""` jika tidak match di `trx_pendaftaran_atlet`.

### `AtletSisiItem`

```json
{
  "id": 1,
  "atlet_id": 5,
  "nama_lengkap": "Adi Pratama",
  "cabor_id": 6,
  "nama_cabor": "Bulutangkis",
  "nomor_id": 71,
  "nama_nomor": "Beregu",
  "urutan": 1
}
```

---

## 4. Endpoint Dropdown

Untuk populate semua dropdown di form buat/edit laporan. Semua GET, tidak perlu payload.

### `GET /admin/laporan-pertandingan/dropdown/kontingen` 🔒

Semua kontingen dari tabel `kontingen` — untuk dropdown **Tim A** dan **Tim B**.

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": 2, "nama_kontingen": "Kabupaten Tangerang", "territory_id": 2 },
    { "id": 3, "nama_kontingen": "Kabupaten Serang",    "territory_id": 3 }
  ]
}
```

---

### `GET /admin/laporan-pertandingan/dropdown/cabor` 🔒

Cabor aktif dari `master_cabor`.

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": 6, "nama": "Bulutangkis", "is_active": true }
  ]
}
```

---

### `GET /admin/laporan-pertandingan/dropdown/nomor?cabor_id=6` 🔒

Nomor/kelas aktif dari `master_nomor`. Filter `cabor_id` dianjurkan.

**Query param opsional:** `cabor_id`

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": 69, "cabor_id": 6, "nama": "Tunggal", "jenis_kelamin": "PUTRA",  "tipe": "INDIVIDU" },
    { "id": 70, "cabor_id": 6, "nama": "Ganda",   "jenis_kelamin": "PUTRA",  "tipe": "BEREGU"   },
    { "id": 71, "cabor_id": 6, "nama": "Beregu",  "jenis_kelamin": "PUTRA",  "tipe": "BEREGU"   }
  ]
}
```

---

### `GET /admin/laporan-pertandingan/dropdown/atlet` 🔒

Atlet dari `trx_pendaftaran_atlet` — **hanya atlet yang sudah terdaftar** di cabor+nomor tertentu.

**Query params (semua opsional):**

| Param | Keterangan |
|---|---|
| `kontingen_id` | Filter by kontingen (Tim A atau Tim B) |
| `cabor_id` | Filter by cabor |
| `nomor_id` | Filter by nomor/kelas |

```
GET /admin/laporan-pertandingan/dropdown/atlet?kontingen_id=3&cabor_id=6&nomor_id=71
GET /admin/laporan-pertandingan/dropdown/atlet?cabor_id=6&nomor_id=71
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "atlet_id": 4,
      "nama_lengkap": "Joko",
      "kontingen_id": 3,
      "nama_kontingen": "Kabupaten Serang",
      "cabor_id": 6,
      "nomor_id": 71
    }
  ]
}
```

**Alur dropdown di form — urutan penting:**
```
1. Pilih Cabor  → GET dropdown/cabor
2. Pilih Nomor  → GET dropdown/nomor?cabor_id={cabor_id}  (update saat cabor berubah)
3. Pilih Tim A  → GET dropdown/kontingen
4. Pilih Atlet A → GET dropdown/atlet?kontingen_id={tim_a}&cabor_id={cabor_id}&nomor_id={nomor_id}
5. Pilih Tim B  → dari dropdown/kontingen yang sudah ada
6. Pilih Atlet B → GET dropdown/atlet?kontingen_id={tim_b}&cabor_id={cabor_id}&nomor_id={nomor_id}
```

---

## 5. Endpoints CRUD

### `GET /admin/laporan-pertandingan` 🔒

List semua laporan, diurutkan **tanggal DESC, waktu DESC** (terbaru dulu).

**Query params opsional:**

| Param | Tipe | Keterangan |
|---|---|---|
| `cabor_id` | number | Filter by cabor |
| `nomor_id` | number | Filter by nomor/kelas |
| `babak` | string | Filter by babak (case-insensitive) |
| `tanggal` | string | Filter by tanggal, format `YYYY-MM-DD` |
| `pemenang` | string | Filter: `TIM_A` / `TIM_B` / `DRAW` |

```
GET /admin/laporan-pertandingan
GET /admin/laporan-pertandingan?tanggal=2026-08-10
GET /admin/laporan-pertandingan?cabor_id=6&babak=FINAL
GET /admin/laporan-pertandingan?pemenang=TIM_A
```

**Response 200:**
```json
{
  "success": true,
  "message": "Data laporan pertandingan berhasil diambil",
  "data": [ ...array of LaporanDetail... ]
}
```

---

### `GET /admin/laporan-pertandingan/:id` 🔒

Detail satu laporan lengkap dengan `atlet_a` dan `atlet_b`.

---

### `POST /admin/laporan-pertandingan` 🔒

Buat laporan baru. **`created_by` tidak perlu dikirim** — otomatis dari JWT.

**Content-Type:** `application/json`

**Field wajib:** `tanggal_pertandingan`, `waktu_pertandingan`, `venue`, `cabor_id`, `nomor_id`, `babak`, `kontingen_a_id`, `hasil_pertandingan`, `pemenang`, `wasit`

```json
{
  "tanggal_pertandingan": "2026-08-10",
  "waktu_pertandingan": "09:00:00",
  "venue": "GOR Pemuda Serang",
  "cabor_id": 6,
  "nomor_id": 71,
  "babak": "PENYISIHAN",
  "kontingen_a_id": 3,
  "kontingen_b_id": 2,
  "hasil_pertandingan": "21-18,21-17,21-19",
  "pemenang": "TIM_A",
  "juara_ke": null,
  "wasit": "Budi Santoso",
  "catatan_khusus": null,
  "atlet_a": [5, 4],
  "atlet_b": [6, 7]
}
```

> `atlet_a` dan `atlet_b` adalah **ordered list of `atlet_id`** dari `trx_pendaftaran_atlet`.  
> Index 0 = urutan 1, index 1 = urutan 2.  
> Untuk beregu tanpa specify atlet: kirim `[]` atau tidak kirim field ini.

**Response 201:** `LaporanDetail` lengkap.

---

### `PUT /admin/laporan-pertandingan/:id` 🔒

Update laporan. **Partial update** — hanya field yang dikirim yang berubah.

**Perilaku `atlet_a` / `atlet_b`:**

| Yang dikirim | Hasilnya |
|---|---|
| Field tidak ada di body | Atlet sisi itu **tidak berubah** |
| `"atlet_a": [10, 11]` | **Replace** semua atlet sisi A |
| `"atlet_a": []` | **Hapus semua** atlet sisi A |

```json
{
  "hasil_pertandingan": "21-15, 21-18",
  "pemenang": "TIM_B",
  "catatan_khusus": "Tim B menang dengan permainan dominan"
}
```

**Response 200:** `LaporanDetail` terbaru.

---

### `DELETE /admin/laporan-pertandingan/:id` 🔒

Hapus laporan. Data atlet (`laporan_pertandingan_atlet`) **ikut terhapus otomatis** via `ON DELETE CASCADE`.

**Response 200:**
```json
{ "success": true, "message": "Laporan pertandingan berhasil dihapus" }
```

---

## 6. Upload Foto & Video Bukti

### `PUT /admin/laporan-pertandingan/:id/foto` 🔒

**Content-Type:** `multipart/form-data` | **Field:** `foto`

**Response 200:**
```json
{
  "success": true,
  "message": "Foto bukti berhasil diupload",
  "path": "/uploads/laporan/1717123456_foto.jpg"
}
```

---

### `PUT /admin/laporan-pertandingan/:id/video` 🔒

**Content-Type:** `multipart/form-data` | **Field:** `video`

**Response 200:**
```json
{
  "success": true,
  "message": "Video bukti berhasil diupload",
  "path": "/uploads/laporan/video/1717123456_video.mp4"
}
```

---

## 7. Export PDF

Pakai `POST` bukan `GET` karena body berisi data tanda tangan (base64 PNG bisa besar).

### Layout PDF Portrait A4

```
LAPORAN PERTANDINGAN  #1
─────────────────────────────────────────────
Tanggal Pertandingan  │ 10 Agustus 2026
Waktu                 │ 09:00 WIB
Venue / Lapangan      │ GOR Pemuda Serang
Cabang Olahraga       │ Bulutangkis
Nomor / Kelas         │ Beregu Putra
Babak                 │ Final
Tim A                 │ Kabupaten Serang
Tim B                 │ Kabupaten Tangerang
Atlet Sisi A          │ 1. Adi | 2. Budi
Atlet Sisi B          │ 1. Candra | 2. Doni
Hasil Pertandingan    │ 21-18,21-17,21-19
Pemenang              │ Tim A
Juara Ke              │ Juara 1
Wasit / Juri          │ Budi Santoso
Catatan Khusus        │ -

              Serang, 10 Agustus 2026

  Wasit,             Ketua Panitia,
  [tanda tangan]     [tanda tangan]
  ─────────────      ─────────────
  Budi Santoso       Rudi Hartono
  NIP. ...           -
```

---

### `POST /admin/laporan-pertandingan/:id/export/pdf` 🔒

Export PDF **satu pertandingan**. Body opsional — tanpa body tetap generate tanpa tanda tangan.

```json
{
  "penandatangan": [
    {
      "jabatan": "Wasit",
      "nama_tercetak": "Budi Santoso",
      "nip": "",
      "signature_b64": "data:image/png;base64,iVBOR..."
    },
    {
      "jabatan": "Ketua Panitia",
      "nama_tercetak": "Rudi Hartono",
      "nip": "198001012010011001",
      "signature_b64": ""
    }
  ]
}
```

**Response:** File PDF binary
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="laporan_1_Bulutangkis_2026-08-10.pdf"
```

---

### `POST /admin/laporan-pertandingan/export/pdf` 🔒

Export PDF **batch** — semua pertandingan atau difilter. Tanda tangan muncul **sekali di akhir**.

```json
{
  "tanggal": "2026-08-10",
  "cabor_id": 6,
  "nomor_id": 0,
  "penandatangan": [...]
}
```

**Filter di body:**

| Field | Keterangan |
|---|---|
| `tanggal` | `YYYY-MM-DD` — hanya hari itu |
| `cabor_id` | Filter by cabor |
| `nomor_id` | Filter by nomor |
| Semua kosong/0 | Semua pertandingan |

**Response 404 jika tidak ada data:**
```json
{ "success": false, "message": "Tidak ada data laporan untuk di-export" }
```

---

## 8. Tanda Tangan Lewat Web

Tanda tangan dikumpulkan di frontend menggunakan **Signature Pad** (canvas), dikirim sebagai `base64 PNG`.  
Backend decode dengan `base64.StdEncoding.DecodeString` → `bytes.NewReader` → embed ke PDF via `gofpdf.RegisterImageReader`.

> **Penting:** Kirim base64 **dengan atau tanpa** data URI prefix — keduanya diterima backend:
> ```
> "data:image/png;base64,iVBORw0KGgo..."   ← ✅ dengan prefix (output toDataURL())
> "iVBORw0KGgo..."                          ← ✅ tanpa prefix
> ""  atau tidak ada field                  ← ✅ area tanda tangan kosong (tanda tangan manual)
> ```

### Library

```
npm install signature_pad
```

### Komponen React

```tsx
import SignaturePad from "signature_pad";
import { useRef, useEffect } from "react";

function SignaturePadComponent({
  label,
  onSave,
}: {
  label: string;
  onSave: (b64: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      padRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: "rgba(255,255,255,0)",
        penColor: "#000000",
      });
    }
  }, []);

  const handleSave = () => {
    if (padRef.current && !padRef.current.isEmpty()) {
      // toDataURL menghasilkan "data:image/png;base64,..." — backend strip prefix otomatis
      onSave(padRef.current.toDataURL("image/png"));
    }
  };

  return (
    <div className="border rounded p-3">
      <p className="text-sm font-medium mb-2">{label}</p>
      <canvas
        ref={canvasRef}
        width={300}
        height={120}
        className="border rounded bg-white w-full"
        style={{ touchAction: "none" }}
      />
      <div className="flex gap-2 mt-2">
        <button onClick={handleSave} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
          Gunakan
        </button>
        <button onClick={() => { padRef.current?.clear(); onSave(""); }}
          className="px-3 py-1 bg-gray-200 rounded text-sm">
          Hapus
        </button>
      </div>
    </div>
  );
}
```

### Struktur payload tanda tangan

```typescript
interface TTDData {
  jabatan: string;        // "Wasit", "Ketua Panitia", dll
  nama_tercetak: string;  // nama yang dicetak di bawah garis
  nip?: string;           // opsional
  signature_b64?: string; // output dari signaturePad.toDataURL("image/png")
}
```

### Posisi di PDF

Tanda tangan muncul **di bawah tabel data**, sejajar per kolom sesuai jumlah penandatangan:
- 1 penandatangan → 1 kolom penuh tengah
- 2 penandatangan → 2 kolom bagi rata
- 3 penandatangan → 3 kolom bagi rata

Untuk export **satu laporan** (`POST /:id/export/pdf`) → TTD muncul di halaman itu.  
Untuk export **batch** (`POST /export/pdf`) → TTD muncul **sekali di halaman terakhir**.

---

## 9. Error Responses

| Kondisi | HTTP | Pesan |
|---|---|---|
| Laporan tidak ditemukan | 404 | `"laporan pertandingan tidak ditemukan"` |
| `babak` tidak valid | 400 | `"babak tidak valid (PENYISIHAN/8_BESAR/PEREMPAT_FINAL/SEMIFINAL/FINAL/PEREBUTAN_TEMPAT_3/LAINNYA)"` |
| `pemenang` tidak valid | 400 | `"pemenang tidak valid (TIM_A/TIM_B/DRAW)"` |
| Field wajib kosong | 400 | `"Format request tidak valid"` + detail di field `error` |
| File foto tidak ada | 400 | `"File foto diperlukan (field: foto)"` |
| File video tidak ada | 400 | `"File video diperlukan (field: video)"` |
| Tidak ada data export | 404 | `"Tidak ada data laporan untuk di-export"` |

> Validasi `babak`/`pemenang` di **service layer** dengan `strings.ToUpper` — `"Final"` dan `"FINAL"` keduanya valid.  
> Jika POST 400, cek field `"error"` di response JSON untuk tahu field mana yang gagal validasi binding.

### Catatan Format Tanggal

`tanggal_pertandingan` di response **selalu `"YYYY-MM-DD"`** (contoh: `"2026-08-10"`).  
Backend menggunakan custom type yang strip timezone offset dari MariaDB (`"2026-06-12T00:00:00+07:00"` → `"2026-06-12"`).

Frontend bisa langsung bind ke `<input type="date">`:
```typescript
// ✅ Langsung pakai
<input type="date" value={laporan.tanggal_pertandingan} />

// ✅ Format untuk display
new Date(laporan.tanggal_pertandingan).toLocaleDateString("id-ID", {
  day: "numeric", month: "long", year: "numeric"
})
// → "10 Agustus 2026"
```

Saat **mengirim** ke backend (`POST`/`PUT`), kirim plain `"YYYY-MM-DD"`:
```typescript
// ✅ Benar
{ tanggal_pertandingan: "2026-08-10" }

// ❌ Salah — jangan kirim timestamp
{ tanggal_pertandingan: "2026-08-10T00:00:00+07:00" }
```

---

## 10. Contoh Implementasi

### Types (TypeScript)

```typescript
export type Babak =
  | "PENYISIHAN"
  | "8_BESAR"
  | "PEREMPAT_FINAL"
  | "SEMIFINAL"
  | "FINAL"
  | "PEREBUTAN_TEMPAT_3"
  | "LAINNYA";

export type Pemenang = "TIM_A" | "TIM_B" | "DRAW";

export interface AtletSisiItem {
  id: number;
  atlet_id: number;
  nama_lengkap: string;
  cabor_id: number;        // 0 jika tidak match di trx_pendaftaran_atlet
  nama_cabor: string;      // "" jika tidak match
  nomor_id: number;        // 0 jika tidak match
  nama_nomor: string;      // "" jika tidak match
  urutan: number;
}

export interface LaporanDetail {
  id: number;
  tanggal_pertandingan: string;   // selalu "YYYY-MM-DD" — backend strip timezone otomatis
  waktu_pertandingan: string;     // "HH:MM:SS"
  venue: string;
  cabor_id: number;
  nomor_id: number;
  babak: Babak;
  kontingen_a_id: number;
  kontingen_b_id: number | null;
  hasil_pertandingan: string;
  pemenang: Pemenang;
  juara_ke: number | null;
  wasit: string;
  catatan_khusus: string | null;
  foto_bukti: string | null;
  video_bukti: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  // Join fields
  nama_cabor: string;
  nama_nomor: string;
  nama_kontingen_a: string;
  nama_kontingen_b: string | null;
  atlet_a: AtletSisiItem[];
  atlet_b: AtletSisiItem[];
}

export interface CreateLaporanPayload {
  tanggal_pertandingan: string;   // YYYY-MM-DD
  waktu_pertandingan: string;     // HH:MM:SS
  venue: string;
  cabor_id: number;
  nomor_id: number;
  babak: Babak;                   // case-insensitive di backend
  kontingen_a_id: number;
  kontingen_b_id?: number;
  hasil_pertandingan: string;
  pemenang: Pemenang;             // case-insensitive di backend
  juara_ke?: number;
  wasit: string;
  catatan_khusus?: string;
  atlet_a?: number[];             // ordered list atlet_id dari trx_pendaftaran_atlet
  atlet_b?: number[];
  // JANGAN kirim created_by
}

export interface UpdateLaporanPayload {
  tanggal_pertandingan?: string;
  waktu_pertandingan?: string;
  venue?: string;
  cabor_id?: number;
  nomor_id?: number;
  babak?: Babak;
  kontingen_a_id?: number;
  kontingen_b_id?: number | null;
  hasil_pertandingan?: string;
  pemenang?: Pemenang;
  juara_ke?: number | null;
  wasit?: string;
  catatan_khusus?: string | null;
  atlet_a?: number[];   // replace semua, [] = hapus semua
  atlet_b?: number[];
}

export interface TTDData {
  jabatan: string;
  nama_tercetak: string;
  nip?: string;
  signature_b64?: string;
}

export interface ExportPDFPayload {
  tanggal?: string;
  cabor_id?: number;
  nomor_id?: number;
  penandatangan?: TTDData[];
}

// ===== Dropdown types =====

export interface KontingenDropdownItem {
  id: number;
  nama_kontingen: string;
  territory_id: number;
}

export interface CaborDropdownItem {
  id: number;
  nama: string;
  is_active: boolean;
}

export interface NomorDropdownItem {
  id: number;
  cabor_id: number;
  nama: string;
  jenis_kelamin: "PUTRA" | "PUTRI" | "CAMPURAN";
  tipe: "INDIVIDU" | "BEREGU";
}

export interface AtletTerdaftarDropdownItem {
  atlet_id: number;
  nama_lengkap: string;
  kontingen_id: number;
  nama_kontingen: string;
  cabor_id: number;
  nomor_id: number;
}
```

### Service Functions

```typescript
const BASE = "http://localhost:8000";

export const laporanPertandinganService = {
  // ===== CRUD =====
  getAll: (params?: {
    tanggal?: string;
    cabor_id?: number;
    nomor_id?: number;
    babak?: Babak;
    pemenang?: Pemenang;
  }): Promise<LaporanDetail[]> =>
    api.get("/admin/laporan-pertandingan", { params }).then(r => r.data.data),

  getByID: (id: number): Promise<LaporanDetail> =>
    api.get(`/admin/laporan-pertandingan/${id}`).then(r => r.data.data),

  create: (payload: CreateLaporanPayload): Promise<LaporanDetail> =>
    api.post("/admin/laporan-pertandingan", payload).then(r => r.data.data),

  update: (id: number, payload: UpdateLaporanPayload): Promise<LaporanDetail> =>
    api.put(`/admin/laporan-pertandingan/${id}`, payload).then(r => r.data.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/admin/laporan-pertandingan/${id}`),

  // ===== UPLOAD =====
  uploadFoto: (id: number, file: File) => {
    const form = new FormData();
    form.append("foto", file); // field name: "foto"
    return api.put(`/admin/laporan-pertandingan/${id}/foto`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(r => r.data);
  },

  uploadVideo: (id: number, file: File) => {
    const form = new FormData();
    form.append("video", file); // field name: "video"
    return api.put(`/admin/laporan-pertandingan/${id}/video`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(r => r.data);
  },

  // ===== DROPDOWN =====
  getKontingenDropdown: (): Promise<KontingenDropdownItem[]> =>
    api.get("/admin/laporan-pertandingan/dropdown/kontingen").then(r => r.data.data),

  getCaborDropdown: (): Promise<CaborDropdownItem[]> =>
    api.get("/admin/laporan-pertandingan/dropdown/cabor").then(r => r.data.data),

  getNomorDropdown: (caborId?: number): Promise<NomorDropdownItem[]> =>
    api.get("/admin/laporan-pertandingan/dropdown/nomor", {
      params: caborId ? { cabor_id: caborId } : {},
    }).then(r => r.data.data),

  // Hanya atlet yang sudah terdaftar di trx_pendaftaran_atlet
  getAtletDropdown: (params: {
    kontingen_id?: number;
    cabor_id?: number;
    nomor_id?: number;
  }): Promise<AtletTerdaftarDropdownItem[]> =>
    api.get("/admin/laporan-pertandingan/dropdown/atlet", { params })
      .then(r => r.data.data),

  // ===== EXPORT =====
  exportSatuPDF: async (id: number, payload: ExportPDFPayload = {}) => {
    const res = await fetch(`${BASE}/admin/laporan-pertandingan/${id}/export/pdf`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Gagal export PDF");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `laporan_${id}.pdf`;
    a.click();
  },

  exportBatchPDF: async (payload: ExportPDFPayload = {}) => {
    const res = await fetch(`${BASE}/admin/laporan-pertandingan/export/pdf`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message ?? "Gagal export PDF");
    }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `laporan_pertandingan_${payload.tanggal ?? "semua"}.pdf`;
    a.click();
  },
};
```

### Konstanta Enum

```typescript
export const BABAK_OPTIONS = [
  { value: "PENYISIHAN",         label: "Penyisihan" },
  { value: "8_BESAR",            label: "8 Besar" },
  { value: "PEREMPAT_FINAL",     label: "Perempat Final" },
  { value: "SEMIFINAL",          label: "Semifinal" },
  { value: "FINAL",              label: "Final" },
  { value: "PEREBUTAN_TEMPAT_3", label: "Perebutan Tempat 3" },
  { value: "LAINNYA",            label: "Lainnya" },
] as const;

export const PEMENANG_OPTIONS = [
  { value: "TIM_A", label: "Tim A" },
  { value: "TIM_B", label: "Tim B" },
  { value: "DRAW",  label: "Seri" },
] as const;

// Helper label — toleran terhadap case apapun
export const getBabakLabel = (v: string) =>
  BABAK_OPTIONS.find(o => o.value === v?.toUpperCase())?.label ?? v;

export const getPemenangLabel = (v: string) =>
  PEMENANG_OPTIONS.find(o => o.value === v?.toUpperCase())?.label ?? v;
```

---

## Ringkasan Endpoint

| Method | URL | Keterangan |
|---|---|---|
| `GET` | `/admin/laporan-pertandingan` | List + filter |
| `POST` | `/admin/laporan-pertandingan` | Buat laporan baru |
| `POST` | `/admin/laporan-pertandingan/export/pdf` | Export PDF batch + tanda tangan |
| `GET` | `/admin/laporan-pertandingan/dropdown/kontingen` | Dropdown Tim A/B |
| `GET` | `/admin/laporan-pertandingan/dropdown/cabor` | Dropdown cabang olahraga |
| `GET` | `/admin/laporan-pertandingan/dropdown/nomor` | Dropdown nomor (`?cabor_id=6`) |
| `GET` | `/admin/laporan-pertandingan/dropdown/atlet` | Dropdown atlet terdaftar |
| `GET` | `/admin/laporan-pertandingan/:id` | Detail satu laporan |
| `PUT` | `/admin/laporan-pertandingan/:id` | Update partial |
| `DELETE` | `/admin/laporan-pertandingan/:id` | Hapus (atlet ikut terhapus) |
| `PUT` | `/admin/laporan-pertandingan/:id/foto` | Upload foto bukti |
| `PUT` | `/admin/laporan-pertandingan/:id/video` | Upload video bukti |
| `POST` | `/admin/laporan-pertandingan/:id/export/pdf` | Export PDF satu laporan + TTD |

> **Urutan route penting:** semua path statis (`/export/pdf`, `/dropdown/*`) terdaftar **sebelum** `/:id` — sudah ditangani di `main.go`.

---

## Checklist Implementasi Frontend

- [x] Dropdown cabor dari `GET /dropdown/cabor`
- [x] Dropdown nomor dari `GET /dropdown/nomor?cabor_id=X`
- [x] Dropdown Tim A/B dari `GET /dropdown/kontingen`
- [x] Dropdown atlet dari `GET /dropdown/atlet?kontingen_id=X&cabor_id=X&nomor_id=X`
- [x] `tanggal_pertandingan` response selalu `"YYYY-MM-DD"` — langsung bind ke `<input type="date">`
- [x] Tanda tangan PDF — kirim `signature_b64` dari `signaturePad.toDataURL("image/png")`
- [ ] List laporan dengan filter tanggal, cabor, babak, pemenang
- [ ] Detail laporan — tampilkan `atlet_a`/`atlet_b` dengan `nama_cabor` + `nama_nomor`
- [ ] Update laporan — partial, atlet tidak berubah jika tidak dikirim
- [ ] Upload foto — field name: `foto`
- [ ] Upload video — field name: `video`
- [ ] Modal tanda tangan — signature pad per penandatangan
- [ ] Cetak PDF satu laporan — `POST /:id/export/pdf` + TTD
- [ ] Cetak PDF harian — `POST /export/pdf` dengan `tanggal` + TTD
- [ ] Cetak PDF semua — `POST /export/pdf` tanpa filter + TTD
