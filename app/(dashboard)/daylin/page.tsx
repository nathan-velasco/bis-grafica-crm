"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  CalendarCheck,
  Plus,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  Phone,
  DollarSign,
  Repeat,
  Send,
  Eye,
  BarChart2,
  Filter,
  X,
} from "lucide-react";
import { formatCurrency, formatDate, todayString } from "@/lib/utils";

interface DailyRecord {
  id: string;
  userId: string;
  date: string;
  mood: string;
  leadsReceived: number;
  quotasSent: number;
  forecast: number;
  salesCount: number;
  salesValue: number;
  prospectingCount: number;
  followupCount: number;
  retentionCount: number;
  difficulty: string | null;
  notes: string | null;
  user: { name: string };
}

interface Summary {
  totalSalesValue: number;
  totalSalesCount: number;
  totalLeads: number;
  totalQuotas: number;
  totalForecast: number;
  totalProspecting: number;
  totalFollowup: number;
  totalRetention: number;
  recordCount: number;
}

interface User {
  id: string;
  name: string;
}

const MOODS = [
  { value: "OTIMO", label: "Ótimo", emoji: "🚀", color: "bg-green-100 text-green-700 border-green-300" },
  { value: "BOM", label: "Bom", emoji: "😊", color: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "REGULAR", label: "Regular", emoji: "😐", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "RUIM", label: "Ruim", emoji: "😕", color: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "PESSIMO", label: "Péssimo", emoji: "😞", color: "bg-red-100 text-red-700 border-red-300" },
];

const emptyForm = {
  mood: "BOM",
  leadsReceived: "",
  quotasSent: "",
  forecast: "",
  salesCount: "",
  salesValue: "",
  prospectingCount: "",
  followupCount: "",
  retentionCount: "",
  difficulty: "",
  notes: "",
};

