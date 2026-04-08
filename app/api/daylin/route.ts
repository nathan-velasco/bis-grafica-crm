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

  // Vendedor só vê os próprios registros
  if (user.role !== "MANAGER") {
    where.userId = user.id;
  } else if (filterUserId) {
    where.userId = filterUserId;
  }

  if (start && end) {
    where.date = { gte: start, lte: end };
  } else if (start) {
    where.date = { gte: start };
  } else if (end) {
    where.date = { lte: end };
  }

  const records = await prisma.dailyRecord.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { user: { select: { name: true, id: true } } },
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = session.user as { id: string };
  const body = await req.json();
  const {
    date,
    mood,
    leadsReceived,
    quotasSent,
    forecast,
    salesCount,
    salesValue,
    prospectingCount,
    followupCount,
    retentionCount,
    difficulty,
    notes,
  } = body;

  if (!date) {
    return NextResponse.json({ error: "Data é obrigatória" }, { status: 400 });
  }

  const record = await prisma.dailyRecord.upsert({
    where: { userId_date: { userId: user.id, date } },
    update: {
      mood,
      leadsReceived: Number(leadsReceived) || 0,
      quotasSent: Number(quotasSent) || 0,
      forecast: Number(forecast) || 0,
      salesCount: Number(salesCount) || 0,
      salesValue: Number(salesValue) || 0,
      prospectingCount: Number(prospectingCount) || 0,
      followupCount: Number(followupCount) || 0,
      retentionCount: Number(retentionCount) || 0,
      difficulty,
      notes,
    },
    create: {
      userId: user.id,
      date,
      mood: mood || "BOM",
      leadsReceived: Number(leadsReceived) || 0,
      quotasSent: Number(quotasSent) || 0,
      forecast: Number(forecast) || 0,
      salesCount: Number(salesCount) || 0,
      salesValue: Number(salesValue) || 0,
      prospectingCount: Number(prospectingCount) || 0,
      followupCount: Number(followupCount) || 0,
      retentionCount: Number(retentionCount) || 0,
      difficulty,
      notes,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
