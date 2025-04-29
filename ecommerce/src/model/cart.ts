import mongoose, { Document, Schema } from 'mongoose';

export interface CartItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface Cart extends Document {
  userId: mongoose.Types.ObjectId;
  items: CartItem[];
  totalValue: number;
  updatedAt: Date;
}

const cartSchema = new Schema<Cart>({
  userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  items: [
    {
      productId: { type: Schema.Types.ObjectId, ref: 'product', required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],
  totalValue: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<Cart>('cart', cartSchema,'cart');











