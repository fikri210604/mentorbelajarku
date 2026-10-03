# Rencana Implementasi RBAC Dinamis (Bertahap, Mudah Dulu)

**Proyek:** MentorBelajarku  
**Tujuan:** membuat role & permission benar-benar dinamis — bisa menambah role baru lalu "tinggal atur permission"-nya, dan permission tersebut benar-benar berlaku di server.  
**Dasar temuan:** `docs/SECURITY_AND_FLOW_AUDIT.md` → H-01 dan F-06.  
**Pendekatan:** bertahap, dimulai dari perbaikan paling mudah dan berisiko rendah, tanpa memutus mode demo/sintetis yang sekarang dipakai.

---

## 0. Status Implementasi

| Fase | Status | Catatan |
|---|---|---|
| Fase 0 — Quick wins role actions | **Selesai** | `role.actions.ts` fail-closed, pisah DB/sintetis, proteksi owner/is_system dari DB, validasi permission, audit log. |
| Fase 1 — Resolver terpusat | **Selesai** | `lib/permissions/resolver.ts` + re-export di `lib/permissions/index.ts`. |
| Fase 2 — Session `role_id` + permissions | **Selesai** | `lib/auth/session.ts` membawa `roleId`, `roleName`, `permissions[]`; `role_id` ditambah ke tipe `user`. |
| Fase 3 — Enforce `requirePermission` (pilot) | **Selesai (pilot)** | Guard `requirePermissionApi`/`checkPermission`; diterapkan pada roles, tutor-rates, payroll, audit-logs. |
| Fase 4 — Assign role ke user | **Selesai** | Halaman `/management/settings/users` + `assignUserRoleAction`; menyinkronkan `user.role_id` dan `user.role`, plus invalidasi cache & audit log. |
| Fase 5 — Master permission dinamis | **Selesai** | Tabel `permissions` menjadi katalog; halaman `/management/settings/permissions` + `savePermissionAction`/`deletePermissionAction`; matriks role memakai katalog DB. |
| Perbaikan C-02 — auth fail-open | **Selesai** | `getCurrentUser()` kini `null` bila tidak ada session valid (tidak lagi fallback owner). Mode sintetis dibatasi flag `SYNTHETIC_AUTH_ENABLED` (default nonaktif di produksi). |

**Caveat Fase 5:** permission baru bisa ditambah dan ditempelkan ke role tanpa deploy, dan `session.permissions` akan membawanya. Namun permission tersebut baru benar-benar memblokir akses jika ada titik enforcement di server (`requirePermissionApi`/`checkPermission`/`requirePermissionUser`) yang memeriksanya. Permission tanpa titik enforcement hanya bersifat informatif.

**Caveat autentikasi:** `getCurrentUser()` sekarang fail-closed, tetapi pemetaan identitas Better Auth → role masih bergantung pada query `user.role_id`. Pastikan seed/migrasi mengisi `role_id` untuk user produksi agar permission teresolusi dari DB, bukan fallback.

---

## 1. Kondisi Saat Ini (Ringkas)

| Komponen | Status | Bukti |
|---|---|---|
| CRUD role | Ada, bisa tambah/edit/hapus | `features/management/settings/actions/role.actions.ts:48,140` |
| Set permission ke role | Ada, tersimpan ke `role_permissions` | `role.actions.ts:180` |
| UI matriks permission | Ada | `features/management/settings/components/RolesManagementPage.tsx` |
| Enforcement permission di server | **Belum ada** | Cek role hardcoded `=== 'management' \|\| 'admin'` di banyak file |
| `role_id` dibaca saat session | **Belum** | `lib/auth/session.ts:150,184` (subrole selalu `owner`) |
| Assign role ke user | **Belum ada UI** | Tidak ditemukan update `user.role_id` |
| Tipe role/permission | Masih tertutup (union) | `types/database.types.ts:9`; `types/auth.ts:5,28` |
| Permission hanya dipakai di | Sidebar (UI saja) | `components/management/ManagementSidebar.tsx:104` |

Catatan penting: kolom `user.role_id` dan tabel `roles`, `permissions`, `role_permissions` **sudah ada** di `supabase/migrations/0001_initial_schema.sql:77-113,123-138`. Jadi sebagian besar fase awal **tidak memerlukan migration baru**.

---

## 2. Prinsip Pengerjaan

