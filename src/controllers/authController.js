const supabase = require('../config/supabase');

exports.signup = async (req, res) => {
    try {
        const { email, password, name, tenant_code } = req.body;

        if (!email || !password || !name || !tenant_code) {
            return res.status(400).json({ error: 'Email, password, name, and tenant_code are required' });
        }

        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;

        if (!authData.user) {
            return res.status(400).json({ error: 'Signup failed. Please try again.' });
        }

        // 2. Create Tenant record
        const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .insert([{
                email,
                name,
                tenant_code: tenant_code.toUpperCase()
            }])
            .select()
            .single();

        if (tenantError) {
            throw tenantError;
        }

        res.status(201).json({ user: authData.user, tenant: tenantData });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error during signup' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // 1. Sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) throw authError;

        // 2. Fetch Tenant details
        const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('email', email)
            .single();

        if (tenantError) {
            return res.status(404).json({ error: 'Tenant record not found' });
        }

        res.json({ session: authData.session, tenant: tenantData });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
};

exports.logout = async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error during logout' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        // Expecting 'Authorization: Bearer <token>'
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Missing Authorization header' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Fetch Tenant details using the email from the token
        const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('email', user.email)
            .single();

        if (tenantError) throw tenantError;

        res.json({ user, tenant: tenantData });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error while fetching profile' });
    }
};
