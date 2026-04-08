import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayString } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = session.user as { id: string; role: string };
  const today = todayString();

  // Início e fim do mês atual
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd = today;

  // Filtro base: manager vê tudo, vendedor vê só o próprio
  const userFilter = user.role === "MANAGER" ? {} : { userId: user.id };

  // Registros de hoje
  const todayRecords = await prisma.dailyRecord.findMany({
    where: { ...userFilter, date: today },
  });

  const totalSalesDay = todayRecords.reduce((s, r) => s + r.salesValue, 0);
  const leadsToday = todayRecords.reduce((s, r) => s + r.leadsReceived, 0);
  const quotesToday = todayRecords.reduce((s, r) => s + r.quotasSent, 0);
  const forecastToday = todayRecords.reduce((s, r) => s + r.forecast, 0);

  // Dados do mês
  let salespeople: {
    id: string;
    name: string;
    salesValue: number;
    salesCount: number;
    leadsReceived: number;
  }[] = [];

  let recentRecords: {
    id: string;
    userName: string;
    date: string;
    salesValue: number;
    salesCount: number;
    mood: string;
  }[] = [];

  if (user.role === "MANAGER") {
    // Ranking por vendedor no mês
    const monthRecords = await prisma.dailyRecord.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      include: { user: { select: { id: true, name: true } } },
    });

    const byUser = new Map<string, { id: string; name: string; salesValue: number; salesCount: number; leadsReceived: number }>();
    for (const r of monthRecords) {
      const prev = byUser.get(r.userId) ?? { id: r.user.id, name: r.user.name, salesValue: 0, salesCount: 0, leadsReceived: 0 };
      byUser.set(r.userId, {
        ...prev,
        salesValue: prev.salesValue + r.salesValue,
        salesCount: prev.salesCount + r.salesCount,
        leadsReceived: prev.leadsReceived + r.leadsReceived,
      });
    }
    salespeople = Array.from(byUser.values()).sort((a, b) => b.salesValue - a.salesValue);

    // Registros recentes
    const recent = await prisma.dailyRecord.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 10,
      include: { user: { select: { name: true } } },
    });
    recentRecords = recent.map((r) => ({
      id: r.id,
      userName: r.user.name,
      date: r.date,
      salesValue: r.salesValue,
      salesCount: r.salesCount,
      mood: r.mood,
    }));
  }

  // Metas ativas
  const activeGoalsWhere =
    user.role === "MANAGER"
      ? { status: "ATIVA" }
      : { status: "ATIVA", assignments: { some: { userId: user.id } } };

  const activeGoals = await prisma.goal.count({ where: activeGoalsWhere });

  return NextResponse.json({
    totalSalesDay,
    leadsToday,
    quotesToday,
    forecastToday,
    salespeople,
    recentRecords,
    activeGoals,
  });
}