1. **Satu sumber kebenaran:** `roles`, `permissions`, `role_permissions`, dan `user.role_id` di database.
2. **Server adalah batas otorisasi.** UI hanya mencerminkan; server yang memutuskan (AGENTS.md Rule 3 & 34).
3. **Jangan merusak mode demo.** Selama Supabase belum dikonfigurasi, gunakan fallback `SYNTHETIC_ROLES` / `ROLE_PERMISSIONS` yang sudah ada.
4. **Kompatibel mundur.** Pertahankan string `user.role` (`management`/`admin`/`tutor`/`finance`) agar kode lama tetap jalan, sambil menambah `role_id`.
5. **Fail closed.** Jika permission tidak diketahui/resolusi gagal, tolak akses, jangan izinkan.
6. **Jangan menebak aturan bisnis.** Perubahan payroll/attendance tetap mengikuti `docs/SECURITY_AND_FLOW_AUDIT.md` bagian keputusan terbuka.

---

## 3. Target Arsitektur

```text
user.role_id ──► roles (name)
                   │
                   └──► role_permissions ──► permissions (id)
                                              │
                                              ▼
                       getCurrentUser() → session.permissions[]
                                              │
                                              ▼
                       requirePermission() di server action / route handler
```

- `user.role_id` → role dinamis (bisa custom seperti `curriculum`, `hrd`, `finance`, atau role baru).
- `user.role` tetap sebagai string kompatibel untuk redirect portal (`management`/`tutor`).
- Session membawa `permissions[]` hasil query, bukan hardcoded.
- Route/action memanggil `requirePermission()`.

---

## 4. Fase 0 — Quick Wins Tanpa Migration (Paling Mudah)

**Target:** memperbaiki bug pada pengelolaan role agar data tidak bohong. Tidak mengubah model otorisasi.

**File utama:** `features/management/settings/actions/role.actions.ts`, `features/management/settings/schemas/role.schema.ts`.

### Langkah

1. **Hentikan silent success.**
   Saat `isSupabaseConfigured()`, jika `insert`/`update`/`delete` gagal, kembalikan `{ success: false, message }`. Jangan `console.warn` lalu tetap anggap sukses (`role.actions.ts:78-82,95-99,159-161`).

2. **Pisahkan jalur DB dan synthetic.**
   Mutasi hanya menyentuh `SYNTHETIC_ROLES` ketika `!isSupabaseConfigured()`. Saat DB aktif, jangan menulis ke array in-memory (`role.actions.ts:117-126,167-170,220-224`).

3. **Proteksi `is_system` dan `owner` dari database.**
   Ambil `is_system` dan `name` dari DB berdasarkan `id`, bukan dari `SYNTHETIC_ROLES` (`role.actions.ts:150-153,193-196`). Tolak hapus role sistem dan tolak kurangi permission role `owner`.

4. **Jadikan `updateRolePermissionsAction` konsisten.**
   - Validasi setiap `permission_id` terhadap `SYSTEM_PERMISSIONS` (`config/permissions.ts:3`) sebelum menulis.
   - Hapus + insert harus atomik. Bila Supabase mendukung, buat RPC `replace_role_permissions(role_id, permission_ids[])`; minimal, jika insert gagal, kembalikan `success: false` dan jangan klaim berhasil (`role.actions.ts:202-213`).

5. **Fallback read hanya saat demo.**
   `getRolesWithPermissionsAction` hanya boleh fallback ke `SYNTHETIC_ROLES` bila `!isSupabaseConfigured()`. Jika DB aktif tapi kosong/error, tampilkan error nyata (`role.actions.ts:17-42`).

6. **Audit log untuk mutasi role.**
   Catat `ROLE_CREATED`, `ROLE_UPDATED`, `ROLE_DELETED`, `ROLE_PERMISSIONS_UPDATED` ke `audit_logs` (AGENTS.md Rule 16).

### Acceptance Test Fase 0

- Matikan/putus DB saat mode DB aktif → aksi mengembalikan gagal, tidak ada perubahan state palsu.
- Role `owner` tidak bisa dihapus atau dikurangi permission-nya.
- `permission_id` ilegal ditolak sebelum menulis.
- Setiap mutasi role menghasilkan 1 baris `audit_logs`.

**Estimasi:** paling kecil, 1 file + schema. Risiko rendah.

---

## 5. Fase 1 — Utility Resolver Terpusat (Mudah, Belum Mengubah Perilaku)

**Target:** menyediakan satu API resolusi permission yang dipakai UI maupun server, tanpa mengubah otorisasi yang ada dulu.

**File baru:** `lib/permissions/resolver.ts` (atau tambahkan ke `lib/permissions/index.ts`).

### Langkah

1. Buat fungsi murni:
   ```ts
   // Ilustrasi
   resolvePermissionsForRoleName(roleName: string): Permission[]
   roleNameHasPermission(roleName: string, permission: Permission): boolean
   ```
   - Cek ke `SYNTHETIC_ROLES`/`SUBROLE_PERMISSIONS` sebagai default untuk role sistem.
   - Untuk role custom, terima daftar permission yang di-inject (belum query di sini).

