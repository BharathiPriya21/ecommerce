import { Request, Response } from 'express';
import Product from '../model/product';
import {v2 as cloudinary} from 'cloudinary';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Create Product
export const createProduct = async (req: CustomRequest, res: Response): Promise<any> => {
  try {
    const user = req.user; 

         if (user?.role !== "Admin") {
            return res.status(400).json({
                status: false,
                message: "Only Admin can create product"
            });
        }

    const { title, description, price, stock, category } = req.body;

    if (!title || !price || !stock || !category) {
      res.status(400).json({ status: false, error: 'Title, price, stock, and category are required' });
      return;
    }
    
    if(req.file)
    {
      res.status(400).json({status:false,message:"product image is required"});

      const cloundinaryRes=await cloudinary.uploader.upload(req.file.path,{folder:'product'});
    }
    const newProduct = new Product({
      title,
      description,
      price,
      stock,
      category,
      
      adminId: user.userId
    });

    const savedProduct = await newProduct.save();
    res.status(201).json({ status: true, data: savedProduct });
  } catch (error: any) {
    console.error("Create Product Error:", error.message);
    res.status(500).json({ status: false, error: 'Server error' });
  }
};

// Get All Products
export const getAllProduct = async (_req: CustomRequest, res: Response): Promise<any> => {
  try {
    const products = await Product.find();
    res.status(200).json({
      status: true,
      message: "All products retrieved successfully",
      data: products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: 'Server error' });
  }
};

// Get Product By ID
export const getProductById = async (req: CustomRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const singleProduct = await Product.findById(id);

    if (!singleProduct) {
      res.status(404).json({ status: false, message: "Product not found" });
      return;
    }

    res.status(200).json({ status: true, message: "Product retrieved successfully", data: singleProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Invalid Product ID" });
  }
};

// Update Product (Admin only)
export const updateProduct = async (req: CustomRequest, res: Response): Promise<any> => {
  try {
    const user = req.user; 

         if (user?.role !== "Admin") {
            return res.status(400).json({
                status: false,
                message: "Only Admin can update product"
            });
        }


    const { id } = req.params;
    const { title, description, price, stock, category, image_url } = req.body;

    const updateFields: any = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (price) updateFields.price = price;
    if (stock) updateFields.stock = stock;
    if (category) updateFields.category = category;
    if (image_url) updateFields.image_url = image_url;

    const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, { new: true });

    if (!updatedProduct) {
      res.status(404).json({ status: false, message: "Product not found" });
      return;
    }

    res.status(200).json({ status: true, message: "Product updated successfully", data: updatedProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

// Delete Product (Admin only)
export const deleteProduct = async (req: CustomRequest, res: Response): Promise<any> => {
  try {
    const user = req.user; 

         if (user?.role !== "Admin") {
            return res.status(400).json({
                status: false,
                message: "Only Admin can delete product"
            });
        }

    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      res.status(404).json({ status: false, message: 'Product not found' });
      return;
    }

    res.status(200).json({ status: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};