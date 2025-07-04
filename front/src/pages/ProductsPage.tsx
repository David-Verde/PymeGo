import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import apiClient from '@/api';
import type { IProduct, IApiResponse, IPagination } from '@/types';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";

// Esquema de validación mejorado
const productFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  category: z.string().min(1, 'La categoría es requerida'),
  costPrice: z.coerce.number().min(0.01, 'El precio de costo debe ser positivo'),
  salePrice: z.coerce.number().min(0.01, 'El precio de venta debe ser positivo'),
  stockQuantity: z.coerce.number().int().min(0, 'El stock debe ser un número entero no negativo'),
  lowStockThreshold: z.coerce.number().int().min(0, 'El umbral debe ser un número entero no negativo').optional(),
}).refine(data => data.salePrice >= data.costPrice, {
  message: "El precio de venta debe ser mayor o igual al costo",
  path: ["salePrice"],
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [pagination, setPagination] = useState<IPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      category: '',
      costPrice: 0,
      salePrice: 0,
      stockQuantity: 0,
      lowStockThreshold: 10,
    },
  });

  // Resetear formulario cuando se abre/cierra el diálogo
  useEffect(() => {
    if (!isDialogOpen) {
      form.reset();
      setEditingProduct(null);
    }
  }, [isDialogOpen, form]);

  // Cargar datos del producto a editar
  useEffect(() => {
    if (editingProduct && isDialogOpen) {
      form.reset({
        name: editingProduct.name,
        category: editingProduct.category,
        costPrice: editingProduct.costPrice,
        salePrice: editingProduct.salePrice,
        stockQuantity: editingProduct.stockQuantity,
        lowStockThreshold: editingProduct.lowStockThreshold,
      });
    }
  }, [editingProduct, isDialogOpen, form]);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiClient.get<IApiResponse<{ data: IProduct[], pagination: IPagination }>>(
        `/products?page=${page}&limit=10`
      );
      
      if (response.data.success) {
        setProducts(response.data.data || []);
        setPagination(response.data.pagination || null);
        setCurrentPage(page);
      }
    } catch (error) {
      toast.error('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (values: ProductFormValues) => {
    try {
      if (editingProduct) {
        // Actualizar producto existente
        await apiClient.put(`/products/${editingProduct._id}`, values);
        toast.success('Producto actualizado correctamente');
      } else {
        // Crear nuevo producto
        await apiClient.post('/products', values);
        toast.success('Producto creado correctamente');
      }
      
      setIsDialogOpen(false);
      fetchProducts(currentPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ocurrió un error al guardar el producto');
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await apiClient.delete(`/products/${productId}`);
      toast.success('Producto eliminado correctamente');
      fetchProducts(currentPage);
    } catch (error) {
      toast.error('No se pudo eliminar el producto');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Productos</h1>
            <p className="text-muted-foreground">Gestiona tu inventario de productos</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            Crear Producto
          </Button>
        </div>

        {/* Diálogo para crear/editar producto */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct 
                  ? 'Modifica los detalles del producto' 
                  : 'Completa los campos para añadir un nuevo producto'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Café Americano" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Bebidas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Costo</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Venta</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lowStockThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Umbral bajo stock</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <LoadingSpinner className="mr-2" />
                    ) : editingProduct ? (
                      'Actualizar Producto'
                    ) : (
                      'Crear Producto'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Tabla de productos */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length > 0 ? (
                      products.map((product) => (
                        <TableRow key={product._id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell className="text-right">
                            ${product.salePrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {product.stockQuantity}
                              {product.stockQuantity <= (product.lowStockThreshold || 10) && (
                                <Badge variant="destructive">Bajo Stock</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingProduct(product);
                                    setIsDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDelete(product._id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No se encontraron productos
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Paginación */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center justify-end space-x-2 p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchProducts(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm">
                      Página {currentPage} de {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchProducts(currentPage + 1)}
                      disabled={currentPage >= pagination.pages}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}