import mongoose, { Document, Schema } from 'mongoose';

interface OrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

interface ShippingAddress {
  street?: string;
  city?: string;
  state?: string;
  pinCode?: number;
  country?: string;
}

export interface Order extends Document {
  userId: mongoose.Types.ObjectId;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress: ShippingAddress; 
  paymentMethod?: string;
  placedAt: Date;
}

const orderSchema = new Schema<Order>({
  userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  items: [
    {
      productId: { type: Schema.Types.ObjectId, ref: 'product', required: true },
      quantity: { type: Number, required: true }
    }
  ],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  shippingAddress: {
    street: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    pinCode: { type: Number, required: false },
    country: { type: String, required: false }
  },
  paymentMethod: { type: String, required: false },
  placedAt: { type: Date, default: Date.now }
});


export default mongoose.model<Order>('order', orderSchema,'order');
