-- Disable RLS on all tables to allow the backend (using anon key) to read/write freely.
-- In a production environment, you should use the 'service_role' key in your backend 
-- or configure strict RLS policies.

ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items DISABLE ROW LEVEL SECURITY;
