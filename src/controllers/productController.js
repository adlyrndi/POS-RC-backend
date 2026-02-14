const supabase = require('../config/supabase');

exports.createProduct = async (req, res) => {
    try {
        const { title, description, price, stock, image_url, tenant_id } = req.body;

        // Validate required fields
        if (!title || !price || !tenant_id) {
            return res.status(400).json({ error: 'Title, price, and tenant_id are required' });
        }

        const { data, error } = await supabase
            .from('products')
            .insert([{ title, description, price, stock, image_url, tenant_id }])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal server error while creating product' });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        if (data.length === 0) return res.status(404).json({ error: 'Product not found' });

        res.json(data[0]);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal server error while updating product' });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const { tenant_id } = req.query;

        if (!tenant_id) {
            return res.status(400).json({ error: 'tenant_id is required' });
        }

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .eq('tenant_id', tenant_id);

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error while fetching products' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal server error while deleting product' });
    }
};
