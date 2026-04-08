# Como instalar e rodar o CRM Bis Gráfica

## Pré-requisitos

Você precisa ter o **Node.js** instalado no seu computador.

### Instalar o Node.js

1. Acesse: https://nodejs.org/en/download
2. Baixe a versão **LTS** (recomendada)
3. Execute o instalador
4. Reinicie o computador após a instalação

Para verificar se instalou corretamente, abra o CMD ou PowerShell e execute:
```
node --version
npm --version
```

---

## Configuração inicial (apenas uma vez)

Abra o **CMD** ou **PowerShell** nesta pasta e execute:

```bash
npm install
```

Em seguida, crie o banco de dados e as tabelas:

```bash
npx prisma db push
```

Por fim, popule o banco com dados iniciais:

```bash
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed.ts
```

Ou use o comando simplificado:
```bash
npm run setup
```

---

## Rodando o sistema

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## Credenciais de acesso

| Perfil    | Email                    | Senha        |
|-----------|--------------------------|--------------|
| Gestor    | gestor@bisgrafica.com    | admin123     |
| Vendedor 1| joao@bisgrafica.com      | vendedor123  |
| Vendedor 2| maria@bisgrafica.com     | vendedor123  |

---

## Como adicionar novos vendedores

Como gestor, você pode adicionar novos vendedores diretamente via API ou editando o arquivo `prisma/seed.ts` e rodando novamente.

Para adicionar via API (POST /api/users):
```json
{
  "name": "Nome do Vendedor",
  "email": "vendedor@bisgrafica.com",
  "password": "senha123"
}
```

---

## Estrutura do sistema

- **Dashboard**: Visão geral do dia com métricas e ranking
- **Clientes** (somente gestor): Base de dados completa de clientes com exportação CSV
- **Daylin**: Registro diário de atividades dos vendedores
- **Premiação**: Metas e recompensas da equipe

---

## Permissões por perfil

| Funcionalidade         | Gestor | Vendedor |
|------------------------|--------|----------|
| Ver dashboard geral    | ✅     | ✅ (próprio) |
| Base de clientes       | ✅     | ❌       |
| Exportar clientes      | ✅     | ❌       |
| Ver Daylin geral       | ✅     | ❌       |
| Registrar próprio Daylin| ✅    | ✅       |
| Criar/editar metas     | ✅     | ❌       |
| Ver metas              | ✅     | ✅ (atribuídas) |
| Atualizar progresso    | ✅     | ✅ (próprio) |
