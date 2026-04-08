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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const denied = requireManager(session as { user: { role: string } } | null);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type") ?? "";
  const segment = searchParams.get("segment") ?? "";
  const sort = searchParams.get("sort") ?? "name";
  const dir = searchParams.get("dir") === "desc" ? "desc" : "asc";
  const isExport = searchParams.get("export") === "csv";

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (segment) where.segment = segment;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { cpf: { contains: search } },
      { cnpj: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const orderBy: Record<string, string> =
    sort === "name" ? { name: dir } : { createdAt: dir };

  const customers = await prisma.customer.findMany({
    where,
    orderBy,
    include: {
      _count: { select: { orders: true } },
      orders: { select: { value: true } },
    },
  });

  const enriched = customers.map((c) => {
    const totalValue = c.orders.reduce((s, o) => s + o.value, 0);
    const averageTicket = c._count.orders > 0 ? totalValue / c._count.orders : 0;
    return { ...c, totalValue, averageTicket, orders: undefined };
  });

  // Ordenação por totalValue
  if (sort === "totalValue") {
    enriched.sort((a, b) =>
      dir === "asc" ? a.totalValue - b.totalValue : b.totalValue - a.totalValue
    );
  }

  if (isExport) {
    const headers = [
      "Nome",
      "Tipo",
      "CPF/CNPJ",
      "Telefone",
      "Email",
      "Segmento",
      "Nicho",
      "Cidade",
      "Total Gasto",
      "Qtd Pedidos",
      "Ticket Médio",
      "Cadastrado em",
    ];
    const rows = enriched.map((c) => [
      `"${c.name}"`,
      c.type,
      c.cpf || c.cnpj || "",
      c.phone || "",
      c.email || "",
      c.segment || "",
      c.niche || "",
      c.city || "",
      c.totalValue.toFixed(2).replace(".", ","),
      c._count.orders,
      c.averageTicket.toFixed(2).replace(".", ","),
      c.createdAt.toISOString().split("T")[0],
    ]);

    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="clientes.csv"',
      },
    });
  }

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const denied = requireManager(session as { user: { role: string } } | null);
  if (denied) return denied;

  const body = await req.json();
  const { name, phone, email, cpf, cnpj, address, city, segment, niche, type, notes } = body;

  if (!name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const customer = await prisma.customer.create({
    data: { name, phone, email, cpf, cnpj, address, city, segment, niche, type: type || "PF", notes },
  });

  return NextResponse.json(customer, { status: 201 });
}
