// src/pages/admin/AtletByNames.tsx
import { useState, useEffect } from "react";
import axios from "axios";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import FileInput from "../../components/form/input/FileInput";

// API Service
const API_BASE = 'http://localhost:8000/admin';

const tahap3API = {
  getData: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE}/tahap3`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data; // Backend return gin.H{"data": innerData}, jadi ini langsung { data: ... }
  },

  saveAtlet: async (formData: FormData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE}/tahap3/atlet`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  savePelatih: async (formData: FormData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE}/tahap3/pelatih`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  saveOfficial: async (formData: FormData) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE}/tahap3/official`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  submitFinal: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE}/tahap3/submit`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

// Provinsi lengkap Indonesia
const daftarProvinsi = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau", "Jambi",
  "Sumatera Selatan", "Bengkulu", "Lampung", "Bangka Belitung", "DKI Jakarta",
  "Jawa Barat", "Banten", "Jawa Tengah", "Daerah Istimewa Yogyakarta", "Jawa Timur",
  "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat",
  "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
  "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat", "Sulawesi Selatan",
  "Sulawesi Tenggara", "Maluku", "Maluku Utara", "Papua", "Papua Barat",
  "Papua Selatan", "Papua Tengah", "Papua Pegunungan", "Papua Barat Daya"
];

// Opsi pendidikan
const pendidikanOptions = ["SD", "SMP", "SMA/SMK", "Diploma", "S1/D4", "S2", "S3"];

// Opsi fokus tim
const fokusTimOptions = ["Putra", "Putri", "Campuran"];

// Opsi jabatan official
const jabatanOptions = [
  "Manajer Tim", "Asisten Pelatih", "Dokter Tim", "Fisioterapis", "Masseur",
  "Liaison Officer (LO)", "Mekanik", "Lainnya"
];

// Opsi kelas sekolah untuk atlet
const kelasOptions = [
  "SD Kelas 1", "SD Kelas 2", "SD Kelas 3", "SD Kelas 4", "SD Kelas 5", "SD Kelas 6",
  "SMP Kelas 7", "SMP Kelas 8", "SMP Kelas 9",
  "SMA/SMK Kelas 10", "SMA/SMK Kelas 11", "SMA/SMK Kelas 12"
];

export default function AtletByNames() {
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"atlet" | "pelatih" | "official">("atlet");

  const [caborOptions, setCaborOptions] = useState<string[]>([]);
  const [caborLoading, setCaborLoading] = useState(true);
  const [caborError, setCaborError] = useState<string | null>(null);

  const [atletList, setAtletList] = useState<any[]>([]);
  const [pelatihList, setPelatihList] = useState<any[]>([]);
  const [officialList, setOfficialList] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await tahap3API.getData();
        const data = response.data; // Backend return gin.H{"data": innerData} → response.data adalah { data: ... }

        // Debugging log untuk cek struktur response
        console.log("Response Tahap 3 full:", response);

        setSubmitted(data.tahap3_submitted || false);
        setSubmittedAt(data.submitted_at || null);

        // Cabor dari Tahap 1 (dari cabor_kontingens via GetCaborDipilih)
        setCaborLoading(true);
        if (data.available_cabor && Array.isArray(data.available_cabor) && data.available_cabor.length > 0) {
          setCaborOptions(data.available_cabor);
          setCaborError(null);
          console.log("Cabor berhasil dimuat dari Tahap 1:", data.available_cabor);
        } else {
          setCaborOptions([]);
          setCaborError("Belum ada cabang olahraga yang dipilih di Tahap 1 (Entry by Sport). Harap lengkapi Tahap 1 terlebih dahulu.");
          console.warn("available_cabor kosong atau tidak ada di response");
        }
        setCaborLoading(false);

        // Load existing atlet
        if (data.atlets && data.atlets.length > 0) {
          setAtletList(data.atlets.map((atlet: any) => ({
            ...atlet,
            files: {},
            kelas: atlet.kelas || "",
            domisili: atlet.domisili || "",
            isBinaan: atlet.is_binaan || false,
            cabor: atlet.cabor || "",
            jenisKelamin: atlet.gender || "" // mapping backend gender → UI jenisKelamin
          })));
        } else {
          setAtletList([{ nama: "", tglLahir: "", jenisKelamin: "", nisn: "", sekolah: "", bpjs: "", kelas: "", domisili: "", isBinaan: false, cabor: "", files: {} }]);
        }

        // Load pelatih
        if (data.pelatihs && data.pelatihs.length > 0) {
          setPelatihList(data.pelatihs.map((pelatih: any) => ({
            ...pelatih,
            files: {},
            fokusTim: pelatih.fokus_tim || ""
          })));
        } else {
          setPelatihList([{ nama: "", nik: "", jenisKelamin: "", tglLahir: "", provinsi: "", pendidikan: "", fokusTim: "", cabor: "", kontak: "", email: "", files: {} }]);
        }

        // Load official
        if (data.officials && data.officials.length > 0) {
          setOfficialList(data.officials.map((official: any) => ({ ...official, files: {} })));
        } else {
          setOfficialList([{ nama: "", nik: "", jenisKelamin: "", tglLahir: "", provinsi: "", pendidikan: "", jabatan: "", kontak: "", email: "", files: {} }]);
        }

      } catch (error: any) {
        console.error('Error loading Tahap 3 data:', error);
        setCaborOptions([]);
        setCaborLoading(false);
        setCaborError("Gagal memuat data Tahap 3. Silakan refresh atau cek koneksi ke backend.");
        setAtletList([{ nama: "", tglLahir: "", jenisKelamin: "", nisn: "", sekolah: "", bpjs: "", kelas: "", domisili: "", isBinaan: false, cabor: "", files: {} }]);
        setPelatihList([{ nama: "", nik: "", jenisKelamin: "", tglLahir: "", provinsi: "", pendidikan: "", fokusTim: "", cabor: "", kontak: "", email: "", files: {} }]);
        setOfficialList([{ nama: "", nik: "", jenisKelamin: "", tglLahir: "", provinsi: "", pendidikan: "", jabatan: "", kontak: "", email: "", files: {} }]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const addPerson = (type: "atlet" | "pelatih" | "official") => {
    if (type === "atlet") {
      setAtletList((prev) => [...prev, { nama: "", tglLahir: "", jenisKelamin: "", nisn: "", sekolah: "", bpjs: "", kelas: "", domisili: "", isBinaan: false, cabor: "", files: {} }]);
    } else if (type === "pelatih") {
      setPelatihList((prev) => [...prev, { nama: "", nik: "", jenisKelamin: "", tglLahir: "", provinsi: "", pendidikan: "", fokusTim: "", cabor: "", kontak: "", email: "", files: {} }]);
    } else if (type === "official") {
      setOfficialList((prev) => [...prev, { nama: "", nik: "", jenisKelamin: "", tglLahir: "", provinsi: "", pendidikan: "", jabatan: "", kontak: "", email: "", files: {} }]);
    }
  };

  const updateField = (type: string, index: number, field: string, value: any) => {
    if (type === "atlet") {
      setAtletList((prev) => {
        const newList = [...prev];
        if (newList[index]) newList[index][field] = value;
        return newList;
      });
    } else if (type === "pelatih") {
      setPelatihList((prev) => {
        const newList = [...prev];
        if (newList[index]) newList[index][field] = value;
        return newList;
      });
    } else if (type === "official") {
      setOfficialList((prev) => {
        const newList = [...prev];
        if (newList[index]) newList[index][field] = value;
        return newList;
      });
    }
  };

  const updateFile = (type: string, index: number, docKey: string, file: File | null) => {
    if (type === "atlet") {
      setAtletList((prev) => {
        const newList = [...prev];
        if (newList[index]) newList[index].files[docKey] = file;
        return newList;
      });
    } else if (type === "pelatih") {
      setPelatihList((prev) => {
        const newList = [...prev];
        if (newList[index]) newList[index].files[docKey] = file;
        return newList;
      });
    } else if (type === "official") {
      setOfficialList((prev) => {
        const newList = [...prev];
        if (newList[index]) newList[index].files[docKey] = file;
        return newList;
      });
    }
  };

  const saveAtlet = async (index: number) => {
    const atlet = atletList[index];

    if (!atlet.cabor?.trim()) {
      alert("Cabang olahraga wajib dipilih dari daftar Tahap 1!");
      return;
    }

    const formData = new FormData();
    formData.append('nama', atlet.nama || '');
    formData.append('tglLahir', atlet.tglLahir || '');
    formData.append('gender', atlet.jenisKelamin || '');
    formData.append('nisn', atlet.nisn || '');
    formData.append('sekolah', atlet.sekolah || '');
    formData.append('bpjs', atlet.bpjs || '');
    formData.append('cabor', atlet.cabor || '');
    formData.append('kelas', atlet.kelas || '');
    formData.append('domisili', atlet.domisili || '');
    formData.append('isBinaan', atlet.isBinaan ? 'true' : 'false');

    Object.entries(atlet.files || {}).forEach(([key, file]: [string, any]) => {
      if (file instanceof File) {
        formData.append(key, file);
      }
    });

    try {
      await tahap3API.saveAtlet(formData);
      alert('Data atlet berhasil disimpan!');
    } catch (error: any) {
      alert('Gagal menyimpan atlet: ' + (error.response?.data?.error || error.message));
    }
  };

  const savePelatih = async (index: number) => {
    const pelatih = pelatihList[index];

    if (!pelatih.cabor?.trim()) {
      alert("Cabang olahraga wajib dipilih dari daftar Tahap 1!");
      return;
    }

    const formData = new FormData();
    formData.append('nama', pelatih.nama || '');
    formData.append('tglLahir', pelatih.tglLahir || '');
    formData.append('gender', pelatih.jenisKelamin || '');
    formData.append('nik', pelatih.nik || '');
    formData.append('kontak', pelatih.kontak || '');
    formData.append('provinsi', pelatih.provinsi || '');
    formData.append('pendidikan', pelatih.pendidikan || '');
    formData.append('fokusTim', pelatih.fokusTim || '');
    formData.append('email', pelatih.email || '');
    formData.append('cabor', pelatih.cabor || '');

    Object.entries(pelatih.files || {}).forEach(([key, file]: [string, any]) => {
      if (file instanceof File) {
        formData.append(key, file);
      }
    });

    try {
      await tahap3API.savePelatih(formData);
      alert('Data pelatih berhasil disimpan!');
    } catch (error: any) {
      alert('Gagal menyimpan pelatih: ' + (error.response?.data?.error || error.message));
    }
  };

  const saveOfficial = async (index: number) => {
    const official = officialList[index];

    const formData = new FormData();
    formData.append('nama', official.nama || '');
    formData.append('jabatan', official.jabatan || '');
    formData.append('tglLahir', official.tglLahir || '');
    formData.append('gender', official.jenisKelamin || '');
    formData.append('nik', official.nik || '');
    formData.append('kontak', official.kontak || '');
    formData.append('provinsi', official.provinsi || '');
    formData.append('pendidikan', official.pendidikan || '');
    formData.append('email', official.email || '');

    Object.entries(official.files || {}).forEach(([key, file]: [string, any]) => {
      if (file instanceof File) {
        formData.append(key, file);
      }
    });

    try {
      await tahap3API.saveOfficial(formData);
      alert('Data official berhasil disimpan!');
    } catch (error: any) {
      alert('Gagal menyimpan official: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSubmitFinal = async () => {
    let valid = true;

    atletList.forEach((a) => {
      if (!a.nama?.trim() || !a.nisn?.trim() || !a.files?.["pas_foto"] || !a.kelas?.trim() || !a.domisili?.trim() || !a.tglLahir || !a.cabor?.trim()) valid = false;
      if (a.tglLahir) {
        const birthDate = new Date(a.tglLahir);
        const minDate = new Date('2009-01-01');
        if (birthDate < minDate) valid = false;
      }
    });

    pelatihList.forEach((p) => {
      if (!p.nama?.trim() || !p.nik?.trim() || !p.files?.["ktp"] || !p.cabor?.trim()) valid = false;
    });

    officialList.forEach((o) => {
      if (!o.nama?.trim() || !o.nik?.trim() || !o.files?.["ktp"] || !o.jabatan?.trim()) valid = false;
    });

    if (!valid) {
      alert("Lengkapi semua data wajib (nama, NIS/NIK, tanggal lahir, cabang olahraga/jabatan, kelas/domisili untuk atlet, dan upload dokumen penting)!");
      return;
    }

    if (!confirm("Yakin submit final? Data akan dikunci dan tidak bisa diubah lagi.")) {
      return;
    }

    try {
      const jumlahAtlet = atletList.length;
      const jumlahPelatih = pelatihList.length;
      const jumlahOfficial = officialList.length;

      await axios.post(
        `${API_BASE}/tahap3/submit`,
        { jumlah_atlet: jumlahAtlet, jumlah_pelatih: jumlahPelatih, jumlah_official: jumlahOfficial },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          }
        }
      );

      setSubmitted(true);
      setSubmittedAt(new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }));
      alert("Tahap III berhasil disubmit dan terkunci!");
    } catch (error: any) {
      alert(`Gagal submit: ${error.response?.data?.error || error.message}`);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Memuat data...</div>;

  return (
    <>
      <PageMeta
        title="SPORTIF - Tahap III: Entry By Names"
        description="Input data nama atlet, pelatih, dan official beserta dokumen pendukung POPDA XII 2026"
      />
      <PageBreadcrumb pageTitle="Tahap III: Entry By Names" />

<div className="min-h-[calc(100vh-180px)] rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 flex items-center justify-center">
  {submitted ? (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90">
        Sudah Disubmit
      </h3>
      <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
        Silahkan lanjut ke Tahap IV (atau halaman selanjutnya)
      </p>
      <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
        Disubmit pada <span className="font-medium">{submittedAt}</span>
      </p>
    </div>
  ) : (
    <div className="w-full max-w-none space-y-10">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                className={`px-6 py-3 font-medium ${activeTab === "atlet" ? "border-b-2 border-teal-600 text-teal-600" : "text-gray-500 dark:text-gray-400"}`}
                onClick={() => setActiveTab("atlet")}
              >
                Atlet
              </button>
              <button
                className={`px-6 py-3 font-medium ${activeTab === "pelatih" ? "border-b-2 border-teal-600 text-teal-600" : "text-gray-500 dark:text-gray-400"}`}
                onClick={() => setActiveTab("pelatih")}
              >
                Pelatih
              </button>
              <button
                className={`px-6 py-3 font-medium ${activeTab === "official" ? "border-b-2 border-teal-600 text-teal-600" : "text-gray-500 dark:text-gray-400"}`}
                onClick={() => setActiveTab("official")}
              >
                Official
              </button>
            </div>

            {/* Tab Atlet */}
            {activeTab === "atlet" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                    Input Data Atlet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Pilih cabang olahraga dari hasil Tahap 1 (Entry by Sport).
                  </p>
                </div>

                {atletList.map((atlet, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-white/[0.03] mb-8"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h5 className="text-base font-medium text-gray-800 dark:text-white/90">
                        Atlet #{idx + 1}
                      </h5>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => saveAtlet(idx)}
                      >
                        Simpan
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Nama Lengkap *</Label>
                        <Input value={atlet.nama || ''} onChange={(e) => updateField("atlet", idx, "nama", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Tanggal Lahir (minimal 1 Januari 2009) *</Label>
                        <Input
                          type="date"
                          value={atlet.tglLahir || ''}
                          onChange={(e) => updateField("atlet", idx, "tglLahir", e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Jenis Kelamin *</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          value={atlet.jenisKelamin || ''}
                          onChange={(e) => updateField("atlet", idx, "jenisKelamin", e.target.value)}
                        >
                          <option value="">Pilih</option>
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Cabang Olahraga *</Label>
                        {caborLoading ? (
                          <div className="h-10 flex items-center justify-center text-gray-500">
                            Memuat cabang olahraga dari Tahap 1...
                          </div>
                        ) : caborError ? (
                          <div className="h-10 flex items-center text-red-600 text-sm font-medium">
                            {caborError}
                          </div>
                        ) : caborOptions.length === 0 ? (
                          <div className="h-10 flex items-center text-red-600 text-sm font-medium">
                            Belum ada cabang olahraga yang dipilih di Tahap 1. Silakan lengkapi Tahap I terlebih dahulu.
                          </div>
                        ) : (
                          <select
                            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            value={atlet.cabor || ''}
                            onChange={(e) => updateField("atlet", idx, "cabor", e.target.value)}
                          >
                            <option value="">Pilih Cabang Olahraga</option>
                            {caborOptions.map((cabor) => (
                              <option key={cabor} value={cabor}>
                                {cabor}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">NIS/NISN *</Label>
                        <Input
                          type="text"
                          value={atlet.nisn || ''}
                          onChange={(e) => updateField("atlet", idx, "nisn", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Nama Sekolah *</Label>
                        <Input
                          value={atlet.sekolah || ''}
                          onChange={(e) => updateField("atlet", idx, "sekolah", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">No. BPJS Ketenagakerjaan *</Label>
                        <Input
                          type="text"
                          value={atlet.bpjs || ''}
                          onChange={(e) => updateField("atlet", idx, "bpjs", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Kelas/Tingkat Sekolah Saat Ini (maks. Kelas 11) *</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          value={atlet.kelas || ''}
                          onChange={(e) => updateField("atlet", idx, "kelas", e.target.value)}
                        >
                          <option value="">Pilih Kelas</option>
                          {kelasOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Domisili Sekolah/Orang Tua *</Label>
                        <Input
                          value={atlet.domisili || ''}
                          onChange={(e) => updateField("atlet", idx, "domisili", e.target.value)}
                        />
                      </div>
                      <div className="col-span-full flex items-center">
                        <input
                          type="checkbox"
                          checked={atlet.isBinaan || false}
                          onChange={(e) => updateField("atlet", idx, "isBinaan", e.target.checked)}
                          className="mr-2 h-5 w-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        />
                        <Label className="text-gray-700 dark:text-gray-300">
                          Atlet Binaan PPLP/PPLPD/SKO
                        </Label>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-4 block font-medium text-gray-800 dark:text-gray-200">
                        Upload Dokumen Wajib
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                          { key: "akte_kelahiran", label: "1. Akta Kelahiran / Surat Kenal Lahir *" },
                          { key: "rapor_terakhir", label: "2. Rapor Kelas Terakhir *" },
                          { key: "ijazah_sttb", label: "3. Ijazah / STTB Terakhir *" },
                          { key: "bukti_nisn", label: "4. Bukti NIS/NISN *" },
                          { key: "surat_sekolah", label: "5. Surat Keterangan Aktif Bersekolah *" },
                          { key: "surat_sehat", label: "6. Surat Keterangan Sehat dari Dokter *" },
                          { key: "pas_foto", label: "7. Pas Foto 3x4 (latar merah, seragam sekolah) *" },
                          { key: "surat_pernyataan", label: "8. Surat Pernyataan (materai, jika diperlukan)" },
                          { key: "sk_binaan", label: "9. SK Binaan PPLP/SKO (jika atlet binaan)" },
                          { key: "pakta_integritas", label: "10. Pakta Integritas (jika atlet SKO)" },
                        ].map((doc) => (
                          <div key={doc.key}>
                            <Label className="text-gray-700 dark:text-gray-300">{doc.label}</Label>
                            <FileInput
                              onChange={(e) => updateFile("atlet", idx, doc.key, e.target.files?.[0] || null)}
                            />
                            {atlet.files?.[doc.key] && (
                              <p className="mt-1 text-xs text-teal-600">
                                {atlet.files[doc.key].name}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  size="md"
                  variant="outline"
                  onClick={() => addPerson("atlet")}
                  className="mt-6"
                >
                  + Tambah Atlet
                </Button>
              </div>
            )}

            {/* Tab Pelatih */}
            {activeTab === "pelatih" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                    Input Data Pelatih
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Lengkapi data pelatih beserta cabang olahraga yang ditangani.
                  </p>
                </div>

                {pelatihList.map((pelatih, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-white/[0.03] mb-8"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h5 className="text-base font-medium text-gray-800 dark:text-white/90">
                        Pelatih #{idx + 1}
                      </h5>
                      <Button size="sm" variant="outline" onClick={() => savePelatih(idx)}>
                        Simpan
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Nama Lengkap *</Label>
                        <Input value={pelatih.nama || ''} onChange={(e) => updateField("pelatih", idx, "nama", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Tanggal Lahir *</Label>
                        <Input
                          type="date"
                          value={pelatih.tglLahir || ''}
                          onChange={(e) => updateField("pelatih", idx, "tglLahir", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Jenis Kelamin *</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          value={pelatih.jenisKelamin || ''}
                          onChange={(e) => updateField("pelatih", idx, "jenisKelamin", e.target.value)}
                        >
                          <option value="">Pilih</option>
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">NIK *</Label>
                        <Input type="text" value={pelatih.nik || ''} onChange={(e) => updateField("pelatih", idx, "nik", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">No. Kontak/HP *</Label>
                        <Input value={pelatih.kontak || ''} onChange={(e) => updateField("pelatih", idx, "kontak", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Provinsi *</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          value={pelatih.provinsi || ''}
                          onChange={(e) => updateField("pelatih", idx, "provinsi", e.target.value)}
                        >
                          <option value="">Pilih Provinsi</option>
                          {daftarProvinsi.map((prov) => (
                            <option key={prov} value={prov}>{prov}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Pendidikan Terakhir *</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          value={pelatih.pendidikan || ''}
                          onChange={(e) => updateField("pelatih", idx, "pendidikan", e.target.value)}
                        >
                          <option value="">Pilih Pendidikan</option>
                          {pendidikanOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Fokus Tim *</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          value={pelatih.fokusTim || ''}
                          onChange={(e) => updateField("pelatih", idx, "fokusTim", e.target.value)}
                        >
                          <option value="">Pilih Fokus</option>
                          {fokusTimOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Cabang Olahraga *</Label>
                        {caborLoading ? (
                          <div className="h-10 flex items-center text-gray-500">Memuat cabang olahraga...</div>
                        ) : caborError ? (
                          <div className="h-10 flex items-center text-red-600 text-sm font-medium">{caborError}</div>
                        ) : caborOptions.length === 0 ? (
                          <div className="h-10 flex items-center text-red-600 text-sm font-medium">
                            Belum ada cabang olahraga dari Tahap 1.
                          </div>
                        ) : (
                          <select
                            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            value={pelatih.cabor || ''}
                            onChange={(e) => updateField("pelatih", idx, "cabor", e.target.value)}
                          >
                            <option value="">Pilih Cabang Olahraga</option>
                            {caborOptions.map((cabor) => (
                              <option key={cabor} value={cabor}>
                                {cabor}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Email (opsional)</Label>
                        <Input
                          type="email"
                          value={pelatih.email || ''}
                          onChange={(e) => updateField("pelatih", idx, "email", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="mb-4 block font-medium text-gray-800 dark:text-gray-200">
                        Upload Dokumen Wajib
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                          { key: "ktp", label: "KTP *" },
                          { key: "foto", label: "Foto Diri *" },
                          { key: "surat_sehat", label: "Surat Keterangan Sehat *" },
                          { key: "sk_kontingen", label: "SK Kontingen *" },
                          { key: "surat_tugas", label: "Surat Tugas Dinas (opsional)" },
                        ].map((doc) => (
                          <div key={doc.key}>
                            <Label className="text-gray-700 dark:text-gray-300">{doc.label}</Label>
                            <FileInput
                              onChange={(e) => updateFile("pelatih", idx, doc.key, e.target.files?.[0] || null)}
                            />
                            {pelatih.files?.[doc.key] && (
                              <p className="mt-1 text-xs text-teal-600">
                                {pelatih.files[doc.key].name}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  size="md"
                  variant="outline"
                  onClick={() => addPerson("pelatih")}
                  className="mt-6"
                >
                  + Tambah Pelatih
                </Button>
              </div>
            )}

            {/* Tab Official */}
            {activeTab === "official" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                    Input Data Official
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Lengkapi data official beserta jabatan pendamping.
                  </p>
                </div>

                {officialList.map((official, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-white/[0.03] mb-8"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h5 className="text-base font-medium text-gray-800 dark:text-white/90">
                        Official #{idx + 1}
                      </h5>
                      <Button size="sm" variant="outline" onClick={() => saveOfficial(idx)}>
                        Simpan
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Nama Lengkap *</Label>
                        <Input value={official.nama || ''} onChange={(e) => updateField("official", idx, "nama", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Jabatan *</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          value={official.jabatan || ''}
                          onChange={(e) => updateField("official", idx, "jabatan", e.target.value)}
                        >
                          <option value="">Pilih Jabatan</option>
                          {jabatanOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Tanggal Lahir *</Label>
                        <Input
                          type="date"
                          value={official.tglLahir || ''}
                          onChange={(e) => updateField("official", idx, "tglLahir", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Jenis Kelamin *</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          value={official.jenisKelamin || ''}
                          onChange={(e) => updateField("official", idx, "jenisKelamin", e.target.value)}
                        >
                          <option value="">Pilih</option>
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">NIK *</Label>
                        <Input type="text" value={official.nik || ''} onChange={(e) => updateField("official", idx, "nik", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">No. Kontak/HP *</Label>
                        <Input value={official.kontak || ''} onChange={(e) => updateField("official", idx, "kontak", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Provinsi *</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          value={official.provinsi || ''}
                          onChange={(e) => updateField("official", idx, "provinsi", e.target.value)}
                        >
                          <option value="">Pilih Provinsi</option>
                          {daftarProvinsi.map((prov) => (
                            <option key={prov} value={prov}>{prov}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Pendidikan Terakhir</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          value={official.pendidikan || ''}
                          onChange={(e) => updateField("official", idx, "pendidikan", e.target.value)}
                        >
                          <option value="">Pilih Pendidikan</option>
                          {pendidikanOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-gray-700 dark:text-gray-300">Email (opsional)</Label>
                        <Input
                          type="email"
                          value={official.email || ''}
                          onChange={(e) => updateField("official", idx, "email", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="mb-4 block font-medium text-gray-800 dark:text-gray-200">
                        Upload Dokumen Wajib
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                          { key: "ktp", label: "KTP *" },
                          { key: "foto", label: "Foto Diri *" },
                          { key: "surat_sehat", label: "Surat Keterangan Sehat *" },
                          { key: "sk_kontingen", label: "SK Kontingen *" },
                          { key: "surat_tugas", label: "Surat Tugas Dinas (opsional)" },
                        ].map((doc) => (
                          <div key={doc.key}>
                            <Label className="text-gray-700 dark:text-gray-300">{doc.label}</Label>
                            <FileInput
                              onChange={(e) => updateFile("official", idx, doc.key, e.target.files?.[0] || null)}
                            />
                            {official.files?.[doc.key] && (
                              <p className="mt-1 text-xs text-teal-600">
                                {official.files[doc.key].name}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  size="md"
                  variant="outline"
                  onClick={() => addPerson("official")}
                  className="mt-6"
                >
                  + Tambah Official
                </Button>
              </div>
            )}

            {/* Tombol Submit Final */}
            <div className="mt-12 flex justify-end">
              <Button
                size="md"
                variant="primary"
                onClick={handleSubmitFinal}
                disabled={loading || submitted}
              >
                Submit Final & Kunci Data Tahap III
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}