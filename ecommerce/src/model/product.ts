import mongoose, { Document, Schema } from 'mongoose';

export interface Product extends Document {
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string;
  adminId:mongoose.Types.ObjectId;
  createdAt: Date;
}

const productSchema = new Schema<Product>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: { type: String, required: true },
  image_url: { type: String, required: true },
  adminId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<Product>('product', productSchema,'product');

