// src/types/identitas.ts
// Interface sesuai backend KontingenIdentitas
export interface IdentitasKontingen {
  id: number;
  kontingen_id: number;
  
  // Data Kepala
  kepala_nama: string;
  kepala_jabatan: string;
  kepala_nip: string;
  kepala_telepon: string;
  kepala_foto: string;
  
  // Data PIC
  pic_nama: string;
  pic_jabatan: string;
  pic_telepon: string;
  pic_foto: string;
  
  // Data Instansi
  alamat: string;
  email_instansi: string;
  phone_instansi: string;
  
  updated_at: string;
}
