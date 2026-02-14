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
        auth: {
            signUp: jest.fn(),
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
            getUser: jest.fn(),
        },
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

describe('Auth Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        supabase._data = [];
        supabase._error = null;
    });

    describe('POST /api/auth/signup', () => {
        it('should signup successfully', async () => {
            supabase.auth.signUp.mockResolvedValue({ data: { user: { id: 'u1', email: 't@t.com' } }, error: null });
            supabase._data = { id: 't1', email: 't@t.com', name: 'Tenant' };

            const res = await request(app).post('/api/auth/signup').send({
                email: 't@t.com',
                password: 'password',
                name: 'Tenant',
                tenant_code: 'TNT'
            });

            expect(res.status).toBe(201);
            expect(res.body.tenant.name).toBe('Tenant');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully', async () => {
            supabase.auth.signInWithPassword.mockResolvedValue({ data: { session: { access_token: 'tk1' } }, error: null });
            supabase._data = { id: 't1', email: 't@t.com' };

            const res = await request(app).post('/api/auth/login').send({
                email: 't@t.com',
                password: 'password'
            });

            expect(res.status).toBe(200);
            expect(res.body.session.access_token).toBe('tk1');
        });
    });
});
