# Role Permission Guide — Frontend Implementation

> **Target project:** `C:\PROJECT POPDA\frontend`  
> **Stack:** React + TypeScript + Vite  
> **File yang dimodifikasi:** AppRoute.tsx, AuthContext.tsx, ProtectedRoute.tsx, auth-helpers.ts, AppSidebar.tsx

---

## 1. Kondisi Saat Ini (Audit)

| File | Lokasi | Status |
|---|---|---|
| Router | `src/routes/AppRoute.tsx` | ✅ Ada — belum ada role guard per route |
| Auth Store | `src/context/AuthContext.tsx` | ✅ Ada — belum simpan permissions |
| Route Guard | `src/modules/Auth/components/ProtectedRoute.tsx` | ⚠️ Ada — hanya cek token, belum cek permission |
| Permission Helper | `src/utils/auth-helpers.ts` | ⚠️ Ada fungsi `hasPermission()` tapi belum dipakai di routing |
| Sidebar | `src/modules/Dashboard/components/AppSidebar.tsx` | ⚠️ Sudah filter SETTINGS untuk SUPERADMIN, belum pakai permission per item |
| API Client | `src/shared/ApiClient.ts` | ✅ Ada — sudah kirim Bearer token |

**Gap utama:** `ProtectedRoute.tsx` tidak terima `requiredPermission` prop. Semua user yang login bisa akses `/admin/*` jika tahu URL-nya.

---

## 2. Perubahan yang Diperlukan

### File 1: `src/utils/auth-helpers.ts`

Tambahkan fungsi helper baru. File ini sudah ada `hasPermission()` tapi belum cukup — perlu fungsi `can()` yang terintegrasi dengan store permission.

```typescript
// src/utils/auth-helpers.ts

// Role hierarchy yang sudah ada — pertahankan
export const ROLE_HIERARCHY = {
  STAFF_LAPANGAN: 1,
  ADMIN: 2,
  SUPERADMIN: 3,
}

// Fungsi baru — cek satu permission
export function can(permissions: string[], permission: string): boolean {
  // SUPERADMIN selalu bisa
  if (permissions.includes('*')) return true
  return permissions.includes(permission)
}

// Fungsi baru — cek minimal satu dari banyak permission
export function canAny(permissions: string[], permissionList: string[]): boolean {
  return permissionList.some(p => can(permissions, p))
}

// Mapping halaman → permission yang dibutuhkan untuk masuk
export const ROUTE_PERMISSIONS: Record<string, string> = {
  '/dashboard':           'dashboard.read',
  '/admin/cabor':         'cabor.read',
  '/admin/nomor':         'nomor.read',
  '/atlet-by-sports':     'trx_kontingen_cabor.read',
  '/atlet-by-numbers':    'trx_kontingen_nomor.read',
  '/atlet-by-names':      'trx_pendaftaran_atlet.read',
  '/admin/users':         'user.read',
  '/admin/roles':         'role.read',
  '/admin/territories':   'territory.read',
  '/admin/permissions':   'permission.read',
  '/admin/modules':       'permission.read',  // pakai permission yg sama
}
```

---

### File 2: `src/context/AuthContext.tsx`

Tambahkan state `permissions` dan fungsi `can()` ke context.

