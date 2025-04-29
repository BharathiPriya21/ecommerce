import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import User from '../model/user';

dotenv.config();

const JWT_SECURITY_KEY = process.env.JWT_SECURITY_KEY as string;

interface CustomRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// User Registration
export const registration = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phoneNo, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ status: false, message: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      phoneNo,
      password: hashedPassword,
      role,
    });

    await newUser.save();
    res.status(200).json({ status: true, message: 'Registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

// User Login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ status: false, message: 'Email and password are required' });
      return;
    }

    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      res.status(400).json({ status: false, message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      res.status(400).json({ status: false, message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: foundUser._id, role: foundUser.role },
      JWT_SECURITY_KEY,
    //   { expiresIn: '1d' }
    );

    res.status(200).json({ status: true, message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};



