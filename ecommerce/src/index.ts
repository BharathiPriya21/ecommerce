import dotenv from 'dotenv';
import express from 'express';
import connectDB from './config/dbconfig';
import userRoutes from './routes/user';
import productRoutes from './routes/product';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/order';

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
