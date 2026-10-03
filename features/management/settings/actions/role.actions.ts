'use server';

import { revalidatePath } from 'next/cache';
import {
  requireAuthUser,
  checkPermission,
  invalidateUserSessionCache,
} from '@/lib/auth/session';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getSafeErrorMessage } from '@/lib/traits/response.trait';
import { roleSchema, RoleInput } from '../schemas/role.schema';
import { Permission, RoleWithPermissions } from '@/types/auth';
import type { Json } from '@/types/database.types';
import {
  KNOWN_PERMISSION_IDS,
  normalizeRoleName,
  isOwnerRoleName,
  portalRoleForRoleName,
} from '@/lib/permissions/resolver';

interface RoleRow {
  id: string;
  name: string;
  display_name: string;
  description?: string | null;
  is_system?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

function formatRoleRow(row: RoleRow, permissions: Permission[] = []): RoleWithPermissions {
  return {
    id: row.id,
    name: row.name,
    display_name: row.display_name,
    description: row.description ?? '',
    is_system: Boolean(row.is_system),
    permissions,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}

async function writeAuditLog(params: {
  userId: string;
  action: string;
  entityId: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createServerSupabaseClient();
    await supabase.from('audit_logs').insert({
      user_id: params.userId,
      action: params.action,
      entity_type: 'role',
      entity_id: params.entityId,
      metadata: params.metadata as unknown as Json,
    });
  } catch (err) {
    console.warn('[role.actions] Gagal menulis audit log:', err);
  }
}

export async function getRolesWithPermissionsAction(): Promise<{
  success: boolean;
  data: RoleWithPermissions[];
  message?: string;
}> {
  try {
    await requireAuthUser();

    if (!isSupabaseConfigured()) {
      return { success: false, data: [], message: 'Database belum dikonfigurasi.' };
    }

    const supabase = createServerSupabaseClient();
    const [{ data: roles, error: rolesError }, { data: rolePerms }] = await Promise.all([
      supabase
        .from('roles')
        .select('id, name, display_name, description, is_system, created_at, updated_at')
        .order('created_at', { ascending: true }),
      supabase.from('role_permissions').select('role_id, permission_id'),
    ]);

    if (rolesError) {
      return {
        success: false,
        data: [],
        message: getSafeErrorMessage(rolesError, 'Gagal memuat data peran dari database.'),
      };
    }

    const permsByRole = new Map<string, Permission[]>();
    for (const rp of (rolePerms ?? []) as { role_id: string; permission_id: string }[]) {
      const list = permsByRole.get(rp.role_id) ?? [];
      list.push(rp.permission_id as Permission);
      permsByRole.set(rp.role_id, list);
    }

    const formatted = ((roles ?? []) as unknown as RoleRow[]).map((r) =>
      formatRoleRow(r, permsByRole.get(r.id) ?? [])
    );

    return { success: true, data: formatted };
  } catch (err: unknown) {
    return { success: false, data: [], message: getSafeErrorMessage(err, 'Gagal memuat roles.') };
  }
}

export async function saveRoleAction(data: RoleInput): Promise<{
  success: boolean;
  message: string;
  data?: RoleWithPermissions;
}> {
  try {
    const { user, allowed } = await checkPermission('roles:manage');
    if (!allowed || !user) {
      return { success: false, message: 'Hanya Owner yang diizinkan mengelola peran (role).' };
    }
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Database belum dikonfigurasi.' };
    }

    const parsed = roleSchema.parse(data);
    const roleName = normalizeRoleName(parsed.name);
    const displayName = parsed.display_name.trim();
    const description = parsed.description?.trim() || null;

    const supabase = createServerSupabaseClient();

    if (parsed.id) {
      const { data: updated, error } = await supabase
        .from('roles')
        .update({
          name: roleName,
          display_name: displayName,
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', parsed.id)
        .select()
        .single();

      if (error || !updated) {
        return { success: false, message: getSafeErrorMessage(error, 'Gagal memperbarui peran.') };
      }

      await writeAuditLog({
        userId: user.user.id,
        action: 'ROLE_UPDATED',
        entityId: updated.id,
        metadata: { roleName, displayName, description },
      });

      revalidatePath('/management/settings/roles');
      return { success: true, message: 'Peran berhasil diperbarui.', data: formatRoleRow(updated as unknown as RoleRow) };
    }

    const { data: created, error } = await supabase
      .from('roles')
      .insert({ name: roleName, display_name: displayName, description, is_system: false })
      .select()
      .single();

    if (error || !created) {
      return { success: false, message: getSafeErrorMessage(error, 'Gagal menambahkan peran baru.') };
    }

    await writeAuditLog({
      userId: user.user.id,
      action: 'ROLE_CREATED',
      entityId: created.id,
      metadata: { roleName, displayName, description },
    });

    revalidatePath('/management/settings/roles');
    return { success: true, message: 'Peran baru berhasil ditambahkan.', data: formatRoleRow(created as unknown as RoleRow) };
  } catch (err: unknown) {
    console.error('saveRoleAction error:', err);
    return { success: false, message: getSafeErrorMessage(err, 'Gagal menyimpan data role.') };
  }
}

export async function deleteRoleAction(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const { user, allowed } = await checkPermission('roles:manage');
    if (!allowed || !user) {
      return { success: false, message: 'Hanya Owner yang diizinkan menghapus peran.' };
    }
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Database belum dikonfigurasi.' };
    }

    const supabase = createServerSupabaseClient();
    const { data: existing, error: findError } = await supabase
      .from('roles')
      .select('id, name, is_system')
      .eq('id', id)
      .maybeSingle();

    if (findError) {
      return { success: false, message: getSafeErrorMessage(findError, 'Gagal membaca data peran.') };
    }
    if (!existing) {
      return { success: false, message: 'Peran tidak ditemukan.' };
    }
    if (existing.is_system || isOwnerRoleName(existing.name)) {
      return { success: false, message: 'Peran sistem bawaan tidak boleh dihapus.' };
    }

    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) {
      return { success: false, message: getSafeErrorMessage(error, 'Gagal menghapus peran.') };
    }

    await writeAuditLog({
      userId: user.user.id,
      action: 'ROLE_DELETED',
      entityId: id,
      metadata: { roleName: existing.name },
    });

    revalidatePath('/management/settings/roles');
    return { success: true, message: 'Peran berhasil dihapus dari sistem.' };
  } catch (err: unknown) {
    console.error('deleteRoleAction error:', err);
    return { success: false, message: getSafeErrorMessage(err, 'Gagal menghapus peran.') };
  }
}

