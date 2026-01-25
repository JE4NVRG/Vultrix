-- Ensure diacritic handling is available
create extension if not exists unaccent;

alter table public.filament_brands
    add column if not exists normalized_name text;

update public.filament_brands
set normalized_name = lower(
        regexp_replace(
            unaccent(name),
            '[^a-z0-9]',
            '',
            'g'
        )
    );

alter table public.filament_brands
    alter column normalized_name set not null;

create unique index if not exists filament_brands_user_normalized_name_key
    on public.filament_brands (user_id, normalized_name);
