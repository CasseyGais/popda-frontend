// Test credentials berdasarkan database POPDA 2026
export const TEST_CREDENTIALS = [
  {
    email: 'superadmin@popda.id',
    password: 'password', // Hash: ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
    role: 'SUPERADMIN',
    name: 'Super Admin Dispora',
    kab_kota: 'Provinsi Banten'
  },
  {
    email: 'admin.kabtangerang@popda.id',
    password: 'password', // Hash: 871241dbf332bd665f337dbbe036fd560ee1af5731fd29a9d0fc449c44548d4a
    role: 'ADMIN',
    name: 'Admin Kab Tangerang',
    kab_kota: 'Kabupaten Tangerang'
  },
  {
    email: 'admin.kabserang@popda.id',
    password: 'password',
    role: 'ADMIN',
    name: 'Admin Kab Serang',
    kab_kota: 'Kabupaten Serang'
  }
];

// Fungsi untuk generate hash password (SHA256)
export function hashPassword(password: string): string {
  // Ini untuk testing - di backend menggunakan Go crypto/sha256
  // Password default untuk semua user kecuali admin.kabtangerang adalah "password"
  return password;
}

/** Hash string menggunakan SHA-256 via Web Crypto API (async) */
export async function sha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// API endpoints berdasarkan backend
export const API_ENDPOINTS = {
  LOGIN: '/login',
  ADMIN: {
    IDENTITAS: '/admin/identitas',
    TAHAP1: '/admin/tahap1',
    TAHAP2: '/admin/tahap2',
    TAHAP3: '/admin/tahap3',
    TRX_CABOR: '/admin/trx/cabor',
    TRX_NOMOR: '/admin/trx/nomor',
    TRX_ATLET: '/admin/trx/atlet'
  }
};
