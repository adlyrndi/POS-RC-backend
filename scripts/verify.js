const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000/api';
// Use a fixed tenant ID for testing or generate one if the API supported it.
// Since we don't have a tenant creation endpoint in the requirements (it was just "Tenant Role"),
// I will assume a tenant exists or I can insert one directly via Supabase if I had the admin key.
// But wait, the requirements didn't explicitly ask for Tenant CRUD, just "Tenant (MVP)".
// I'll assume we need to manually insert a tenant into the DB first or just use a UUID.
// For this script, let's assume the user has set up the DB and has a valid tenant_id.
// I'll make the script fail gracefully if it can't connect.

const TENANT_ID = 'd0c9c7f6-3f3d-4b8a-8d1e-2f3b4c5d6e7f'; // Example UUID

async function runVerification() {
    try {
        console.log('Starting verification...');

        // 1. Create Product
        console.log('Creating Product...');
        const productRes = await axios.post(`${API_URL}/products`, {
            tenant_id: TENANT_ID,
            title: 'Test Product',
            description: 'A test product',
            price: 10000,
            stock: 50,
            image_url: 'http://example.com/image.png'
        });
        const product = productRes.data;
        console.log('Product created:', product.id);

        // 2. Create Voucher
        console.log('Creating Voucher...');
        const voucherRes = await axios.post(`${API_URL}/vouchers`, {
            tenant_id: TENANT_ID,
            code: 'TESTVOUCHER' + Math.floor(Math.random() * 1000),
            name: 'Test Voucher',
            discount_amount: 10,
            discount_type: 'percentage'
        });
        const voucher = voucherRes.data;
        console.log('Voucher created:', voucher.id);

        // 3. Create Transaction
        console.log('Creating Transaction...');
        const transactionRes = await axios.post(`${API_URL}/transactions`, {
            tenant_id: TENANT_ID,
            items: [{ product_id: product.id, quantity: 2 }],
            payment_method: 'cash',
            voucher_id: voucher.id,
            male_count: 1,
            female_count: 0,
            description: 'Test transaction'
        });
        const transaction = transactionRes.data;
        console.log('Transaction created:', transaction.id);

        // 4. Get Analytics
        console.log('Fetching Analytics...');
        const analyticsRes = await axios.get(`${API_URL}/analytics`, {
            params: { tenant_id: TENANT_ID }
        });
        console.log('Analytics fetched:', analyticsRes.data);

        console.log('Verification passed!');
    } catch (error) {
        console.error('Verification failed:', error.response ? error.response.data : error.message);
    }
}

// Check if server is running before running tests? 
// Or just let the user run it.
// I'll write this file to scripts/verify.js
