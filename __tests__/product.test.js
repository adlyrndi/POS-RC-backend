const request = require('supertest');
const app = require('../src/app');
const supabase = require('../src/config/supabase');

// Improved Mock
jest.mock('../src/config/supabase', () => {
    const mock = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn(function (resolve) {
            return resolve({ data: this._data || [], error: this._error || null });
        }),
        _data: [],
        _error: null,
    };
    return mock;
});

describe('Product Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        supabase._data = [];
        supabase._error = null;
    });

    describe('GET /api/products', () => {
        it('should return all products for a tenant', async () => {
            const mockProducts = [{ id: 1, title: 'Product 1', tenant_id: 't1' }];
            supabase._data = mockProducts;

            const res = await request(app).get('/api/products?tenant_id=t1');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockProducts);
            expect(supabase.from).toHaveBeenCalledWith('products');
            expect(supabase.eq).toHaveBeenCalledWith('is_active', true);
            expect(supabase.eq).toHaveBeenCalledWith('tenant_id', 't1');
        });

        it('should return 500 if supabase error occurs', async () => {
            supabase._error = { message: 'DB Error' };

            const res = await request(app).get('/api/products?tenant_id=t1');

            expect(res.status).toBe(500);
            expect(res.body.error).toBe('DB Error');
        });
    });

    describe('POST /api/products', () => {
        it('should create a new product', async () => {
            const newProduct = { title: 'New Product', price: 100, tenant_id: 't1' };
            supabase._data = [{ id: 2, ...newProduct }];

            const res = await request(app).post('/api/products').send(newProduct);

            expect(res.status).toBe(201);
            expect(res.body.title).toBe('New Product');
        });

        it('should return 400 if title is missing', async () => {
            const res = await request(app).post('/api/products').send({ price: 100, tenant_id: 't1' });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Title, price, and tenant_id are required');
        });
    });

    describe('DELETE /api/products/:id', () => {
        it('should deactivate (soft delete) a product', async () => {
            const res = await request(app).delete('/api/products/1');
            expect(res.status).toBe(204);
            expect(supabase.update).toHaveBeenCalledWith({ is_active: false });
            expect(supabase.eq).toHaveBeenCalledWith('id', '1');
        });
    });
});
