import { Metadata } from "next";
import PermissionsCatalogPage from "@/features/management/settings/components/PermissionsCatalogPage";
import { getPermissionsCatalog } from "@/features/management/settings/queries/permission.queries";
import { requirePermissionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Katalog Permission | Bimbel Management",
  description: "Master hak akses granular untuk matriks peran dinamis.",
};

export default async function Page() {
  await requirePermissionUser("roles:manage");
  const permissions = await getPermissionsCatalog();

  return <PermissionsCatalogPage initialPermissions={permissions} />;
}
