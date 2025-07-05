import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import apiClient from '@/api';
import type { IFinancialSummary, ISalesTrend, IExpenseAnalysis } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading';
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Componente para el resumen financiero
const FinancialSummary = ({ data }: { data: IFinancialSummary | null }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${data?.totalIncome?.toFixed(2) || '0.00'}</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-red-500">${data?.totalExpenses?.toFixed(2) || '0.00'}</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-500">${data?.netProfit?.toFixed(2) || '0.00'}</div>
      </CardContent>
    </Card>
  </div>
);

// Componente para el gráfico de tendencias de ventas
const SalesTrendChart = ({ data }: { data: ISalesTrend[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
      <Legend />
      <Line 
        type="monotone" 
        dataKey="sales" 
        name="Ventas" 
        stroke="#8884d8" 
        activeDot={{ r: 8 }} 
      />
    </LineChart>
  </ResponsiveContainer>
);

// Componente para el gráfico de análisis de gastos
const ExpenseAnalysisChart = ({ data }: { data: IExpenseAnalysis[] }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
    label={({ name, percent }) => 
  `${name}: ${percent ? (percent * 100).toFixed(0) : '0'}%`
}
          outerRadius={80}
          fill="#8884d8"
          dataKey="amount"
          nameKey="category"
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

// La página principal del Dashboard
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<IFinancialSummary | null>(null);
  const [salesTrends, setSalesTrends] = useState<ISalesTrend[]>([]);
  const [expenseAnalysis, setExpenseAnalysis] = useState<IExpenseAnalysis[]>([]);
  const [timePeriod, setTimePeriod] = useState<'daily' | 'monthly'>('monthly');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, salesRes, expensesRes] = await Promise.all([
        apiClient.get('/transactions/summary'),
        apiClient.get(`/transactions/sales-trends?period=${timePeriod}`),
        apiClient.get('/analytics/expenses')
      ]);

      setSummary(summaryRes.data.data);
      setSalesTrends(salesRes.data.data);
      setExpenseAnalysis(expensesRes.data.data);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Error al cargar el Dashboard", {
        description: "No se pudieron obtener los datos. Intenta de nuevo más tarde."
      });
    } finally {
      setLoading(false);
    }
  }, [timePeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        <FinancialSummary data={summary} />
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tendencia de Ventas</CardTitle>
              <ToggleGroup 
                type="single" 
                value={timePeriod} 
                onValueChange={(value) => { 
                  if (value) setTimePeriod(value as 'daily' | 'monthly');
                }}
              >
                <ToggleGroupItem value="daily" aria-label="Ver por día">
                  Diario
                </ToggleGroupItem>
                <ToggleGroupItem value="monthly" aria-label="Ver por mes">
                  Mensual
                </ToggleGroupItem>
              </ToggleGroup>
            </CardHeader>
            <CardContent>
              <SalesTrendChart data={salesTrends} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Gastos por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseAnalysisChart data={expenseAnalysis} />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}