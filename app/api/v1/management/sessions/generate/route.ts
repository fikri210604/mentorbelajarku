import { NextRequest } from "next/server";
import { requireManagementApi } from "@/lib/auth/guards";
import { SessionGeneratorService } from "@/features/shared/sessions/services/session-generator.service";
import { apiSuccess, apiError } from "@/lib/traits";

export async function POST(req: NextRequest) {
  const guard = await requireManagementApi("session:create");
  if (!guard.ok) return guard.response;

  try {
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // Body opsional jika hanya ingin generate default hari ini
    }

    const result = await SessionGeneratorService.generateSessions({
      targetDate: typeof body.targetDate === "string" ? body.targetDate : undefined,
      startDate: typeof body.startDate === "string" ? body.startDate : undefined,
      endDate: typeof body.endDate === "string" ? body.endDate : undefined,
      scheduleId: typeof body.scheduleId === "string" ? body.scheduleId : undefined,
      userId: guard.user.user.id,
    });

    if (!result.success && result.errors.length > 0 && result.createdCount === 0) {
      return apiError(result.errors.join(", "), {
        status: 500,
        code: "GENERATION_FAILED",
      });
    }

    return apiSuccess(result, {
      message: `Berhasil membuat ${result.createdCount} sesi baru (${result.skippedCount} dilewati/sudah ada).`,
      meta: {
        totalEvaluated: result.totalEvaluated,
        createdCount: result.createdCount,
        skippedCount: result.skippedCount,
      },
    });
  } catch (err: unknown) {
    return apiError(err instanceof Error ? err.message : "Internal Server Error", { status: 500 });
  }
}
