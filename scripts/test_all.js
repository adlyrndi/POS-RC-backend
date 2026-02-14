const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_URL = 'http://127.0.0.1:3000/api';

async function runFullTest() {
    try {
        console.log('🚀 Starting Full Backend Test...\n');

        // --- 1. AUTHENTICATION ---
        console.log('--- 1. Testing Auth ---');
        const email = `test.user.${Date.now()}@gmail.com`;
        const password = 'password123';
        // Generate random 3 letter uppercase string
        const tenant_code = Array(3).fill(0).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
        const name = 'Test Tenant';

        console.log(`Simulating Signup for: ${email}`);
        const signupRes = await axios.post(`${API_URL}/auth/signup`, {
            email, password, name, tenant_code
        });
        const { user, tenant } = signupRes.data;
        console.log('✅ Signup successful');
        console.log(`   Tenant ID: ${tenant.id}\n`);

        console.log('Simulating Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email, password
        });
        const { session } = loginRes.data;
        console.log('✅ Login successful');
        console.log(`   Token: ${session.access_token.substring(0, 15)}...\n`);

        const TENANT_ID = tenant.id;

        // --- 2. PRODUCTS ---
        console.log('--- 2. Testing Products ---');
        console.log('Creating Product...');
        const productRes = await axios.post(`${API_URL}/products`, {
            tenant_id: TENANT_ID,
            title: 'Espresso',
            description: 'Strong coffee',
            price: 25000,
            stock: 100,
            image_url: 'http://example.com/espresso.png'
        });
        const product = productRes.data;
        console.log(`✅ Product created: ${product.title} (ID: ${product.id})`);
        console.log(`   Stock: ${product.stock}\n`);

        // --- 3. VOUCHERS ---
        console.log('--- 3. Testing Vouchers ---');
        console.log('Creating Voucher...');
        const voucherRes = await axios.post(`${API_URL}/vouchers`, {
            tenant_id: TENANT_ID,
            code: `DISC${Math.floor(Math.random() * 1000)}`,
            name: 'Opening Promo',
            discount_amount: 10, // 10%
            discount_type: 'percentage'
        });
        const voucher = voucherRes.data;
        console.log(`✅ Voucher created: ${voucher.code} (ID: ${voucher.id})\n`);

        // --- 4. TRANSACTIONS ---
        console.log('--- 4. Testing Transactions ---');
        console.log('Creating Transaction (buying 2 Espresso with Voucher)...');
        const transactionRes = await axios.post(`${API_URL}/transactions`, {
            tenant_id: TENANT_ID,
            items: [{ product_id: product.id, quantity: 2 }],
            payment_method: 'QRIS',
            voucher_id: voucher.id,
            male_count: 1,
            female_count: 0,
            description: 'Morning coffee'
        });
        const transaction = transactionRes.data;
        console.log(`✅ Transaction created: ${transaction.transaction_code}`);
        console.log(`   Subtotal: ${transaction.subtotal}`);
        console.log(`   Discount: ${transaction.discount}`);
        console.log(`   Total: ${transaction.total}\n`);

        // --- 5. ANALYTICS ---
        console.log('--- 5. Testing Analytics ---');
        console.log('Fetching Analytics data...');
        const analyticsRes = await axios.get(`${API_URL}/analytics`, {
            params: { tenant_id: TENANT_ID }
        });
        const analytics = analyticsRes.data;
        console.log('✅ Analytics fetched');
        console.log('   Today Revenue:', analytics.today.revenue);
        console.log('   Today Transactions:', analytics.today.transactions);
        console.log('   Today Products Sold:', analytics.today.product_sold);
        console.log('   Inventory Stock Remaining:', analytics.inventory[0].stock);

        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');

    } catch (error) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

runFullTest();
