"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Trophy,
  Plus,
  X,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Star,
  ChevronDown,
  ChevronUp,
  Pencil,
  History,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface GoalAssignment {
  id: string;
  userId: string;
  currentValue: number;
  completed: boolean;
  completedAt: string | null;
  user: { id: string; name: string };
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  targetValue: number;
  rewardValue: number;
  rewardDesc: string | null;
  deadline: string;
  priority: string;
  status: string;
  assignType: string;
  createdAt: string;
  assignments: GoalAssignment[];
}

interface User {
  id: string;
  name: string;
}

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  ALTA: { label: "Alta", color: "bg-red-100 text-red-700" },
  MEDIA: { label: "Média", color: "bg-yellow-100 text-yellow-700" },
  BAIXA: { label: "Baixa", color: "bg-green-100 text-green-700" },
};

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ATIVA: { label: "Ativa", color: "bg-blue-100 text-blue-700", icon: Target },
  ENCERRADA: { label: "Encerrada", color: "bg-gray-100 text-gray-600", icon: CheckCircle },
  CANCELADA: { label: "Cancelada", color: "bg-red-100 text-red-600", icon: AlertCircle },
};

const emptyGoalForm = {
  title: "",
  description: "",
  targetValue: "",
  rewardValue: "",
  rewardDesc: "",
  deadline: "",
  priority: "MEDIA",
  assignType: "TEAM",
  selectedUsers: [] as string[],
};

