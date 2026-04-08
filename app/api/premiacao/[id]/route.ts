import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "MANAGER") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();

  // Se é só uma atualização de status
  if (body.status && Object.keys(body).length === 1) {
    const goal = await prisma.goal.update({
      where: { id: params.id },
      data: { status: body.status },
    });
    return NextResponse.json(goal);
  }

  const {
    title,
    description,
    targetValue,
    rewardValue,
    rewardDesc,
    deadline,
    priority,
    assignType,
    userIds,
    status,
  } = body;

  const goal = await prisma.goal.update({
    where: { id: params.id },
    data: {
      title,
      description,
      targetValue: targetValue ? Number(targetValue) : undefined,
      rewardValue: rewardValue !== undefined ? Number(rewardValue) : undefined,
      rewardDesc,
      deadline,
      priority,
      assignType,
      status,
    },
  });

  // Atualiza atribuições se fornecidas
  if (userIds) {
    const existing = await prisma.goalAssignment.findMany({
      where: { goalId: params.id },
    });
    const existingUserIds = existing.map((a) => a.userId);

    // Adiciona novos
    const toAdd = (userIds as string[]).filter((id: string) => !existingUserIds.includes(id));
    if (toAdd.length > 0) {
      await prisma.goalAssignment.createMany({
        data: toAdd.map((uid: string) => ({ goalId: params.id, userId: uid, currentValue: 0 })),
        skipDuplicates: true,
      });
    }

    // Remove os que não estão mais na lista
    const toRemove = existingUserIds.filter((id) => !(userIds as string[]).includes(id));
    if (toRemove.length > 0) {
      await prisma.goalAssignment.deleteMany({
        where: { goalId: params.id, userId: { in: toRemove } },
      });
    }
  }

  const updated = await prisma.goal.findUnique({
    where: { id: params.id },
    include: {
      assignments: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "MANAGER") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await prisma.goal.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
