import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api';
import { useAuthStore } from '@/store/authStore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner'

// Enum para categorías de negocio (como en tu backend)
const BusinessCategory = z.enum(['restaurant', 'retail', 'service', 'manufacturing', 'other']);

// Esquema de validación con Zod
const formSchema = z.object({
  email: z.string().email({ message: 'Email inválido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
  business: z.object({
    name: z.string().min(1, { message: 'El nombre del negocio es requerido.' }),
    category: BusinessCategory,
    currency: z.string().min(1, { message: 'La moneda es requerida (ej. USD, MXN).' }).toUpperCase(),
    timezone: z.string().min(1, { message: 'La zona horaria es requerida (ej. America/Mexico_City).' }),
  }),
  logo: z.any() // Aceptamos cualquier tipo de archivo, validaremos manualmente
    .refine((files) => files?.length == 1, 'La imagen del logo es requerida.')
    .refine((files) => files?.[0]?.size <= 5000000, `El tamaño máximo es 5MB.`)
    .refine(
      (files) => ['image/jpeg', 'image/png', 'image/webp'].includes(files?.[0]?.type),
      'Solo se aceptan formatos .jpg, .png y .webp.'
    ),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      business: {
        name: '',
        category: 'other',
        currency: 'USD',
        timezone: 'America/New_York',
      },
      logo: undefined,
    },
  });

  const fileRef = form.register("logo"); // Para manejar el input de archivo

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();

    // Añadir campos de texto
    formData.append('email', values.email);
    formData.append('password', values.password);
    // Enviar los campos del negocio por separado
    formData.append('business[name]', values.business.name);
    formData.append('business[category]', values.business.category);
    formData.append('business[currency]', values.business.currency);
    formData.append('business[timezone]', values.business.timezone);

    // Añadir el archivo
    if (values.logo && values.logo.length > 0) {
      formData.append('logo', values.logo[0]);
    }
    
    try {
      // Hacemos la petición con el header correcto para FormData
      const response = await apiClient.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data.success) {
        toast.success("¡Registro Exitoso!", {
          description: "Bienvenido. Redirigiendo a tu dashboard...",
        });
        setAuth(response.data.data);
        navigate('/');
      }
    } catch (error: any) {
      toast.error("Error en el registro", {
        description: error.response?.data?.message || "Ocurrió un error inesperado.",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Crear una Cuenta</CardTitle>
          <CardDescription>Completa el formulario para registrar tu negocio.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Sección de Cuenta de Usuario */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Datos de Acceso</h3>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="tu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sección de Datos del Negocio */}
              <div className="space-y-4 pt-4 border-t">
                 <h3 className="text-lg font-medium">Datos del Negocio</h3>
                 <FormField
                  control={form.control}
                  name="business.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Negocio</FormLabel>
                      <FormControl>
                        <Input placeholder="Mi Cafetería Increíble" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="business.category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría del Negocio</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                                <SelectItem value="restaurant">Restaurante</SelectItem>
                                <SelectItem value="retail">Retail/Tienda</SelectItem>
                                <SelectItem value="service">Servicios</SelectItem>
                                <SelectItem value="manufacturing">Manufactura</SelectItem>
                                <SelectItem value="other">Otro</SelectItem>
                           </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="business.currency"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Moneda</FormLabel>
                        <FormControl>
                            <Input placeholder="USD" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="business.timezone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Zona Horaria</FormLabel>
                        <FormControl>
                            <Input placeholder="America/New_York" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                  control={form.control}
                  name="logo"
                  render={() => (
                    <FormItem>
                      <FormLabel>Logo del Negocio</FormLabel>
                      <FormControl>
                        <Input type="file" {...fileRef} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Registrando..." : "Crear Cuenta"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            ¿Ya tienes una cuenta?{' '}
            <a onClick={() => navigate('/login')} className="underline cursor-pointer">
              Inicia sesión
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}