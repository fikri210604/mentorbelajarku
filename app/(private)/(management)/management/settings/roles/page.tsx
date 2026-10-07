import { Metadata } from "next";
import RolesManagementPage from "@/features/management/settings/components/RolesManagementPage";
import { getRolesWithPermissionsAction } from "@/features/management/settings/actions/role.actions";
import { getPermissionsCatalog } from "@/features/management/settings/queries/permission.queries";
import { requirePermissionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Manajemen Peran & Hak Akses (RBAC) | Bimbel Belajarku",
  description: "Kelola peran operasional dan matriks hak akses dinamis untuk staf dan pimpinan bimbel.",
};

export default async function Page() {
  const session = await requirePermissionUser("roles:manage");
  const [rolesRes, permissionsCatalog] = await Promise.all([
    getRolesWithPermissionsAction(),
    getPermissionsCatalog(),
  ]);

  return (
    <RolesManagementPage
      initialRoles={rolesRes.data || []}
      initialPermissions={permissionsCatalog}
      roleName={session.roleName}
      permissions={session.permissions}
      currentSubrole={session.subrole}
    />
  );
}
