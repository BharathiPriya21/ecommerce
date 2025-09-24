/**
 * Unit tests for product-controller.ts
 * Framework: Jest (TypeScript via ts-jest if configured)
 *
 * We test:
 * - createProduct (admin/non-admin, missing fields, with/without image file, persistence success/failure)
 * - getAllProduct (happy path, error path)
 * - getProductById (found/not found, invalid id)
 * - updateProduct (admin gate, partial updates, not found, error)
 * - deleteProduct (admin gate, delete success, not found, error)
 *
 * External deps mocked: Product model, cloudinary, Express Response.
 */

import { Request, Response } from 'express';
import { createProduct, getAllProduct, getProductById, updateProduct, deleteProduct } from '../product-controller';

// Mock Product model and cloudinary
jest.mock('../../model/product', () => {
  const m: any = function(data?: any) {
    return {
      ...data,
      save: jest.fn(),
    };
  };
  // Attach static methods expected by controller
  m.find = jest.fn();
  m.findById = jest.fn();
  m.findByIdAndUpdate = jest.fn();
  m.findByIdAndDelete = jest.fn();
  return { __esModule: true, default: m };
});

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
    },
  },
}));

import Product from '../../model/product';
import { v2 as cloudinary } from 'cloudinary';

type CustomReq = Partial<Request> & {
  user?: { userId: string; email?: string; role?: string };
  file?: { path: string };
  body?: any;
  params?: any;
};

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response & {
    status: jest.Mock;
    json: jest.Mock;
  };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createProduct', () => {
  const baseBody = { title: 'T', description: 'D', price: 10, stock: 5, category: 'C' };

  test('returns 400 for non-admin user', async () => {
    const req: CustomReq = { user: { userId: 'u1', role: 'User' }, body: baseBody };
    const res = mockRes();

    await createProduct(req as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Only Admin can create product',
    });
  });

  test('returns 400 when required fields are missing', async () => {
    const req: CustomReq = { user: { userId: 'a1', role: 'Admin' }, body: { title: '', price: null, stock: null, category: '' } };
    const res = mockRes();

    await createProduct(req as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      error: 'Title, price, stock, and category are required',
    });
  });

  test('if req.file present: responds 400 and attempts cloud upload (as per current logic)', async () => {
    // Note: Current implementation responds 400 "product image is required" when req.file exists,
    // then still proceeds to call cloudinary.uploader.upload. This test documents that behavior.
    const req: CustomReq = {
      user: { userId: 'a1', role: 'Admin' },
      body: baseBody,
      file: { path: '/tmp/img.jpg' },
    };
    const res = mockRes();
    (cloudinary.uploader.upload as jest.Mock).mockResolvedValue({ secure_url: 'https://cdn.example.com/p.jpg' });

    // Set up instance save mock
    const instance = { save: jest.fn().mockResolvedValue({ _id: 'p1' }) };
    // Mock Product constructor to return instance with save
    (Product as unknown as jest.Mock).mockImplementation(() => instance);

    await createProduct(req as any, res);

    // First: responds 400
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ status: false, message: 'product image is required' });

    // And also calls cloudinary upload according to current code path
    expect(cloudinary.uploader.upload).toHaveBeenCalledWith('/tmp/img.jpg', { folder: 'product' });
  });

  test('happy path: admin creates product successfully without image file', async () => {
    const req: CustomReq = { user: { userId: 'a1', role: 'Admin' }, body: baseBody };
    const res = mockRes();

    const saved = { _id: 'p1', ...baseBody, image_url: undefined, adminId: 'a1' };
    const instance = { save: jest.fn().mockResolvedValue(saved) };
    (Product as unknown as jest.Mock).mockImplementation(() => instance);

    await createProduct(req as any, res);

    // Ensure Product was called with expected data
    expect(Product).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'T',
        description: 'D',
        price: 10,
        stock: 5,
        category: 'C',
        image_url: undefined,
        adminId: 'a1',
      })
    );
    expect(instance.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ status: true, data: saved });
  });

  test('server error path returns 500', async () => {
    const req: CustomReq = { user: { userId: 'a1', role: 'Admin' }, body: baseBody };
    const res = mockRes();

    const instance = { save: jest.fn().mockRejectedValue(new Error('db down')) };
    (Product as unknown as jest.Mock).mockImplementation(() => instance);

    await createProduct(req as any, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Server error' });
  });
});

