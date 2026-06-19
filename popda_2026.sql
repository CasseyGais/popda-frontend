-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 05 Jun 2026 pada 19.45
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `popda_2026`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `kontingen`
--

CREATE TABLE `kontingen` (
  `id` bigint(20) NOT NULL,
  `territory_id` bigint(20) NOT NULL,
  `nama_kontingen` varchar(150) DEFAULT NULL,
  `tahap1_status` enum('DRAFT','SUBMITTED') DEFAULT 'DRAFT',
  `tahap1_submitted_at` datetime DEFAULT NULL,
  `tahap1_validasi_status` enum('PENDING','VALID','REVISI') DEFAULT NULL COMMENT 'NULL=belum submit, PENDING=menunggu review, VALID=ok, REVISI=perlu perbaikan',
  `tahap1_validasi_catatan` text DEFAULT NULL COMMENT 'Catatan superadmin jika status REVISI',
  `tahap1_validasi_at` datetime DEFAULT NULL COMMENT 'Waktu superadmin terakhir ubah status validasi',
  `tahap2_status` enum('DRAFT','SUBMITTED') DEFAULT 'DRAFT',
  `tahap2_submitted_at` datetime DEFAULT NULL,
  `tahap2_validasi_status` enum('PENDING','VALID','REVISI') DEFAULT NULL COMMENT 'NULL=belum submit, PENDING=menunggu review, VALID=ok, REVISI=perlu perbaikan',
  `tahap2_validasi_catatan` text DEFAULT NULL COMMENT 'Catatan superadmin jika status REVISI',
  `tahap2_validasi_at` datetime DEFAULT NULL COMMENT 'Waktu superadmin terakhir ubah status validasi',
  `tahap3_status` enum('DRAFT','SUBMITTED') DEFAULT 'DRAFT',
  `tahap3_submitted_at` datetime DEFAULT NULL,
  `tahap3_validasi_status` enum('PENDING','VALID','REVISI') DEFAULT NULL COMMENT 'NULL=belum submit, PENDING=menunggu review, VALID=ok, REVISI=perlu perbaikan',
  `tahap3_validasi_catatan` text DEFAULT NULL COMMENT 'Catatan superadmin jika status REVISI',
  `tahap3_validasi_at` datetime DEFAULT NULL COMMENT 'Waktu superadmin terakhir ubah status validasi',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `kontingen`
--

INSERT INTO `kontingen` (`id`, `territory_id`, `nama_kontingen`, `tahap1_status`, `tahap1_submitted_at`, `tahap1_validasi_status`, `tahap1_validasi_catatan`, `tahap1_validasi_at`, `tahap2_status`, `tahap2_submitted_at`, `tahap2_validasi_status`, `tahap2_validasi_catatan`, `tahap2_validasi_at`, `tahap3_status`, `tahap3_submitted_at`, `tahap3_validasi_status`, `tahap3_validasi_catatan`, `tahap3_validasi_at`, `created_at`, `updated_at`) VALUES
(2, 2, 'Kabupaten Tangerang', 'SUBMITTED', '2026-06-03 04:24:55', NULL, NULL, NULL, 'SUBMITTED', '2026-06-03 09:03:01', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-13 04:33:26', '2026-06-03 11:18:54'),
(3, 3, 'Kontingen 3', 'SUBMITTED', '2026-06-02 14:54:34', NULL, NULL, NULL, 'SUBMITTED', '2026-06-02 17:09:46', NULL, NULL, NULL, 'SUBMITTED', '2026-06-04 01:24:08', NULL, NULL, NULL, '2026-05-24 15:05:08', '2026-06-03 18:24:08'),
(4, 4, 'Kontingen 4', 'SUBMITTED', '2026-06-02 15:15:42', NULL, NULL, NULL, 'DRAFT', NULL, NULL, NULL, NULL, 'DRAFT', NULL, NULL, NULL, NULL, '2026-05-24 15:05:08', '2026-06-02 08:15:42'),
(5, 5, 'Kontingen 5', 'DRAFT', NULL, NULL, NULL, NULL, 'DRAFT', NULL, NULL, NULL, NULL, 'DRAFT', NULL, NULL, NULL, NULL, '2026-05-24 15:05:08', '2026-05-24 15:05:08'),
(6, 6, 'Kontingen 6', 'DRAFT', NULL, NULL, NULL, NULL, 'DRAFT', NULL, NULL, NULL, NULL, 'DRAFT', NULL, NULL, NULL, NULL, '2026-05-24 15:05:08', '2026-05-24 15:05:08'),
(7, 7, 'Kontingen 7', 'DRAFT', NULL, NULL, NULL, NULL, 'DRAFT', NULL, NULL, NULL, NULL, 'DRAFT', NULL, NULL, NULL, NULL, '2026-05-24 15:05:08', '2026-05-24 15:05:08'),
(8, 8, 'Kontingen 8', 'DRAFT', NULL, NULL, NULL, NULL, 'DRAFT', NULL, NULL, NULL, NULL, 'DRAFT', NULL, NULL, NULL, NULL, '2026-05-24 15:05:08', '2026-05-24 15:05:08'),
(9, 9, 'Kontingen 9', 'DRAFT', NULL, NULL, NULL, NULL, 'DRAFT', NULL, NULL, NULL, NULL, 'DRAFT', NULL, NULL, NULL, NULL, '2026-05-24 15:05:08', '2026-05-24 15:05:08');

-- --------------------------------------------------------

--
-- Struktur dari tabel `kontingen_identitas`
--

CREATE TABLE `kontingen_identitas` (
  `id` bigint(20) NOT NULL,
  `kontingen_id` bigint(20) NOT NULL,
  `kepala_nama` varchar(150) DEFAULT NULL,
  `kepala_jabatan` varchar(150) DEFAULT NULL,
  `kepala_nip` varchar(50) DEFAULT NULL,
  `kepala_telepon` varchar(30) DEFAULT NULL,
  `kepala_foto` varchar(255) DEFAULT NULL,
  `pic_nama` varchar(150) DEFAULT NULL,
  `pic_jabatan` varchar(150) DEFAULT NULL,
  `pic_telepon` varchar(30) DEFAULT NULL,
  `pic_foto` varchar(255) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `email_instansi` varchar(150) DEFAULT NULL,
  `phone_instansi` varchar(30) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `kontingen_identitas`
--

INSERT INTO `kontingen_identitas` (`id`, `kontingen_id`, `kepala_nama`, `kepala_jabatan`, `kepala_nip`, `kepala_telepon`, `kepala_foto`, `pic_nama`, `pic_jabatan`, `pic_telepon`, `pic_foto`, `alamat`, `email_instansi`, `phone_instansi`, `updated_at`) VALUES
(14, 2, 'Rudi Hartono', 'Ketua Kontingen', '1987654321', '+628111111111', '/uploads/kepala/20260603062121_ChatGPT Image 28 Mei 2026, 20.06.11.png', 'Andi Saputraa', 'Operator', '+628111111112', '/uploads/pic/20260603062121_WhatsApp Image 2026-05-28 at 19.52.42 (1).jpeg', 'Kabupaten Serang', 'kontingen3@popda.id', '+628111111113', '2026-06-02 23:30:30'),
(15, 3, 'Rudi Hartono', 'Ketua Kontingen', '1987654321', '+628111111111', '/uploads/kepala/1780009974708474800_WhatsApp Image 2026-05-28 at 19.52.42.jpeg', 'Andi Saputra', 'Operator', '+628111111112', '/uploads/pic/1780009974807541600_ChatGPT Image 28 Mei 2026, 20.06.11.png', 'Kabupaten Serang', 'kontingen3@popda.id', '+628111111113', '2026-05-28 23:12:54'),
(16, 4, 'Dedi Supriadi', 'Ketua Kontingen', '1987654322', '+628222222221', '/uploads/kepala/kepala4.jpg', 'Fajar Nugraha', 'Admin', '+628222222222', '/uploads/pic/pic4.jpg', 'Kota Cilegon', 'kontingen4@popda.id', '+628222222223', '2026-05-24 15:09:52'),
(17, 5, 'Agus Setiawan', 'Ketua Kontingen', '1987654323', '+628333333331', '/uploads/kepala/kepala5.jpg', 'Beni Firmansyah', 'Operator', '+628333333332', '/uploads/pic/pic5.jpg', 'Kota Tangerang', 'kontingen5@popda.id', '+628333333333', '2026-05-24 15:09:52'),
(18, 6, 'Yusuf Maulana', 'Ketua Kontingen', '1987654324', '+628444444441', '/uploads/kepala/kepala6.jpg', 'Rizki Hidayat', 'Admin', '+628444444442', '/uploads/pic/pic6.jpg', 'Kabupaten Pandeglang', 'kontingen6@popda.id', '+628444444443', '2026-05-24 15:09:52'),
(19, 7, 'Maman Abdurahman', 'Ketua Kontingen', '1987654325', '+628555555551', '/uploads/kepala/kepala7.jpg', 'Ilham Ramadhan', 'Operator', '+628555555552', '/uploads/pic/pic7.jpg', 'Kabupaten Lebak', 'kontingen7@popda.id', '+628555555553', '2026-05-24 15:09:52'),
(20, 8, 'Rahmat Hidayat', 'Ketua Kontingen', '1987654326', '+628666666661', '/uploads/kepala/kepala8.jpg', 'Galih Pratama', 'Admin', '+628666666662', '/uploads/pic/pic8.jpg', 'Kota Serang', 'kontingen8@popda.id', '+628666666663', '2026-05-24 15:09:52'),
(21, 9, 'Asep Kurniawan', 'Ketua Kontingen', '1987654327', '+628777777771', '/uploads/kepala/kepala9.jpg', 'Dimas Saputra', 'Operator', '+628777777772', '/uploads/pic/pic9.jpg', 'Kabupaten Tangerang', 'kontingen9@popda.id', '+628777777773', '2026-05-24 15:09:52');

-- --------------------------------------------------------

--
-- Struktur dari tabel `master_atlet`
--

CREATE TABLE `master_atlet` (
  `id` bigint(20) NOT NULL,
  `kontingen_id` bigint(20) NOT NULL,
  `nama_lengkap` varchar(150) NOT NULL,
  `jenis_kelamin` enum('L','P') NOT NULL,
  `tanggal_lahir` date NOT NULL,
  `tempat_lahir` varchar(100) DEFAULT NULL,
  `nisn` varchar(20) NOT NULL,
  `nis` varchar(20) DEFAULT NULL,
  `sekolah` varchar(150) NOT NULL,
  `kelas_jurusan` varchar(50) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `kabupaten_kota` varchar(100) NOT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `nama_ortu_wali` varchar(150) DEFAULT NULL,
  `status` enum('draft','terdaftar','terverifikasi','ditolak') DEFAULT 'draft',
  `foto` varchar(255) DEFAULT NULL,
  `file_kartu_pelajar` varchar(255) DEFAULT NULL,
  `file_akte_kelahiran` varchar(255) DEFAULT NULL,
  `file_kk` varchar(255) DEFAULT NULL,
  `file_surat_keterangan_sekolah` varchar(255) DEFAULT NULL,
  `file_surat_izin_ortu` varchar(255) DEFAULT NULL,
  `prestasi_sebelumnya` text DEFAULT NULL,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `master_atlet`
--

INSERT INTO `master_atlet` (`id`, `kontingen_id`, `nama_lengkap`, `jenis_kelamin`, `tanggal_lahir`, `tempat_lahir`, `nisn`, `nis`, `sekolah`, `kelas_jurusan`, `alamat`, `kabupaten_kota`, `no_hp`, `nama_ortu_wali`, `status`, `foto`, `file_kartu_pelajar`, `file_akte_kelahiran`, `file_kk`, `file_surat_keterangan_sekolah`, `file_surat_izin_ortu`, `prestasi_sebelumnya`, `catatan`, `created_at`, `updated_at`) VALUES
(4, 3, 'Joko', 'L', '2003-01-01', 'Tangerang', '12432131231', '21321321312', 'anjay', 'VIII A', 'Melia Residence Blok x12/6', 'Tangerang', '089719121323', 'Anton', 'draft', '', '', '', '', '', '', '', '', '2026-06-03 18:21:02', '2026-06-03 18:21:02');

-- --------------------------------------------------------

--
-- Struktur dari tabel `master_cabor`
--

CREATE TABLE `master_cabor` (
  `id` int(11) NOT NULL,
  `nama` varchar(150) NOT NULL,
  `max_putra` int(11) DEFAULT 0,
  `max_putri` int(11) DEFAULT 0,
  `max_pelatih` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `master_cabor`
--

INSERT INTO `master_cabor` (`id`, `nama`, `max_putra`, `max_putri`, `max_pelatih`, `is_active`, `created_at`) VALUES
(6, 'Bulutangkis', 5, 5, 2, 1, '2026-02-11 08:25:14');

-- --------------------------------------------------------

--
-- Struktur dari tabel `master_nomor`
--

CREATE TABLE `master_nomor` (
  `id` bigint(20) NOT NULL,
  `cabor_id` int(11) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `jenis_kelamin` enum('PUTRA','PUTRI','CAMPURAN') NOT NULL,
  `tipe` enum('INDIVIDU','BEREGU') DEFAULT 'INDIVIDU',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `master_nomor`
--

INSERT INTO `master_nomor` (`id`, `cabor_id`, `nama`, `jenis_kelamin`, `tipe`, `is_active`, `created_at`) VALUES
(69, 6, 'Tunggal', 'PUTRA', 'INDIVIDU', 1, '2026-02-11 08:38:00'),
(70, 6, 'Ganda', 'PUTRA', 'BEREGU', 1, '2026-02-11 08:38:00'),
(71, 6, 'Beregu', 'PUTRA', 'BEREGU', 1, '2026-02-11 08:38:00'),
(72, 6, 'Tunggal', 'PUTRI', 'INDIVIDU', 1, '2026-02-11 08:38:00'),
(73, 6, 'Ganda', 'PUTRI', 'BEREGU', 1, '2026-02-11 08:38:00'),
(74, 6, 'Beregu', 'PUTRI', 'BEREGU', 1, '2026-02-11 08:38:00');

-- --------------------------------------------------------

--
-- Struktur dari tabel `master_official`
--

CREATE TABLE `master_official` (
  `id` bigint(20) NOT NULL,
  `kontingen_id` bigint(20) NOT NULL,
  `nama_lengkap` varchar(150) NOT NULL,
  `jenis_kelamin` enum('L','P') NOT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `tempat_lahir` varchar(100) DEFAULT NULL,
  `nik` varchar(20) DEFAULT NULL,
  `sekolah_asal` varchar(150) DEFAULT NULL,
  `jabatan` varchar(100) NOT NULL,
  `alamat` text DEFAULT NULL,
  `kabupaten_kota` varchar(100) NOT NULL,
  `no_hp` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `status` enum('draft','terdaftar','terverifikasi','ditolak') DEFAULT 'draft',
  `foto` varchar(255) DEFAULT NULL,
  `file_ktp` varchar(255) DEFAULT NULL,
  `file_surat_tugas` varchar(255) DEFAULT NULL,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `master_pelatih`
--

CREATE TABLE `master_pelatih` (
  `id` bigint(20) NOT NULL,
  `kontingen_id` bigint(20) NOT NULL,
  `nama_lengkap` varchar(150) NOT NULL,
  `jenis_kelamin` enum('L','P') NOT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `tempat_lahir` varchar(100) DEFAULT NULL,
  `nik` varchar(20) DEFAULT NULL,
  `sekolah_asal` varchar(150) DEFAULT NULL,
  `profesi` varchar(100) DEFAULT NULL,
  `jabatan` varchar(100) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `kabupaten_kota` varchar(100) NOT NULL,
  `no_hp` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `nama_istri_suami` varchar(150) DEFAULT NULL,
  `status` enum('draft','terdaftar','terverifikasi','ditolak') DEFAULT 'draft',
  `foto` varchar(255) DEFAULT NULL,
  `file_ktp` varchar(255) DEFAULT NULL,
  `file_surat_tugas` varchar(255) DEFAULT NULL,
  `file_sertifikat_pelatih` varchar(255) DEFAULT NULL,
  `prestasi_sebelumnya` text DEFAULT NULL,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `modules`
--

CREATE TABLE `modules` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL COMMENT 'Nama teknis modul, contoh: dashboard, cabor',
  `label` varchar(150) NOT NULL COMMENT 'Label tampilan, contoh: Dashboard, Cabor',
  `code` varchar(50) NOT NULL COMMENT 'Kode unik huruf besar, contoh: DASHBOARD, CABOR',
  `url` varchar(255) DEFAULT NULL COMMENT 'Path URL frontend, contoh: /dashboard',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Daftar modul/fitur dalam sistem POPDA 2026';

--
-- Dumping data untuk tabel `modules`
--

INSERT INTO `modules` (`id`, `name`, `label`, `code`, `url`, `created_at`, `updated_at`) VALUES
(1, 'dashboard', 'Dashboard', 'DASHBOARD', '/dashboard', '2026-05-30 12:21:24', '2026-05-30 12:21:24'),
(2, 'cabor', 'Cabang Olahraga', 'CABOR', '/master/cabor', '2026-05-30 12:21:24', '2026-05-30 12:21:24'),
(3, 'nomor', 'Nomor Pertandingan', 'NOMOR', '/master/nomor', '2026-05-30 12:21:24', '2026-05-30 12:21:24'),
(4, 'sekolah', 'Data Sekolah', 'SEKOLAH', '/master/sekolah', '2026-05-30 12:21:24', '2026-05-30 12:21:24'),
(5, 'atlet', 'Master Atlet', 'ATLET', '/master/atlet', '2026-05-30 12:21:24', '2026-05-30 12:21:24'),
(6, 'pelatih', 'Master Pelatih', 'PELATIH', '/master/pelatih', '2026-05-30 12:21:24', '2026-05-30 12:21:24'),
(7, 'official', 'Master Official', 'OFFICIAL', '/master/official', '2026-05-30 12:21:24', '2026-05-30 12:21:24'),
(8, 'trx_kontingen_cabor', 'Pendaftaran Cabor', 'TRX_KONTINGEN_CABOR', '/pendaftaran/cabor', '2026-05-30 12:21:24', '2026-05-30 12:21:24'),
(9, 'trx_kontingen_nomor', 'Pendaftaran Nomor', 'TRX_KONTINGEN_NOMOR', '/pendaftaran/nomor', '2026-05-30 12:21:24', '2026-05-30 12:21:24'),
(10, 'trx_pendaftaran_atlet', 'Pendaftaran Atlet & Tim', 'TRX_PENDAFTARAN_ATLET', '/pendaftaran/atlet', '2026-05-30 12:21:24', '2026-05-30 12:21:24'),
(11, 'verifikasi', 'Verifikasi Berkas', 'VERIFIKASI', '/verifikasi', '2026-05-30 12:21:24', '2026-05-30 12:21:24'),
(12, 'kontingen', 'Manajemen Kontingen', 'KONTINGEN', '/kontingen', '2026-05-30 12:21:24', '2026-05-30 12:21:24'),
(13, 'user', 'Manajemen User', 'USER', '/settings/users', '2026-05-30 12:21:24', '2026-05-30 12:21:24'),
(14, 'role', 'Manajemen Role / Akses', 'ROLE', '/settings/roles', '2026-05-30 12:21:24', '2026-05-30 12:21:24'),
(15, 'territory', 'Wilayah / Kota / Kab', 'TERRITORY', '/settings/territory', '2026-05-30 12:21:24', '2026-05-30 12:21:24'),
(16, 'permission', 'Hak Akses (Permission)', 'PERMISSION', '/settings/permissions', '2026-05-30 12:21:24', '2026-05-30 12:21:24');

-- --------------------------------------------------------

--
-- Struktur dari tabel `pengaturan_tahap`
--

CREATE TABLE `pengaturan_tahap` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `tahap` tinyint(3) UNSIGNED NOT NULL,
  `is_open` tinyint(1) NOT NULL DEFAULT 0,
  `tanggal_buka` date DEFAULT NULL,
  `tanggal_tutup` date DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `pengaturan_tahap`
--

INSERT INTO `pengaturan_tahap` (`id`, `tahap`, `is_open`, `tanggal_buka`, `tanggal_tutup`, `updated_at`) VALUES
(1, 1, 0, NULL, NULL, '2026-06-06 00:30:53'),
(2, 2, 0, NULL, NULL, '2026-06-06 00:30:53'),
(3, 3, 0, NULL, NULL, '2026-06-06 00:30:53');

-- --------------------------------------------------------

--
-- Struktur dari tabel `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `module_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `permissions`
--

INSERT INTO `permissions` (`id`, `module_id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 1, 'dashboard.read', 'Melihat dashboard statistik', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(2, 2, 'cabor.read', 'Melihat data cabor', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(3, 2, 'cabor.create', 'Menambah data cabor', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(4, 2, 'cabor.update', 'Mengubah data cabor', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(5, 2, 'cabor.delete', 'Menghapus data cabor', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(6, 3, 'nomor.read', 'Melihat data nomor', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(7, 3, 'nomor.create', 'Menambah data nomor', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(8, 3, 'nomor.update', 'Mengubah data nomor', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(9, 3, 'nomor.delete', 'Menghapus data nomor', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(10, 4, 'sekolah.read', 'Melihat data sekolah', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(11, 4, 'sekolah.create', 'Menambah data sekolah', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(12, 4, 'sekolah.update', 'Mengubah data sekolah', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(13, 4, 'sekolah.delete', 'Menghapus data sekolah', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(14, 5, 'atlet.read', 'Melihat data atlet', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(15, 5, 'atlet.create', 'Menambah data atlet', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(16, 5, 'atlet.update', 'Mengubah data atlet', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(17, 5, 'atlet.delete', 'Menghapus data atlet', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(18, 6, 'pelatih.read', 'Melihat data pelatih', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(19, 6, 'pelatih.create', 'Menambah data pelatih', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(20, 6, 'pelatih.update', 'Mengubah data pelatih', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(21, 6, 'pelatih.delete', 'Menghapus data pelatih', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(22, 7, 'official.read', 'Melihat data official', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(23, 7, 'official.create', 'Menambah data official', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(24, 7, 'official.update', 'Mengubah data official', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(25, 7, 'official.delete', 'Menghapus data official', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(26, 8, 'trx_kontingen_cabor.read', 'Melihat data transaksi kontingen cabor', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(27, 8, 'trx_kontingen_cabor.create', 'Menambah data transaksi kontingen cabor', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(28, 8, 'trx_kontingen_cabor.update', 'Mengubah data transaksi kontingen cabor', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(29, 8, 'trx_kontingen_cabor.delete', 'Menghapus data transaksi kontingen cabor', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(30, 9, 'trx_kontingen_nomor.read', 'Melihat data transaksi kontingen nomor', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(31, 9, 'trx_kontingen_nomor.create', 'Menambah data transaksi kontingen nomor', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(32, 9, 'trx_kontingen_nomor.update', 'Mengubah data transaksi kontingen nomor', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(33, 9, 'trx_kontingen_nomor.delete', 'Menghapus data transaksi kontingen nomor', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(34, 10, 'trx_pendaftaran_atlet.read', 'Melihat data transaksi pendaftaran atlet', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(35, 10, 'trx_pendaftaran_atlet.create', 'Menambah data transaksi pendaftaran atlet', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(36, 10, 'trx_pendaftaran_atlet.update', 'Mengubah data transaksi pendaftaran atlet', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(37, 10, 'trx_pendaftaran_atlet.delete', 'Menghapus data transaksi pendaftaran atlet', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(38, 11, 'verifikasi.read', 'Melihat data untuk verifikasi', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(39, 11, 'verifikasi.approve', 'Approve atau tolak data', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(40, 12, 'kontingen.read', 'Melihat data kontingen', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(41, 12, 'kontingen.create', 'Menambah data kontingen', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(42, 12, 'kontingen.update', 'Mengubah data kontingen', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(43, 12, 'kontingen.delete', 'Menghapus data kontingen', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(44, 13, 'user.read', 'Melihat data user', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(45, 13, 'user.create', 'Menambah data user', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(46, 13, 'user.update', 'Mengubah data user', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(47, 13, 'user.delete', 'Menghapus data user', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(48, 14, 'role.read', 'Melihat data role', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(49, 14, 'role.create', 'Menambah data role', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(50, 14, 'role.update', 'Mengubah data role', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(51, 14, 'role.delete', 'Menghapus data role', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(52, 15, 'territory.read', 'Melihat data territory', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(53, 15, 'territory.create', 'Menambah data territory', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(54, 15, 'territory.update', 'Mengubah data territory', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(55, 15, 'territory.delete', 'Menghapus data territory', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(56, 16, 'permission.read', 'Melihat data permission', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(57, 16, 'permission.create', 'Menambah data permission', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(58, 16, 'permission.update', 'Mengubah data permission', '2026-05-30 12:22:50', '2026-05-30 12:22:50'),
(59, 16, 'permission.delete', 'Menghapus data permission', '2026-05-30 12:22:50', '2026-05-30 12:22:50');

-- --------------------------------------------------------

--
-- Struktur dari tabel `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'SUPERADMIN', 'Admin pusat Dispora Provinsi'),
(2, 'ADMIN', 'Admin masing-masing Kabupaten/Kota'),
(3, 'STAFF_LAPANGAN', 'Petugas lapangan / verifikator');

-- --------------------------------------------------------

--
-- Struktur dari tabel `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(1, 10),
(1, 11),
(1, 12),
(1, 13),
(1, 14),
(1, 15),
(1, 16),
(1, 17),
(1, 18),
(1, 19),
(1, 20),
(1, 21),
(1, 22),
(1, 23),
(1, 24),
(1, 25),
(1, 26),
(1, 27),
(1, 28),
(1, 29),
(1, 30),
(1, 31),
(1, 32),
(1, 33),
(1, 34),
(1, 35),
(1, 36),
(1, 37),
(1, 38),
(1, 39),
(1, 40),
(1, 41),
(1, 42),
(1, 43),
(1, 44),
(1, 45),
(1, 46),
(1, 47),
(1, 48),
(1, 49),
(1, 50),
(1, 51),
(1, 52),
(1, 53),
(1, 54),
(1, 55),
(1, 56),
(1, 57),
(1, 58),
(1, 59),
(2, 1),
(2, 2),
(2, 3),
(2, 4),
(2, 5),
(2, 26),
(2, 27),
(2, 28),
(2, 34),
(2, 35),
(2, 36),
(2, 40),
(2, 41),
(2, 42),
(2, 44),
(2, 48),
(2, 52),
(2, 56);

-- --------------------------------------------------------

--
-- Struktur dari tabel `territories`
--

CREATE TABLE `territories` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('PROVINSI','KABUPATEN','KOTA') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `territories`
--

INSERT INTO `territories` (`id`, `name`, `type`) VALUES
(2, 'Kabupaten Tangerang', 'KABUPATEN'),
(3, 'Kabupaten Serang', 'KABUPATEN'),
(4, 'Kabupaten Lebak', 'KABUPATEN'),
(5, 'Kabupaten Pandeglang', 'KABUPATEN'),
(6, 'Kota Tangerang', 'KOTA'),
(7, 'Kota Tangerang Selatan', 'KOTA'),
(8, 'Kota Serang', 'KOTA'),
(9, 'Kota Cilegon', 'KOTA');

-- --------------------------------------------------------

--
-- Struktur dari tabel `trx_kontingen_cabor`
--

CREATE TABLE `trx_kontingen_cabor` (
  `id` bigint(20) NOT NULL,
  `kontingen_id` bigint(20) NOT NULL,
  `cabor_id` int(11) NOT NULL,
  `putra` int(11) DEFAULT 0,
  `putri` int(11) DEFAULT 0,
  `pelatih` int(11) DEFAULT 0,
  `total_atlet` int(11) DEFAULT 0,
  `total_personel` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `trx_kontingen_cabor`
--

INSERT INTO `trx_kontingen_cabor` (`id`, `kontingen_id`, `cabor_id`, `putra`, `putri`, `pelatih`, `total_atlet`, `total_personel`, `created_at`) VALUES
(1, 2, 6, 2, 1, 1, 3, 4, '2026-06-02 07:14:23'),
(2, 3, 6, 2, 2, 2, 4, 6, '2026-06-02 07:54:29'),
(3, 4, 6, 1, 1, 1, 2, 3, '2026-06-02 08:15:39');

--
-- Trigger `trx_kontingen_cabor`
--
DELIMITER $$
CREATE TRIGGER `before_insert_trx_kontingen_cabor` BEFORE INSERT ON `trx_kontingen_cabor` FOR EACH ROW BEGIN
    DECLARE max_putra INT;
    DECLARE max_putri INT;
    DECLARE max_pelatih INT;

    SELECT max_putra, max_putri, max_pelatih
    INTO max_putra, max_putri, max_pelatih
    FROM master_cabor
    WHERE id = NEW.cabor_id;

    IF NEW.putra > max_putra THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Jumlah atlet putra melebihi kuota';
    END IF;

    IF NEW.putri > max_putri THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Jumlah atlet putri melebihi kuota';
    END IF;

    IF NEW.pelatih > max_pelatih THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Jumlah pelatih melebihi kuota';
    END IF;

END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Struktur dari tabel `trx_kontingen_nomor`
--

CREATE TABLE `trx_kontingen_nomor` (
  `id` bigint(20) NOT NULL,
  `kontingen_id` bigint(20) NOT NULL,
  `nomor_id` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `trx_kontingen_nomor`
--

INSERT INTO `trx_kontingen_nomor` (`id`, `kontingen_id`, `nomor_id`, `created_at`) VALUES
(1, 3, 71, '2026-06-02 10:09:39'),
(3, 2, 71, '2026-06-03 02:02:57');

-- --------------------------------------------------------

--
-- Struktur dari tabel `trx_pendaftaran_atlet`
--

CREATE TABLE `trx_pendaftaran_atlet` (
  `id` bigint(20) NOT NULL,
  `atlet_id` bigint(20) NOT NULL,
  `cabor_id` int(20) NOT NULL,
  `nomor_id` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `trx_pendaftaran_atlet`
--

INSERT INTO `trx_pendaftaran_atlet` (`id`, `atlet_id`, `cabor_id`, `nomor_id`, `created_at`, `updated_at`) VALUES
(8, 4, 6, 71, '2026-06-03 18:21:11', '2026-06-03 18:21:11');

-- --------------------------------------------------------

--
-- Struktur dari tabel `trx_pendaftaran_official`
--

CREATE TABLE `trx_pendaftaran_official` (
  `id` bigint(20) NOT NULL,
  `official_id` bigint(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `trx_pendaftaran_pelatih`
--

CREATE TABLE `trx_pendaftaran_pelatih` (
  `id` bigint(20) NOT NULL,
  `pelatih_id` bigint(20) NOT NULL,
  `cabor_id` int(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `avatar` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `is_active`, `created_at`, `avatar`) VALUES
(1, 'Superadmin', 'superadmin@popda.id', '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b', 1, '2026-02-11 07:58:38', ''),
(2, 'Admin Kab Tangerang', 'admin.kabtangerang@popda.id', '871241dbf332bd665f337dbbe036fd560ee1af5731fd29a9d0fc449c44548d4a', 1, '2026-02-11 07:58:38', '/avatar/tangerangkab.png'),
(3, 'Admin Kab Serang', 'admin.kabserang@popda.id', '871241dbf332bd665f337dbbe036fd560ee1af5731fd29a9d0fc449c44548d4a', 1, '2026-02-11 07:58:38', NULL),
(4, 'Admin Kab Lebak', 'admin.kablebak@popda.id', '871241dbf332bd665f337dbbe036fd560ee1af5731fd29a9d0fc449c44548d4a', 1, '2026-02-11 07:58:38', ''),
(5, 'Admin Kab Pandeglang', 'admin.kabpandeglang@popda.id', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, '2026-02-11 07:58:38', NULL),
(6, 'Admin Kota Tangerang', 'admin.kotatangerang@popda.id', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, '2026-02-11 07:58:38', NULL),
(7, 'Admin Tangsel', 'admin.tangsel@popda.id', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, '2026-02-11 07:58:38', NULL),
(8, 'Admin Kota Serang', 'admin.kotaserang@popda.id', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, '2026-02-11 07:58:38', NULL),
(9, 'Admin Kota Cilegon', 'admin.kotacilegon@popda.id', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, '2026-02-11 07:58:38', NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1),
(2, 2),
(3, 2),
(4, 2),
(5, 2),
(6, 2),
(7, 2),
(8, 2),
(9, 2);

-- --------------------------------------------------------

--
-- Struktur dari tabel `user_territories`
--

CREATE TABLE `user_territories` (
  `user_id` int(11) NOT NULL,
  `territory_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `user_territories`
--

INSERT INTO `user_territories` (`user_id`, `territory_id`) VALUES
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(2, 2),
(3, 3),
(4, 4),
(5, 5),
(6, 6),
(7, 7),
(8, 8),
(9, 9);

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `kontingen`
--
ALTER TABLE `kontingen`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_kontingen_territory` (`territory_id`);

--
-- Indeks untuk tabel `kontingen_identitas`
--
ALTER TABLE `kontingen_identitas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kontingen_id` (`kontingen_id`);

--
-- Indeks untuk tabel `master_atlet`
--
ALTER TABLE `master_atlet`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nisn` (`nisn`),
  ADD KEY `kontingen_id` (`kontingen_id`);

--
-- Indeks untuk tabel `master_cabor`
--
ALTER TABLE `master_cabor`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `master_nomor`
--
ALTER TABLE `master_nomor`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cabor` (`cabor_id`),
  ADD KEY `idx_kelamin` (`jenis_kelamin`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indeks untuk tabel `master_official`
--
ALTER TABLE `master_official`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nik` (`nik`),
  ADD KEY `kontingen_id` (`kontingen_id`);

--
-- Indeks untuk tabel `master_pelatih`
--
ALTER TABLE `master_pelatih`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nik` (`nik`),
  ADD KEY `kontingen_id` (`kontingen_id`);

--
-- Indeks untuk tabel `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_modules_code` (`code`),
  ADD UNIQUE KEY `idx_modules_name` (`name`);

--
-- Indeks untuk tabel `pengaturan_tahap`
--
ALTER TABLE `pengaturan_tahap`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_tahap` (`tahap`);

--
-- Indeks untuk tabel `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_permissions_name` (`name`),
  ADD KEY `fk_permissions_modules` (`module_id`);

--
-- Indeks untuk tabel `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indeks untuk tabel `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indeks untuk tabel `territories`
--
ALTER TABLE `territories`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `trx_kontingen_cabor`
--
ALTER TABLE `trx_kontingen_cabor`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_kontingen_cabor` (`kontingen_id`,`cabor_id`),
  ADD KEY `cabor_id` (`cabor_id`);

--
-- Indeks untuk tabel `trx_kontingen_nomor`
--
ALTER TABLE `trx_kontingen_nomor`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_kontingen_nomor` (`kontingen_id`,`nomor_id`),
  ADD KEY `nomor_id` (`nomor_id`);

--
-- Indeks untuk tabel `trx_pendaftaran_atlet`
--
ALTER TABLE `trx_pendaftaran_atlet`
  ADD PRIMARY KEY (`id`),
  ADD KEY `atlet_id` (`atlet_id`),
  ADD KEY `cabor_id` (`cabor_id`),
  ADD KEY `nomor_id` (`nomor_id`);

--
-- Indeks untuk tabel `trx_pendaftaran_official`
--
ALTER TABLE `trx_pendaftaran_official`
  ADD PRIMARY KEY (`id`),
  ADD KEY `official_id` (`official_id`);

--
-- Indeks untuk tabel `trx_pendaftaran_pelatih`
--
ALTER TABLE `trx_pendaftaran_pelatih`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cabor_id` (`cabor_id`),
  ADD KEY `pelatih_id` (`pelatih_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indeks untuk tabel `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `role_id` (`role_id`);

--
-- Indeks untuk tabel `user_territories`
--
ALTER TABLE `user_territories`
  ADD PRIMARY KEY (`user_id`,`territory_id`),
  ADD KEY `fk_user_territory` (`territory_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `kontingen`
--
ALTER TABLE `kontingen`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `kontingen_identitas`
--
ALTER TABLE `kontingen_identitas`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT untuk tabel `master_atlet`
--
ALTER TABLE `master_atlet`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `master_cabor`
--
ALTER TABLE `master_cabor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT untuk tabel `master_nomor`
--
ALTER TABLE `master_nomor`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=168;

--
-- AUTO_INCREMENT untuk tabel `master_official`
--
ALTER TABLE `master_official`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `master_pelatih`
--
ALTER TABLE `master_pelatih`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `modules`
--
ALTER TABLE `modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT untuk tabel `pengaturan_tahap`
--
ALTER TABLE `pengaturan_tahap`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT untuk tabel `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `territories`
--
ALTER TABLE `territories`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `trx_kontingen_cabor`
--
ALTER TABLE `trx_kontingen_cabor`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `trx_kontingen_nomor`
--
ALTER TABLE `trx_kontingen_nomor`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT untuk tabel `trx_pendaftaran_atlet`
--
ALTER TABLE `trx_pendaftaran_atlet`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT untuk tabel `trx_pendaftaran_official`
--
ALTER TABLE `trx_pendaftaran_official`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `trx_pendaftaran_pelatih`
--
ALTER TABLE `trx_pendaftaran_pelatih`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `kontingen`
--
ALTER TABLE `kontingen`
  ADD CONSTRAINT `fk_kontingen_territory` FOREIGN KEY (`territory_id`) REFERENCES `territories` (`id`) ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `kontingen_identitas`
--
ALTER TABLE `kontingen_identitas`
  ADD CONSTRAINT `fk_identitas_kontingen` FOREIGN KEY (`kontingen_id`) REFERENCES `kontingen` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `master_atlet`
--
ALTER TABLE `master_atlet`
  ADD CONSTRAINT `master_atlet_ibfk_1` FOREIGN KEY (`kontingen_id`) REFERENCES `kontingen` (`id`);

--
-- Ketidakleluasaan untuk tabel `master_nomor`
--
ALTER TABLE `master_nomor`
  ADD CONSTRAINT `master_nomor_ibfk_1` FOREIGN KEY (`cabor_id`) REFERENCES `master_cabor` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `master_official`
--
ALTER TABLE `master_official`
  ADD CONSTRAINT `master_official_ibfk_1` FOREIGN KEY (`kontingen_id`) REFERENCES `kontingen` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `master_pelatih`
--
ALTER TABLE `master_pelatih`
  ADD CONSTRAINT `master_pelatih_ibfk_1` FOREIGN KEY (`kontingen_id`) REFERENCES `kontingen` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `permissions`
--
ALTER TABLE `permissions`
  ADD CONSTRAINT `fk_permissions_modules` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `trx_kontingen_cabor`
--
ALTER TABLE `trx_kontingen_cabor`
  ADD CONSTRAINT `trx_kontingen_cabor_ibfk_1` FOREIGN KEY (`kontingen_id`) REFERENCES `kontingen` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `trx_kontingen_cabor_ibfk_2` FOREIGN KEY (`cabor_id`) REFERENCES `master_cabor` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `trx_kontingen_nomor`
--
ALTER TABLE `trx_kontingen_nomor`
  ADD CONSTRAINT `trx_kontingen_nomor_ibfk_1` FOREIGN KEY (`kontingen_id`) REFERENCES `kontingen` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `trx_kontingen_nomor_ibfk_2` FOREIGN KEY (`nomor_id`) REFERENCES `master_nomor` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `trx_pendaftaran_atlet`
--
ALTER TABLE `trx_pendaftaran_atlet`
  ADD CONSTRAINT `trx_pendaftaran_atlet_ibfk_1` FOREIGN KEY (`atlet_id`) REFERENCES `master_atlet` (`id`),
  ADD CONSTRAINT `trx_pendaftaran_atlet_ibfk_2` FOREIGN KEY (`cabor_id`) REFERENCES `master_cabor` (`id`),
  ADD CONSTRAINT `trx_pendaftaran_atlet_ibfk_3` FOREIGN KEY (`nomor_id`) REFERENCES `master_nomor` (`id`);

--
-- Ketidakleluasaan untuk tabel `trx_pendaftaran_official`
--
ALTER TABLE `trx_pendaftaran_official`
  ADD CONSTRAINT `trx_pendaftaran_official_ibfk_1` FOREIGN KEY (`official_id`) REFERENCES `master_official` (`id`);

--
-- Ketidakleluasaan untuk tabel `trx_pendaftaran_pelatih`
--
ALTER TABLE `trx_pendaftaran_pelatih`
  ADD CONSTRAINT `trx_pendaftaran_pelatih_ibfk_1` FOREIGN KEY (`cabor_id`) REFERENCES `master_cabor` (`id`),
  ADD CONSTRAINT `trx_pendaftaran_pelatih_ibfk_2` FOREIGN KEY (`pelatih_id`) REFERENCES `master_pelatih` (`id`);

--
-- Ketidakleluasaan untuk tabel `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `user_territories`
--
ALTER TABLE `user_territories`
  ADD CONSTRAINT `fk_user_territory` FOREIGN KEY (`territory_id`) REFERENCES `territories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_territories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
