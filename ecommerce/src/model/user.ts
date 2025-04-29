import mongoose, { Document, Schema } from 'mongoose';

interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  pinCode?: number;
  country?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phoneNo: number;
  password: string;
  role: 'Customer' | 'Admin';
  address: IAddress;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNo: { type: Number, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Customer', 'Admin'], default: 'Customer' },
  address: {
    street: String,
    city: String,
    state: String,
    pinCode: Number,
    country: String
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('user', userSchema,'user');

