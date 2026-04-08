import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do banco de dados...");

  // Cria o gestor
  const managerPassword = await bcrypt.hash("admin123", 12);
  const manager = await prisma.user.upsert({
    where: { email: "gestor@bisgrafica.com" },
    update: {},
    create: {
      name: "Gestor",
      email: "gestor@bisgrafica.com",
      passwordHash: managerPassword,
      role: "MANAGER",
    },
  });
  console.log("Gestor criado:", manager.email);

  // Cria vendedores de exemplo
  const vendedor1Password = await bcrypt.hash("vendedor123", 12);
  const vendedor1 = await prisma.user.upsert({
    where: { email: "joao@bisgrafica.com" },
    update: {},
    create: {
      name: "João Silva",
      email: "joao@bisgrafica.com",
      passwordHash: vendedor1Password,
      role: "SALESPERSON",
    },
  });

  const vendedor2Password = await bcrypt.hash("vendedor123", 12);
  const vendedor2 = await prisma.user.upsert({
    where: { email: "maria@bisgrafica.com" },
    update: {},
    create: {
      name: "Maria Santos",
      email: "maria@bisgrafica.com",
      passwordHash: vendedor2Password,
      role: "SALESPERSON",
    },
  });

  console.log("Vendedores criados:", vendedor1.email, vendedor2.email);

  // Cria alguns clientes de exemplo
  const cliente1 = await prisma.customer.upsert({
    where: { id: "cliente-exemplo-1" },
    update: {},
    create: {
      id: "cliente-exemplo-1",
      name: "Empresa ABC Ltda",
      phone: "(11) 9999-1234",
      email: "contato@empresaabc.com",
      cnpj: "12.345.678/0001-99",
      type: "PJ",
      segment: "Empresarial",
      niche: "Marketing",
      address: "Rua das Flores, 123 - São Paulo/SP",
    },
  });

  const cliente2 = await prisma.customer.upsert({
    where: { id: "cliente-exemplo-2" },
    update: {},
    create: {
      id: "cliente-exemplo-2",
      name: "Carlos Pereira",
      phone: "(11) 8888-5678",
      email: "carlos@email.com",
      cpf: "123.456.789-00",
      type: "PF",
      segment: "Pessoa Física",
      niche: "Evento",
      address: "Av. Brasil, 456 - São Paulo/SP",
    },
  });

  // Cria pedidos de exemplo
  await prisma.order.createMany({
    skipDuplicates: true,
    data: [
      {
        customerId: cliente1.id,
        salespersonId: vendedor1.id,
        value: 1500.0,
        date: "2024-03-01",
        description: "Banners e flyers para evento",
        status: "CONCLUIDO",
      },
      {
        customerId: cliente1.id,
        salespersonId: vendedor1.id,
        value: 2800.0,
        date: "2024-04-15",
        description: "Catálogo de produtos",
        status: "CONCLUIDO",
      },
      {
        customerId: cliente2.id,
        salespersonId: vendedor2.id,
        value: 350.0,
        date: "2024-05-10",
        description: "Convites de casamento",
        status: "CONCLUIDO",
      },
    ],
  });

  // Cria registros diários de exemplo
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.dailyRecord.upsert({
    where: { userId_date: { userId: vendedor1.id, date: formatDate(yesterday) } },
    update: {},
    create: {
      userId: vendedor1.id,
      date: formatDate(yesterday),
      mood: "BOM",
      leadsReceived: 5,
      quotasSent: 3,
      forecast: 4500,
      salesCount: 2,
      salesValue: 3200,
      prospectingCount: 8,
      followupCount: 4,
      retentionCount: 1,
      difficulty: "Clientes indecisos com prazo de entrega",
    },
  });

  // Cria meta de exemplo
  const meta = await prisma.goal.create({
    data: {
      title: "Meta de Vendas - Abril/2024",
      description: "Bater R$ 20.000 em vendas no mês de abril",
      targetValue: 20000,
      rewardValue: 500,
      rewardDesc: "Bônus em dinheiro para quem bater a meta",
      deadline: "2024-04-30",
      priority: "ALTA",
      status: "ATIVA",
      assignType: "TEAM",
      createdById: manager.id,
    },
  });

  await prisma.goalAssignment.createMany({
    skipDuplicates: true,
    data: [
      { goalId: meta.id, userId: vendedor1.id, currentValue: 3200 },
      { goalId: meta.id, userId: vendedor2.id, currentValue: 350 },
    ],
  });

  console.log("Seed concluído com sucesso!");
  console.log("\nCredenciais de acesso:");
  console.log("Gestor: gestor@bisgrafica.com / admin123");
  console.log("Vendedor 1: joao@bisgrafica.com / vendedor123");
  console.log("Vendedor 2: maria@bisgrafica.com / vendedor123");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
