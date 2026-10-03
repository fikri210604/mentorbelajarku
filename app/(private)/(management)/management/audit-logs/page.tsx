import AuditLogViewerPage from "@/features/management/audit-logs/components/AuditLogViewerPage";
import { getAuditLogs } from "@/features/management/audit-logs/queries/audit-log.queries";
import { requireAuthUser } from "@/lib/auth/session";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Log & Jejak Perubahan | Bimbel Belajarku",
};

export default async function Page() {
  await requireAuthUser();
  const logs = await getAuditLogs();
  return <AuditLogViewerPage initialLogs={logs} />;
}