export default function DaylinPage() {
  const { data: session } = useSession();
  const isManager = session?.user?.role === "MANAGER";

  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<DailyRecord | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DailyRecord | null>(null);

  // Filtros
  const [filterUser, setFilterUser] = useState("");
  const [filterStart, setFilterStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [filterEnd, setFilterEnd] = useState(todayString());
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState<"registros" | "resumo">("registros");

  // Paginação simples
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  useEffect(() => {
    if (isManager) {
      fetch("/api/users")
        .then((r) => r.json())
        .then(setUsers)
        .catch(() => {});
    }
  }, [isManager]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("start", filterStart);
      params.set("end", filterEnd);
      if (filterUser) params.set("userId", filterUser);

      const [recordsRes, summaryRes] = await Promise.all([
        fetch(`/api/daylin?${params}`),
        fetch(`/api/daylin/summary?${params}`),
      ]);

      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setRecords(data);
        // Encontra o registro de hoje do usuário atual
        const today = todayString();
        const tr = data.find(
          (r: DailyRecord) =>
            r.date === today && r.userId === session?.user?.id
        );
        setTodayRecord(tr ?? null);
      }
      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      }
    } finally {
      setLoading(false);
    }
  }, [filterStart, filterEnd, filterUser, session?.user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openForm(record?: DailyRecord) {
    if (record) {
      setForm({
        mood: record.mood,
        leadsReceived: String(record.leadsReceived),
        quotasSent: String(record.quotasSent),
        forecast: String(record.forecast),
        salesCount: String(record.salesCount),
        salesValue: String(record.salesValue),
        prospectingCount: String(record.prospectingCount),
        followupCount: String(record.followupCount),
        retentionCount: String(record.retentionCount),
        difficulty: record.difficulty ?? "",
        notes: record.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        date: todayString(),
        mood: form.mood,
        leadsReceived: Number(form.leadsReceived) || 0,
        quotasSent: Number(form.quotasSent) || 0,
        forecast: Number(form.forecast) || 0,
        salesCount: Number(form.salesCount) || 0,
        salesValue: Number(form.salesValue) || 0,
        prospectingCount: Number(form.prospectingCount) || 0,
        followupCount: Number(form.followupCount) || 0,
        retentionCount: Number(form.retentionCount) || 0,
        difficulty: form.difficulty,
        notes: form.notes,
      };

      const method = todayRecord ? "PUT" : "POST";
      const url = todayRecord ? `/api/daylin/${todayRecord.id}` : "/api/daylin";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        loadData();
      }
    } finally {
      setSaving(false);
    }
  }

  const moodInfo = (mood: string) =>
    MOODS.find((m) => m.value === mood) ?? MOODS[1];

  const paged = records.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(records.length / PER_PAGE);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-blue-600" />
            Daylin
          </h1>
          <p className="text-gray-500 mt-1">Controle diário de atividades</p>
        </div>

        {/* Botão de registrar (vendedor) ou área do vendedor */}
        {!isManager && (
          <div>
            {todayRecord ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Registrado hoje
                </div>
                <button onClick={() => openForm(todayRecord)} className="btn-secondary text-sm">
                  Editar registro
                </button>
              </div>
            ) : (
              <button onClick={() => openForm()} className="btn-primary">
                <Plus className="w-4 h-4" />
                Registrar meu dia
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(["registros", "resumo"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "registros" ? "Registros" : "Resumo"}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-400" />
          <div>
            <label className="text-xs text-gray-500 block mb-1">Período início</label>
            <input
              type="date"
              className="input-field text-sm"
              value={filterStart}
              onChange={(e) => { setFilterStart(e.target.value); setPage(1); }}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Período fim</label>
            <input
              type="date"
              className="input-field text-sm"
              value={filterEnd}
              onChange={(e) => { setFilterEnd(e.target.value); setPage(1); }}
            />
          </div>
          {isManager && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Vendedor</label>
              <select
                className="input-field text-sm w-48"
                value={filterUser}
                onChange={(e) => { setFilterUser(e.target.value); setPage(1); }}
              >
                <option value="">Todos os vendedores</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo por tab */}
      {tab === "resumo" && summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Vendido", value: formatCurrency(summary.totalSalesValue), icon: DollarSign, color: "bg-green-100 text-green-600" },
              { label: "Qtd. Vendas", value: String(summary.totalSalesCount), icon: TrendingUp, color: "bg-blue-100 text-blue-600" },
              { label: "Leads Recebidos", value: String(summary.totalLeads), icon: Users, color: "bg-purple-100 text-purple-600" },
              { label: "Orçamentos Enviados", value: String(summary.totalQuotas), icon: Send, color: "bg-indigo-100 text-indigo-600" },
              { label: "Forecast Total", value: formatCurrency(summary.totalForecast), icon: BarChart2, color: "bg-orange-100 text-orange-600" },
              { label: "Prospecções", value: String(summary.totalProspecting), icon: Eye, color: "bg-cyan-100 text-cyan-600" },
              { label: "Follow-ups", value: String(summary.totalFollowup), icon: Repeat, color: "bg-teal-100 text-teal-600" },
              { label: "Ativo/Retenção", value: String(summary.totalRetention), icon: Phone, color: "bg-pink-100 text-pink-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">{label}</p>
                    <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400 text-center">
            {summary.recordCount} registro{summary.recordCount !== 1 ? "s" : ""} no período
          </p>
        </div>
      )}

      {tab === "registros" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {isManager && <th className="table-header px-4 py-3 text-left">Vendedor</th>}
                  <th className="table-header px-4 py-3 text-left">Data</th>
                  <th className="table-header px-4 py-3 text-center">Sentimento</th>
                  <th className="table-header px-4 py-3 text-right">Leads</th>
                  <th className="table-header px-4 py-3 text-right">Orçamentos</th>
                  <th className="table-header px-4 py-3 text-right">Forecast</th>
                  <th className="table-header px-4 py-3 text-right">Vendas</th>
                  <th className="table-header px-4 py-3 text-right">Valor Vendido</th>
                  <th className="table-header px-4 py-3 text-right">Prospecções</th>
                  <th className="table-header px-4 py-3 text-right">Follow-ups</th>
                  <th className="table-header px-4 py-3 text-right">Retenções</th>
                  <th className="table-header px-4 py-3 text-center">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={isManager ? 12 : 11} className="px-4 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        Carregando...
                      </div>
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={isManager ? 12 : 11} className="px-4 py-12 text-center text-gray-400">
                      Nenhum registro encontrado no período
                    </td>
                  </tr>
                ) : (
                  paged.map((record) => {
                    const mood = moodInfo(record.mood);
                    return (
                      <tr
                        key={record.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          record.date === todayString() && record.userId === session?.user?.id
                            ? "bg-blue-50/30"
                            : ""
                        }`}
                      >
                        {isManager && (
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {record.user.name}
                          </td>
                        )}
                        <td className="px-4 py-3 text-gray-600">{formatDate(record.date)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`badge border ${mood.color}`}>
                            {mood.emoji} {mood.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">{record.leadsReceived}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{record.quotasSent}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(record.forecast)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{record.salesCount}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(record.salesValue)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{record.prospectingCount}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{record.followupCount}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{record.retentionCount}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {records.length} registro{records.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-40 rounded"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-40 rounded"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de detalhes do registro */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {isManager ? selectedRecord.user.name : "Meu registro"}
                </h3>
                <p className="text-sm text-gray-500">{formatDate(selectedRecord.date)}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-center">
                {(() => {
                  const mood = moodInfo(selectedRecord.mood);
                  return (
                    <span className={`badge border text-sm px-4 py-1.5 ${mood.color}`}>
                      {mood.emoji} Sentimento: {mood.label}
                    </span>
                  );
                })()}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Leads", value: selectedRecord.leadsReceived },
                  { label: "Orçamentos", value: selectedRecord.quotasSent },
                  { label: "Vendas", value: selectedRecord.salesCount },
                  { label: "Prospecções", value: selectedRecord.prospectingCount },
                  { label: "Follow-ups", value: selectedRecord.followupCount },
                  { label: "Retenções", value: selectedRecord.retentionCount },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center bg-gray-50 rounded-lg p-3">
                    <p className="text-xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(selectedRecord.salesValue)}
                  </p>
                  <p className="text-xs text-green-500">Valor Vendido</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-orange-700">
                    {formatCurrency(selectedRecord.forecast)}
                  </p>
                  <p className="text-xs text-orange-500">Forecast</p>
                </div>
              </div>
              {selectedRecord.difficulty && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Dificuldade do dia:</p>
                  <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                    {selectedRecord.difficulty}
                  </p>
                </div>
              )}
              {selectedRecord.notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Observações:</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    {selectedRecord.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de formulário de registro */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {todayRecord ? "Editar" : "Registrar"} meu dia
                </h2>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Sentimento */}
              <div>
                <label className="label">Como foi o seu dia?</label>
                <div className="flex gap-2 flex-wrap">
                  {MOODS.map((mood) => (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={() => setForm({ ...form, mood: mood.value })}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        form.mood === mood.value
                          ? mood.color + " border-current"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {mood.emoji} {mood.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Métricas numéricas */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Métricas do dia</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: "leadsReceived", label: "Leads recebidos", placeholder: "0", type: "number" },
                    { key: "quotasSent", label: "Orçamentos enviados", placeholder: "0", type: "number" },
                    { key: "salesCount", label: "Qtd. vendas fechadas", placeholder: "0", type: "number" },
                    { key: "salesValue", label: "Valor vendido (R$)", placeholder: "0,00", type: "number" },
                    { key: "forecast", label: "Forecast do dia (R$)", placeholder: "0,00", type: "number" },
                    { key: "prospectingCount", label: "Prospecções feitas", placeholder: "0", type: "number" },
                    { key: "followupCount", label: "Follow-ups feitos", placeholder: "0", type: "number" },
                    { key: "retentionCount", label: "Ativo/Retenção", placeholder: "0", type: "number" },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key}>
                      <label className="label text-xs">{label}</label>
                      <input
                        type={type}
                        min="0"
                        step="0.01"
                        className="input-field"
                        placeholder={placeholder}
                        value={form[key as keyof typeof form]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Textuais */}
              <div>
                <label className="label">Dificuldade do dia</label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Descreva as principais dificuldades encontradas hoje..."
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Observações gerais</label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Outras anotações do dia..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? "Salvando..." : todayRecord ? "Atualizar Registro" : "Salvar Registro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
