const request = require('supertest');
const app = require('../src/app');
const supabase = require('../src/config/supabase');

// Mock supabase
jest.mock('../src/config/supabase', () => {
    const mock = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        rpc: jest.fn().mockResolvedValue({ error: null }),
        then: jest.fn(function (resolve) {
            return resolve({
                data: this._data !== undefined ? this._data : [],
                error: this._error || null,
                count: this._count || 0
            });
        }),
        _data: [],
        _error: null,
        _count: 0
    };
    return mock;
});

describe('Transaction Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        supabase._data = [];
        supabase._error = null;
        supabase._count = 0;
    });

    describe('POST /api/transactions', () => {
        it('should create a transaction successfully', async () => {
            // Mock product search
            supabase.from.mockImplementation((table) => {
                if (table === 'products') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: { id: 'p1', title: 'P1', price: 100, stock: 10 }, error: null })
                    };
                }
                if (table === 'tenants') {
                    return {
                        select: jest.fn().mockReturnThis(),
                        eq: jest.fn().mockReturnThis(),
                        single: jest.fn().mockResolvedValue({ data: { tenant_code: 'T' }, error: null })
                    };
                }
                return supabase;
            });

            // Mock initial count
            supabase._count = 0;
            // Mock transaction insert
            supabase._data = { id: 'tx1', total: 100 };

            const res = await request(app).post('/api/transactions').send({
                tenant_id: 't1',
                items: [{ product_id: 'p1', quantity: 1 }],
                payment_method: 'Cash',
                male_count: 1,
                female_count: 0
            });

            expect(res.status).toBe(201);
            expect(res.body.id).toBe('tx1');
            expect(supabase.rpc).toHaveBeenCalledWith('decrement_stock', expect.any(Object));
        });
    });
});