export async function updateRolePermissionsAction(
  roleId: string,
  permissions: string[]
): Promise<{ success: boolean; message: string }> {
  try {
    const { user, allowed } = await checkPermission('roles:manage');
    if (!allowed || !user) {
      return { success: false, message: 'Hanya Owner yang diizinkan mengatur hak akses.' };
    }
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Database belum dikonfigurasi.' };
    }

    const supabase = createServerSupabaseClient();

    let validPermissionIds: ReadonlySet<string> = KNOWN_PERMISSION_IDS;
    const { data: permissionRows } = await supabase.from('permissions').select('id');
    if (permissionRows && permissionRows.length > 0) {
      validPermissionIds = new Set<string>([
        ...KNOWN_PERMISSION_IDS,
        ...permissionRows.map((row) => row.id as string),
      ]);
    }

    const invalidPermissions = permissions.filter((p) => !validPermissionIds.has(p));
    if (invalidPermissions.length > 0) {
      return { success: false, message: `Hak akses tidak dikenal: ${invalidPermissions.join(', ')}.` };
    }
    const nextPermissions = Array.from(new Set(permissions));

    const { data: targetRole, error: roleError } = await supabase
      .from('roles')
      .select('id, name, is_system')
      .eq('id', roleId)
      .maybeSingle();

    if (roleError) {
      return { success: false, message: getSafeErrorMessage(roleError, 'Gagal membaca data peran.') };
    }
    if (!targetRole) {
      return { success: false, message: 'Peran tidak ditemukan.' };
    }
    if (isOwnerRoleName(targetRole.name)) {
      return {
        success: false,
        message: 'Peran Owner selalu memiliki hak akses penuh dan tidak dapat dikurangi.',
      };
    }

    const { data: currentRows, error: currentError } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', roleId);

    if (currentError) {
      return { success: false, message: getSafeErrorMessage(currentError, 'Gagal membaca hak akses peran.') };
    }

    const currentSet = new Set<string>((currentRows ?? []).map((r) => r.permission_id));
    const nextSet = new Set<string>(nextPermissions);
    const toAdd = nextPermissions.filter((p) => !currentSet.has(p));
    const toRemove = [...currentSet].filter((p) => !nextSet.has(p));

    if (toAdd.length > 0) {
      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert(toAdd.map((p) => ({ role_id: roleId, permission_id: p })));

      if (insertError) {
        return { success: false, message: getSafeErrorMessage(insertError, 'Gagal menyimpan hak akses baru.') };
      }
    }

    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .in('permission_id', toRemove);

      if (deleteError) {
        return { success: false, message: getSafeErrorMessage(deleteError, 'Gagal menghapus hak akses lama.') };
      }
    }

    await writeAuditLog({
      userId: user.user.id,
      action: 'ROLE_PERMISSIONS_UPDATED',
      entityId: roleId,
      metadata: { roleName: targetRole.name, added: toAdd, removed: toRemove, total: nextPermissions.length },
    });

    invalidateUserSessionCache();
    revalidatePath('/management/settings/roles');
    return { success: true, message: 'Hak akses peran berhasil disimpan.' };
  } catch (err: unknown) {
    console.error('updateRolePermissionsAction error:', err);
    return { success: false, message: getSafeErrorMessage(err, 'Gagal memperbarui hak akses.') };
  }
}