```typescript
// src/context/AuthContext.tsx

// Tambahkan ke type AuthContextType
type AuthContextType = {
  user: User | null
  token: string | null
  permissions: string[]          // ← TAMBAH INI
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  can: (permission: string) => boolean  // ← TAMBAH INI
}

// Di dalam AuthProvider, tambahkan state:
const [permissions, setPermissions] = useState<string[]>(() => {
  const saved = localStorage.getItem('permissions')
  return saved ? JSON.parse(saved) : []
})

// Update fungsi login — tambah fetch permissions setelah dapat token:
async function login(email: string, password: string) {
  const res = await fetch('http://localhost:8000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()

  if (!data.success) throw new Error(data.message)

  const { token, user, role } = data.data

  // Simpan token dan user ke localStorage (sudah ada)
  localStorage.setItem('token', token)
  localStorage.setItem('user_data', JSON.stringify(user))

  // ─── BARU: Fetch dan simpan permissions ───
  let userPermissions: string[] = []

  if (role === 'SUPERADMIN') {
    // Superadmin bypass semua — wildcard
    userPermissions = ['*']
  } else {
    // Ambil role_id dulu dari user roles
    const rolesRes = await fetch(`http://localhost:8000/admin/users/${user.id}/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const rolesData = await rolesRes.json()
    const roleIds: number[] = rolesData.data // [2] atau [3]

    if (roleIds.length > 0) {
      // Ambil permission objects dari role pertama
      const permRes = await fetch(
        `http://localhost:8000/admin/permissions/role/${roleIds[0]}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const permData = await permRes.json()
      // Simpan sebagai array of string name
      userPermissions = permData.data.map((p: { name: string }) => p.name)
      // contoh: ["cabor.read", "atlet.read", "verifikasi.read"]
    }
  }

  localStorage.setItem('permissions', JSON.stringify(userPermissions))
  setPermissions(userPermissions)
  setToken(token)
  setUser(user)
}

// Update fungsi logout — bersihkan permissions:
function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user_data')
  localStorage.removeItem('permissions')   // ← TAMBAH INI
  setToken(null)
  setUser(null)
  setPermissions([])                        // ← TAMBAH INI
}

// Helper can() untuk dipakai di komponen
function can(permission: string): boolean {
  if (permissions.includes('*')) return true
  return permissions.includes(permission)
}

// Sertakan permissions dan can di value context:
<AuthContext.Provider value={{
  user, token, permissions,
  login, logout, isAuthenticated,
  can                // ← TAMBAH INI
}}>
```

---

### File 3: `src/modules/Auth/components/ProtectedRoute.tsx`

Update agar bisa terima prop `requiredPermission` dan redirect ke halaman 403 jika tidak punya akses.

```typescript
// src/modules/Auth/components/ProtectedRoute.tsx

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { ROUTE_PERMISSIONS } from '../../../utils/auth-helpers'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string  // ← TAMBAH prop opsional ini
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, can } = useAuth()
  const location = useLocation()

  // Cek autentikasi (sudah ada sebelumnya)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Cek permission — gunakan prop jika ada, fallback ke ROUTE_PERMISSIONS map
  const permissionToCheck = requiredPermission ?? ROUTE_PERMISSIONS[location.pathname]

  if (permissionToCheck && !can(permissionToCheck)) {
    return <Navigate to="/403" replace />
  }

  return <>{children}</>
}
```

---

### File 4: `src/routes/AppRoute.tsx`

Tambahkan `requiredPermission` ke setiap route yang butuh akses terbatas.

```typescript
// src/routes/AppRoute.tsx

// Tambahkan halaman 403
import { ForbiddenPage } from '../modules/Auth/components/ForbiddenPage'

// Update setiap route yang butuh permission — contoh:
<Routes>
  <Route path="/login" element={<LoginPage />} />

  {/* Halaman 403 */}
  <Route path="/403" element={<ForbiddenPage />} />

  {/* Dashboard */}
  <Route path="/dashboard" element={
    <ProtectedRoute requiredPermission="dashboard.read">
      <DashboardPage />
    </ProtectedRoute>
  } />

  {/* Identitas Kontingen — tidak butuh permission khusus, hanya login */}
  <Route path="/identitas-kontingen" element={
    <ProtectedRoute>
      <IdentitasPage />
    </ProtectedRoute>
  } />

  {/* Tahap 1 */}
  <Route path="/atlet-by-sports" element={
    <ProtectedRoute requiredPermission="trx_kontingen_cabor.read">
      <AtletBySportPage />
    </ProtectedRoute>
  } />

  {/* Tahap 2 */}
  <Route path="/atlet-by-numbers" element={
    <ProtectedRoute requiredPermission="trx_kontingen_nomor.read">
      <AtletByNumberPage />
    </ProtectedRoute>
  } />

  {/* Tahap 3 */}
  <Route path="/atlet-by-names" element={
    <ProtectedRoute requiredPermission="trx_pendaftaran_atlet.read">
      <AtletByNamePage />
    </ProtectedRoute>
  } />

  {/* Admin — Master Data */}
  <Route path="/admin/cabor" element={
    <ProtectedRoute requiredPermission="cabor.read">
      <CaborPage />
    </ProtectedRoute>
  } />
  <Route path="/admin/nomor" element={
    <ProtectedRoute requiredPermission="nomor.read">
      <NomorPage />
    </ProtectedRoute>
  } />

  {/* Admin — Settings */}
  <Route path="/admin/users" element={
    <ProtectedRoute requiredPermission="user.read">
      <UsersPage />
    </ProtectedRoute>
  } />
  <Route path="/admin/roles" element={
    <ProtectedRoute requiredPermission="role.read">
      <RolesPage />
    </ProtectedRoute>
  } />
  <Route path="/admin/territories" element={
    <ProtectedRoute requiredPermission="territory.read">
      <TerritoriesPage />
    </ProtectedRoute>
  } />
  <Route path="/admin/permissions" element={
    <ProtectedRoute requiredPermission="permission.read">
      <PermissionsPage />
    </ProtectedRoute>
  } />
  <Route path="/admin/modules" element={
    <ProtectedRoute requiredPermission="permission.read">
      <ModulesPage />
    </ProtectedRoute>
  } />
</Routes>
```

---

### File 5: `src/modules/Dashboard/components/AppSidebar.tsx`

File ini sudah filter SETTINGS untuk SUPERADMIN. Update agar pakai `can()` dari context.

```typescript
// src/modules/Dashboard/components/AppSidebar.tsx

import { useAuth } from '../../../context/AuthContext'

export function AppSidebar() {
  const { user, can } = useAuth()   // ← tambah can

  // Ganti semua check role langsung dengan can()
  // Sebelum: user?.role?.name === 'SUPERADMIN'
  // Sesudah: can('user.read') dll

  const menuItems = [
    // Menu yang semua authenticated user bisa lihat
    { label: 'Beranda', path: '/dashboard', show: true },
    { label: 'Identitas Kontingen', path: '/identitas-kontingen', show: true },

    // Pendaftaran — tampilkan jika punya salah satu permission tahap
    {
      label: 'Tahap I: Entry By Sport',
      path: '/atlet-by-sports',
      show: can('trx_kontingen_cabor.read')
    },
    {
      label: 'Tahap II: Entry By Number',
      path: '/atlet-by-numbers',
      show: can('trx_kontingen_nomor.read')
    },
    {
      label: 'Tahap III: Entry By Name',
      path: '/atlet-by-names',
      show: can('trx_pendaftaran_atlet.read')
    },

    // Settings — hanya yang punya permission
    {
      label: 'Master Data',
      isGroup: true,
      show: can('cabor.read') || can('nomor.read'),
      children: [
        { label: 'Cabor', path: '/admin/cabor', show: can('cabor.read') },
        { label: 'Nomor', path: '/admin/nomor', show: can('nomor.read') },
      ]
    },
    {
      label: 'Settings',
      isGroup: true,
      show: can('user.read') || can('role.read') || can('territory.read'),
      children: [
        { label: 'Users', path: '/admin/users', show: can('user.read') },
        { label: 'Roles', path: '/admin/roles', show: can('role.read') },
        { label: 'Territories', path: '/admin/territories', show: can('territory.read') },
        { label: 'Permissions', path: '/admin/permissions', show: can('permission.read') },
        { label: 'Modules', path: '/admin/modules', show: can('permission.read') },
      ]
    }
  ]

  return (
    <aside>
      {menuItems
        .filter(item => item.show)
        .map(item => (
          item.isGroup ? (
            <SidebarGroup key={item.label} label={item.label}>
              {item.children
                ?.filter(c => c.show)
                .map(c => <SidebarItem key={c.path} {...c} />)
              }
            </SidebarGroup>
          ) : (
            <SidebarItem key={item.path} {...item} />
          )
        ))
      }
    </aside>
  )
}
```

---

### File 6 (baru): `src/modules/Auth/components/ForbiddenPage.tsx`

Buat halaman 403 yang tampil saat user tidak punya permission.

```typescript
// src/modules/Auth/components/ForbiddenPage.tsx

import { useNavigate } from 'react-router-dom'

export function ForbiddenPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold text-red-500">403</h1>
      <p className="text-xl mt-2">Akses Ditolak</p>
      <p className="text-gray-500 mt-1">
        Anda tidak memiliki permission untuk mengakses halaman ini.
      </p>
      <button
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={() => navigate('/dashboard')}
      >
        Kembali ke Dashboard
      </button>
    </div>
  )
}
```

---

## 3. Pakai `can()` di Dalam Halaman

Setelah perubahan di atas, gunakan `useAuth()` di semua halaman untuk kontrol tombol:

```typescript
// Contoh di src/modules/Admin/pages/CaborPage.tsx

import { useAuth } from '../../../context/AuthContext'

export function CaborPage() {
  const { can } = useAuth()

  return (
    <div>
      <h1>Master Cabor</h1>

      {/* Tombol tambah hanya muncul jika punya permission create */}
      {can('cabor.create') && (
        <button onClick={handleTambah}>+ Tambah Cabor</button>
      )}

      <table>
        {cabors.map(cabor => (
          <tr key={cabor.id}>
            <td>{cabor.nama}</td>
            <td>
              {can('cabor.update') && (
                <button onClick={() => handleEdit(cabor.id)}>Edit</button>
              )}
              {can('cabor.delete') && (
                <button onClick={() => handleHapus(cabor.id)}>Hapus</button>
              )}
            </td>
          </tr>
        ))}
      </table>
    </div>
  )
}
```

---

## 4. Mapping Permission per Halaman

| Path di AppRoute.tsx | Permission untuk masuk | Permission aksi tambahan |
|---|---|---|
| `/dashboard` | `dashboard.read` | — |
| `/identitas-kontingen` | *(hanya login)* | — |
| `/atlet-by-sports` | `trx_kontingen_cabor.read` | `.create`, `.update`, `.delete` |
| `/atlet-by-numbers` | `trx_kontingen_nomor.read` | `.create`, `.delete` |
| `/atlet-by-names` | `trx_pendaftaran_atlet.read` | `.create`, `.delete` |
| `/admin/cabor` | `cabor.read` | `.create`, `.update`, `.delete` |
| `/admin/nomor` | `nomor.read` | `.create`, `.update`, `.delete` |
| `/admin/users` | `user.read` | `.create`, `.update`, `.delete` |
| `/admin/roles` | `role.read` | `.create`, `.update`, `.delete` |
| `/admin/territories` | `territory.read` | `.create`, `.update`, `.delete` |
| `/admin/permissions` | `permission.read` | `.create`, `.update`, `.delete` |
| `/admin/modules` | `permission.read` | `.create`, `.update`, `.delete` |

---

## 5. Permission per Role yang Disarankan

### SUPERADMIN (role_id = 1)
Sudah punya semua permission — `permissions = ['*']` di frontend, tidak perlu fetch.

### ADMIN (role_id = 2)
```
dashboard.read
trx_kontingen_cabor.read, .create, .update, .delete
trx_kontingen_nomor.read, .create, .delete
trx_pendaftaran_atlet.read, .create, .delete
atlet.read, .create, .update, .delete
pelatih.read, .create, .update, .delete
official.read, .create, .update, .delete
kontingen.read, .update
sekolah.read
cabor.read
nomor.read
```

### STAFF_LAPANGAN (role_id = 3)
```
dashboard.read
atlet.read
pelatih.read
official.read
verifikasi.read, .approve
kontingen.read
trx_pendaftaran_atlet.read
cabor.read
nomor.read
```

---

## 6. Ringkasan Urutan Pengerjaan

```
1. src/utils/auth-helpers.ts
   → Tambah fungsi can(), canAny(), ROUTE_PERMISSIONS

2. src/context/AuthContext.tsx
   → Tambah state permissions + fetch saat login
   → Tambah fungsi can() ke context value
   → Bersihkan permissions saat logout

3. src/modules/Auth/components/ForbiddenPage.tsx (baru)
   → Buat halaman 403

4. src/modules/Auth/components/ProtectedRoute.tsx
   → Tambah prop requiredPermission
   → Cek can() sebelum render children

5. src/routes/AppRoute.tsx
   → Tambah Route /403
   → Tambah requiredPermission ke semua Route yang butuh

6. src/modules/Dashboard/components/AppSidebar.tsx
   → Ganti check role langsung dengan can()
   → Filter item menu berdasarkan permission

7. Semua halaman (CaborPage, NomorPage, UsersPage, dll.)
   → Tambah can() check untuk kontrol tombol Tambah/Edit/Hapus
```
