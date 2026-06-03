import api from "../../lib/api";

/* =========================================================
   USERS
========================================================= */
export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  avatar: string | null;
  created_at: string;
  // updated_at tidak ada di tabel users
}

export interface UserPayload {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
}

export interface UserListResponse  { success: boolean; message: string; data: User[] }
export interface UserSingleResponse{ success: boolean; message: string; data: User }

// GET /admin/users/:id/roles → returns array of number (role IDs)
// GET /admin/users/:id/territories → returns array of number (territory IDs)
export interface UserRoleIdsResponse      { success: boolean; message: string; data: number[] }
export interface UserTerritoryIdsResponse { success: boolean; message: string; data: number[] }

export const userService = {
  getAll:          (): Promise<UserListResponse>        => api.get("/admin/users").then(r => r.data),
  getById:         (id: number)                         => api.get(`/admin/users/${id}`).then(r => r.data),
  create:          (p: UserPayload)                     => api.post("/admin/users", p).then(r => r.data),
  update:          (id: number, p: Partial<UserPayload>)=> api.put(`/admin/users/${id}`, p).then(r => r.data),
  delete:          (id: number)                         => api.delete(`/admin/users/${id}`).then(r => r.data),
  updateStatus:    (id: number, is_active: boolean)     => api.put(`/admin/users/${id}/status`, { is_active }).then(r => r.data),
  updatePassword:  (id: number, password: string)       => api.put(`/admin/users/${id}/password`, { password }).then(r => r.data),
  // Returns array of role IDs (number[])
  getRoleIds:      (userId: number): Promise<UserRoleIdsResponse>      => api.get(`/admin/users/${userId}/roles`).then(r => r.data),
  assignRole:      (userId: number, roleId: number)     => api.post(`/admin/users/${userId}/roles/${roleId}`).then(r => r.data),
  removeRole:      (userId: number, roleId: number)     => api.delete(`/admin/users/${userId}/roles/${roleId}`).then(r => r.data),
  // Returns array of territory IDs (number[])
  getTerritoryIds: (userId: number): Promise<UserTerritoryIdsResponse> => api.get(`/admin/users/${userId}/territories`).then(r => r.data),
  assignTerritory: (userId: number, tId: number)        => api.post(`/admin/users/${userId}/territories/${tId}`).then(r => r.data),
  removeTerritory: (userId: number, tId: number)        => api.delete(`/admin/users/${userId}/territories/${tId}`).then(r => r.data),
};

/* =========================================================
   ROLES
========================================================= */
export interface Role {
  id: number;
  name: string;
  description: string;
  // roles tidak punya created_at / updated_at
}

export interface RolePayload {
  name: string;
  description?: string;
}

export interface RoleListResponse  { success: boolean; message: string; data: Role[] }
export interface RoleSingleResponse{ success: boolean; message: string; data: Role }

// GET /admin/roles/:id/permissions → returns array of number (permission IDs)
export interface RolePermissionIdsResponse { success: boolean; message: string; data: number[] }

export const roleService = {
  getAll:           (): Promise<RoleListResponse>         => api.get("/admin/roles").then(r => r.data),
  getById:          (id: number)                          => api.get(`/admin/roles/${id}`).then(r => r.data),
  create:           (p: RolePayload)                      => api.post("/admin/roles", p).then(r => r.data),
  update:           (id: number, p: Partial<RolePayload>) => api.put(`/admin/roles/${id}`, p).then(r => r.data),
  delete:           (id: number)                          => api.delete(`/admin/roles/${id}`).then(r => r.data),
  // Returns array of permission IDs (number[])
  getPermissionIds: (id: number): Promise<RolePermissionIdsResponse> => api.get(`/admin/roles/${id}/permissions`).then(r => r.data),
  assignPermission: (roleId: number, permId: number)      => api.post(`/admin/roles/${roleId}/permissions/${permId}`).then(r => r.data),
  removePermission: (roleId: number, permId: number)      => api.delete(`/admin/roles/${roleId}/permissions/${permId}`).then(r => r.data),
};

/* =========================================================
   TERRITORIES
========================================================= */
export interface Territory {
  id: number;
  name: string;
  type: "PROVINSI" | "KABUPATEN" | "KOTA";
  // territories tidak punya created_at / updated_at
}

export interface TerritoryPayload {
  name: string;
  type: "PROVINSI" | "KABUPATEN" | "KOTA";
}

export interface TerritoryListResponse  { success: boolean; message: string; data: Territory[] }
export interface TerritorySingleResponse{ success: boolean; message: string; data: Territory }

export const territoryService = {
  getAll:  (): Promise<TerritoryListResponse>        => api.get("/admin/territories").then(r => r.data),
  getById: (id: number)                              => api.get(`/admin/territories/${id}`).then(r => r.data),
  create:  (p: TerritoryPayload)                     => api.post("/admin/territories", p).then(r => r.data),
  update:  (id: number, p: Partial<TerritoryPayload>)=> api.put(`/admin/territories/${id}`, p).then(r => r.data),
  delete:  (id: number)                              => api.delete(`/admin/territories/${id}`).then(r => r.data),
};

/* =========================================================
   MODULES
========================================================= */
export interface Module {
  id: number;
  name: string;
  label: string;
  code: string;
  url: string | null;
  created_at: string;
  updated_at: string;
  // modules punya created_at dan updated_at
}

