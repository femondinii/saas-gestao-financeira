import { useState } from "react";
import { Filter, Search, BrushCleaning } from "lucide-react";
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
import TransactionTable from "../components/transactions/TransactionTable";
import { NewTransactionModal } from "../components/transactions/NewTransactionModal";

const categories = [
  "Todas",
  "Alimentação",
  "Moradia",
  "Transporte",
  "Saúde",
  "Entretenimento",
  "Educação",
  "Renda",
  "Renda Extra",
  "Presentes",
];

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Categoria");
  const [type, setType] = useState("Tipo");

  const [dateStart, setDateStart] = useState(() => firstDayOfMonthISO(new Date()));
  const [dateEnd, setDateEnd] = useState(() => lastDayOfMonthISO(new Date()));

  function handleSearch() {
    console.log("Pesquisar →", { search, category, type, dateStart, dateEnd });
  }

  function clearFilters() {
    setSearch("");
    setCategory("Categoria");
    setType("Tipo");
    setDateStart(firstDayOfMonthISO(new Date()));
    setDateEnd(lastDayOfMonthISO(new Date()));
  }

  function onStartChange(v) {
    if (dateEnd && v > dateEnd) setDateEnd(v);
    setDateStart(v);
  }
  function onEndChange(v) {
    if (dateStart && v < dateStart) setDateStart(v);
    setDateEnd(v);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">Gerencie suas receitas e despesas</p>
        </div>
        <NewTransactionModal />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {/* Busca */}
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

            {/* Categoria */}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tipo */}
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="receita">Receitas</SelectItem>
                <SelectItem value="despesa">Despesas</SelectItem>
              </SelectContent>
            </Select>

            {/* Data inicial */}
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

            {/* Data final */}
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

            {/* Ações: Pesquisar / Limpar */}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionTable transactions={null} />
        </CardContent>
      </Card>
    </div>
  );
}

function toISO(d) {
  const dt = typeof d === "string" ? new Date(d) : d;
  const off = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - off * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function firstDayOfMonthISO(d) {
  return toISO(new Date(d.getFullYear(), d.getMonth(), 1));
}

function lastDayOfMonthISO(d) {
  return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}
