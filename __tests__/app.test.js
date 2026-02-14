const request = require('supertest');
const app = require('../src/app');

// Mock supabase to avoid hitting real DB or needing env vars
jest.mock('../src/config/supabase', () => ({
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
    }
}));

describe('Backend Health Check', () => {
    it('should return a 200 status for the root route', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('POS Backend is running');
    });
});
