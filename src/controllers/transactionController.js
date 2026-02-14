const supabase = require('../config/supabase');



exports.createTransaction = async (req, res) => {
    try {
        const {
            tenant_id,
            items, // array of { product_id, quantity }
            payment_method,
            voucher_id,
            male_count,
            female_count,
            description
        } = req.body;

        if (!tenant_id || !items || items.length === 0 || !payment_method) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Calculate subtotal and validate stock
        let subtotal = 0;
        const transactionItems = [];

        for (const item of items) {
            const { data: product, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', item.product_id)
                .single();

            if (error || !product) {
                return res.status(404).json({ error: `Product ${item.product_id} not found` });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for product ${product.title}` });
            }

            const itemSubtotal = product.price * item.quantity;
            subtotal += itemSubtotal;

            transactionItems.push({
                product_id: product.id,
                product_title: product.title,
                product_price: product.price,
                quantity: item.quantity,
                subtotal: itemSubtotal
            });
        }

        // 2. Apply Voucher
        let discount = 0;
        if (voucher_id) {
            const { data: voucher, error } = await supabase
                .from('vouchers')
                .select('*')
                .eq('id', voucher_id)
                .single();

            if (!error && voucher && voucher.is_active) {
                if (voucher.discount_type === 'percentage') {
                    discount = subtotal * (voucher.discount_amount / 100);
                } else {
                    discount = voucher.discount_amount;
                }
            }
        }

        const total = Math.max(0, subtotal - discount);

        // Fetch Tenant Code
        const { data: tenantData, error: tenantQueryError } = await supabase
            .from('tenants')
            .select('tenant_code')
            .eq('id', tenant_id)
            .single();

        if (tenantQueryError || !tenantData) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Get Count of existing transactions for this tenant
        const { count, error: countError } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant_id);

        if (countError) throw countError;

        const sequence = (count + 1).toString().padStart(4, '0');
        const transactionCode = `ROOMS - ${tenantData.tenant_code}${sequence}`;

        // 3. Create Transaction Record
        const { data: transaction, error: transError } = await supabase
            .from('transactions')
            .insert([{
                tenant_id,
                transaction_code: transactionCode,
                payment_method,
                subtotal,
                discount,
                total,
                voucher_id,
                description,
                male_count,
                female_count
            }])
            .select()
            .single();

        if (transError) {
            // Check for unique constraint violation (idempotency safety)
            if (transError.code === '23505') {
                return res.status(409).json({ error: 'Transaction already exists' });
            }
            throw transError;
        }

        // 4. Create Transaction Items & Update Stock
        // Note: ideally this should be a transaction or RPC call for atomicity
        for (const item of transactionItems) {
            // Atomic Update using RPC which checks stock again
            const { data: success, error: stockError } = await supabase
                .rpc('decrement_stock', {
                    product_id: item.product_id,
                    quantity_to_subtract: item.quantity
                });

            if (stockError || !success) {
                console.error(`Failed to update stock for product ${item.product_id}:`, stockError);
                // We've already created the transaction record. In a more complex setup, 
                // we would use a DB transaction to rollback. For now, we log it.
                // The RPC check 'stock >= quantity' prevents negative stock.
                continue;
            }

            await supabase
                .from('transaction_items')
                .insert([{
                    transaction_id: transaction.id,
                    ...item
                }]);
        }

        res.status(201).json(transaction);

    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Internal server error while creating transaction' });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const { tenant_id } = req.query;

        if (!tenant_id) {
            return res.status(400).json({ error: 'tenant_id is required' });
        }

        const { data, error } = await supabase
            .from('transactions')
            .select('*, transaction_items(*)')
            .eq('tenant_id', tenant_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal server error while fetching transactions' });
    }
}
