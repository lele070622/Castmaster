create extension if not exists pgcrypto;

create table public.profiles (
    id uuid references auth.users not null primary key,
    username text unique,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create type water_type_enum as enum ('Freshwater', 'Saltwater', 'Brackish');
create type privacy_enum as enum ('Public', 'Private');

create table public.fishing_spots (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    latitude numeric(10, 7) not null,
    longitude numeric(10, 7) not null,
    water_type water_type_enum not null,
    privacy_level privacy_enum not null default 'Private',
    notes text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

create table public.catches (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    spot_id uuid references public.fishing_spots(id) on delete set null,
    species_name text not null,
    confidence_score real not null,
    photo_url text not null,
    weight_lbs real,
    length_in real,
    bait_used text,
    weather_snapshot_json jsonb,
    caught_at timestamptz default timezone('utc'::text, now()) not null
);

create index idx_fishing_spots_user_id on public.fishing_spots (user_id);
create index idx_fishing_spots_privacy on public.fishing_spots (privacy_level);
create index idx_catches_user_id on public.catches (user_id);
create index idx_catches_spot_id on public.catches (spot_id);
create index idx_catches_caught_at on public.catches (caught_at desc);

create function public.handle_new_user() returns trigger
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, username)
    values (
        new.id,
        coalesce(
            new.raw_user_meta_data->>'username',
            split_part(new.email, '@', 1)
        ) || '_' || left(new.id::text, 8)
    );
    return new;
end;
$$ language plpgsql;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.fishing_spots enable row level security;
alter table public.catches enable row level security;

create policy "Allow public read access to public spots" on public.fishing_spots
    for select using (privacy_level = 'Public');

create policy "Allow users to manage their own spots" on public.fishing_spots
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Allow users to manage their own catches" on public.catches
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Allow users to read their own profile" on public.profiles
    for select using (auth.uid() = id);

create policy "Allow users to update their own profile" on public.profiles
    for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Allow public read of catches on public spots" on public.catches
    for select using (
        exists (
            select 1 from public.fishing_spots s
            where s.id = spot_id and s.privacy_level = 'Public'
        )
    );

create function public.get_public_stats() returns json
security definer set search_path = public
as $$
    select json_build_object(
        'total_public_spots', (select count(*) from public.fishing_spots where privacy_level = 'Public'),
        'total_catches', (select count(*) from public.catches),
        'distinct_species', (select count(distinct species_name) from public.catches)
    );
$$ language sql stable;

revoke all on function public.get_public_stats() from public;
grant execute on function public.get_public_stats() to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('catch-photos', 'catch-photos', true)
on conflict (id) do nothing;

create policy "Allow authenticated upload to own catch folder" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'catch-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Allow public read of catch photos" on storage.objects
    for select using (bucket_id = 'catch-photos');
