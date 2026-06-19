# Validasi Pendaftaran — Dokumentasi Frontend

> **Base URL:** `http://localhost:8000`  
> **Auth:** Wajib header `Authorization: Bearer <token>` di semua endpoint  
> **Superadmin:** Akses semua endpoint, set VALID/REVISI, **tidak perlu `territory_id`** untuk list validasi  
> **Admin kontingen:** Read-only — hanya bisa lihat status validasi milik sendiri

---

## Daftar Isi

1. [Konsep & Alur Kerja](#1-konsep--alur-kerja)
2. [Status Validasi](#2-status-validasi)
3. [Perubahan di GET Tahap 1/2/3](#3-perubahan-di-get-tahap-123)
4. [Perubahan di POST Submit](#4-perubahan-di-post-submit)
5. [Endpoints Baru](#5-endpoints-baru)
6. [Error Responses](#6-error-responses)
7. [Alur Frontend — Admin Kontingen](#7-alur-frontend--admin-kontingen)
8. [Alur Frontend — Superadmin Panel](#8-alur-frontend--superadmin-panel)
9. [Contoh Implementasi](#9-contoh-implementasi)

---

## 1. Konsep & Alur Kerja

Setelah kontingen submit setiap tahap, superadmin melakukan review. Superadmin bisa memberi status **VALID** atau **REVISI** per tahap per kontingen. Admin kontingen melihat hasilnya di dua tempat: widget dashboard dan halaman Rekap Pendaftaran.

```
Kontingen submit Tahap X
        ↓
validasi_status otomatis → PENDING
        ↓
Superadmin buka halaman Validasi Pendaftaran
→ review semua kontingen sekaligus
        ↓
   VALID              REVISI
     ↓                  ↓
Badge hijau       Badge kuning + catatan
                        ↓
               Admin kontingen lihat di widget / halaman tahap
                        ↓
               Admin perbaiki + submit ulang
                        ↓
               validasi_status kembali PENDING
                        ↓
               Superadmin review ulang
```

**Aturan penting:**
- `PENDING` di-set **otomatis oleh backend** saat submit — bukan oleh superadmin
- `VALID` dan `REVISI` hanya bisa di-set oleh superadmin
- Jika kontingen **submit ulang** setelah REVISI → status otomatis kembali ke `PENDING`
- Status `REVISI` **wajib** disertai `catatan` — backend tolak jika kosong
- Superadmin **tidak perlu** kirim `territory_id` di endpoint validasi — bisa lihat semua kontingen langsung

---

## 2. Status Validasi

| Status | Kapan | Tampilan di Frontend |
|---|---|---|
| `null` | Sebelum kontingen pernah submit | "Belum disubmit" / abu-abu |
| `"PENDING"` | Otomatis setelah submit | "Menunggu validasi" / jam kuning |
| `"VALID"` | Superadmin set | "Valid" / centang hijau |
| `"REVISI"` | Superadmin set | "Perlu revisi" / peringatan kuning + catatan |

---

## 3. Perubahan di GET Tahap 1/2/3

Response GET tahap sekarang **menyertakan field validasi**. Gunakan untuk tampilkan banner di halaman tahap masing-masing.

### GET `/admin/tahap1` — Response (Updated)

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
    "cabor_list": [ ... ]
  }
}
```

### GET `/admin/tahap2` — Response (Updated)

```json
{
  "success": true,
  "data": {
    "kontingen_id": 3,
    "territory_id": 2,
    "nama_kontingen": "Kabupaten Tangerang",
    "tahap2_status": "SUBMITTED",
    "tahap2_submitted_at": "2026-07-05T09:00:00Z",
    "tahap2_validasi_status": "PENDING",
    "tahap2_validasi_catatan": null,
    "nomor_list": [ ... ]
  }
}
```

### GET `/admin/tahap3` — Response (Updated)

```json
{
  "success": true,
  "data": {
    "kontingen_id": 3,
    "territory_id": 2,
    "nama_kontingen": "Kabupaten Tangerang",
    "tahap3_status": "DRAFT",
    "tahap3_submitted_at": null,
    "tahap3_validasi_status": null,
    "tahap3_validasi_catatan": null,
    ...
  }
}
```

**Logika tampilkan banner:**
```typescript
// Cukup cek validasi_status, tidak perlu cek tahapX_status
if (data.tahap1_validasi_status === "REVISI") {
  // tampilkan banner merah/kuning dengan catatan
}
if (data.tahap1_validasi_status === "PENDING") {
  // tampilkan banner biru "menunggu validasi"
}
if (data.tahap1_validasi_status === "VALID") {
  // tampilkan badge hijau
}
```

---

## 4. Perubahan di POST Submit

Setelah submit berhasil, backend **otomatis** set `validasi_status = PENDING`. Frontend cukup refetch GET tahap setelah submit.

```
1. POST /admin/tahap1/submit → 200 OK
2. Refetch GET /admin/tahap1
3. Response: tahap1_status = "SUBMITTED", tahap1_validasi_status = "PENDING"
4. Tampilkan badge "Menunggu validasi panitia"
```

---

## 5. Endpoints Baru

### `GET /admin/validasi-pendaftaran/status` 🔒 (Semua Role)

Widget dashboard — hanya status validasi kontingen yang sedang login.

```
GET /admin/validasi-pendaftaran/status

# Superadmin — baca status kontingen tertentu via territory:
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

> Endpoint ini ringan — tidak load data atlet/pelatih/official. Ideal untuk widget dashboard.

---

### `GET /admin/rekap-pendaftaran` 🔒 (Semua Role)

Ambil semua data pendaftaran kontingen dalam satu response. Dipakai halaman Rekap Pendaftaran (admin) dan detail validasi (superadmin).

- **Admin biasa:** tidak perlu param — data kontingen sendiri dari JWT
- **Superadmin:** wajib kirim `?territory_id=X`

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
            "atlet_id": 1,
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
          {
            "pelatih_id": 1,
            "cabor_id": 6,
            "nama_cabor": "Bulutangkis"
          }
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

**Catatan field `trx`:**
- `atlets[].trx` → array cabor+nomor yang sudah didaftarkan atlet tersebut
- `pelatihs[].trx` → array cabor yang sudah didaftarkan pelatih tersebut
- `officials[].trx` → array berisi satu item `{ "keterangan": "..." }` jika sudah terdaftar, array kosong `[]` jika belum

---

### `GET /admin/validasi-pendaftaran` 🔒 (Superadmin Only)

List semua kontingen + status validasi. **Tidak perlu `territory_id`** — superadmin otomatis melihat semua kontingen.

**Query params (semua opsional):**
| Param | Nilai | Keterangan |
|---|---|---|
| `status` | `PENDING` \| `VALID` \| `REVISI` | Filter by status validasi |
| `tahap` | `1` \| `2` \| `3` | Filter by tahap |
| `territory_id` | number | Filter hanya kontingen dari territory tertentu |

```
GET /admin/validasi-pendaftaran
GET /admin/validasi-pendaftaran?status=PENDING
GET /admin/validasi-pendaftaran?tahap=1&status=PENDING
GET /admin/validasi-pendaftaran?territory_id=2
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
        "validasi_catatan": "Nomor ganda campuran belum didaftarkan",
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

### `PUT /admin/validasi-pendaftaran/:kontingen_id/tahap/:tahap` 🔒 (Superadmin Only)

Set status validasi satu tahap untuk satu kontingen. `:tahap` harus `1`, `2`, atau `3`.

**Content-Type:** `application/json`

**Set VALID:**
```json
{ "status": "VALID", "catatan": null }
```

**Set REVISI (catatan wajib diisi):**
```json
{
  "status": "REVISI",
  "catatan": "Jumlah atlet putra bulutangkis melebihi yang seharusnya. Harap perbaiki."
}
```

**Response sukses 200:**
```json
{
  "success": true,
  "message": "Validasi Tahap 1 kontingen Kabupaten Tangerang berhasil disimpan",
  "data": {
    "kontingen_id": 2,
    "nama_kontingen": "Kabupaten Tangerang",
    "tahap": 1,
    "status": "VALID",
    "catatan": null,
    "validasi_at": "2026-06-11T09:00:00Z"
  }
}
```

---

## 6. Error Responses

### REVISI tanpa catatan (400)
```json
{ "success": false, "message": "Catatan wajib diisi jika status REVISI" }
```

### Status tidak valid (400)
```json
{ "success": false, "message": "Status harus VALID atau REVISI" }
```

### Tahap belum disubmit (400)
```json
{ "success": false, "message": "kontingen belum submit tahap ini, tidak ada yang bisa divalidasi" }
```

### Kontingen tidak ditemukan (404)
```json
{ "success": false, "message": "kontingen tidak ditemukan" }
```

### Bukan superadmin (403)
```json
{ "success": false, "message": "Hanya superadmin yang bisa mengubah status validasi" }
```

### Superadmin akses rekap/status tanpa territory_id (400)
```json
{ "success": false, "message": "Superadmin wajib kirim query parameter territory_id" }
```

> Catatan: error ini hanya untuk `GET /admin/rekap-pendaftaran` dan `GET /admin/validasi-pendaftaran/status`. Untuk `GET /admin/validasi-pendaftaran` (list semua), superadmin tidak perlu territory_id.

---

## 7. Alur Frontend — Admin Kontingen

### Widget Dashboard

Panggil `GET /admin/validasi-pendaftaran/status` saat dashboard dibuka.

```
┌─────────────────────────────────────────────────┐
│  Status Pendaftaran                              │
│                                                  │
│  Tahap 1 (Entry By Sport)                        │
│  ✓ SUBMITTED  ●  VALID                           │
│                                                  │
│  Tahap 2 (Entry By Number)                       │
│  ✓ SUBMITTED  ⚠  REVISI                          │
│  "Nomor ganda campuran belum didaftarkan"        │
│                                                  │
│  Tahap 3 (Entry By Name)                         │
│  ○ DRAFT      —  Belum disubmit                  │
└─────────────────────────────────────────────────┘
```

**Panduan tampilan berdasarkan `validasi_status`:**

| `validasi_status` | Yang ditampilkan |
|---|---|
| `null` | — Belum disubmit (abu-abu) |
| `"PENDING"` | ⏳ Menunggu validasi panitia (biru) |
| `"VALID"` | ✅ VALID (hijau) |
| `"REVISI"` | ⚠ REVISI + tampilkan catatan (kuning) |

### Banner di Halaman Tahap

Setiap kali load GET tahap, cek `tahapX_validasi_status`:

```
REVISI:
┌─────────────────────────────────────────────────────┐
│  ⚠  Data Tahap 2 perlu direvisi                     │
│     Catatan panitia: "Nomor ganda campuran belum    │
│     didaftarkan padahal kuota masih ada"            │
│     Silakan perbaiki data dan submit ulang.         │
└─────────────────────────────────────────────────────┘

PENDING:
┌──────────────────────────────────────────────────────┐
│  ⏳  Tahap 2 sedang menunggu validasi dari panitia.  │
└──────────────────────────────────────────────────────┘

VALID:
┌──────────────────────────────────────────────────────┐
│  ✅  Tahap 2 telah divalidasi oleh panitia.          │
└──────────────────────────────────────────────────────┘
```

### Halaman Rekap Pendaftaran (Read-Only)

Halaman dedicated di sidebar. Panggil `GET /admin/rekap-pendaftaran` (tanpa `territory_id` untuk admin biasa).

Halaman ini **tidak bisa diedit**. Sediakan tombol shortcut:
- "Edit di Tahap 1" → `/tahap1`
- "Edit di Tahap 2" → `/tahap2`
- "Edit di Tahap 3" → `/tahap3`

---

## 8. Alur Frontend — Superadmin Panel

### Halaman Validasi Pendaftaran

Panggil `GET /admin/validasi-pendaftaran` — tidak perlu territory_id, backend sudah return semua kontingen.

```
[ Territory: Semua ▼ ] [ Tahap: Semua ▼ ] [ Status: PENDING ▼ ]

Nama Kontingen        | Tahap 1    | Tahap 2    | Tahap 3    | Aksi
──────────────────────|────────────|────────────|────────────|──────
Kab. Tangerang        | ✅ VALID    | ⚠ REVISI   | — Belum    | [Detail]
Kab. Serang           | ⏳ PENDING  | — Belum    | — Belum    | [Detail]
Kota Cilegon          | ✅ VALID    | ✅ VALID    | ⏳ PENDING  | [Detail]
Kab. Lebak            | — Belum    | — Belum    | — Belum    | —
```

Filter di UI cukup kirim sebagai query param:
```typescript
// Contoh filter: hanya tahap 1 yang pending
GET /admin/validasi-pendaftaran?tahap=1&status=PENDING
```

Tombol **[Detail]** → buka `GET /admin/rekap-pendaftaran?territory_id=X` + tampilkan form validasi.

### Halaman Detail Kontingen (Superadmin)

```
1. Load rekap: GET /admin/rekap-pendaftaran?territory_id=X
2. Tampilkan semua data kontingen (cabor, nomor, atlet, pelatih, official)
3. Di atas setiap seksi data, tampilkan status validasi + form:

   ┌────────────────────────────────────────────────────┐
   │  Validasi Tahap 1                                  │
   │  Status sekarang: ⚠ REVISI                         │
   │                                                    │
   │  [● VALID]  [○ REVISI]                             │
   │  Catatan: ________________________________         │
   │  [ Simpan Validasi ]                               │
   └────────────────────────────────────────────────────┘

4. Submit: PUT /admin/validasi-pendaftaran/{kontingen_id}/tahap/1
```

### Workflow Set VALID

```
Pilih "VALID" → catatan kosong/null → PUT → badge hijau
```

### Workflow Set REVISI

```
Pilih "REVISI" → kolom catatan required → isi catatan → PUT → badge kuning
```

---

## 9. Contoh Implementasi

### Types (TypeScript)

```typescript
export type ValidasiStatus = "PENDING" | "VALID" | "REVISI" | null;

export interface ValidasiPerTahap {
  validasi_status: ValidasiStatus;
  validasi_catatan: string | null;
}

// Widget dashboard
export interface ValidasiStatusResponse {
  kontingen_id: number;
  nama_kontingen: string;
  tahap1: ValidasiPerTahap;
  tahap2: ValidasiPerTahap;
  tahap3: ValidasiPerTahap;
}

// List superadmin
export interface ValidasiKontingen {
  kontingen_id: number;
  territory_id: number;
  nama_kontingen: string;
  tahap1: {
    submit_status: "DRAFT" | "SUBMITTED";
    submitted_at: string | null;
    validasi_status: ValidasiStatus;
    validasi_catatan: string | null;
    validasi_at: string | null;
  };
  tahap2: {
    submit_status: "DRAFT" | "SUBMITTED";
    submitted_at: string | null;
    validasi_status: ValidasiStatus;
    validasi_catatan: string | null;
    validasi_at: string | null;
  };
  tahap3: {
    submit_status: "DRAFT" | "SUBMITTED";
    submitted_at: string | null;
    validasi_status: ValidasiStatus;
    validasi_catatan: string | null;
    validasi_at: string | null;
  };
}

// Rekap pendaftaran
export interface RekapAtletTrx {
  atlet_id: number;
  cabor_id: number;
  nama_cabor: string;
  nomor_id: number;
  nama_nomor: string;
  jenis_kelamin: string;
  tipe: string;
}

export interface RekapPelatihTrx {
  pelatih_id: number;
  cabor_id: number;
  nama_cabor: string;
}

export interface SetValidasiPayload {
  status: "VALID" | "REVISI";
  catatan: string | null;
}
```

### Service Functions

```typescript
export const validasiPendaftaranService = {
  // Widget dashboard — admin biasa tidak perlu territoryId
  getStatus: (territoryId?: number): Promise<ValidasiStatusResponse> => {
    const params = territoryId ? { territory_id: territoryId } : {};
    return api.get("/admin/validasi-pendaftaran/status", { params }).then(r => r.data.data);
  },

  // Rekap — admin biasa tidak kirim territoryId, superadmin wajib
  getRekap: (territoryId?: number) => {
    const params = territoryId ? { territory_id: territoryId } : {};
    return api.get("/admin/rekap-pendaftaran", { params }).then(r => r.data.data);
  },

  // List semua kontingen — superadmin only, tidak perlu territory_id
  getList: (filters?: { status?: string; tahap?: number; territory_id?: number }) =>
    api.get("/admin/validasi-pendaftaran", { params: filters }).then(r => r.data.data),

  // Set validasi — superadmin only
  setValidasi: (kontingenId: number, tahap: 1 | 2 | 3, payload: SetValidasiPayload) =>
    api
      .put(`/admin/validasi-pendaftaran/${kontingenId}/tahap/${tahap}`, payload)
      .then(r => r.data),
};
```

### Hook Widget Dashboard

```typescript
export function useValidasiStatus(territoryId?: number) {
  return useQuery({
    queryKey: ["validasi-status", territoryId],
    queryFn: () => validasiPendaftaranService.getStatus(territoryId),
    staleTime: 30_000,
  });
}
```

### Hook Set Validasi (Superadmin)

```typescript
export function useSetValidasi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      kontingenId,
      tahap,
      payload,
    }: {
      kontingenId: number;
      tahap: 1 | 2 | 3;
      payload: SetValidasiPayload;
    }) => validasiPendaftaranService.setValidasi(kontingenId, tahap, payload),

    onSuccess: (_, variables) => {
      toast.success(`Validasi Tahap ${variables.tahap} berhasil disimpan`);
      queryClient.invalidateQueries({ queryKey: ["validasi-list"] });
      queryClient.invalidateQueries({ queryKey: ["validasi-status"] });
    },

    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? "Gagal menyimpan validasi");
    },
  });
}
```

### Komponen Banner Validasi

```tsx
function BannerValidasi({
  tahap,
  validasiStatus,
  validasiCatatan,
}: {
  tahap: number;
  validasiStatus: ValidasiStatus;
  validasiCatatan: string | null;
}) {
  if (!validasiStatus) return null;

  if (validasiStatus === "REVISI") {
    return (
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
        <div className="flex gap-2 items-start">
          <span className="text-yellow-600 text-lg">⚠</span>
          <div>
            <p className="font-semibold text-yellow-800">Data Tahap {tahap} perlu direvisi</p>
            <p className="text-yellow-700 text-sm mt-1">
              Catatan panitia: <em>"{validasiCatatan}"</em>
            </p>
            <p className="text-yellow-600 text-sm mt-1">Silakan perbaiki data dan submit ulang.</p>
          </div>
        </div>
      </div>
    );
  }

  if (validasiStatus === "PENDING") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-2 items-center">
        <span className="text-blue-500">⏳</span>
        <p className="text-blue-700 text-sm">Tahap {tahap} sedang menunggu validasi dari panitia.</p>
      </div>
    );
  }

  if (validasiStatus === "VALID") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-2 items-center">
        <span className="text-green-600">✅</span>
        <p className="text-green-700 text-sm">Tahap {tahap} telah divalidasi oleh panitia.</p>
      </div>
    );
  }

  return null;
}
```

### Form Validasi (Superadmin)

```tsx
function FormValidasi({
  kontingenId,
  tahap,
}: {
  kontingenId: number;
  tahap: 1 | 2 | 3;
}) {
  const [status, setStatus] = useState<"VALID" | "REVISI">("VALID");
  const [catatan, setCatatan] = useState("");
  const { mutate, isPending } = useSetValidasi();

  const handleSubmit = () => {
    if (status === "REVISI" && !catatan.trim()) {
      toast.error("Catatan wajib diisi untuk status REVISI");
      return;
    }
    mutate({
      kontingenId,
      tahap,
      payload: { status, catatan: status === "REVISI" ? catatan : null },
    });
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <p className="font-semibold">Validasi Tahap {tahap}</p>
      <div className="flex gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" value="VALID" checked={status === "VALID"} onChange={() => setStatus("VALID")} />
          ✅ VALID
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" value="REVISI" checked={status === "REVISI"} onChange={() => setStatus("REVISI")} />
          ⚠ REVISI
        </label>
      </div>
      {status === "REVISI" && (
        <textarea
          className="w-full border rounded p-2 text-sm"
          placeholder="Tulis catatan revisi... (wajib)"
          rows={3}
          value={catatan}
          onChange={e => setCatatan(e.target.value)}
        />
      )}
      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Simpan Validasi"}
      </button>
    </div>
  );
}
```

---

## Ringkasan Endpoint

| Method | URL | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/admin/validasi-pendaftaran/status` | Semua | Status validasi kontingen sendiri (widget) |
| `GET` | `/admin/rekap-pendaftaran` | Semua | Semua data kontingen (rekap — superadmin wajib `?territory_id`) |
| `GET` | `/admin/validasi-pendaftaran` | Superadmin | List semua kontingen + status validasi (filter opsional) |
| `PUT` | `/admin/validasi-pendaftaran/:id/tahap/:tahap` | Superadmin | Set VALID atau REVISI |

**Perbedaan kebutuhan `territory_id` per endpoint:**

| Endpoint | Admin Biasa | Superadmin |
|---|---|---|
| `GET /validasi-pendaftaran/status` | Tidak perlu | Kirim `?territory_id=X` |
| `GET /rekap-pendaftaran` | Tidak perlu | Wajib `?territory_id=X` |
| `GET /validasi-pendaftaran` | ❌ Forbidden | Tidak perlu (lihat semua langsung) |
| `PUT /validasi-pendaftaran/:id/...` | ❌ Forbidden | Tidak perlu (pakai `:kontingen_id` di URL) |
