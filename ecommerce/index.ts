import dotenv from 'dotenv';
import express from 'express';
import connectDB from './src/config/dbconfig';
import userRoutes from './src/routes/user';
import productRoutes from './src/routes/product';
import cartRoutes from './src/routes/cart';
import orderRoutes from './src/routes/order';

dotenv.config();

const app = express();
const PORT=process.env.PORT || 3000;

connectDB();

app.use(express.json());

app.use('/api/user', userRoutes);
app.use('/api/product', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
