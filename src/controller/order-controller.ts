import { Request, Response } from 'express';
import OrderModel from '../model/order';
import CartModel from '../model/cart';
import ProductModel from '../model/product';
import { Types } from 'mongoose';
import product from '../model/product';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Place an Order
export const placeOrder = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ status: false, message: "userId is required" });
      return;
    }

    const userObjectId = new Types.ObjectId(userId);

    const cart = await CartModel.findOne({ userId: userObjectId });

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ status: false, message: "Cart is empty" });
      return;
    }

    const newOrder = new OrderModel({
      userId: userObjectId,
      items: cart.items,
      totalAmount: cart.totalValue,
      placedAt: new Date(),
      status: 'Pending'
    });

    await newOrder.save();

    await cart.save();

    res.status(200).json({ status: true, message: "Order placed successfully" });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Get Past Orders
export const getPastOrder = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ status: false, message: "userId is required" });
      return;
    }

    const userObjectId = new Types.ObjectId(userId);

    const orders = await OrderModel.find({ userId: userObjectId }).populate('items.productId');

    if (!orders || orders.length === 0) {
      res.status(200).json({ status: true, message: "No past orders found", data: [] });
      return;
    }

    res.status(200).json({
      status: true,
      message: "Orders retrieved successfully",
      data: orders
    });
  } catch (error) {
    console.error("Error fetching past orders:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

//admin 
export const getOrderForAdminProducts=async(req:CustomRequest,res:Response):Promise<any>=>
  {
   try
   {
    const adminId=req.body;
  
    if(!adminId)
    {
      return res.status(409).json({status:false,message:"adminId not found"});
    }

    const adminProductIds = await ProductModel.find({ adminId: new Types.ObjectId(adminId) }).select('_id');
  
      if (!adminProductIds || adminProductIds.length === 0) {
        res.status(404).json({ status: false, message: 'no products found for admin' });
        return;
      }
  
      const productIds = adminProductIds.map(product => product._id);

       const orders=await OrderModel.find(
        {
          productIds:{ $in:productIds}
        })
        .populate({
          path:'productId',
          select:('title price image_url')
        }).select('userId productId quantity shippingAddress name phoneNumber totalAmount status')

        if(!orders)
        {
          return res.status(409).json({status:true,message:"no orders found from this user"})
        }
        return res.status(200).json({status:true,message:"orders retrived successfully"});
  
  
   }catch(error)
   {
    console.log(error);
    return res.status(500).json({status:false,message:"Internal server error"});
   }
  }

  //userCan viewall admin product
  export const viewAllProducts=async(req:CustomRequest,res:Response):Promise<any> =>
  {
    try{
      const products=await ProductModel.find()
      .select('title description price image_url')
      .populate({
        path:'adminId',
        select:'name email'
      });
      
      return res.status(200).json({status:true,message:'products retrived successfully',data:products});

    }catch(error)
    {
      console.log(error)
      return res.status(500).json({status:false,message:'Internal server error'})
    }
  }