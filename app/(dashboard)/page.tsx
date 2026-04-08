"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  CalendarCheck,
  Award,
  BarChart2,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardStats {
  totalSalesMonth: number;
  totalSalesDay: number;
  leadsToday: number;
  quotesToday: number;
  forecastToday: number;
  salespeople: {
    id: string;
    name: string;
    salesValue: number;
    salesCount: number;
    leadsReceived: number;
  }[];
  activeGoals: number;
  recentRecords: {
    id: string;
    userName: string;
    date: string;
    salesValue: number;
    salesCount: number;
    mood: string;
  }[];
}

const moodLabels: Record<string, { label: string; color: string }> = {
  OTIMO: { label: "Ótimo", color: "text-green-700 bg-green-100" },
  BOM: { label: "Bom", color: "text-blue-700 bg-blue-100" },
  REGULAR: { label: "Regular", color: "text-yellow-700 bg-yellow-100" },
  RUIM: { label: "Ruim", color: "text-orange-700 bg-orange-100" },
  PESSIMO: { label: "Péssimo", color: "text-red-700 bg-red-100" },
};

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isManager = session?.user?.role === "MANAGER";

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {session?.user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-gray-500 mt-1 capitalize">{today}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Vendas Hoje"
          value={formatCurrency(stats?.totalSalesDay ?? 0)}
          icon={DollarSign}
          color="bg-green-100 text-green-600"
          subtitle="valor total do dia"
        />
        <StatCard
          title="Leads Hoje"
          value={String(stats?.leadsToday ?? 0)}
          icon={Users}
          color="bg-blue-100 text-blue-600"
          subtitle="leads recebidos"
        />
        <StatCard
          title="Orçamentos Enviados"
          value={String(stats?.quotesToday ?? 0)}
          icon={BarChart2}
          color="bg-purple-100 text-purple-600"
          subtitle="hoje"
        />
        <StatCard
          title="Forecast do Dia"
          value={formatCurrency(stats?.forecastToday ?? 0)}
          icon={TrendingUp}
          color="bg-orange-100 text-orange-600"
          subtitle="previsão de fechamento"
        />
      </div>

      {/* Conteúdo por role */}
      {isManager ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ranking de vendedores */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Ranking do Mês
                </h2>
                <span className="text-xs text-gray-500">mês atual</span>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {stats?.salespeople?.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum registro este mês
                </p>
              )}
              {stats?.salespeople?.map((sp, index) => (
                <div
                  key={sp.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? "bg-yellow-400 text-yellow-900"
                        : index === 1
                        ? "bg-gray-300 text-gray-700"
                        : index === 2
                        ? "bg-amber-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {sp.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {sp.salesCount} venda{sp.salesCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(sp.salesValue)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {sp.leadsReceived} leads
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Registros recentes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-blue-500" />
                Registros Recentes
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {stats?.recentRecords?.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  Nenhum registro encontrado
                </p>
              )}
              {stats?.recentRecords?.map((record) => {
                const mood = moodLabels[record.mood] ?? moodLabels.BOM;
                return (
                  <div key={record.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold flex-shrink-0">
                      {record.userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {record.userName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(record.date)}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span
                        className={`badge text-xs ${mood.color}`}
                      >
                        {mood.label}
                      </span>
                      <p className="text-xs font-medium text-gray-700">
                        {formatCurrency(record.salesValue)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Painel do vendedor */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-blue-600" />
            <h2 className="font-semibold text-gray-900 text-lg">
              Metas Ativas
            </h2>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <ArrowUpRight className="w-4 h-4" />
            <p className="text-sm">
              Acesse a aba{" "}
              <span className="font-medium text-blue-600">Daylin</span> para
              registrar seu dia e{" "}
              <span className="font-medium text-blue-600">Premiação</span> para
              ver suas metas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
