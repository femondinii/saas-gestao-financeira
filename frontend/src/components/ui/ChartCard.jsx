import React from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend
} from 'recharts';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from './Card';
import { LoadingOverlay } from './Spinner';
import { EmptyState } from './EmptyState';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function ChartCard({
    type,
    data,
    title,
    description,
    icon,
    loading
}) {
    const renderChart = () => {
        switch (type) {
            case 'area':
                return (
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Area
                            type="monotone"
                            dataKey="income"
                            stroke="#3B82F6"
                            fillOpacity={1}
                            fill="url(#colorIncome)"
                            name="Receitas"
                        />
                        <Area
                            type="monotone"
                            dataKey="expenses"
                            stroke="#EF4444"
                            fillOpacity={1}
                            fill="url(#colorExpenses)"
                            name="Despesas"
                        />
                    </AreaChart>
                );

            case 'bar':
                return (
                    <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 50, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal opacity={0.3} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" scale="band" />
                        <Tooltip />
                        <Bar dataKey="value" name="Valor (R$)" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                );

            case 'line':
                return (
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`R$ ${value}`, 'Saldo']} />
                        <Line
                            type="monotone"
                            dataKey="balance"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            dot={{ r: 4, fill: "#3B82F6", strokeWidth: 2, stroke: "#FFFFFF" }}
                            activeDot={{ r: 6, fill: "#3B82F6", strokeWidth: 2, stroke: "#FFFFFF" }}
                            name="Saldo"
                        />
                    </LineChart>
                );

            case 'pie':
                return (
                    <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => `R$ ${value}`} />
                        <Legend
                            formatter={(_, entry) => {
                                return `${entry.payload.name}: ${entry.payload.percent}%`;
                            }}
                        />
                    </PieChart>
                );

            default:
                return <div>Tipo de gráfico não suportado</div>;
        }
    };

    const isEmpty = !data || (Array.isArray(data) && data.length === 0);

    return (
        <Card className="card-hover">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {React.cloneElement(icon, { className: "h-5 w-5 text-blue-500" })}
                    <span>{title}</span>
                </CardTitle>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <LoadingOverlay  />
                ) : isEmpty ? (
                    <EmptyState
                        variant="charts"
                    />
                ) : (
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            {renderChart()}
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}