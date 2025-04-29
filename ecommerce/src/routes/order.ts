import express from 'express';
import {placeOrder,getPastOrder, getOrderForAdminProducts, viewAllProducts} from '../controller/order-controller'
import { authenticateUser } from '../middlewares/auth';

const router = express.Router();

router.post('/placeOrder',authenticateUser,placeOrder);
router.get('/getPastOrder',authenticateUser,getPastOrder);
router.get('/viewAllProducts',authenticateUser,viewAllProducts)

router.get('/getAdminOrders/id',authenticateUser,getOrderForAdminProducts);

export default router;
