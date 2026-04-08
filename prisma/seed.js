const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Criando usuários no banco de dados...");

  const managerPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "gestor@bisgrafica.com" },
    update: {},
    create: {
      name: "Gestor",
      email: "gestor@bisgrafica.com",
      passwordHash: managerPassword,
      role: "MANAGER",
    },
  });
  console.log("✓ Gestor criado: gestor@bisgrafica.com / admin123");

  const v1Password = await bcrypt.hash("vendedor123", 12);
  await prisma.user.upsert({
    where: { email: "joao@bisgrafica.com" },
    update: {},
    create: {
      name: "João Silva",
      email: "joao@bisgrafica.com",
      passwordHash: v1Password,
      role: "SALESPERSON",
    },
  });
  console.log("✓ Vendedor criado: joao@bisgrafica.com / vendedor123");

  const v2Password = await bcrypt.hash("vendedor123", 12);
  await prisma.user.upsert({
    where: { email: "maria@bisgrafica.com" },
    update: {},
    create: {
      name: "Maria Santos",
      email: "maria@bisgrafica.com",
      passwordHash: v2Password,
      role: "SALESPERSON",
    },
  });
  console.log("✓ Vendedor criado: maria@bisgrafica.com / vendedor123");

  console.log("\nBanco de dados populado com sucesso!");
}

main()
  .catch((e) => { console.error("Erro:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
