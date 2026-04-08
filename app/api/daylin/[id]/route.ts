import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = session.user as { id: string; role: string };
  const existing = await prisma.dailyRecord.findUnique({ where: { id: params.id } });

  if (!existing) {
    return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
  }

  // Vendedor só pode editar o próprio registro
  if (user.role !== "MANAGER" && existing.userId !== user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const record = await prisma.dailyRecord.update({
    where: { id: params.id },
    data: {
      mood: body.mood,
      leadsReceived: Number(body.leadsReceived) || 0,
      quotasSent: Number(body.quotasSent) || 0,
      forecast: Number(body.forecast) || 0,
      salesCount: Number(body.salesCount) || 0,
      salesValue: Number(body.salesValue) || 0,
      prospectingCount: Number(body.prospectingCount) || 0,
      followupCount: Number(body.followupCount) || 0,
      retentionCount: Number(body.retentionCount) || 0,
      difficulty: body.difficulty,
      notes: body.notes,
    },
  });

  return NextResponse.json(record);
}
