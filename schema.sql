-- Enable the UUID extension (required for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants Table (Top level entity)
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  tenant_code text NOT NULL UNIQUE CHECK (length(tenant_code) = 3 AND tenant_code ~ '^[A-Z]{3}$'::text),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tenants_pkey PRIMARY KEY (id)
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- 3. Sessions (Optional if using Supabase Auth, but kept for schema consistency)
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  refresh_token text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  revoked boolean DEFAULT false,
  expired_at timestamp with time zone,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- 4. Vouchers Table
CREATE TABLE IF NOT EXISTS public.vouchers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  discount_amount numeric NOT NULL CHECK (discount_amount >= 0::numeric),
  discount_type text NOT NULL CHECK (discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (tenant_id, code), -- Validate uniqueness per tenant ideally, or globally if preferred
  CONSTRAINT vouchers_pkey PRIMARY KEY (id),
  CONSTRAINT vouchers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- 5. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  transaction_code text NOT NULL UNIQUE,
  payment_method text NOT NULL,
  subtotal numeric NOT NULL CHECK (subtotal >= 0::numeric),
  discount numeric DEFAULT 0 CHECK (discount >= 0::numeric),
  total numeric NOT NULL CHECK (total >= 0::numeric),
  voucher_id uuid,
  description text,
  male_count integer DEFAULT 0 CHECK (male_count >= 0),
  female_count integer DEFAULT 0 CHECK (female_count >= 0),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT transactions_voucher_id_fkey FOREIGN KEY (voucher_id) REFERENCES public.vouchers(id)
);

-- 6. Transaction Items Table
CREATE TABLE IF NOT EXISTS public.transaction_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  transaction_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_title text NOT NULL,
  product_price numeric NOT NULL CHECK (product_price >= 0::numeric),
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal numeric NOT NULL CHECK (subtotal >= 0::numeric),
  CONSTRAINT transaction_items_pkey PRIMARY KEY (id),
  CONSTRAINT transaction_items_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE,
  CONSTRAINT transaction_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- Row Level Security (RLS) - Optional for backend service role access, but good practice
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (since backend handles auth) or configure policies as needed
-- For a backend service interacting via service key or authenticated user:
-- CREATE POLICY "Enable access to all users" ON public.tenants FOR ALL USING (true);
-- (Repeat for others if needed, or rely on service_role key bypassing RLS)
