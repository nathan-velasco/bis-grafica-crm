"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Download,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Building2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
  cnpj: string | null;
  address: string | null;
  city: string | null;
  segment: string | null;
  niche: string | null;
  type: string;
  notes: string | null;
  createdAt: string;
  _count: { orders: number };
  totalValue: number;
  averageTicket: number;
}

interface Order {
  id: string;
  value: number;
  date: string;
  description: string | null;
  status: string;
  salesperson: { name: string };
}

const SEGMENTS = ["Empresarial", "Pessoa Física", "Evento", "Institucional", "Varejo", "Outros"];
const NICHES = ["Marketing", "Evento", "Comercial", "Acadêmico", "Pessoal", "Outros"];

const initialForm = {
  name: "",
  phone: "",
  email: "",
  cpf: "",
  cnpj: "",
  address: "",
  city: "",
  segment: "",
  niche: "",
  type: "PF",
  notes: "",
};

export default function ClientesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSegment, setFilterSegment] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerId: "",
    value: "",
    date: "",
    description: "",
    status: "CONCLUIDO",
  });

  useEffect(() => {
    if (session?.user?.role !== "MANAGER") {
      router.push("/");
    }
  }, [session, router]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterType) params.set("type", filterType);
      if (filterSegment) params.set("segment", filterSegment);
      params.set("sort", sortField);
      params.set("dir", sortDir);
      const res = await fetch(`/api/clientes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterSegment, sortField, sortDir]);

  useEffect(() => {
    const timer = setTimeout(loadCustomers, 300);
    return () => clearTimeout(timer);
  }, [loadCustomers]);

  async function loadCustomerDetail(id: string) {
    const res = await fetch(`/api/clientes/${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedCustomer(data.customer);
      setCustomerOrders(data.orders);
      setShowDetail(true);
    }
  }

  function openCreate() {
    setForm(initialForm);
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(customer: Customer) {
    setForm({
      name: customer.name,
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      cpf: customer.cpf ?? "",
      cnpj: customer.cnpj ?? "",
      address: customer.address ?? "",
      city: customer.city ?? "",
      segment: customer.segment ?? "",
      niche: customer.niche ?? "",
      type: customer.type,
      notes: customer.notes ?? "",
    });
    setEditingId(customer.id);
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/clientes/${editingId}` : "/api/clientes";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        loadCustomers();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
    const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
    if (res.ok) loadCustomers();
  }

  async function handleExport() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterType) params.set("type", filterType);
    if (filterSegment) params.set("segment", filterSegment);
    params.set("export", "csv");
    const res = await fetch(`/api/clientes?${params}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "clientes.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }

  async function handleAddOrder() {
    if (!selectedCustomer) return;
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...orderForm, customerId: selectedCustomer.id }),
    });
    if (res.ok) {
      setShowOrderModal(false);
      setOrderForm({ customerId: "", value: "", date: "", description: "", status: "CONCLUIDO" });
      loadCustomerDetail(selectedCustomer.id);
    }
  }

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field ? (
      sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
    ) : null;

  if (session?.user?.role !== "MANAGER") return null;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">
            {customers.length} cliente{customers.length !== 1 ? "s" : ""} encontrado{customers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email, CPF, CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field w-40"
          >
            <option value="">Todos os tipos</option>
            <option value="PF">Pessoa Física</option>
            <option value="PJ">Pessoa Jurídica</option>
          </select>
          <select
            value={filterSegment}
            onChange={(e) => setFilterSegment(e.target.value)}
            className="input-field w-44"
          >
            <option value="">Todos segmentos</option>
            {SEGMENTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {(search || filterType || filterSegment) && (
            <button
              onClick={() => { setSearch(""); setFilterType(""); setFilterSegment(""); }}
              className="btn-secondary"
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th
                  className="table-header px-4 py-3 text-left cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Nome <SortIcon field="name" />
                  </div>
                </th>
                <th className="table-header px-4 py-3 text-left">Tipo</th>
                <th className="table-header px-4 py-3 text-left">Contato</th>
                <th className="table-header px-4 py-3 text-left">Segmento</th>
                <th
                  className="table-header px-4 py-3 text-right cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort("totalValue")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Gasto <SortIcon field="totalValue" />
                  </div>
                </th>
                <th className="table-header px-4 py-3 text-right">Pedidos</th>
                <th className="table-header px-4 py-3 text-right">Ticket Médio</th>
                <th className="table-header px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Carregando...
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-xs text-gray-400">{customer.cpf || customer.cnpj || ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${customer.type === "PJ" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
                        {customer.type === "PJ" ? (
                          <Building2 className="w-3 h-3 mr-1" />
                        ) : (
                          <User className="w-3 h-3 mr-1" />
                        )}
                        {customer.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>
                        <p>{customer.phone || "-"}</p>
                        <p className="text-xs text-gray-400">{customer.email || ""}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {customer.segment && (
                        <span className="badge bg-gray-100 text-gray-600">{customer.segment}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(customer.totalValue)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {customer._count.orders}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatCurrency(customer.averageTicket)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => loadCustomerDetail(customer.id)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(customer)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de criar/editar cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? "Editar Cliente" : "Novo Cliente"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nome *</label>
                  <input
                    className="input-field"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nome completo ou razão social"
                  />
                </div>
                <div>
                  <label className="label">Tipo *</label>
                  <select
                    className="input-field"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="PF">Pessoa Física</option>
                    <option value="PJ">Pessoa Jurídica</option>
                  </select>
                </div>
                <div>
                  <label className="label">{form.type === "PF" ? "CPF" : "CNPJ"}</label>
                  <input
                    className="input-field"
                    value={form.type === "PF" ? form.cpf : form.cnpj}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [form.type === "PF" ? "cpf" : "cnpj"]: e.target.value,
                      })
                    }
                    placeholder={form.type === "PF" ? "000.000.000-00" : "00.000.000/0001-00"}
                  />
                </div>
                <div>
                  <label className="label">Telefone</label>
                  <input
                    className="input-field"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="label">Segmento</label>
                  <select
                    className="input-field"
                    value={form.segment}
                    onChange={(e) => setForm({ ...form, segment: e.target.value })}
                  >
                    <option value="">Selecionar...</option>
                    {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Nicho</label>
                  <select
                    className="input-field"
                    value={form.niche}
                    onChange={(e) => setForm({ ...form, niche: e.target.value })}
                  >
                    <option value="">Selecionar...</option>
                    {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Endereço</label>
                  <input
                    className="input-field"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div>
                  <label className="label">Cidade</label>
                  <input
                    className="input-field"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Cidade/UF"
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">Observações</label>
                  <textarea
                    className="input-field resize-none"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Anotações sobre o cliente..."
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="btn-primary"
              >
                {saving ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Cliente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalhes do cliente */}
      {showDetail && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedCustomer.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedCustomer.type === "PF" ? "Pessoa Física" : "Pessoa Jurídica"} •{" "}
                  Cliente desde {formatDate(selectedCustomer.createdAt.split("T")[0])}
                </p>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats do cliente */}
            <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-100">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(selectedCustomer.totalValue)}
                </p>
                <p className="text-xs text-blue-500 mt-1">Total Gasto</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-700">
                  {selectedCustomer._count.orders}
                </p>
                <p className="text-xs text-green-500 mt-1">Pedidos</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-2xl font-bold text-purple-700">
                  {formatCurrency(selectedCustomer.averageTicket)}
                </p>
                <p className="text-xs text-purple-500 mt-1">Ticket Médio</p>
              </div>
            </div>

            {/* Dados do cliente */}
            <div className="p-6 grid grid-cols-2 gap-4 border-b border-gray-100 text-sm">
              {selectedCustomer.phone && (
                <div>
                  <span className="text-gray-500">Telefone:</span>{" "}
                  <span className="font-medium">{selectedCustomer.phone}</span>
                </div>
              )}
              {selectedCustomer.email && (
                <div>
                  <span className="text-gray-500">Email:</span>{" "}
                  <span className="font-medium">{selectedCustomer.email}</span>
                </div>
              )}
              {(selectedCustomer.cpf || selectedCustomer.cnpj) && (
                <div>
                  <span className="text-gray-500">{selectedCustomer.type === "PF" ? "CPF:" : "CNPJ:"}</span>{" "}
                  <span className="font-medium">{selectedCustomer.cpf || selectedCustomer.cnpj}</span>
                </div>
              )}
              {selectedCustomer.address && (
                <div>
                  <span className="text-gray-500">Endereço:</span>{" "}
                  <span className="font-medium">{selectedCustomer.address}</span>
                </div>
              )}
              {selectedCustomer.segment && (
                <div>
                  <span className="text-gray-500">Segmento:</span>{" "}
                  <span className="font-medium">{selectedCustomer.segment}</span>
                </div>
              )}
              {selectedCustomer.niche && (
                <div>
                  <span className="text-gray-500">Nicho:</span>{" "}
                  <span className="font-medium">{selectedCustomer.niche}</span>
                </div>
              )}
            </div>

            {/* Histórico de pedidos */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Histórico de Pedidos</h3>
                <button
                  onClick={() => {
                    setOrderForm({ ...orderForm, customerId: selectedCustomer.id, date: new Date().toISOString().split("T")[0] });
                    setShowOrderModal(true);
                  }}
                  className="btn-primary text-xs py-1.5"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar Pedido
                </button>
              </div>
              {customerOrders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  Nenhum pedido registrado
                </p>
              ) : (
                <div className="space-y-2">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.description || "Pedido sem descrição"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(order.date)} • {order.salesperson.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(order.value)}
                        </p>
                        <span className={`badge text-xs ${order.status === "CONCLUIDO" ? "bg-green-100 text-green-700" : order.status === "CANCELADO" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de adicionar pedido */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Adicionar Pedido</h3>
              <button onClick={() => setShowOrderModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Valor (R$) *</label>
                <input
                  type="number"
                  className="input-field"
                  value={orderForm.value}
                  onChange={(e) => setOrderForm({ ...orderForm, value: e.target.value })}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="label">Data *</label>
                <input
                  type="date"
                  className="input-field"
                  value={orderForm.date}
                  onChange={(e) => setOrderForm({ ...orderForm, date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Descrição</label>
                <input
                  className="input-field"
                  value={orderForm.description}
                  onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
                  placeholder="Ex: Banners para evento, flyers..."
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input-field"
                  value={orderForm.status}
                  onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                >
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="ORCAMENTO">Orçamento</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100">
              <button onClick={() => setShowOrderModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleAddOrder} disabled={!orderForm.value || !orderForm.date} className="btn-primary">
                Salvar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
