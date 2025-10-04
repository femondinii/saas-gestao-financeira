import { useMemo } from "react";
import {
  BarChart3,
  CreditCard,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
  LineChart as LineChartIcon,
  PieChart
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { StatsCard } from "../components/ui/StatsCard";
import ChartCard from "../components/ui/ChartCard";
import { useDashboardData } from "../hooks/useDashboardData";
import { formatBRL, formatPercentage, getTrend } from "../utils/formatters";
import { formatPtDate } from "../utils/date";
import { LoadingOverlay, SpinnerInline } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";

export default function DashboardPage() {
  const { stats, charts, loading } = useDashboardData();

  const formattedStats = useMemo(() => {
    if (!stats) return null;

    return {
      balance: formatBRL(stats.balance),
      income: formatBRL(stats.income.current),
      expenses: formatBRL(stats.expenses.current),
      incomePercentage: formatPercentage(stats.income.change_pct),
      expensesPercentage: formatPercentage(stats.expenses.change_pct),
      incomeTrend: getTrend(stats.income.change_pct),
      expenseTrend: getTrend(stats.expenses.change_pct),
      asOf: formatPtDate(stats.as_of)
    };
  }, [stats]);

  const chartData = useMemo(() => ({
    monthly: charts.monthly.map(m => ({
      month: m.month,
      income: Number(m.income),
      expenses: Number(m.expenses)
    })),

    categories: charts.categories.map(c => ({
      name: c.name || "Sem categoria",
      value: Number(c.value)
    })),

    balance: charts.balance.map(b => ({
      month: b.month,
      balance: Number(b.balance)
    })),

    incomeSources: charts.incomeSources.map(i => ({
      name: i.name,
      value: Number(i.value),
      percent: i.percent
    })),

    recent: charts.recent.map(t => ({
      id: t.id,
      description: t.description,
      date: formatPtDate(t.date),
      category: t?.category_detail?.name,
      amount: t.amount,
      type: t.type
    }))
  }), [charts]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das suas finanças pessoais</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Saldo Atual"
          value={formattedStats?.balance}
          description={formattedStats ? `Atualizado em ${formattedStats.asOf}` : <SpinnerInline />}
          icon={<Wallet />}
        />
        <StatsCard
          title="Renda Mensal"
          value={formattedStats?.income}
          percentage={formattedStats?.incomePercentage}
          trend={formattedStats?.incomeTrend}
          description="vs. mês anterior"
          icon={<TrendingUp />}
        />
        <StatsCard
          title="Despesas Mensais"
          value={formattedStats?.expenses}
          percentage={formattedStats?.expensesPercentage}
          trend={formattedStats?.expenseTrend}
          description="vs. mês anterior"
          icon={<TrendingDown />}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          type="area"
          data={chartData.monthly}
          title="Fluxo de Caixa Mensal"
          description={"Comparativo de receitas e despesas dos últimos 6 meses"}
          icon={<BarChart3 />}
          loading={loading.charts}
        />
        <ChartCard
          type="bar"
          data={chartData.categories}
          title="Despesas por Categoria"
          description={"Distribuição de gastos do mês atual"}
          icon={<DollarSign />}
          loading={loading.charts}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          type="line"
          data={chartData.balance}
          title="Evolução do Saldo"
          description={"Crescimento do saldo nos últimos 6 meses"}
          icon={<LineChartIcon />}
          loading={loading.charts}
        />
        <ChartCard
          type="pie"
          data={chartData.incomeSources}
          title="Receitas por Fonte"
          description={"Distribuição de receitas por origem"}
          icon={<PieChart />}
          loading={loading.charts}
        />
      </div>

      {/* Recent Transactions */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            <span>Transações Recentes</span>
          </CardTitle>
          <CardDescription>
            Últimas movimentações financeiras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {loading.charts ? (
              <LoadingOverlay />
            ) : chartData.recent.length > 0 ? (
              chartData.recent.map(transaction => (
                <div key={transaction.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className={`${transaction.description ? "font-semibold" : "text-gray-400"}`}>{transaction.description || "Não preenchido"}</div>
                    <div className="text-sm text-muted-foreground flex gap-2">
                      <span>{transaction.date}</span>
                      <span>•</span>
                      <span className={transaction.category ? "" : "text-gray-400"}>{transaction.category || "Não preenchido"}</span>
                    </div>
                  </div>
                  <div className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
                    {transaction.type === "income" ? "+ " : "- "}
                    {formatBRL(transaction.amount)}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                variant='transactions'
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}