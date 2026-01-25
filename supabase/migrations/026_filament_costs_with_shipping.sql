-- Add shipping-aware cost tracking fields to filaments
alter table public.filaments
    add column if not exists cost_per_kg_with_shipping numeric not null default 0,
    add column if not exists purchase_shipping_total numeric,
    add column if not exists purchase_fees_total numeric,
    add column if not exists shipping_prorated_by_weight boolean not null default false,
    add column if not exists shipping_share_value numeric,
    add column if not exists fees_share_value numeric;

update public.filaments
set cost_per_kg_with_shipping = custo_por_kg
where cost_per_kg_with_shipping = 0;
