-- Add purchase metadata to filaments so multiple items from the same order can reference their source
alter table public.filaments
    add column if not exists purchase_source text,
    add column if not exists purchase_url text;
