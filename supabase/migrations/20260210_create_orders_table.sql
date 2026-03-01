-- Create orders table for BenefitPay checkout
create table if not exists public.orders (
  id text primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text not null,
  phone text not null,
  email text not null,
  plan_id text not null,
  plan_name text not null,
  amount numeric(10, 2) not null,
  payment_ref text,
  payment_proof_url text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes text,
  constraint orders_plan_id_fkey foreign key (plan_id) references public.products(id) on delete restrict
);

-- Create indexes
create index if not exists orders_email_idx on public.orders(email);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

-- Enable RLS
alter table public.orders enable row level security;

-- RLS Policy: Only admins can read/update orders
create policy "Admins can view all orders"
  on public.orders
  for select
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Public can insert orders"
  on public.orders
  for insert
  with check (true);

create policy "Only admins can update orders"
  on public.orders
  for update
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Grant permissions
grant select on public.orders to authenticated, anon;
grant insert on public.orders to authenticated, anon;
grant update on public.orders to authenticated;
