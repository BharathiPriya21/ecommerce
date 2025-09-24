/**
 * Tests for product controller
 * Framework: Jest (TypeScript), using jest.fn() mocks and manual Request/Response stubs.
 * If repo uses a different framework, adapt describe/it/expect syntax accordingly.
 */

import type { Request, Response } from 'express'

// We will mock the Product model and cloudinary uploader.
// Using require() pattern to allow jest.mock hoisting in TS transpilation contexts.
jest.mock('../model/product', () => {
  const saveMock = jest.fn()
  const ProductMock: any = jest.fn().mockImplementation((doc: any) => ({
    ...doc,
    save: saveMock,
  }))
  ProductMock.find = jest.fn()
  ProductMock.findById = jest.fn()
  ProductMock.findByIdAndUpdate = jest.fn()
  ProductMock.findByIdAndDelete = jest.fn()
  ProductMock.__saveMock = saveMock
  return {
    __esModule: true,
    default: ProductMock,
  }
})

jest.mock('cloudinary', () => {
  const uploadMock = jest.fn().mockResolvedValue({ url: 'https://cdn.example.com/img.jpg' })
  return {
    __esModule: true,
    v2: {
      config: jest.fn(),
      uploader: { upload: uploadMock },
    },
  }
})

// Import after mocks
import Product from '../model/product'
import { v2 as cloudinary } from 'cloudinary'

// IMPORTANT: The controller code lives in a sibling file "product-controller.ts" in the same folder,
// per the provided snippet. If the actual file name differs, adjust the import below accordingly.
import {
  createProduct,
  getAllProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} from './product-controller'

// Utility to create mock Request/Response
const mockRes = () => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockImplementation(function (this: any, code: number) {
    // capture status code if needed
    ;(this as any).__status = code
    return this
  }) as any
  res.json = jest.fn().mockImplementation(function (this: any, payload: any) {
    ;(this as any).__json = payload
    return this
  }) as any
  return res as Response & { __status?: number; __json?: any }
}

const mockReq = (overrides: Partial<Request> = {}) =>
  ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides,
  } as unknown as Request)

