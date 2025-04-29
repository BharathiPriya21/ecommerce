import express from 'express';
import { addProduct,updateProductQuantity, removeProduct, getCurrentCartItem } from '../controller/cart-controller';
import { authenticateUser } from '../middlewares/auth';
import { cartValidationSchema } from '../middlewares/validation';
import { handleValidationErrors } from '../middlewares/validation';

const router = express.Router();

// router.post('/addProduct',cartValidationSchema, authenticateUser, addProduct);
// router.put('/updateProductAndQuantity',cartValidationSchema,authenticateUser, updateProductQuantity);
// router.delete('/removeProduct',authenticateUser, removeProduct);
// router.get('/getCurrentItem',authenticateUser, getCurrentCartItem);

// router.post('/addProduct',authenticateUser,addProduct);
// router.put('/updateProductAndQuantity',authenticateUser, updateProductQuantity);
// router.delete('/removeProduct',authenticateUser, removeProduct);
// router.get('/getCurrentItem',authenticateUser, getCurrentCartItem);

router.post('/addProduct', cartValidationSchema, handleValidationErrors, authenticateUser, addProduct);
router.put('/updateProductAndQuantity', cartValidationSchema, handleValidationErrors, authenticateUser, updateProductQuantity);
router.delete('/removeProduct', authenticateUser, removeProduct);
router.get('/getCurrentItem', authenticateUser, getCurrentCartItem);


export default router;