describe('getAllProduct', () => {
  test('returns all products on success', async () => {
    const res = mockRes();
    const products = [{ _id: '1' }, { _id: '2' }];
    (Product.find as jest.Mock).mockResolvedValue(products);

    await getAllProduct({} as any, res);

    expect(Product.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      message: 'All products retrieved successfully',
      data: products,
    });
  });

  test('returns 500 on error', async () => {
    const res = mockRes();
    (Product.find as jest.Mock).mockRejectedValue(new Error('boom'));

    await getAllProduct({} as any, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ status: false, error: 'Server error' });
  });
});

describe('getProductById', () => {
  test('returns 200 with product when found', async () => {
    const res = mockRes();
    (Product.findById as jest.Mock).mockResolvedValue({ _id: 'p1' });

    await getProductById({ params: { id: 'p1' } } as any, res);

    expect(Product.findById).toHaveBeenCalledWith('p1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      message: 'Product retrieved successfully',
      data: { _id: 'p1' },
    });
  });

  test('returns 404 when product not found', async () => {
    const res = mockRes();
    (Product.findById as jest.Mock).mockResolvedValue(null);

    await getProductById({ params: { id: 'nope' } } as any, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ status: false, message: 'Product not found' });
  });

  test('returns 500 when invalid id or error occurs', async () => {
    const res = mockRes();
    (Product.findById as jest.Mock).mockRejectedValue(new Error('CastError'));

    await getProductById({ params: { id: 'badid' } } as any, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ status: false, message: 'Invalid Product ID' });
  });
});

describe('updateProduct', () => {
  test('non-admin returns 400', async () => {
    const res = mockRes();
    const req: CustomReq = { user: { userId: 'u1', role: 'User' }, params: { id: 'p1' }, body: { title: 'New' } };

    await updateProduct(req as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Only Admin can update product',
    });
  });

  test('admin updates only provided fields', async () => {
    const res = mockRes();
    const req: CustomReq = {
      user: { userId: 'a1', role: 'Admin' },
      params: { id: 'p1' },
      body: { title: 'New', price: 99 },
    };
    const updated = { _id: 'p1', title: 'New', price: 99 };

    (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

    await updateProduct(req as any, res);

    expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ title: 'New', price: 99 }),
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: true,
      message: 'Product updated successfully',
      data: updated,
    });
  });

  test('returns 404 when product not found', async () => {
    const res = mockRes();
    const req: CustomReq = {
      user: { userId: 'a1', role: 'Admin' },
      params: { id: 'nope' },
      body: { title: 'X' },
    };
    (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

    await updateProduct(req as any, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ status: false, message: 'Product not found' });
  });

  test('returns 500 on error', async () => {
    const res = mockRes();
    const req: CustomReq = {
      user: { userId: 'a1', role: 'Admin' },
      params: { id: 'p1' },
      body: { title: 'X' },
    };
    (Product.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('db err'));

    await updateProduct(req as any, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ status: false, message: 'Server error' });
  });
});

describe('deleteProduct', () => {
  test('non-admin returns 400', async () => {
    const res = mockRes();
    const req: CustomReq = { user: { userId: 'u1', role: 'User' }, params: { id: 'p1' } };

    await deleteProduct(req as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Only Admin can delete product',
    });
  });

  test('admin deletes successfully', async () => {
    const res = mockRes();
    const req: CustomReq = { user: { userId: 'a1', role: 'Admin' }, params: { id: 'p1' } };
    (Product.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: 'p1' });

    await deleteProduct(req as any, res);

    expect(Product.findByIdAndDelete).toHaveBeenCalledWith('p1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: true, message: 'Product deleted successfully' });
  });

  test('returns 404 when product not found', async () => {
    const res = mockRes();
    const req: CustomReq = { user: { userId: 'a1', role: 'Admin' }, params: { id: 'nope' } };
    (Product.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

    await deleteProduct(req as any, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ status: false, message: 'Product not found' });
  });

  test('returns 500 on error', async () => {
    const res = mockRes();
    const req: CustomReq = { user: { userId: 'a1', role: 'Admin' }, params: { id: 'p1' } };
    (Product.findByIdAndDelete as jest.Mock).mockRejectedValue(new Error('boom'));

    await deleteProduct(req as any, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ status: false, message: 'Server error' });
  });
});