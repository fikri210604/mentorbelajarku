"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CreditCard, DollarSign, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/utils";
import { PayrollWithDetails } from "../types";
import { finalizePayrollAction, markPayrollAsPaidAction } from "../actions/payroll.actions";

interface PayrollDetailPageProps {
  payroll: PayrollWithDetails | null;
}

export default function PayrollDetailPage({ payroll }: PayrollDetailPageProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  if (!payroll) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Data Payroll tidak ditemukan</h2>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/management/payroll">Kembali</Link>
        </Button>
      </div>
    );
  }

  const handleFinalize = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await finalizePayrollAction(payroll.id);
      if (res && !res.success) {
        setFeedback({ type: "error", message: res.error || "Gagal memfinalisasi payroll." });
      } else {
        setFeedback({ type: "success", message: "Payroll berhasil difinalisasi dan siap dibayarkan!" });
      }
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Terjadi kesalahan sistem." });
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await markPayrollAsPaidAction(payroll.id);
      if (res && !res.success) {
        setFeedback({ type: "error", message: res.error || "Gagal memperbarui status pembayaran." });
      } else {
        setFeedback({ type: "success", message: "Payroll berhasil ditandai telah dibayarkan kepada tutor!" });
      }
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Terjadi kesalahan sistem." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Payroll: ${payroll.tutors?.profiles?.full_name || "Tutor"}`}
        description={`Periode: ${payroll.period_start} s/d ${payroll.period_end}`}
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/management/payroll">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Link>
        </Button>
        {payroll.status === "draft" && (
          <Button size="sm" onClick={handleFinalize} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Finalisasi Payroll
          </Button>
        )}
        {payroll.status === "processed" && (
          <Button size="sm" onClick={handlePay} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />}
            Tandai Telah Dibayar
          </Button>
        )}
      </PageHeader>

      {/* Banner Feedback Alert */}
      {feedback && (
        <Alert variant={feedback.type === "success" ? "success" : "destructive"}>
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{feedback.type === "success" ? "Berhasil" : "Gagal"}</AlertTitle>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">Honor Kotor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{formatCurrency(Number(payroll.gross_amount))}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">Penyesuaian (Bonus/Potongan)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              +{formatCurrency(Number(payroll.bonus))} / -{formatCurrency(Number(payroll.deduction))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">Total Bersih</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono text-primary">{formatCurrency(Number(payroll.net_amount))}</p>
            <div className="mt-2">
              <StatusBadge status={payroll.status} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Rincian Sesi & Murid yang Terhitung
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payroll.items && payroll.items.length > 0 ? (
            <div className="divide-y text-sm">
              {payroll.items.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.students?.name || "Murid"}</p>
                    <p className="text-xs text-muted-foreground">Tipe: {item.bimbel_types?.name || "Reguler"}</p>
                  </div>
                  <span className="font-mono font-medium">{formatCurrency(Number(item.amount))}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada rincian item sesi.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