export interface ModulePayload {
  name: string;
  label: string;
  code: string;
  url?: string;
}

export interface ModuleListResponse  { success: boolean; message: string; data: Module[] }
export interface ModuleSingleResponse{ success: boolean; message: string; data: Module }

export const moduleService = {
  getAll:  (): Promise<ModuleListResponse>        => api.get("/admin/modules").then(r => r.data),
  getById: (id: number)                           => api.get(`/admin/modules/${id}`).then(r => r.data),
  create:  (p: ModulePayload)                     => api.post("/admin/modules", p).then(r => r.data),
  update:  (id: number, p: Partial<ModulePayload>)=> api.put(`/admin/modules/${id}`, p).then(r => r.data),
  delete:  (id: number)                           => api.delete(`/admin/modules/${id}`).then(r => r.data),
};

/* =========================================================
   PERMISSIONS
========================================================= */
export interface Permission {
  id: number;
  module_id: number | null;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
  module?: Module;
}

export interface PermissionPayload {
  module_id?: number | null;
  name: string;
  description?: string;
}

export interface PermissionListResponse  { success: boolean; message: string; data: Permission[] }
export interface PermissionSingleResponse{ success: boolean; message: string; data: Permission }

export const permissionService = {
  getAll:      (): Promise<PermissionListResponse>        => api.get("/admin/permissions").then(r => r.data),
  getById:     (id: number)                               => api.get(`/admin/permissions/${id}`).then(r => r.data),
  create:      (p: PermissionPayload)                     => api.post("/admin/permissions", p).then(r => r.data),
  update:      (id: number, p: Partial<PermissionPayload>)=> api.put(`/admin/permissions/${id}`, p).then(r => r.data),
  delete:      (id: number)                               => api.delete(`/admin/permissions/${id}`).then(r => r.data),
  getByModule: (moduleId: number)                         => api.get(`/admin/permissions/module/${moduleId}`).then(r => r.data),
  getByRole:   (roleId: number)                           => api.get(`/admin/permissions/role/${roleId}`).then(r => r.data),
};

/* =========================================================
   MASTER CABOR
========================================================= */
export interface Cabor {
  id: number;
  nama: string;
  max_putra: number;
  max_putri: number;
  max_pelatih: number;
  is_active: boolean;
  created_at: string;
  // master_cabor tidak punya updated_at
}

export interface CaborPayload {
  nama: string;
  max_putra: number;
  max_putri: number;
  max_pelatih: number;
  // is_active tidak dikirim saat create (backend default true)
  // DELETE = soft delete (set is_active = false)
}

export interface CaborListResponse  { success: boolean; message: string; data: Cabor[] }
export interface CaborSingleResponse{ success: boolean; message: string; data: Cabor }

export const caborService = {
  // GET /admin/master/cabor — returns ALL cabor (aktif + nonaktif)
  // Frontend filter sendiri berdasarkan is_active
  getAll:  (): Promise<CaborListResponse>        => api.get("/admin/master/cabor").then(r => r.data),
  getById: (id: number)                          => api.get(`/admin/master/cabor/${id}`).then(r => r.data),
  create:  (p: CaborPayload)                     => api.post("/admin/master/cabor", p).then(r => r.data),
  update:  (id: number, p: Partial<CaborPayload>)=> api.put(`/admin/master/cabor/${id}`, p).then(r => r.data),
  // DELETE = hard delete (hapus permanen dari DB)
  delete:  (id: number)                          => api.delete(`/admin/master/cabor/${id}`).then(r => r.data),
};

/* =========================================================
   MASTER NOMOR
========================================================= */
export interface Nomor {
  id: number;       // lowercase id (bukan ID)
  nama: string;
  cabor_id: number;
  jenis_kelamin: "PUTRA" | "PUTRI" | "CAMPURAN";
  tipe: "INDIVIDU" | "BEREGU";
  is_active: boolean;
  created_at: string;
  // master_nomor tidak punya updated_at
  cabor?: { id: number; nama: string; max_putra: number; max_putri: number; max_pelatih: number; is_active: boolean; created_at: string };
}

export interface NomorPayload {
  nama: string;
  cabor_id: number;
  jenis_kelamin: "PUTRA" | "PUTRI" | "CAMPURAN";
  tipe: "INDIVIDU" | "BEREGU";
}

export interface NomorListResponse  { success: boolean; message: string; data: Nomor[] }
export interface NomorSingleResponse{ success: boolean; message: string; data: Nomor }

export const nomorService = {
  getAll:     (): Promise<NomorListResponse>        => api.get("/admin/master/nomor").then(r => r.data),
  getById:    (id: number)                          => api.get(`/admin/master/nomor/${id}`).then(r => r.data),
  getByCabor: (caborId: number)                     => api.get(`/admin/master/nomor/cabor/${caborId}`).then(r => r.data),
  create:     (p: NomorPayload)                     => api.post("/admin/master/nomor", p).then(r => r.data),
  update:     (id: number, p: Partial<NomorPayload>)=> api.put(`/admin/master/nomor/${id}`, p).then(r => r.data),
  // DELETE = hard delete (hapus permanen dari DB)
  delete:     (id: number)                          => api.delete(`/admin/master/nomor/${id}`).then(r => r.data),
};
