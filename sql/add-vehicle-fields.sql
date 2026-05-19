alter table public.sites
add column if not exists has_car boolean not null default false,
add column if not exists car_entrance_device_count integer not null default 0,
add column if not exists car_exit_device_count integer not null default 0,
add column if not exists car_exit_payment_device_count integer not null default 0,
add column if not exists has_motorcycle boolean not null default false,
add column if not exists motorcycle_entrance_device_count integer not null default 0,
add column if not exists motorcycle_exit_device_count integer not null default 0,
add column if not exists motorcycle_exit_payment_device_count integer not null default 0,
add column if not exists exit_payment_device_count integer not null default 0,
add column if not exists pricing_computer_count integer not null default 0;

create or replace function public.set_site_vehicle_totals()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.has_car = false then
    new.car_entrance_device_count := 0;
    new.car_exit_device_count := 0;
    new.car_exit_payment_device_count := 0;
  end if;

  if new.has_motorcycle = false then
    new.motorcycle_entrance_device_count := 0;
    new.motorcycle_exit_device_count := 0;
    new.motorcycle_exit_payment_device_count := 0;
  end if;

  new.entrance_device_count :=
    coalesce(new.car_entrance_device_count, 0)
    + coalesce(new.motorcycle_entrance_device_count, 0);

  new.exit_device_count :=
    coalesce(new.car_exit_device_count, 0)
    + coalesce(new.motorcycle_exit_device_count, 0);

  new.exit_payment_device_count :=
    coalesce(new.car_exit_payment_device_count, 0)
    + coalesce(new.motorcycle_exit_payment_device_count, 0);

  return new;
end;
$$;

drop trigger if exists set_site_vehicle_totals on public.sites;

create trigger set_site_vehicle_totals
before insert or update on public.sites
for each row
execute function public.set_site_vehicle_totals();