/**
 * Menetapkan role dinamis ke seorang user.
 * Menyinkronkan `user.role_id` (sumber dinamis) dan `user.role` (string portal).
 */
export async function assignUserRoleAction(input: {
  userId: string;
  roleId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { user, allowed } = await checkPermission('roles:manage');
    if (!allowed || !user) {
      return { success: false, message: 'Hanya Owner yang diizinkan menetapkan role pengguna.' };
    }
    if (!input.userId || !input.roleId) {
      return { success: false, message: 'Pengguna dan peran wajib dipilih.' };
    }
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Database belum dikonfigurasi.' };
    }

    const supabase = createServerSupabaseClient();

    const [{ data: targetUser, error: userError }, { data: roleRow, error: roleError }] =
      await Promise.all([
        supabase.from('user').select('id, role, role_id').eq('id', input.userId).maybeSingle(),
        supabase.from('roles').select('id, name, is_system').eq('id', input.roleId).maybeSingle(),
      ]);

    if (userError || !targetUser) {
      return { success: false, message: getSafeErrorMessage(userError, 'Pengguna tidak ditemukan.') };
    }
    if (roleError || !roleRow) {
      return { success: false, message: getSafeErrorMessage(roleError, 'Peran tidak ditemukan.') };
    }

    const portalRole = portalRoleForRoleName(roleRow.name) ?? 'management';

    const { error: updateError } = await supabase
      .from('user')
      .update({ role: portalRole, role_id: roleRow.id, updated_at: new Date().toISOString() })
      .eq('id', input.userId);

    if (updateError) {
      return { success: false, message: getSafeErrorMessage(updateError, 'Gagal menetapkan role pengguna.') };
    }

    await writeAuditLog({
      userId: user.user.id,
      action: 'USER_ROLE_ASSIGNED',
      entityId: input.userId,
      metadata: {
        before: { role: targetUser.role, role_id: targetUser.role_id },
        after: { role: portalRole, role_id: roleRow.id, role_name: roleRow.name },
      },
    });

    invalidateUserSessionCache();
    revalidatePath('/management/settings/users');
    revalidatePath('/management/settings/roles');
    return { success: true, message: `Role pengguna berhasil ditetapkan ke "${roleRow.name}".` };
  } catch (err: unknown) {
    console.error('assignUserRoleAction error:', err);
    return { success: false, message: getSafeErrorMessage(err, 'Gagal menetapkan role pengguna.') };
  }
}
