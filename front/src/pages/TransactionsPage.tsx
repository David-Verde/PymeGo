import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar as CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import apiClient from '@/api';
import { type ITransaction, TransactionType, PaymentMethod, type IProduct, type ICreateTransactionRequest } from '@/types';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Schema for a product within the transaction
const productInTransactionSchema = z.object({
  productId: z.string().min(1, 'Selecciona un producto'),
  quantity: z.coerce.number().min(1, 'La cantidad debe ser al menos 1'),
  unitPrice: z.coerce.number(),
  productName: z.string().optional(),
});

// Main form schema
const transactionFormSchema = z.object({
  type: z.nativeEnum(TransactionType),
  category: z.string().min(1, 'La categoría es requerida'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser positivo'),
  date: z.date({ required_error: "La fecha es requerida." }),
  paymentMethod: z.nativeEnum(PaymentMethod),
  description: z.string().optional(),
  products: z.array(productInTransactionSchema).optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [availableProducts, setAvailableProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "products",
  });

  const transactionType = form.watch('type');

  // Función centralizada para calcular el monto
  const calculateTotalAmount = (products: { productId: string; quantity: number }[]) => {
    return products.reduce((sum, p) => {
      const productDetails = availableProducts.find(ap => ap._id === p.productId);
      return sum + (productDetails ? productDetails.salePrice * p.quantity : 0);
    }, 0);
  };

  // Función para manejar la adición de un producto
  const handleAddProduct = () => {
    const newProduct = { productId: '', quantity: 1, unitPrice: 0 };
    append(newProduct);
  };
  
  // Función para manejar la eliminación de un producto
  const handleRemoveProduct = (index: number) => {
    const currentProducts = form.getValues('products') || [];
    const updatedProducts = currentProducts.filter((_, i) => i !== index);
    remove(index);
    const newTotal = calculateTotalAmount(updatedProducts);
    form.setValue('amount', newTotal, { shouldValidate: true });
  };

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [transRes, prodRes] = await Promise.all([
          apiClient.get('/transactions?limit=20'),
          apiClient.get('/products?limit=1000')
        ]);
        setTransactions(transRes.data.data || []);
        setAvailableProducts(prodRes.data.data || []);
      } catch (error) {
        toast.error("No se pudieron cargar los datos iniciales.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Observador para cambios en productos individuales (cantidad o producto seleccionado)
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name && (name.startsWith('products') || name === 'type')) {
        if (value.type === TransactionType.INCOME) {
          form.setValue('category', 'Venta de Productos', { shouldValidate: true });
const total = calculateTotalAmount((value.products || []).filter(p => p?.productId && p?.quantity) as { productId: string; quantity: number }[]);
          form.setValue('amount', total, { shouldValidate: true });
        } else if (value.type === TransactionType.WITHDRAWAL) {
          form.setValue('category', 'Retiro Personal', { shouldValidate: true });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, availableProducts]);

  const handleOpenDialog = () => {
    form.reset({
      type: TransactionType.EXPENSE,
      category: '',
      date: new Date(),
      paymentMethod: PaymentMethod.CASH,
      amount: 0,
      products: [],
    });
    replace([]);
    setIsDialogOpen(true);
  };

  const handleTransactionSubmit = async (values: TransactionFormValues) => {
    const payload: ICreateTransactionRequest = {
      ...values,
      date: values.date.toISOString(),
      products: values.type === TransactionType.INCOME ? values.products?.map(p => ({
        productId: p.productId,
        quantity: p.quantity,
        unitPrice: availableProducts.find(ap => ap._id === p.productId)?.salePrice || 0,
        totalPrice: (availableProducts.find(ap => ap._id === p.productId)?.salePrice || 0) * p.quantity
      })) : []
    };
    
    try {
      await apiClient.post('/transactions', payload);
      toast.success("Transacción creada correctamente.");
      setIsDialogOpen(false);
      const transRes = await apiClient.get('/transactions?limit=20');
      setTransactions(transRes.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "No se pudo crear la transacción.");
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transacciones</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog}>Crear Transacción</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nueva Transacción</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleTransactionSubmit)} className="space-y-4 py-4">
                {/* MAIN FIELDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value={TransactionType.INCOME}>Ingreso (Venta)</SelectItem>
                          <SelectItem value={TransactionType.EXPENSE}>Gasto</SelectItem>
                          <SelectItem value={TransactionType.WITHDRAWAL}>Retiro Personal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                      <FormLabel>Fecha</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Elige una fecha</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>

                {/* DYNAMIC PRODUCT SECTION */}
                {transactionType === TransactionType.INCOME && (
                  <div className="space-y-2 pt-4 border-t">
                    <h3 className="text-md font-medium">Productos Vendidos</h3>
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormField control={form.control} name={`products.${index}.productId`} render={({ field }) => (
                          <FormItem className="flex-1">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar producto..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                {availableProducts.map(p => (
                                 <SelectItem key={p._id} value={p._id as string}>
  {p.name} - ${p.salePrice.toFixed(2)}
</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}/>
                        <FormField control={form.control} name={`products.${index}.quantity`} render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="number" placeholder="Cant." className="w-20" {...field} min="1" />
                            </FormControl>
                          </FormItem>
                        )}/>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveProduct(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={handleAddProduct}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Añadir Producto
                    </Button>
                  </div>
                )}
                
                {/* FINAL FIELDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto Total</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} disabled={transactionType === TransactionType.INCOME} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      {transactionType === TransactionType.EXPENSE ? (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una categoría de gasto..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Servicios Publicos">Servicios Públicos (Luz, Agua)</SelectItem>
                            <SelectItem value="Renta">Renta / Alquiler</SelectItem>
                            <SelectItem value="Salarios">Salarios / Empleados</SelectItem>
                            <SelectItem value="Marketing">Marketing y Publicidad</SelectItem>
                            <SelectItem value="Compra de Inventario">Compra de Inventario</SelectItem>
                            <SelectItem value="Otro Gasto">Otro Gasto</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled 
                            value={transactionType === TransactionType.INCOME 
                              ? "Venta de Productos" 
                              : "Retiro Personal"}
                          />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pago</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value={PaymentMethod.CASH}>Efectivo</SelectItem>
                          <SelectItem value={PaymentMethod.CREDIT_CARD}>Tarjeta de Crédito</SelectItem>
                          <SelectItem value={PaymentMethod.DEBIT_CARD}>Tarjeta de Débito</SelectItem>
                         <SelectItem value={PaymentMethod.BANK_TRANSFER}>Transferencia</SelectItem>
                          <SelectItem value={PaymentMethod.OTHER}>Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción (Opcional)</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                
                <DialogFooter>
                  <Button type="submit" disabled={form.formState.isSubmitting}>Guardar</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="mt-4">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Cargando...</TableCell>
                </TableRow>
              ) : transactions.length > 0 ? (
                transactions.map((t) => (
                  <TableRow key={t._id}>
                    <TableCell className="font-medium capitalize">{t.type}</TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      ${t.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{format(new Date(t.date), 'dd/MM/yyyy')}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No hay transacciones.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Layout>
  );
}