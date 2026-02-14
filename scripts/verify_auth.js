const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000/api';

async function runAuthVerification() {
    try {
        console.log('Starting Auth verification...');

        const email = 'test' + Date.now() + '@example.com';
        const password = 'password123';
        const tenant_code = 'TST';
        const name = 'Test Tenant';

        // 1. Signup
        console.log('Testing Signup...');
        const signupRes = await axios.post(`${API_URL}/auth/signup`, {
            email,
            password,
            name,
            tenant_code
        });
        console.log('Signup successful:', signupRes.data.user.email);
        const tenantId = signupRes.data.tenant.id;

        // 2. Login
        console.log('Testing Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        const { session, tenant } = loginRes.data;
        console.log('Login successful. Token:', session.access_token.substring(0, 20) + '...');

        if (tenant.id !== tenantId) {
            throw new Error('Tenant ID mismatch');
        }

        // 3. Get Profile
        console.log('Testing Get Profile...');
        const profileRes = await axios.get(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
        });
        console.log('Profile fetched:', profileRes.data.tenant.name);

        console.log('Auth Verification passed!');
    } catch (error) {
        console.error('Auth Verification failed:', error.response ? error.response.data : error.message);
    }
}

runAuthVerification();
