// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import { Business } from './models/Business';
import { Product } from './models/Product';
import { Transaction} from './models/Transaction';
import { TransactionType, PaymentMethod } from './types/index';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI!;

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB para el seeding...');

        // --- Limpiar datos anteriores del usuario de prueba ---
        const testUser = await User.findOne({ email: 'test@gmail.com' });
        if (testUser) {
            const business = await Business.findOne({ userId: testUser._id });
            if (business) {
                await Product.deleteMany({ businessId: business._id });
                await Transaction.deleteMany({ businessId: business._id });
                await Business.deleteOne({ _id: business._id });
            }
            await User.deleteOne({ _id: testUser._id });
            console.log('🧹 Usuario de prueba anterior y sus datos han sido eliminados.');
        }

        // --- 1. Crear el usuario de prueba ---
        const newUser = await User.create({
            email: 'test@gmail.com',
            password: '123456', // La contraseña se hasheará automáticamente por el hook del modelo
        });
        console.log('👤 Usuario de prueba creado.');

        // --- 2. Crear el negocio de prueba ---
        const newBusiness = await Business.create({
            userId: newUser._id,
            name: 'Restaurant TEST',
            category: 'restaurant',
            currency: 'USD',
            timezone: 'America/New_York',
            logoUrl: 'https://res.cloudinary.com/demo/image/upload/w_100,h_100,c_thumb,g_face,r_max/smiling_man.jpg' // Un logo de ejemplo
        });
        console.log('🏢 Negocio de prueba creado.');
        const businessId = newBusiness._id;

        // --- 3. Crear productos de prueba ---
        const productsData = [
            { name: 'Pizza Margarita', category: 'Pizzas', costPrice: 4.5, salePrice: 10.0, stockQuantity: 100 },
            { name: 'Pizza Pepperoni', category: 'Pizzas', costPrice: 5.5, salePrice: 12.0, stockQuantity: 100 },
            { name: 'Hamburguesa Clásica', category: 'Hamburguesas', costPrice: 3.0, salePrice: 8.0, stockQuantity: 80 },
            { name: 'Papas Fritas', category: 'Acompañantes', costPrice: 1.0, salePrice: 3.5, stockQuantity: 200 },
            { name: 'Aros de Cebolla', category: 'Acompañantes', costPrice: 1.2, salePrice: 4.0, stockQuantity: 150 },
            { name: 'Ensalada César', category: 'Ensaladas', costPrice: 3.5, salePrice: 7.5, stockQuantity: 50 },
            { name: 'Coca-Cola', category: 'Bebidas', costPrice: 0.8, salePrice: 2.5, stockQuantity: 300 },
            { name: 'Agua Mineral', category: 'Bebidas', costPrice: 0.5, salePrice: 2.0, stockQuantity: 300 },
            { name: 'Cerveza Nacional', category: 'Bebidas', costPrice: 1.2, salePrice: 3.0, stockQuantity: 150 },
            { name: 'Jugo de Naranja', category: 'Bebidas', costPrice: 1.0, salePrice: 3.0, stockQuantity: 100 },
            { name: 'Tiramisú', category: 'Postres', costPrice: 2.5, salePrice: 6.0, stockQuantity: 40 },
            { name: 'Cheesecake', category: 'Postres', costPrice: 2.8, salePrice: 6.5, stockQuantity: 40 },
            { name: 'Café Espresso', category: 'Café', costPrice: 0.7, salePrice: 2.0, stockQuantity: 200 },
            { name: 'Alitas BBQ (6u)', category: 'Entradas', costPrice: 3.0, salePrice: 7.0, stockQuantity: 100 },
            { name: 'Nachos con Queso', category: 'Entradas', costPrice: 2.5, salePrice: 6.0, stockQuantity: 90 },
        ];
        
        const createdProducts = await Product.insertMany(productsData.map(p => ({ ...p, businessId })));
        console.log(`📦 ${createdProducts.length} productos creados.`);

        // --- 4. Crear transacciones de prueba ---
      const transactionsToCreate = [];
const today = new Date();

// Generar 90 días de transacciones
for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    // Generar entre 2 y 5 ventas por día
    for (let j = 0; j < Math.floor(Math.random() * 4) + 2; j++) {
        const productsInSale = [];
        let totalAmount = 0;
        // Vender entre 1 y 3 productos diferentes por transacción
        for (let k = 0; k < Math.floor(Math.random() * 3) + 1; k++) {
            const product = createdProducts[Math.floor(Math.random() * createdProducts.length)]!;
            const quantity = Math.floor(Math.random() * 3) + 1;
            productsInSale.push({
                productId: product._id,
                quantity,
                unitPrice: product.salePrice,
                totalPrice: product.salePrice * quantity,
            });
            totalAmount += product.salePrice * quantity;
        }
        
        transactionsToCreate.push({
            businessId,
            type: TransactionType.INCOME,
            category: 'Venta de Productos',
            amount: totalAmount,
            date,
            paymentMethod: PaymentMethod.CASH,
            products: productsInSale
        });
    }
}

        // Generar gastos fijos mensuales (Luz, Agua, Renta, Salarios)
        const expenseCategories = [
            { category: 'Servicios Publicos', amount: 350 },
            { category: 'Renta', amount: 1200 },
            { category: 'Salarios', amount: 2500 },
            { category: 'Marketing', amount: 200 },
        ];

        for (let i = 0; i < 3; i++) { // Para los últimos 3 meses
            for (const expense of expenseCategories) {
                const date = new Date(today);
                date.setMonth(today.getMonth() - i);
                date.setDate(5); // Pagar el 5 de cada mes
                transactionsToCreate.push({
                    businessId,
                    type: TransactionType.EXPENSE,
                    category: expense.category,
                    amount: expense.amount + (Math.random() * 50 - 25), // Pequeña variación
                    date,
                    paymentMethod: PaymentMethod.BANK_TRANSFER
                });
            }
        }

        await Transaction.insertMany(transactionsToCreate);
        console.log(`🧾 ${transactionsToCreate.length} transacciones creadas.`);

        console.log('🎉 ¡Base de datos sembrada con éxito!');
        
    } catch (error) {
        console.error('❌ Error al sembrar la base de datos:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB.');
    }
};

seedDatabase();