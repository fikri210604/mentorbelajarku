"use client";

import { useState, useMemo } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Clock,
  User,
  Activity,
  Layers,
  Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AuditLogItem } from "../queries/audit-log.queries";

interface AuditLogViewerPageProps {
  initialLogs?: AuditLogItem[];
}

export default function AuditLogViewerPage({ initialLogs = [] }: AuditLogViewerPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");
  const [activeLog, setActiveLog] = useState<AuditLogItem | null>(null);

  const entityTypes = useMemo(() => {
    const set = new Set<string>();
    initialLogs.forEach((l) => {
      if (l.entity_type) set.add(l.entity_type);
    });
    return ["ALL", ...Array.from(set)];
  }, [initialLogs]);

  const filteredLogs = useMemo(() => {
    return initialLogs.filter((log) => {
      const matchSearch =
        searchTerm === "" ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user?.name && log.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.user?.email && log.user.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchEntity =
        selectedEntity === "ALL" || log.entity_type.toLowerCase() === selectedEntity.toLowerCase();

      return matchSearch && matchEntity;
    });
  }, [initialLogs, searchTerm, selectedEntity]);

  const getActionBadge = (action: string) => {
    if (action.includes("RESCHEDULE")) {
      return (
        <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 text-xs">
          {action}
        </Badge>
      );
    }
    if (action.includes("CREATE") || action.includes("GENERATE")) {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 text-xs">
          {action}
        </Badge>
      );
    }
    if (action.includes("UPDATE") || action.includes("STATUS")) {
      return (
        <Badge className="bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/40 text-xs">
          {action}
        </Badge>
      );
    }
    if (action.includes("DELETE") || action.includes("CANCEL")) {
      return (
        <Badge className="bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/40 text-xs">
          {action}
        </Badge>
      );
    }
    return <Badge variant="outline" className="text-xs">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs & Jejak Sistem"
        description="Pencatatan riwayat setiap aksi mutasi data sensitif pada sistem bimbel (who, what, when, metadata)."
      />

      {/* Filter & Search Bar */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari aksi, user, atau entity ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm h-9"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-xs font-semibold text-muted-foreground mr-1 shrink-0">
                Filter Entitas:
              </span>
              {entityTypes.map((entity) => (
                <Button
                  key={entity}
                  size="sm"
                  variant={selectedEntity === entity ? "default" : "outline"}
                  onClick={() => setSelectedEntity(entity)}
                  className="text-xs h-8 px-2.5 shrink-0"
                >
                  {entity}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Audit Logs */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Riwayat Perubahan ({filteredLogs.length} entri)
            </span>
          </CardTitle>
          <CardDescription className="text-xs">
            Data tersinkronisasi otomatis dari tabel <code>audit_logs</code> Supabase PostgreSQL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <ShieldAlert className="w-8 h-8 mx-auto text-muted-foreground/60" />
              <p className="text-sm font-medium">Tidak ada rekaman audit log yang sesuai.</p>
              <p className="text-xs">Aksi pengguna akan otomatis muncul di sini begitu ada mutasi data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs border-b">
                  <tr>
                    <th className="px-4 py-2.5">Waktu & Tanggal</th>
                    <th className="px-4 py-2.5">Aksi / Operasi</th>
                    <th className="px-4 py-2.5">Pelaku (User)</th>
                    <th className="px-4 py-2.5">Entitas</th>
                    <th className="px-4 py-2.5 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.map((log) => {
                    const formattedDate = new Date(log.created_at).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });

                    return (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                          {formattedDate}
                        </td>
                        <td className="px-4 py-2.5 font-medium">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-semibold text-foreground text-xs block">
                            {log.user?.name || log.user_id || "System"}
                          </span>
                          {log.user?.email && (
                            <span className="text-[11px] text-muted-foreground block">
                              {log.user.email}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-xs text-foreground block">
                            {log.entity_type}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground block truncate max-w-[120px]">
                            {log.entity_id}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveLog(log)}
                            className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Payload
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Detail Payload Audit Log */}
      <Dialog open={!!activeLog} onOpenChange={(open) => !open && setActiveLog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Detail Audit Log
            </DialogTitle>
            <DialogDescription className="text-xs">
              ID Log: <code>{activeLog?.id}</code>
            </DialogDescription>
          </DialogHeader>

          {activeLog && (
            <div className="space-y-3.5 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg border border-border/60">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Aksi:</span>
                  <span className="font-semibold text-foreground">{activeLog.action}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Entitas Target:</span>
                  <span className="font-semibold text-foreground">
                    {activeLog.entity_type} ({activeLog.entity_id.slice(0, 8)}...)
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Pelaku:</span>
                  <span className="font-semibold text-foreground">
                    {activeLog.user?.name || activeLog.user_id || "Sistem"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Waktu:</span>
                  <span className="font-mono text-foreground">
                    {new Date(activeLog.created_at).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-foreground block">
                  Metadata & Payload Perubahan:
                </span>
                <pre className="p-3 bg-muted/60 text-foreground rounded-lg overflow-x-auto text-[11px] font-mono border border-border/60 max-h-60">
                  {JSON.stringify(activeLog.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
