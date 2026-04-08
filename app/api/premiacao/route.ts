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
  const status = searchParams.get("status") ?? "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  // Vendedor vê apenas metas que têm sua atribuição
  if (user.role !== "MANAGER") {
    where.assignments = { some: { userId: user.id } };
  }

  const goals = await prisma.goal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      assignments: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "MANAGER") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const user = session.user as { id: string };
  const body = await req.json();
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
  } = body;

  if (!title || !targetValue || !deadline) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const goal = await prisma.goal.create({
    data: {
      title,
      description,
      targetValue: Number(targetValue),
      rewardValue: Number(rewardValue) || 0,
      rewardDesc,
      deadline,
      priority: priority || "MEDIA",
      assignType: assignType || "TEAM",
      createdById: user.id,
      assignments: {
        create: (userIds as string[]).map((uid: string) => ({
          userId: uid,
          currentValue: 0,
        })),
      },
    },
    include: {
      assignments: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
