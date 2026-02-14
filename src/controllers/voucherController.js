const supabase = require('../config/supabase');

exports.createVoucher = async (req, res) => {
    try {
        const { code, name, discount_amount, discount_type, tenant_id } = req.body;

        if (!code || !name || !discount_amount || !discount_type || !tenant_id) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const { data, error } = await supabase
            .from('vouchers')
            .insert([{ code, name, discount_amount, discount_type, tenant_id }])
            .select();

        if (error) {
            if (error.code === '23505') return res.status(409).json({ error: 'Voucher code already exists for this tenant' });
            throw error;
        }

        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Create voucher error:', error);
        res.status(500).json({ error: 'Internal server error while creating voucher' });
    }
};

exports.getVouchers = async (req, res) => {
    try {
        const { tenant_id } = req.query;
        if (!tenant_id) {
            return res.status(400).json({ error: 'tenant_id is required' });
        }

        const { data, error } = await supabase
            .from('vouchers')
            .select('*')
            .eq('tenant_id', tenant_id);

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Fetch vouchers error:', error);
        res.status(500).json({ error: 'Internal server error while fetching vouchers' });
    }
};

exports.updateVoucher = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('vouchers')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        if (data.length === 0) return res.status(404).json({ error: 'Voucher not found' });

        res.json(data[0]);
    } catch (error) {
        console.error('Update voucher error:', error);
        res.status(500).json({ error: 'Internal server error while updating voucher' });
    }
};

exports.deleteVoucher = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('vouchers')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(204).send();
    } catch (error) {
        console.error('Delete voucher error:', error);
        res.status(500).json({ error: 'Internal server error while deleting voucher' });
    }
};
