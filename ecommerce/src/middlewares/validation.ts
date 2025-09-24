
import { check, validationResult } from 'express-validator';
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Cart Validation 
export const cartValidationSchema = [
    
    check('items.*.productId')
        .exists().withMessage('productId is required in each item')
        .isMongoId().withMessage('productId must be a valid MongoDB objectId'),

    check('items.*.quantity')
        .exists().withMessage('quantity is required in each item')
        .isInt({ min: 1 }).withMessage('quantity must be a positive integer'),

    
];

// Product Validation 
export const productValidationSchema = [
    check('title')
        .exists().withMessage('title is required')
        .isString().withMessage('title must be a string')
        .isLength({ min: 1, max: 50 }).withMessage('title must be within 1-50')
        .trim(),

    check('description')
        .exists().withMessage('description is required')
        .isString().withMessage('description must be a string')
        .isLength({ min: 1, max: 500 }).withMessage('description must be within 1-500'),

    check('price')
        .exists().withMessage('price is required')
        .isFloat({ min: 0 }).withMessage('price must be a positive number'),

    check('stock')
        .exists().withMessage('stock is required')
        .isInt({ min: 0 }).withMessage('stock should not be a negative integer'),

    check('category')
        .exists().withMessage('category is required')
        .isString().withMessage('category must be a string')
        .trim(),

    check('image_url')
        .exists().withMessage('image_url is required')
        .isURL().withMessage('image_url must be a valid url')
        .trim(),
];

export const handleValidationErrors: RequestHandler = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ error: errors.array() });
        return;
    }
    next();
};