describe('product-controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createProduct', () => {
    it('returns 400 when user is missing or not Admin', async () => {
      const req = mockReq({
        body: { title: 'A', price: 10, stock: 5, category: 'C' },
        // user absent => treated as non-admin
      }) as any
      const res = mockRes()

      await createProduct(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        message: 'Only Admin can create product',
      })
      expect(Product).not.toHaveBeenCalled()
    })

    it('returns 400 when required fields are missing', async () => {
      const req = mockReq({
        user: { userId: 'u1', email: 'a@b.com', role: 'Admin' } as any,
        body: { title: '', price: undefined, stock: undefined, category: '' },
      })
      const res = mockRes()

      await createProduct(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        error: 'Title, price, stock, and category are required',
      })
      expect(Product).not.toHaveBeenCalled()
    })

    it('returns 400 and shows "product image is required" when req.file is present (per current logic)', async () => {
      const req = mockReq({
        user: { userId: 'admin-1', email: 'admin@x.com', role: 'Admin' } as any,
        body: { title: 'T', description: 'D', price: 99, stock: 2, category: 'cat' },
        // Note: The controller currently treats presence of req.file as an error.
        file: { path: '/tmp/p.png' } as any,
      }) as any
      const res = mockRes()

      await createProduct(req as any, res as any)

      // Expect 400 sent for image
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ status: false, message: 'product image is required' })
      // Cloudinary may still be called due to current code; assert upload is attempted
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith('/tmp/p.png', { folder: 'product' })
    })

    it('creates product and returns 201 on happy path (no req.file)', async () => {
      const saved = { _id: 'p1', title: 'T', price: 9, stock: 1, category: 'C', adminId: 'admin-1' }
      ;(Product as any).__saveMock.mockResolvedValue(saved)

      const req = mockReq({
        user: { userId: 'admin-1', email: 'e@x.com', role: 'Admin' } as any,
        body: {
          title: 'T',
          description: 'D',
          price: 9,
          stock: 1,
          category: 'C',
        },
      }) as any
      const res = mockRes()

      await createProduct(req as any, res as any)

      expect(Product).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'T',
          description: 'D',
          price: 9,
          stock: 1,
          category: 'C',
          image_url: undefined,
          adminId: 'admin-1',
        })
      )
      expect((Product as any).__saveMock).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.__json).toEqual({ status: true, data: saved })
    })

    it('returns 500 on save error', async () => {
      ;(Product as any).__saveMock.mockRejectedValue(new Error('DB down'))

      const req = mockReq({
        user: { userId: 'admin-1', email: 'e@x.com', role: 'Admin' } as any,
        body: { title: 'T', description: 'D', price: 9, stock: 1, category: 'C' },
      }) as any
      const res = mockRes()

      await createProduct(req as any, res as any)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.__json).toEqual({ status: false, error: 'Server error' })
    })
  })

  describe('getAllProduct', () => {
    it('returns 200 with all products', async () => {
      ;(Product as any).find.mockResolvedValue([{ _id: '1' }, { _id: '2' }])

      const req = mockReq()
      const res = mockRes()

      await getAllProduct(req as any, res as any)

      expect(Product.find).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.__json).toEqual({
        status: true,
        message: 'All products retrieved successfully',
        data: [{ _id: '1' }, { _id: '2' }],
      })
    })

    it('returns 500 on model error', async () => {
      ;(Product as any).find.mockRejectedValue(new Error('DB err'))

      const res = mockRes()
      await getAllProduct(mockReq() as any, res as any)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.__json).toEqual({ status: false, error: 'Server error' })
    })
  })

  describe('getProductById', () => {
    it('returns 200 when product exists', async () => {
      ;(Product as any).findById.mockResolvedValue({ _id: 'p1', title: 'T' })
      const req = mockReq({ params: { id: 'p1' } as any })
      const res = mockRes()

      await getProductById(req as any, res as any)

      expect(Product.findById).toHaveBeenCalledWith('p1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.__json).toEqual({
        status: true,
        message: 'Product retrieved successfully',
        data: { _id: 'p1', title: 'T' },
      })
    })

    it('returns 404 when product not found', async () => {
      ;(Product as any).findById.mockResolvedValue(null)
      const res = mockRes()

      await getProductById(mockReq({ params: { id: 'nope' } as any }) as any, res as any)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.__json).toEqual({ status: false, message: 'Product not found' })
    })

    it('returns 500 with "Invalid Product ID" on model error', async () => {
      ;(Product as any).findById.mockRejectedValue(new Error('CastError'))
      const res = mockRes()

      await getProductById(mockReq({ params: { id: 'bad' } as any }) as any, res as any)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.__json).toEqual({ status: false, message: 'Invalid Product ID' })
    })
  })

  describe('updateProduct', () => {
    it('returns 400 if user not Admin', async () => {
      const res = mockRes()
      await updateProduct(
        mockReq({
          user: { userId: 'u', email: 'e', role: 'User' } as any,
          params: { id: 'p1' } as any,
          body: { title: 'New' },
        }) as any,
        res as any
      )
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.__json).toEqual({ status: false, message: 'Only Admin can update product' })
    })

    it('updates provided fields and returns 200', async () => {
      ;(Product as any).findByIdAndUpdate.mockResolvedValue({
        _id: 'p1',
        title: 'New',
        price: 20,
      })
      const res = mockRes()
      await updateProduct(
        mockReq({
          user: { userId: 'a', email: 'e', role: 'Admin' } as any,
          params: { id: 'p1' } as any,
          body: { title: 'New', price: 20 },
        }) as any,
        res as any
      )

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ title: 'New', price: 20 }),
        { new: true }
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.__json).toEqual({
        status: true,
        message: 'Product updated successfully',
        data: { _id: 'p1', title: 'New', price: 20 },
      })
    })

    it('returns 404 when product to update not found', async () => {
      ;(Product as any).findByIdAndUpdate.mockResolvedValue(null)
      const res = mockRes()
      await updateProduct(
        mockReq({
          user: { userId: 'a', email: 'e', role: 'Admin' } as any,
          params: { id: 'missing' } as any,
          body: { title: 'New' },
        }) as any,
        res as any
      )
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.__json).toEqual({ status: false, message: 'Product not found' })
    })

    it('returns 500 on model error', async () => {
      ;(Product as any).findByIdAndUpdate.mockRejectedValue(new Error('DB err'))
      const res = mockRes()
      await updateProduct(
        mockReq({
          user: { userId: 'a', email: 'e', role: 'Admin' } as any,
          params: { id: 'p1' } as any,
          body: { title: 'New' },
        }) as any,
        res as any
      )
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.__json).toEqual({ status: false, message: 'Server error' })
    })
  })

  describe('deleteProduct', () => {
    it('returns 400 if user not Admin', async () => {
      const res = mockRes()
      await deleteProduct(
        mockReq({
          user: { userId: 'u', email: 'e', role: 'User' } as any,
          params: { id: 'p1' } as any,
        }) as any,
        res as any
      )
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.__json).toEqual({ status: false, message: 'Only Admin can delete product' })
    })

    it('returns 200 when deleted successfully', async () => {
      ;(Product as any).findByIdAndDelete.mockResolvedValue({ _id: 'p1' })
      const res = mockRes()
      await deleteProduct(
        mockReq({
          user: { userId: 'a', email: 'e', role: 'Admin' } as any,
          params: { id: 'p1' } as any,
        }) as any,
        res as any
      )
      expect(Product.findByIdAndDelete).toHaveBeenCalledWith('p1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.__json).toEqual({ status: true, message: 'Product deleted successfully' })
    })

    it('returns 404 when product not found', async () => {
      ;(Product as any).findByIdAndDelete.mockResolvedValue(null)
      const res = mockRes()
      await deleteProduct(
        mockReq({
          user: { userId: 'a', email: 'e', role: 'Admin' } as any,
          params: { id: 'missing' } as any,
        }) as any,
        res as any
      )
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.__json).toEqual({ status: false, message: 'Product not found' })
    })

    it('returns 500 on model error', async () => {
      ;(Product as any).findByIdAndDelete.mockRejectedValue(new Error('DB err'))
      const res = mockRes()
      await deleteProduct(
        mockReq({
          user: { userId: 'a', email: 'e', role: 'Admin' } as any,
          params: { id: 'p1' } as any,
        }) as any,
        res as any
      )
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.__json).toEqual({ status: false, message: 'Server error' })
    })
  })
})