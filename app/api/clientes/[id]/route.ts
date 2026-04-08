import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function requireManager(session: { user: { role: string } } | null) {
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const denied = requireManager(session as { user: { role: string } } | null);
  if (denied) return denied;

  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { orders: true } },
      orders: { select: { value: true } },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const totalValue = customer.orders.reduce((s, o) => s + o.value, 0);
  const averageTicket =
    customer._count.orders > 0 ? totalValue / customer._count.orders : 0;

  const orders = await prisma.order.findMany({
    where: { customerId: params.id },
    orderBy: { date: "desc" },
    include: { salesperson: { select: { name: true } } },
  });

  return NextResponse.json({
    customer: { ...customer, totalValue, averageTicket },
    orders,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const denied = requireManager(session as { user: { role: string } } | null);
  if (denied) return denied;

  const body = await req.json();
  const { name, phone, email, cpf, cnpj, address, city, segment, niche, type, notes } = body;

  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: { name, phone, email, cpf, cnpj, address, city, segment, niche, type, notes },
  });

  return NextResponse.json(customer);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const denied = requireManager(session as { user: { role: string } } | null);
  if (denied) return denied;

  await prisma.order.deleteMany({ where: { customerId: params.id } });
  await prisma.customer.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
