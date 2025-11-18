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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../components/ui/Card";
import { StatsCard } from "../components/ui/StatsCard";
import ChartCard from "../components/ui/ChartCard";
import { useDashboardData } from "../hooks/useDashboardData";
import { formatBRL, formatPercentage, getTrend } from "../utils/formatters";
import { formatPtDate } from "../utils/date";
import { LoadingOverlay, SpinnerInline } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import TitlePage from "../components/layout/TitlePage";
import { Badge } from "../components/ui/Badge";

export default function DashboardPage() {
  const { stats, charts, loading } = useDashboardData();

  const formattedStats = useMemo(() => {
    if (!stats) return null;

    return {
      balance: formatBRL(stats.net_worth),
      income: formatBRL(stats.income.current),
      expenses: formatBRL(stats.expenses.current),
      incomePercentage: formatPercentage(stats.income.change_pct),
      expensesPercentage: formatPercentage(stats.expenses.change_pct),
      incomeTrend: getTrend(stats.income.change_pct),
      expenseTrend: getTrend(stats.expenses.change_pct),
      asOf: formatPtDate(stats.as_of)
    };
  }, [stats]);

  const chartData = useMemo(() => {
    if (!charts) {
      return {
        monthly: [],
        categories: [],
        balance: [],
        incomeSources: [],
        recent: []
      };
    }

    return {
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
    };
  }, [charts]);

  return (
    <div className="space-y-6 animate-fade-in pb-6">
      <TitlePage
        title="Dashboard"
        subtitle="Visão geral das suas finanças pessoais"
      />
      <div className="grid gap-4 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Saldo Atual"
          value={formattedStats?.balance}
          description={
            formattedStats ? (
              `Atualizado em ${formattedStats.asOf}`
            ) : (
              <SpinnerInline />
            )
          }
          icon={<Wallet />}
        />
        <StatsCard
          title="Renda Mensal"
          value={formattedStats?.income}
          percentage={formattedStats?.incomePercentage}
          trend={formattedStats?.incomeTrend}
          description="vs. mês anterior"
          icon={<TrendingUp />}
          valueClassName="text-green-600"
        />
        <StatsCard
          title="Despesas Mensais"
          value={formattedStats?.expenses}
          percentage={formattedStats?.expensesPercentage}
          trend={formattedStats?.expenseTrend}
          description="vs. mês anterior"
          icon={<TrendingDown />}
          valueClassName="text-red-600"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-12">
        <div className="space-y-4 md:col-span-7">
          <ChartCard
            type="area"
            data={chartData.monthly}
            title="Fluxo de Caixa Mensal"
            description="Comparativo de receitas e despesas dos últimos 6 meses"
            icon={<BarChart3 />}
            loading={loading.charts}
            className="h-[260px] sm:h-[320px]"
          />
          <ChartCard
            type="line"
            data={chartData.balance}
            title="Evolução do Saldo"
            description="Crescimento do saldo nos últimos 6 meses"
            icon={<LineChartIcon />}
            loading={loading.charts}
            className="h-[260px] sm:h-[320px]"
          />
        </div>
        <div className="md:col-span-5">
          <Card className="h-full card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <span>Transações Recentes</span>
              </CardTitle>
              <CardDescription>
                Últimas 10 movimentações financeiras
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[360px] sm:max-h-[480px] lg:max-h-[890px] overflow-auto">
              {loading.charts ? (
                <LoadingOverlay />
              ) : chartData.recent.length > 0 ? (
                chartData.recent.map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div
                        className={
                          transaction.description
                            ? "font-semibold"
                            : "text-gray-400"
                        }
                      >
                        {transaction.description || "Não preenchido"}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                        <span>{transaction.date}</span>
                        <span>•</span>
                        <Badge tone={transaction.category ? "neutral" : "default"}>
                          {transaction.category || "Não preenchido"}
                        </Badge>
                      </div>
                    </div>
                    <div
                      className={`text-sm sm:text-base font-semibold ${
                        transaction.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+ " : "- "}
                      {formatBRL(transaction.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState variant="transactions" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          type="pie"
          data={chartData.incomeSources}
          title="Receitas por Fonte"
          description="Distribuição de receitas por origem"
          icon={<PieChart />}
          loading={loading.charts}
        />
        <ChartCard
          type="bar"
          data={chartData.categories}
          title="Despesas por Categoria"
          description="Distribuição de gastos do mês atual"
          icon={<DollarSign />}
          loading={loading.charts}
        />
      </div>
    </div>
  );
}
