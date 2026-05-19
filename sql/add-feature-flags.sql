alter table public.sites
add column if not exists feature_contactless_payment boolean not null default false,
add column if not exists feature_license_plate_recognition boolean not null default false,
add column if not exists feature_online_payment boolean not null default false,
add column if not exists feature_cash_only boolean not null default false,
add column if not exists feature_monthly_rent_only boolean not null default false;
