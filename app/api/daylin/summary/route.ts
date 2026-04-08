import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = session.user as { id: string; role: string };
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";
  const filterUserId = searchParams.get("userId") ?? "";

  const where: Record<string, unknown> = {};
  if (user.role !== "MANAGER") {
    where.userId = user.id;
  } else if (filterUserId) {
    where.userId = filterUserId;
  }
  if (start && end) {
    where.date = { gte: start, lte: end };
  }

  const records = await prisma.dailyRecord.findMany({ where });

  const summary = {
    totalSalesValue: records.reduce((s, r) => s + r.salesValue, 0),
    totalSalesCount: records.reduce((s, r) => s + r.salesCount, 0),
    totalLeads: records.reduce((s, r) => s + r.leadsReceived, 0),
    totalQuotas: records.reduce((s, r) => s + r.quotasSent, 0),
    totalForecast: records.reduce((s, r) => s + r.forecast, 0),
    totalProspecting: records.reduce((s, r) => s + r.prospectingCount, 0),
    totalFollowup: records.reduce((s, r) => s + r.followupCount, 0),
    totalRetention: records.reduce((s, r) => s + r.retentionCount, 0),
    recordCount: records.length,
  };

  return NextResponse.json(summary);
}
