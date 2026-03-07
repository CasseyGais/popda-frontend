// src/pages/admin/AtletBySports.tsx
import { useState, useEffect, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import FileInput from "../../components/form/input/FileInput";
import { Modal } from "../../components/ui/modal";
import axios from "axios";

const BACKEND_URL = "http://localhost:8000";

// Data dummy cabang olahraga dengan ketentuan maksimal
const DUMMY_CABOR = [
  { id: 1, nama: "Atletik", maxPutra: 26, maxPutri: 26, maxPelatih: 4 },
  { id: 2, nama: "Angkat Besi", maxPutra: 5, maxPutri: 5, maxPelatih: 3 },
  { id: 3, nama: "Bola Basket", maxPutra: 16, maxPutri: 16, maxPelatih: 6 },
  { id: 4, nama: "Bola Voli Indoor", maxPutra: 12, maxPutri: 12, maxPelatih: 4 },
  { id: 5, nama: "Bola Voli Pasir", maxPutra: 2, maxPutri: 2, maxPelatih: 2 },
  { id: 6, nama: "Bulutangkis", maxPutra: 5, maxPutri: 5, maxPelatih: 2 },
  { id: 7, nama: "Catur", maxPutra: 5, maxPutri: 5, maxPelatih: 3 },
  { id: 8, nama: "Dayung", maxPutra: 20, maxPutri: 20, maxPelatih: 3 },
  { id: 9, nama: "Gulat", maxPutra: 8, maxPutri: 3, maxPelatih: 2 },
  { id: 10, nama: "Hockey", maxPutra: 12, maxPutri: 12, maxPelatih: 2 },
  { id: 11, nama: "Judo", maxPutra: 5, maxPutri: 5, maxPelatih: 2 },
  { id: 12, nama: "Karate", maxPutra: 10, maxPutri: 9, maxPelatih: 4 },
  { id: 13, nama: "Kempo", maxPutra: 11, maxPutri: 11, maxPelatih: 2 },
  { id: 14, nama: "Menembak", maxPutra: 8, maxPutri: 8, maxPelatih: 4 },
  { id: 15, nama: "Panahan", maxPutra: 16, maxPutri: 16, maxPelatih: 4 },
  { id: 16, nama: "Panjat Tebing", maxPutra: 7, maxPutri: 7, maxPelatih: 2 },
  { id: 17, nama: "Pencak Silat", maxPutra: 15, maxPutri: 14, maxPelatih: 4 },
  { id: 18, nama: "Renang", maxPutra: 10, maxPutri: 10, maxPelatih: 2 },
  { id: 19, nama: "Sepak Bola", maxPutra: 18, maxPutri: 0, maxPelatih: 3 },
  { id: 20, nama: "Sepaktakraw", maxPutra: 5, maxPutri: 5, maxPelatih: 2 },
  { id: 21, nama: "Senam", maxPutra: 5, maxPutri: 8, maxPelatih: 2 },
  { id: 22, nama: "Tae Kwon Do", maxPutra: 12, maxPutri: 12, maxPelatih: 4 },
  { id: 23, nama: "Tenis Meja", maxPutra: 4, maxPutri: 4, maxPelatih: 2 },
  { id: 24, nama: "Tenis Lapangan", maxPutra: 4, maxPutri: 4, maxPelatih: 2 },
  { id: 25, nama: "Tinju", maxPutra: 8, maxPutri: 6, maxPelatih: 4 },
  { id: 26, nama: "Wushu", maxPutra: 5, maxPutri: 4, maxPelatih: 4 },
];

export default function AtletBySports() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [selectedCabor, setSelectedCabor] = useState<number[]>([]);

  const [caborData, setCaborData] = useState<any[]>([]);
  const [formDataAwal, setFormDataAwal] = useState<File | null>(null);
  const [dataKeikutsertaan, setDataKeikutsertaan] = useState<File | null>(null);
  const [skKontingen, setSkKontingen] = useState<File | null>(null);

  // State untuk modal preview
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleCaborSelection = (caborId: number, isChecked: boolean) => {
    if (isChecked) {
      setSelectedCabor((prev) => [...prev, caborId].sort((a, b) => a - b));

      const cabor = DUMMY_CABOR.find((c) => c.id === caborId);
      if (cabor) {
        setCaborData((prev) => [
          ...prev,
          {
            id: cabor.id,
            cabor: cabor.nama,
            putra: 0,
            putri: 0,
            totalAtlet: 0,
            pelatih: 0,
            total: 0,
            maxPutra: cabor.maxPutra,
            maxPutri: cabor.maxPutri,
            maxPelatih: cabor.maxPelatih,
          },
        ]);
      }
    } else {
      setSelectedCabor((prev) => prev.filter((id) => id !== caborId));
      setCaborData((prev) => prev.filter((item) => item.id !== caborId));
    }
  };

  const updateCaborField = (index: number, field: keyof any, value: number) => {
    setCaborData((prevData) => {
      if (index < 0 || index >= prevData.length) return prevData;

      // Deep clone item agar React deteksi perubahan
      const newData = prevData.map((item, i) =>
        i === index ? { ...item } : item
      );

      const item = newData[index];

      const validatedValue = Math.max(0, Math.min(value,
        field === "putra" ? item.maxPutra :
        field === "putri" ? item.maxPutri :
        item.maxPelatih
      ));

      const updatedItem = {
        ...item,
        [field]: validatedValue,
      };

      // Hitung ulang totalAtlet jika yang diubah putra/putri
      if (field === "putra" || field === "putri") {
        updatedItem.totalAtlet = updatedItem.putra + updatedItem.putri;
      }

      // Selalu hitung ulang total keseluruhan
      updatedItem.total = updatedItem.totalAtlet + updatedItem.pelatih;

      newData[index] = updatedItem;

      // Optional: console.log untuk debug (hapus setelah OK)
      console.log(`Updated ${item.cabor}: putra=${updatedItem.putra}, putri=${updatedItem.putri}, pelatih=${updatedItem.pelatih}, totalAtlet=${updatedItem.totalAtlet}, total=${updatedItem.total}`);

      return newData;
    });
  };

  const handleSaveDraft = async () => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("caborData", JSON.stringify(caborData));

      await axios.put(`${BACKEND_URL}/admin/tahap1`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Draft berhasil disimpan!");
    } catch (err: any) {
      alert("Gagal menyimpan draft: " + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmitFinal = async () => {
    const hasData = caborData.some((item) => item.total > 0);
    if (!hasData) {
      alert("Isi minimal 1 data cabang olahraga!");
      return;
    }
    if (!formDataAwal || !dataKeikutsertaan || !skKontingen) {
      alert("Semua file wajib diupload!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("caborData", JSON.stringify(caborData));
      if (formDataAwal) formData.append("form_data_awal", formDataAwal);
      if (dataKeikutsertaan) formData.append("data_keikutsertaan", dataKeikutsertaan);
      if (skKontingen) formData.append("sk_kontingen", skKontingen);

      await axios.put(`${BACKEND_URL}/admin/tahap1`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Tahap 1 berhasil disubmit dan terkunci!");
      setSubmitted(true);
      setSubmittedAt(new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }));
    } catch (err: any) {
      alert("Gagal submit: " + (err.response?.data?.error || err.message));
    }
  };

  // Fungsi untuk preview file
  const handlePreviewFile = (file: File) => {
    setPreviewFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl("");
  };

  const grandTotal = useMemo(() =>
    caborData.reduce((sum, item) => sum + (item.total || 0), 0),
    [caborData]
  );

  if (loading) {
    return <div className="p-10 text-center text-gray-400">Memuat data...</div>;
  }

  return (
    <>
      <PageMeta
        title="SPORTIF - Tahap I: Entry By Sport"
        description="Entry cabang olahraga dan estimasi jumlah personel kontingen POPDA XII 2026"
      />

      <PageBreadcrumb pageTitle="Tahap I: Entry By Sport" />

      <div className="min-h-[calc(100vh-180px)] rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {submitted ? (
          // ... bagian submitted sama seperti sebelumnya ...
          <div className="text-center py-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Sudah Disubmit
            </h3>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
              Silahkan lanjut ke Tahap II (Entry By Number)
            </p>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-400">
              Disubmit pada <span className="font-medium">{submittedAt}</span>
            </p>
          </div>
        ) : (
          <div className="w-full max-w-none space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                Entry Data Cabang Olahraga
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Pilih cabang olahraga yang akan diikuti, lalu isi jumlah atlet dan pelatih
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800/50">
              <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                Pilih Cabang Olahraga
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {DUMMY_CABOR.map((cabor) => (
                  <label
                    key={cabor.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCabor.includes(cabor.id)}
                      onChange={(e) => handleCaborSelection(cabor.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {cabor.nama}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Max: {cabor.maxPutra + cabor.maxPutri} atlet, {cabor.maxPelatih} pelatih
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {caborData.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800/50">
                    <TableRow>
                      <TableCell isHeader className="px-4 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-14 min-w-14">
                        No
                      </TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 min-w-[180px] md:min-w-[220px]">
                        Cabang Olahraga
                      </TableCell>
                      <TableCell isHeader className="px-3 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-20">
                        Atlet Putra
                      </TableCell>
                      <TableCell isHeader className="px-3 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-20">
                        Atlet Putri
                      </TableCell>
                      <TableCell isHeader className="px-3 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-24">
                        Total Atlet
                      </TableCell>
                      <TableCell isHeader className="px-3 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-24">
                        Pelatih
                      </TableCell>
                      <TableCell isHeader className="px-3 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400 w-28">
                        Total Keseluruhan
                      </TableCell>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {caborData.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="px-4 py-4 text-center text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {item.cabor}
                        </TableCell>
                        <TableCell className="px-3 py-4 text-center">
                          <Input
                            type="number"
                            value={item.putra ?? 0}
                            onChange={(e) => updateCaborField(idx, "putra", Number(e.target.value) || 0)}
                            min="0"
                            max={item.maxPutra}
                            className="!w-full text-center"
                            placeholder={`0-${item.maxPutra}`}
                          />
                          <div className="text-xs text-gray-500 mt-1">Max: {item.maxPutra}</div>
                        </TableCell>
                        <TableCell className="px-3 py-4 text-center">
                          <Input
                            type="number"
                            value={item.putri ?? 0}
                            onChange={(e) => updateCaborField(idx, "putri", Number(e.target.value) || 0)}
                            min="0"
                            max={item.maxPutri}
                            className="!w-full text-center"
                            placeholder={`0-${item.maxPutri}`}
                          />
                          <div className="text-xs text-gray-500 mt-1">Max: {item.maxPutri}</div>
                        </TableCell>
                        <TableCell className="px-3 py-4 text-center">
                          <div className="flex h-full items-center justify-center text-theme-sm font-bold text-gray-800 dark:text-white/90 mb-5">
                            {item.totalAtlet ?? 0}
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-4 text-center">
                          <Input
                            type="number"
                            value={item.pelatih ?? 0}
                            onChange={(e) => updateCaborField(idx, "pelatih", Number(e.target.value) || 0)}
                            min="0"
                            max={item.maxPelatih}
                            className="!w-full text-center"
                            placeholder={`0-${item.maxPelatih}`}
                          />
                          <div className="text-xs text-gray-500 mt-1">Max: {item.maxPelatih}</div>
                        </TableCell>
                        <TableCell className="px-3 py-4 text-center">
                          <div className="flex h-full items-center justify-center text-theme-sm font-bold text-teal-600 dark:text-teal-400 mb-5">
                            {item.total ?? 0}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {caborData.length === 0 && (
              <div className="text-center py-8 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <p className="text-gray-500 dark:text-gray-400">
                  Silakan pilih cabang olahraga terlebih dahulu untuk mengisi data atlet dan pelatih
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Badge size="sm" color="success">
                Total Keseluruhan: {grandTotal}
              </Badge>
            </div>

            {/* Bagian upload dokumen */}
            <div>
              <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white/90">
                Upload Dokumen Wajib
              </h3>
              <div className="space-y-6">
                <div>
                  <Label className="mb-2">Form Data Awal Keikutsertaan</Label>
                  <FileInput
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setFormDataAwal(file);
                    }}
                  />
                  {formDataAwal && (
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-teal-500">File terpilih: {formDataAwal.name}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewFile(formDataAwal)}
                        className="ml-2"
                      >
                        Preview
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="mb-2">Data Keikutsertaan Cabang Olahraga</Label>
                  <FileInput
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setDataKeikutsertaan(file);
                    }}
                  />
                  {dataKeikutsertaan && (
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-teal-500">File terpilih: {dataKeikutsertaan.name}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewFile(dataKeikutsertaan)}
                        className="ml-2"
                      >
                        Preview
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="mb-2">SK Kontingen</Label>
                  <FileInput
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSkKontingen(file);
                    }}
                  />
                  {skKontingen && (
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-teal-500">File terpilih: {skKontingen.name}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewFile(skKontingen)}
                        className="ml-2"
                      >
                        Preview
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-end">
              <Button size="md" variant="outline" onClick={handleSaveDraft}>
                Simpan Sementara
              </Button>
              <Button
                size="md"
                variant="primary"
                onClick={handleSubmitFinal}
                disabled={grandTotal === 0 || !formDataAwal || !dataKeikutsertaan || !skKontingen}
              >
                Submit Final & Kunci Data
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Preview Dokumen */}
      <Modal
        isOpen={showPreview}
        onClose={handleClosePreview}
        className="max-w-6xl mx-auto m-4 sm:m-6"
        showCloseButton={false}
      >
        <div className="relative w-full overflow-y-auto rounded-3xl bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 pr-16">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Preview: {previewFile?.name}
            </h3>
          </div>

          {/* Content */}
          <div className="p-4 pt-2">
            {previewFile?.type.startsWith('image/') ? (
              <div className="flex justify-center">
                <img
                  src={previewUrl}
                  alt={previewFile.name}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  style={{ maxHeight: '70vh' }}
                />
              </div>
            ) : previewFile?.type === 'application/pdf' ? (
              <div className="flex justify-center" style={{ height: '65vh', margin: '0 -16px' }}>
                <iframe
                  src={previewUrl}
                  className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700"
                  title={previewFile.name}
                  style={{ margin: '0 16px' }}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Preview tidak tersedia untuk tipe file ini
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p><strong>Nama File:</strong> {previewFile?.name}</p>
                  <p><strong>Ukuran:</strong> {previewFile ? (previewFile.size / 1024).toFixed(2) : 0} KB</p>
                  <p><strong>Tipe:</strong> {previewFile?.type}</p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    if (previewUrl && previewFile) {
                      const link = document.createElement('a');
                      link.href = previewUrl;
                      link.download = previewFile.name;
                      link.click();
                    }
                  }}
                  className="mt-4"
                >
                  Download File
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex justify-end p-4 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <Button
              size="md"
              variant="outline"
              onClick={handleClosePreview}
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}