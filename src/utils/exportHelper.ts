/**
 * exportHelper.ts
 * Utility untuk download file export (PDF/Excel) dari backend.
 * Pakai axios instance yang sudah ada (token otomatis dari interceptor).
 */
import api from "../lib/api";

/**
 * Download file dari endpoint export backend.
 * Menggunakan axios dengan responseType 'blob' agar bisa handle file binary.
 */
export async function downloadExport(
  path: string,
  filename: string
): Promise<void> {
  const res = await api.get(path, {
    responseType: "blob",
  });

  // Jika backend return error dalam bentuk JSON (bukan blob), parse dan throw
  if (res.data instanceof Blob && res.data.type === "application/json") {
    const text = await res.data.text();
    const json = JSON.parse(text);
    throw new Error(json.message || "Export gagal");
  }

  const blob = new Blob([res.data]);
  const objectUrl = URL.createObjectURL(blob);

  // Buat anchor sementara, klik otomatis, lalu hapus
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

/** Format tanggal hari ini → YYYY-MM-DD */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Sanitasi nama untuk nama file: spasi → underscore, strip karakter non-alphanum */
function sanitizeName(name: string): string {
  return name
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "")
    .slice(0, 40) || "kontingen";
}

/** Bangun query string territory_id jika ada */
function territoryQs(territoryId?: number): string {
  return territoryId ? `?territory_id=${territoryId}` : "";
}

// ─── Tahap 1 ─────────────────────────────────────────────

export async function exportTahap1PDF(
  kontigenName: string,
  territoryId?: number
): Promise<void> {
  const path = `/admin/tahap1/export/pdf${territoryQs(territoryId)}`;
  const filename = `tahap1_${sanitizeName(kontigenName)}_${today()}.pdf`;
  return downloadExport(path, filename);
}

export async function exportTahap1Excel(
  kontigenName: string,
  territoryId?: number
): Promise<void> {
  const path = `/admin/tahap1/export/excel${territoryQs(territoryId)}`;
  const filename = `tahap1_${sanitizeName(kontigenName)}_${today()}.xlsx`;
  return downloadExport(path, filename);
}

// ─── Tahap 2 ─────────────────────────────────────────────

export async function exportTahap2PDF(
  kontigenName: string,
  territoryId?: number
): Promise<void> {
  const path = `/admin/tahap2/export/pdf${territoryQs(territoryId)}`;
  const filename = `tahap2_${sanitizeName(kontigenName)}_${today()}.pdf`;
  return downloadExport(path, filename);
}

export async function exportTahap2Excel(
  kontigenName: string,
  territoryId?: number
): Promise<void> {
  const path = `/admin/tahap2/export/excel${territoryQs(territoryId)}`;
  const filename = `tahap2_${sanitizeName(kontigenName)}_${today()}.xlsx`;
  return downloadExport(path, filename);
}

// ─── Tahap 3 ─────────────────────────────────────────────

export async function exportTahap3PDF(
  kontigenName: string,
  territoryId?: number
): Promise<void> {
  const path = `/admin/tahap3/export/pdf${territoryQs(territoryId)}`;
  const filename = `tahap3_${sanitizeName(kontigenName)}_${today()}.pdf`;
  return downloadExport(path, filename);
}

export async function exportTahap3Excel(
  kontigenName: string,
  territoryId?: number
): Promise<void> {
  const path = `/admin/tahap3/export/excel${territoryQs(territoryId)}`;
  const filename = `tahap3_${sanitizeName(kontigenName)}_${today()}.xlsx`;
  return downloadExport(path, filename);
}