2. Tambahkan helper `hasAnyPermission(perms, required)` dan `isOwnerLike(roleName)`.

3. Tambahkan unit test murni (tanpa DB) untuk fungsi-fungsi ini.

### Acceptance Test Fase 1

- Fungsi mengembalikan permission yang benar untuk `owner`, `curriculum`, `hrd`, `finance`, `tutor`.
- Role tidak dikenal mengembalikan `[]` (fail closed).

**Estimasi:** kecil, murni fungsi. Risiko sangat rendah.

---

## 6. Fase 2 — Sambungkan Session ke `role_id` (Sedang, Kunci Dinamis)

**Target:** session membawa `roleId`, `roleName`, dan `permissions[]` yang berasal dari database.

**File utama:** `lib/auth/session.ts`, `types/auth.ts`, `types/database.types.ts`.

**Catatan:** kolom `role_id` sudah ada di migration, tetapi **belum ada di tipe** `Database` (`types/database.types.ts:33-53`). Perlu regenerate tipe dari DB atau tambahkan manual.

### Langkah

1. **Tambahkan `role_id` ke tipe `user`** di `types/database.types.ts` (Row/Insert/Update) dan relasi ke `roles`.

2. **Perluas `CurrentUserSession`** (`lib/auth/session.ts:11-33`):
   ```ts
   roleId: string | null;
   roleName: string;          // 'owner' | 'curriculum' | ... | 'tutor'
   permissions: Permission[];
   ```

3. **Query role saat resolusi user produksi** (`lib/auth/session.ts:145-196`):
   - Ambil `role_id` dari tabel `user`.
   - Ambil `roles.name` dan `role_permissions(permission_id)`.
   - Susun `roleName` dan `permissions`.
   - Fallback: gunakan `string` `user.role` → `ROLE_PERMISSIONS` bila `role_id` null.

4. **Perbaiki `subrole` yang selalu `owner`** (`lib/auth/session.ts:184`):
   - Turunkan `subrole` dari `roleName` (`owner`/`curriculum`/`hrd`/`finance`/`general`), bukan hardcode.
   - Jika role custom di luar daftar, biarkan `general` atau `null` sesuai keputusan.

5. **Synthetic mode:** resolusi dari `SYNTHETIC_USERS` + `SYNTHETIC_ROLES` (sudah ada), tetap seperti sekarang.

6. **Jangan ubah pemanggil dulu.** Cukup session mengembalikan field baru; UI bisa mulai memakainya pelan-pelan.

### Acceptance Test Fase 2

- User dengan `role_id` = role custom mendapat permission sesuai `role_permissions`.
- User dengan `role_id` null tetap mendapat permission dari `user.role`.
- Akun demo/sintetis tetap berfungsi seperti sebelumnya.
- `session.subrole` tidak lagi selalu `owner` untuk role HRD/finance.

**Estimasi:** sedang. Perlu regenerate tipe DB. Risiko sedang pada session.

---

## 7. Fase 3 — Enforce `requirePermission` di Server (Sedang, Pilot Bertahap)

**Target:** permission benar-benar menolak akses server. Kerjakan bertahap, mulai dari modul paling sensitif.

**File utama:** `lib/auth/session.ts`, `lib/auth/authorization.ts`, lalu route/action pilot.

### Langkah

1. **Tambah helper:**
   ```ts
   // Server Component / Server Action
   requirePermissionUser(permission: Permission): Promise<CurrentUserSession>
   // Route Handler
   apiRequirePermission(permission: Permission): Promise<NextResponse | null>
   ```
   - `owner` / role yang punya permission → lolos.
   - Tidak punya → redirect (`/management/dashboard?error=forbidden`) atau `403` JSON.

2. **Pilot di 4 area sensitif** (ganti cek hardcoded):
   | Area | Permission | Lokasi cek saat ini |
   |---|---|---|
   | Manajemen role | `roles:manage` | `role.actions.ts:55,146,189` |
   | Tarif tutor | `rates:manage` | `app/api/v1/management/tutor-rates/route.ts:20` |
   | Payroll | `payroll:generate` / `payroll:finalize` / `payroll:pay` | `app/api/v1/management/payroll/**` |
   | Audit log | `audit:read` | `app/api/v1/management/audit-logs/route.ts:7` |

3. **Ganti `ManagementSidebar`** agar memfilter menu dari `session.permissions` (bukan `canSubroleAccessRoute` hardcoded). Ini opsional, tapi menghilangkan duplikasi aturan.

4. **Pertahankan `user.role` untuk portal.** Redirect management/tutor tetap memakai `role`, bukan permission.

