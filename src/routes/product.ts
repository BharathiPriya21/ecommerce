import express from 'express';
import { createProduct, getAllProduct, getProductById, updateProduct, deleteProduct } from '../controller/product-controller';
import {authenticateUser} from '../middlewares/auth';
import { productValidationSchema } from '../middlewares/validation';
import { handleValidationErrors } from '../middlewares/validation';
import multer from 'multer';
const upload=multer();
const router = express.Router();



router.post('/createProduct', upload.single('image'), productValidationSchema, handleValidationErrors, authenticateUser, createProduct);
router.get('/getAllProduct', authenticateUser, getAllProduct);
router.get('/getProductById/:id', authenticateUser, getProductById);
router.put('/updateProduct/:id', productValidationSchema, handleValidationErrors, authenticateUser, updateProduct);
router.delete('/deleteProduct/:id', authenticateUser, deleteProduct);


// router.post('/createProduct',productValidationSchema,authenticateUser, createProduct);
// router.get('/getAllProduct',authenticateUser, getAllProduct);
// router.get('/getProductById/:id',authenticateUser, getProductById);
// router.put('/updateProduct/:id',productValidationSchema,authenticateUser, updateProduct);
// router.delete('/deleteProduct/:id',authenticateUser, deleteProduct);

// router.post('/createProduct',createProduct);
// router.get('/getAllProduct',getAllProduct);
// router.get('/getProductById/:id',getProductById);
// router.put('/updateProduct/:id',updateProduct);
// router.delete('/deleteProduct/:id',deleteProduct);

export default router;
