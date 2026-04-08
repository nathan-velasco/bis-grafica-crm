import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role: string }).role !== "MANAGER") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const { customerId, value, date, description, status } = body;

  if (!customerId || !value || !date) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      customerId,
      salespersonId: (session.user as { id: string }).id,
      value: Number(value),
      date,
      description,
      status: status || "CONCLUIDO",
    },
  });

  return NextResponse.json(order, { status: 201 });
}