function ProgressBar({ value, target }: { value: number; target: number }) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all ${pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-orange-400"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function PremiacaoPage() {
  const { data: session } = useSession();
  const isManager = session?.user?.role === "MANAGER";

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ATIVA");
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState(emptyGoalForm);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [showProgressModal, setShowProgressModal] = useState<{ goalId: string; assignId: string; userName: string; currentValue: number } | null>(null);
  const [progressValue, setProgressValue] = useState("");

  useEffect(() => {
    if (isManager) {
      fetch("/api/users").then((r) => r.json()).then(setUsers).catch(() => {});
    }
  }, [isManager]);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/premiacao?${params}`);
      if (res.ok) setGoals(await res.json());
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  function openCreate() {
    setEditingGoal(null);
    setForm(emptyGoalForm);
    setShowForm(true);
  }

  function openEdit(goal: Goal) {
    setEditingGoal(goal);
    setForm({
      title: goal.title,
      description: goal.description ?? "",
      targetValue: String(goal.targetValue),
      rewardValue: String(goal.rewardValue),
      rewardDesc: goal.rewardDesc ?? "",
      deadline: goal.deadline,
      priority: goal.priority,
      assignType: goal.assignType,
      selectedUsers: goal.assignments.map((a) => a.userId),
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        targetValue: Number(form.targetValue),
        rewardValue: Number(form.rewardValue) || 0,
        rewardDesc: form.rewardDesc,
        deadline: form.deadline,
        priority: form.priority,
        assignType: form.assignType,
        userIds: form.assignType === "TEAM" ? users.map((u) => u.id) : form.selectedUsers,
      };

      const method = editingGoal ? "PUT" : "POST";
      const url = editingGoal ? `/api/premiacao/${editingGoal.id}` : "/api/premiacao";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowForm(false);
        loadGoals();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(goalId: string, status: string) {
    const res = await fetch(`/api/premiacao/${goalId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) loadGoals();
  }

  async function handleUpdateProgress() {
    if (!showProgressModal) return;
    const res = await fetch(`/api/premiacao/${showProgressModal.goalId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentId: showProgressModal.assignId,
        currentValue: Number(progressValue),
      }),
    });
    if (res.ok) {
      setShowProgressModal(null);
      setProgressValue("");
      loadGoals();
    }
  }

  const myGoals = goals.filter((g) =>
    g.assignments.some((a) => a.userId === session?.user?.id)
  );

  const visibleGoals = isManager ? goals : myGoals;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-yellow-500" />
            Premiação
          </h1>
          <p className="text-gray-500 mt-1">Metas, desafios e recompensas</p>
        </div>
        {isManager && (
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nova Meta
          </button>
        )}
      </div>

      {/* Filtro por status */}
      <div className="flex gap-2">
        {[
          { value: "", label: "Todas", icon: History },
          { value: "ATIVA", label: "Ativas", icon: Target },
          { value: "ENCERRADA", label: "Encerradas", icon: CheckCircle },
          { value: "CANCELADA", label: "Canceladas", icon: AlertCircle },
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setFilterStatus(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === value
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Lista de metas */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Carregando...
        </div>
      ) : visibleGoals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma meta encontrada</p>
          {isManager && (
            <button onClick={openCreate} className="btn-primary mt-4 mx-auto">
              <Plus className="w-4 h-4" />
              Criar primeira meta
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleGoals.map((goal) => {
            const isExpanded = expandedGoal === goal.id;
            const priority = PRIORITY_LABELS[goal.priority] ?? PRIORITY_LABELS.MEDIA;
            const statusInfo = STATUS_LABELS[goal.status] ?? STATUS_LABELS.ATIVA;
            const StatusIcon = statusInfo.icon;
            const totalProgress = goal.assignments.reduce((s, a) => s + a.currentValue, 0);
            const completedCount = goal.assignments.filter((a) => a.completed).length;
            const isExpired = goal.deadline < new Date().toISOString().split("T")[0];
            const myAssignment = goal.assignments.find((a) => a.userId === session?.user?.id);

            return (
              <div
                key={goal.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Header do card */}
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                        <span className={`badge ${priority.color}`}>{priority.label}</span>
                        <span className={`badge ${statusInfo.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                        {isExpired && goal.status === "ATIVA" && (
                          <span className="badge bg-red-100 text-red-600">Vencida</span>
                        )}
                      </div>
                      {goal.description && (
                        <p className="text-sm text-gray-500 mb-3">{goal.description}</p>
                      )}

                      {/* Barra de progresso geral */}
                      <div className="flex items-center gap-3">
                        <ProgressBar value={totalProgress} target={goal.targetValue} />
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {Math.min(100, goal.targetValue > 0 ? Math.round((totalProgress / goal.targetValue) * 100) : 0)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Meta: {formatCurrency(goal.targetValue)}
                        </span>
                        {goal.rewardValue > 0 && (
                          <span className="flex items-center gap-1 text-yellow-600">
                            <Star className="w-3 h-3" />
                            Prêmio: {formatCurrency(goal.rewardValue)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Até {formatDate(goal.deadline)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {completedCount}/{goal.assignments.length} concluídos
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Ação do vendedor */}
                      {!isManager && myAssignment && goal.status === "ATIVA" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowProgressModal({
                              goalId: goal.id,
                              assignId: myAssignment.id,
                              userName: session?.user?.name ?? "",
                              currentValue: myAssignment.currentValue,
                            });
                            setProgressValue(String(myAssignment.currentValue));
                          }}
                          className="btn-secondary text-xs py-1"
                        >
                          Atualizar progresso
                        </button>
                      )}
                      {isManager && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(goal); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {goal.status === "ATIVA" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(goal.id, "ENCERRADA"); }}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                              title="Encerrar meta"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5">
                    {goal.rewardDesc && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800 flex items-start gap-2">
                        <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{goal.rewardDesc}</span>
                      </div>
                    )}
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Progresso por vendedor
                    </h4>
                    <div className="space-y-3">
                      {goal.assignments.map((assignment) => {
                        const pct = Math.min(
                          100,
                          goal.targetValue > 0
                            ? (assignment.currentValue / goal.targetValue) * 100
                            : 0
                        );
                        return (
                          <div key={assignment.id} className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                              {assignment.user.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                                  {assignment.user.name}
                                  {assignment.completed && (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  )}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatCurrency(assignment.currentValue)} / {formatCurrency(goal.targetValue)} ({Math.round(pct)}%)
                                </span>
                              </div>
                              <ProgressBar value={assignment.currentValue} target={goal.targetValue} />
                              {assignment.completed && assignment.completedAt && (
                                <p className="text-xs text-green-600 mt-0.5">
                                  Meta batida em {formatDate(assignment.completedAt)}!
                                </p>
                              )}
                            </div>
                            {isManager && goal.status === "ATIVA" && (
                              <button
                                onClick={() => {
                                  setShowProgressModal({
                                    goalId: goal.id,
                                    assignId: assignment.id,
                                    userName: assignment.user.name,
                                    currentValue: assignment.currentValue,
                                  });
                                  setProgressValue(String(assignment.currentValue));
                                }}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs"
                                title="Atualizar progresso"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal criar/editar meta */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingGoal ? "Editar Meta" : "Nova Meta"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Título *</label>
                <input
                  className="input-field"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Meta de vendas de abril"
                />
              </div>
              <div>
                <label className="label">Descrição</label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detalhes da meta..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Valor da meta (R$) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={form.targetValue}
                    onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="label">Valor do prêmio (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={form.rewardValue}
                    onChange={(e) => setForm({ ...form, rewardValue: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="label">Prazo *</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Prioridade</label>
                  <select
                    className="input-field"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Média</option>
                    <option value="BAIXA">Baixa</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Descrição do prêmio</label>
                <input
                  className="input-field"
                  value={form.rewardDesc}
                  onChange={(e) => setForm({ ...form, rewardDesc: e.target.value })}
                  placeholder="Ex: Bônus em dinheiro, folga, gift card..."
                />
              </div>
              <div>
                <label className="label">Atribuir para</label>
                <div className="flex gap-2 mb-2">
                  {[
                    { value: "TEAM", label: "Toda a equipe" },
                    { value: "INDIVIDUAL", label: "Vendedores específicos" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, assignType: value, selectedUsers: [] })}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                        form.assignType === value
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {form.assignType === "INDIVIDUAL" && (
                  <div className="space-y-1 mt-2">
                    {users.map((u) => (
                      <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.selectedUsers.includes(u.id)}
                          onChange={(e) => {
                            setForm({
                              ...form,
                              selectedUsers: e.target.checked
                                ? [...form.selectedUsers, u.id]
                                : form.selectedUsers.filter((id) => id !== u.id),
                            });
                          }}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{u.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.targetValue || !form.deadline}
                className="btn-primary"
              >
                {saving ? "Salvando..." : editingGoal ? "Salvar Alterações" : "Criar Meta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de atualizar progresso */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">Atualizar Progresso</h3>
                <p className="text-sm text-gray-500">{showProgressModal.userName}</p>
              </div>
              <button
                onClick={() => { setShowProgressModal(null); setProgressValue(""); }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-500">
                Valor atual: {formatCurrency(showProgressModal.currentValue)}
              </p>
              <div>
                <label className="label">Novo valor alcançado (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field"
                  value={progressValue}
                  onChange={(e) => setProgressValue(e.target.value)}
                  placeholder="0,00"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100">
              <button onClick={() => { setShowProgressModal(null); setProgressValue(""); }} className="btn-secondary">Cancelar</button>
              <button onClick={handleUpdateProgress} disabled={!progressValue} className="btn-primary">
                Atualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
