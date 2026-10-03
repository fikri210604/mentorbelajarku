'use server';

import { revalidatePath } from 'next/cache';
import { checkPermission } from '@/lib/auth/session';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { getSafeErrorMessage } from '@/lib/traits/response.trait';
import { SYSTEM_PERMISSIONS } from '@/config/permissions';
import { permissionSchema, PermissionInput } from '../schemas/permission.schema';
import type { PermissionDefinition } from '@/types/auth';

async function writeAuditLog(params: {
  userId: string;
  action: string;
  entityId: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createServerSupabaseClient();
    await (supabase as any).from('audit_logs').insert({
      user_id: params.userId,
      action: params.action,
      entity_type: 'permission',
      entity_id: params.entityId,
      metadata: params.metadata,
    });
  } catch (err) {
    console.warn('[permission.actions] Gagal menulis audit log:', err);
  }
}

export async function savePermissionAction(
  input: PermissionInput
): Promise<{ success: boolean; message: string; data?: PermissionDefinition }> {
  try {
    const { user, allowed } = await checkPermission('roles:manage');
    if (!allowed) {
      return { success: false, message: 'Hanya Owner yang diizinkan mengelola master permission.' };
    }

    const parsed = permissionSchema.parse(input);
    const definition: PermissionDefinition = {
      id: parsed.id.trim().toLowerCase(),
      category: parsed.category.trim(),
      name: parsed.name.trim(),
      description: parsed.description?.trim() || null,
    };

    if (isSupabaseConfigured()) {
      const supabase = createServerSupabaseClient();
      const db = supabase as any;

      const { error } = await db.from('permissions').upsert(
        {
          id: definition.id,
          category: definition.category,
          name: definition.name,
          description: definition.description,
        },
        { onConflict: 'id' }
      );

      if (error) {
        return {
          success: false,
          message: getSafeErrorMessage(error, 'Gagal menyimpan permission pada database.'),
        };
      }

      await writeAuditLog({
        userId: user.user.id,
        action: 'PERMISSION_SAVED',
        entityId: definition.id,
        metadata: { ...definition },
      });

      revalidatePath('/management/settings/permissions');
      revalidatePath('/management/settings/roles');
      return { success: true, message: 'Permission berhasil disimpan.', data: definition };
    }

    // Mode demo/sintetis
    const existingIdx = SYSTEM_PERMISSIONS.findIndex((p) => p.id === definition.id);
    if (existingIdx >= 0) {
      SYSTEM_PERMISSIONS[existingIdx] = definition;
    } else {
      SYSTEM_PERMISSIONS.push(definition);
    }

    revalidatePath('/management/settings/permissions');
    revalidatePath('/management/settings/roles');
    return { success: true, message: 'Permission berhasil disimpan.', data: definition };
  } catch (err: unknown) {
    console.error('savePermissionAction error:', err);
    return { success: false, message: getSafeErrorMessage(err, 'Gagal menyimpan permission.') };
  }
}

export async function deletePermissionAction(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { user, allowed } = await checkPermission('roles:manage');
    if (!allowed) {
      return { success: false, message: 'Hanya Owner yang diizinkan menghapus master permission.' };
    }

    if (!id) {
      return { success: false, message: 'Identifier permission wajib diisi.' };
    }

    if (isSupabaseConfigured()) {
      const supabase = createServerSupabaseClient();
      const db = supabase as any;

      const { error } = await db.from('permissions').delete().eq('id', id);
      if (error) {
        return {
          success: false,
          message: getSafeErrorMessage(error, 'Gagal menghapus permission pada database.'),
        };
      }

      await writeAuditLog({
        userId: user.user.id,
        action: 'PERMISSION_DELETED',
        entityId: id,
        metadata: { permissionId: id },
      });

      revalidatePath('/management/settings/permissions');
      revalidatePath('/management/settings/roles');
      return { success: true, message: 'Permission berhasil dihapus.' };
    }

    const idx = SYSTEM_PERMISSIONS.findIndex((p) => p.id === id);
    if (idx >= 0) {
      SYSTEM_PERMISSIONS.splice(idx, 1);
    }

    revalidatePath('/management/settings/permissions');
    revalidatePath('/management/settings/roles');
    return { success: true, message: 'Permission berhasil dihapus.' };
  } catch (err: unknown) {
    console.error('deletePermissionAction error:', err);
    return { success: false, message: getSafeErrorMessage(err, 'Gagal menghapus permission.') };
  }
}