5. **Tambahkan test otorisasi** untuk tiap pilot: role tanpa permission → 403; role dengan permission → lolos.

### Acceptance Test Fase 3

- HRD/finance/custom role hanya bisa membuka aksi sesuai permission-nya.
- Menghapus permission `rates:manage` dari sebuah role langsung memblokir API tarif.
- `owner` tetap lolos semua.
- UI hiding tidak lagi menjadi satu-satunya pembatas.

**Estimasi:** sedang. Kerjakan per modul agar tidak sekaligus.

---

## 8. Fase 4 — Assign Role ke User (Sedang)

**Target:** role baru bisa ditempelkan ke user dari UI.

**File baru:** action `assignUserRoleAction` + komponen UI di detail tutor/staf.

### Langkah

1. Action `assignUserRoleAction({ userId, roleId })` dengan `requirePermissionUser('roles:manage')`.
2. Dalam satu transaksi:
   - `user.role_id = roleId`
   - `user.role = roles.name` (string kompatibel untuk portal)
3. Audit log `USER_ROLE_ASSIGNED` dengan before/after.
4. UI di halaman detail tutor/staf: dropdown role + tombol simpan.
5. Invalidasi cache session user terkait (lihat `invalidateUserSessionCache` di `lib/auth/session.ts:42`).

### Acceptance Test Fase 4

- Role baru bisa di-assign ke user dan langsung berlaku setelah login ulang / invalidasi cache.
- Perubahan role tercatat di audit log.
- Tidak ada user management yang kehilangan akses owner terakhir.

**Estimasi:** sedang. Butuh UI.

---

## 9. Fase 5 — Master Permission Dinamis (Paling Berat, Kerjakan Terakhir)

**Target:** menambah permission baru tanpa mengubah kode.

**Kondisi saat ini:** `Permission` adalah union hardcoded (`types/auth.ts:28-71`), `SYSTEM_PERMISSIONS` hardcoded (`config/permissions.ts:3`).

### Langkah

1. Ubah `Permission` menjadi `string` (atau branded string) dan validasi lewat DB + Zod.
2. Tambah CRUD untuk tabel `permissions`.
3. Ganti `SYSTEM_PERMISSIONS` statis menjadi query DB, dengan fallback seed.
4. Tambah migration untuk permission baru (bila perlu).
5. Pastikan setiap permission baru punya titik enforcement di server — permission tanpa enforcement tidak ada gunanya.

### Acceptance Test Fase 5

- Permission baru bisa ditambah dari UI dan langsung bisa dicentang ke role.
- Permission baru bisa ditegakkan di server tanpa deploy ulang kode.

**Estimasi:** besar. Jangan digabung dengan fase lain.

---

## 10. Urutan Commit yang Disarankan

1. `fix(rbac): role actions fail closed + audit log` (Fase 0)
2. `feat(rbac): centralized permission resolver` (Fase 1)
3. `feat(auth): resolve role_id and permissions into session` (Fase 2)
4. `feat(rbac): enforce requirePermission on sensitive modules` (Fase 3)
5. `feat(rbac): assign role to user` (Fase 4)
6. `feat(rbac): dynamic permission master` (Fase 5)

---

## 11. Risiko & Catatan Penting

- **Mode demo/sintetis harus tetap jalan.** Selalu sediakan fallback `SYNTHETIC_ROLES`/`ROLE_PERMISSIONS` selama Supabase belum dikonfigurasi.
- **Tipe DB belum punya `role_id`.** Regenerate tipe agar tidak memakai `any` (AGENTS.md Rule 28).
- **Jangan jadikan UI sebagai batas keamanan.** Enforcement wajib di server action/route handler.
- **Perubahan role harus menginvalidasi cache session** (`lib/auth/session.ts:40-48,92-98`) agar tidak menunggu 45 detik.
- **Fase 3 ke atas menyentuh otorisasi.** Sebelum menegakkan permission pada payroll/attendance, selesaikan dulu keputusan bisnis di `docs/SECURITY_AND_FLOW_AUDIT.md` bagian "Keputusan Bisnis yang Masih Terbuka".
- **Jangan hardcode nama role baru.** Selalu baca dari DB agar penambahan role benar-benar dinamis.

---

## 12. Definisi Selesai (Overall)

RBAC bisa disebut "dinamis dan berfungsi" jika:

- Owner bisa menambah role baru dari UI tanpa deploy.
- Owner bisa mencentang permission role tersebut.
- Owner bisa meng-assign role itu ke user.
- User tersebut hanya bisa mengakses aksi sesuai permission-nya, ditegakkan di server.
- Semua perubahan role/permission tercatat di audit log.
- Role sistem (`owner`, `tutor`) terlindungi dari perubahan yang merusak.
