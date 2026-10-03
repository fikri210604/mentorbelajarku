import { Metadata } from "next";
import UsersRolesPage from "@/features/management/settings/components/UsersRolesPage";
import { getManagedUsers } from "@/features/management/settings/queries/user-role.queries";
import { getRolesWithPermissionsAction } from "@/features/management/settings/actions/role.actions";
import { requirePermissionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Pengguna & Penetapan Peran | Bimbel Management",
  description: "Tetapkan peran dinamis dan hak akses kepada setiap pengguna sistem.",
};

export default async function Page() {
  await requirePermissionUser("roles:manage");

  const [users, rolesRes] = await Promise.all([
    getManagedUsers(),
    getRolesWithPermissionsAction(),
  ]);

  return (
    <UsersRolesPage initialUsers={users} roles={rolesRes.data || []} />
  );
}
