import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const url: string = process.env.MONGO_URL || '';

const connectDB = async (): Promise<void> => {
  try {
    const connect = await mongoose.connect(url);
    console.log("Database connected ::", connect.connection.name);
  } catch (error) {
    console.error("DB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
