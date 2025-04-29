import { Request, Response } from 'express';
import CartModel from '../model/cart';
import ProductModel from '../model/product';
import { Types } from 'mongoose';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Add product to cart
export const addProduct = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      res.status(400).json({ status: false, message: "Product ID and quantity are required" });
      return; 
    }

    const product = await ProductModel.findById(productId);
    if (!product) {
      res.status(400).json({ status: false, message: "Product not found" });
      return;
    }

    const userId = new Types.ObjectId(req.user?.userId);

    let cart = await CartModel.findOne({ userId });

    if (!cart) {
      cart = new CartModel({ userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, price: product.price });
    }

    cart.totalValue = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cart.updatedAt = new Date();

    await cart.save();

    res.status(200).json({ status: true, data: cart });
  } catch (error) {
    console.error("Error in addProduct:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Update product quantity in cart
export const updateProductQuantity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || quantity === undefined) {
      res.status(400).json({ status: false, message: 'userId, productId and quantity are required' });
      return;
    }

    const cart = await CartModel.findOne({ userId: new Types.ObjectId(userId) }).populate('userId');

    if (!cart) {
      res.status(400).json({ status: false, message: 'Cart not found' });
      return;
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex === -1) {
      res.status(400).json({ status: false, message: 'Item not found in cart' });
      return;
    }

    cart.items[itemIndex].quantity = quantity;
    cart.totalValue = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    await cart.save();
    res.status(200).json({ status: true, data: cart });
  } catch (error) {
    console.error("Error in updateProductQuantity:", error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};


// Remove product from cart
export const removeProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      res.status(400).json({ status: false, message: 'userId and productId are required' });
      return;
    }

    const cart = await CartModel.findOne({ userId: new Types.ObjectId(userId) });

    if (!cart) {
      res.status(400).json({ status: false, message: 'Cart not found' });
      return;
    }

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    cart.totalValue = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    await cart.save();
    res.status(200).json({ status: true, data: cart });
  } catch (error) {
    console.error("Error in removeProduct:", error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};

// Get current cart item list
export const getCurrentCartItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ status: false, message: 'userId is required' });
      return;
    }

    const cart = await CartModel.findOne({ userId: new Types.ObjectId(userId) })
      .populate({
        path: 'items.productId',
        model: 'product',
        select: 'title price image_url'
      });

    if (!cart || cart.items.length === 0) {
      res.status(200).json({ status: true, items: [], totalValue: 0 });
      return;
    }

    const totalValue = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.status(200).json({ status: true, items: cart.items, totalValue });
  } catch (error) {
    console.error("Error in getCurrentCartItem:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};


