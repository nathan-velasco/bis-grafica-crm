import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayString } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = session.user as { id: string; role: string };
  const body = await req.json();
  const { assignmentId, currentValue } = body;

  // Encontra a atribuição
  const assignment = await prisma.goalAssignment.findUnique({
    where: { id: assignmentId },
    include: { goal: { select: { targetValue: true } } },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Atribuição não encontrada" }, { status: 404 });
  }

  // Vendedor só pode atualizar o próprio progresso
  if (user.role !== "MANAGER" && assignment.userId !== user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const newValue = Number(currentValue);
  const completed = newValue >= assignment.goal.targetValue;

  const updated = await prisma.goalAssignment.update({
    where: { id: assignmentId },
    data: {
      currentValue: newValue,
      completed,
      completedAt: completed && !assignment.completed ? todayString() : assignment.completedAt,
    },
  });

  return NextResponse.json(updated);
}
