import { useEffect, useState, useCallback } from "react";
import {
  Search,
  BrushCleaning,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { TransactionTable } from "../components/transactions/TransactionTable";
import { NewTransactionModal } from "../components/transactions/NewTransactionModal";
import { CategorySelect } from "../components/categories/CategorySelect";
import { AlertModal } from "../components/ui/AlertModal";
import { api } from "../lib/api";
import {
  formatDateFlexible,
  firstDayOfMonthISO,
  lastDayOfMonthISO,
} from "../utils/date";
import { EditTransactionModal } from "../components/transactions/EditTransactionModal";

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState("");
  const [dateStart, setDateStart] = useState(() => firstDayOfMonthISO(new Date()));
  const [dateEnd, setDateEnd] = useState(() => lastDayOfMonthISO(new Date()));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editTx, setEditTx] = useState(null);

  const [queryParams, setQueryParams] = useState(() => ({
    search: "",
    categoryId: "",
    type: "",
    dateStart,
    dateEnd,
  }));

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [openActions, setOpenActions] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function resetSelection() {
    setSelectedIds(new Set());
  }
  function onToggleRow(id, checked) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }
  function onToggleAll(checked) {
    setSelectedIds(checked ? new Set(rows.map((r) => r.id)) : new Set());
  }

  const fetchTransactions = useCallback(
    async (params) => {
      setLoading(true);
      try {
        const q = new URLSearchParams();
        if ((params.search || "").trim()) q.set("q", params.search.trim());
        if (params.categoryId) q.set("category_id", params.categoryId);
        if (params.type === "income" || params.type === "expense") q.set("type", params.type);
        if (params.dateStart) q.set("date_start", params.dateStart);
        if (params.dateEnd) q.set("date_end", params.dateEnd);
        q.set("ordering", "-date");

        const res = await api.get(`/finance/transactions/?${q.toString()}`);

        if (!res.ok) {
          setRows([]);
          return;
        }
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data) ? data : (data.results ?? []);

        const mapped = list.map((t) => {
          return {
            id: t.id,
            description: t.description,
            category: t.category_detail?.name,
            date: formatDateFlexible(t.date),
            amount: Number(t.amount),
            type: t.type,
          };
        });

        setRows(mapped);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchTransactions(queryParams);
  }, [fetchTransactions, queryParams]);

  function handleSearch() {
    setQueryParams({
      search,
      categoryId,
      type,
      dateStart,
      dateEnd,
    });
  }

  function clearFilters() {
    const ds = firstDayOfMonthISO(new Date());
    const de = lastDayOfMonthISO(new Date());
    setSearch("");
    setCategoryId("");
    setType("");
    setDateStart(ds);
    setDateEnd(de);
    setQueryParams({
      search: "",
      categoryId: "",
      type: "",
      dateStart: ds,
      dateEnd: de,
    });
  }

  function onStartChange(v) {
    if (dateEnd && v > dateEnd) setDateEnd(v);
    setDateStart(v);
  }
  function onEndChange(v) {
    if (dateStart && v < dateStart) setDateStart(v);
    setDateEnd(v);
  }

  function handleCreated() {
    fetchTransactions(queryParams);
  }

  function openDeleteDialog() {
    if (selectedIds.size > 0) setDeleteOpen(true);
  }

  function closeDeleteDialog() {
    setDeleteOpen(false);
  }

  async function confirmDelete() {
    const ids = Array.from(selectedIds);

    if (ids.length === 0) return;

    try {
      if (ids.length === 1) {
        const r = await api.del(`/finance/transactions/${ids[0]}/`);
        if (!r.ok) throw new Error();
      } else {
        const q = new URLSearchParams();
        ids.forEach((id) => q.append("id", id));
        const r = await api.del(`/finance/transactions/bulk/?${q.toString()}`);
        if (!r.ok) throw new Error();
      }
      resetSelection();
      fetchTransactions(queryParams);
    } catch {
      alert("Não foi possível excluir.");
    } finally {
      setDeleteOpen(false);
    }
  }

  async function handleEditSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length !== 1) return;
    const id = ids[0];
    const res = await api.get(`/finance/transactions/${id}/`);
    if (!res.ok) return;
    const t = await res.json();
    setEditTx(t);
    setEditOpen(true);
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">Gerencie suas receitas e despesas</p>
        </div>
        <NewTransactionModal onTransactionCreated={handleCreated} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="relative">
              <Input
                placeholder="Buscar transações..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                startIcon={
                  <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                }
              />
            </div>

            <CategorySelect
              value={categoryId}
              onChange={setCategoryId}
              placeholder="Categoria"
            />

            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <input
                type="date"
                value={dateStart}
                max={dateEnd || undefined}
                onChange={(e) => onStartChange(e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Data inicial"
              />
            </div>

            <div className="relative">
              <input
                type="date"
                value={dateEnd}
                min={dateStart || undefined}
                onChange={(e) => onEndChange(e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Data final"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                className="w-full sm:w-auto inline-flex items-center gap-2 p-3"
              >
                Pesquisar
              </Button>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full sm:w-auto inline-flex items-center gap-2 p-3"
              >
                <BrushCleaning className="h-4 w-4" />
                Limpar
              </Button>
            </div>
          </div>

          <p className="pl-9 mt-3 text-xs text-gray-500">
            Período aplicado: {formatDateFlexible(queryParams.dateStart)} — {formatDateFlexible(queryParams.dateEnd)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Transações</CardTitle>
            <div className="relative">
              <Button
                variant="primary"
                className="inline-flex items-center gap-2 p-3"
                aria-haspopup="menu"
                disabled={selectedCount === 0 && !openActions}
                onClick={() => setOpenActions((v) => !v)}
              >
                Ações <ChevronDown className="h-4 w-4" />
              </Button>
              {openActions && (
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border bg-white p-1 shadow-lg">
                  <button
                    className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-gray-50 ${
                      selectedCount !== 1 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={selectedCount !== 1}
                    onClick={() => {
                      setOpenActions(false);
                      handleEditSelected();
                    }}
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </button>

                  <button
                    className={"flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-gray-50 text-rose-600"}
                    onClick={() => {
                      setOpenActions(false);
                      openDeleteDialog();
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Excluir
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <TransactionTable
            items={rows}
            loading={loading}
            selectedIds={selectedIds}
            onToggleRow={onToggleRow}
            onToggleAll={onToggleAll}
          />
        </CardContent>
      </Card>

      <AlertModal
        open={deleteOpen}
        title="Excluir"
        message={
          selectedCount === 1
            ? "Tem certeza que deseja excluir esta transação?"
            : `Tem certeza que deseja excluir ${selectedCount} transações?`
        }
        danger
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />

      <EditTransactionModal
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditTx(null);
        }}
        transaction={editTx}
        onTransactionUpdated={() => {
          setEditOpen(false);
          setEditTx(null);
          fetchTransactions(queryParams);
        }}
      />
    </div>
  );
}
