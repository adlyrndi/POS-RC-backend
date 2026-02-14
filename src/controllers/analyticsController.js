const supabase = require('../config/supabase');

exports.getAnalytics = async (req, res) => {
    try {
        const { tenant_id } = req.query;
        if (!tenant_id) return res.status(400).json({ error: 'tenant_id is required' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Fetch all transactions for the tenant
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*, transaction_items(*)')
            .eq('tenant_id', tenant_id);

        if (error) throw error;

        // Process data in JS (MVP approach)
        let todayRevenue = 0;
        let todayTransactions = 0;
        let todayProductSold = 0;

        let yesterdayRevenue = 0;

        let allTimeRevenue = 0;
        let allTimeTransactions = 0;
        let allTimeProductSold = 0;

        let maleCount = 0;
        let femaleCount = 0;

        const salesByHour = new Array(24).fill(0);
        const transactionsByHour = new Array(24).fill(0);

        transactions.forEach(t => {
            const date = new Date(t.created_at);
            const isToday = date >= today;
            const isYesterday = date >= yesterday && date < today;

            // All time
            allTimeRevenue += t.total;
            allTimeTransactions++;
            maleCount += t.male_count || 0;
            femaleCount += t.female_count || 0;

            const hour = date.getHours();
            salesByHour[hour] += t.total;
            transactionsByHour[hour]++;

            // Item level stats
            t.transaction_items.forEach(item => {
                allTimeProductSold += item.quantity;
                if (isToday) todayProductSold += item.quantity;
            });

            if (isToday) {
                todayRevenue += t.total;
                todayTransactions++;
            }

            if (isYesterday) {
                yesterdayRevenue += t.total;
            }
        });

        // Calculate growth
        const revenueGrowth = yesterdayRevenue === 0 ? 100 : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;

        // Fetch Stock
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('id, title, stock, transaction_items(quantity)')
            .eq('tenant_id', tenant_id);

        if (prodError) throw prodError;

        // Calculate all time product sold per variant
        const productStats = products.map(p => {
            const sold = p.transaction_items.reduce((sum, item) => sum + item.quantity, 0);
            return {
                title: p.title,
                stock: p.stock,
                sold
            };
        });

        res.json({
            today: {
                revenue: todayRevenue,
                transactions: todayTransactions,
                product_sold: todayProductSold,
                growth_percentage: revenueGrowth
            },
            all_time: {
                revenue: allTimeRevenue,
                transactions: allTimeTransactions,
                product_sold: allTimeProductSold,
                demographics: { male: maleCount, female: femaleCount }
            },
            sales_by_hour: salesByHour,
            inventory: productStats
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Internal server error while fetching analytics' });
    }
};
