import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import apiClient from '@/api';
import type { IFinancialSummary, ISalesTrend, IExpenseAnalysis, IProduct, IProductPerformance } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { DollarSign } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading';
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Interfaz para los datos de Flujo de Caja
interface ICashFlowData {
  date: string;
  income: number;
  expenses: number;
  netCashFlow: number;
}

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

// Componente para Alertas de Stock Bajo
const LowStockAlerts = ({ data }: { data: IProduct[] }) => (
  <div className="lg:col-span-3">
    <Card>
      <CardHeader>
        <CardTitle>Alertas de Stock Bajo</CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ul className="space-y-2">
            {data.map(product => (
              <li key={product._id} className="flex justify-between items-center text-sm">
                <span>{product.name}</span>
                <span className="font-bold text-red-500">{product.stockQuantity} unidades</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">¡Todo el inventario está en orden!</p>
        )}
      </CardContent>
    </Card>
  </div>
);

// Componente para Rendimiento de Productos
const ProductPerformanceChart = ({ data }: { data: IProductPerformance[] }) => (
  <Card>
    <CardHeader><CardTitle>Productos Más Rentables</CardTitle></CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="productName" width={100} interval={0} />
          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          <Legend />
          <Bar dataKey="revenue" name="Ingresos" fill="#8884d8" />
          <Bar dataKey="profit" name="Ganancia" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

// Componente para Flujo de Caja
const CashFlowChart = ({ data }: { data: ICashFlowData[] }) => (
  <Card>
    <CardHeader><CardTitle>Flujo de Caja</CardTitle></CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          <Legend />
          <Line type="monotone" dataKey="income" name="Ingresos" stroke="#22c55e" />
          <Line type="monotone" dataKey="expenses" name="Gastos" stroke="#ef4444" />
          <Line type="monotone" dataKey="netCashFlow" name="Flujo Neto" stroke="#3b82f6" />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

// La página principal del Dashboard
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<IFinancialSummary | null>(null);
  const [salesTrends, setSalesTrends] = useState<ISalesTrend[]>([]);
  const [expenseAnalysis, setExpenseAnalysis] = useState<IExpenseAnalysis[]>([]);
  const [timePeriod, setTimePeriod] = useState<'daily' | 'monthly'>('monthly');
  const [lowStockProducts, setLowStockProducts] = useState<IProduct[]>([]);
  const [productPerformance, setProductPerformance] = useState<IProductPerformance[]>([]);
  const [cashFlow, setCashFlow] = useState<ICashFlowData[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Usar Promise.allSettled en lugar de Promise.all
      const results = await Promise.allSettled([
        apiClient.get('/transactions/summary'),
        apiClient.get(`/transactions/sales-trends?period=${timePeriod}`),
        apiClient.get('/analytics/expenses'),
        apiClient.get('/products/low-stock'),
        apiClient.get('/analytics/product-performance'),
        apiClient.get('/analytics/cash-flow')
      ]);

      // Procesar cada resultado individualmente
      if (results[0].status === 'fulfilled') setSummary(results[0].value.data.data);
      if (results[1].status === 'fulfilled') setSalesTrends(results[1].value.data.data);
      if (results[2].status === 'fulfilled') setExpenseAnalysis(results[2].value.data.data);
      if (results[3].status === 'fulfilled') setLowStockProducts(results[3].value.data.data);
      if (results[4].status === 'fulfilled') setProductPerformance(results[4].value.data.data);
      if (results[5].status === 'fulfilled') setCashFlow(results[5].value.data.data);

      // Mostrar errores individuales si los hay
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Error en la petición ${index}:`, result.reason);
          toast.error(`Error al cargar una parte del dashboard.`);
        }
      });

    } catch (error) {
      console.error("Error general fetching dashboard data:", error);
      toast.error("Error inesperado al cargar el Dashboard.");
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
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-4">
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
          </div>
          
          <LowStockAlerts data={lowStockProducts} />
        </div>
        
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <ProductPerformanceChart data={productPerformance} />
          <CashFlowChart data={cashFlow} />
        </div>
        
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
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