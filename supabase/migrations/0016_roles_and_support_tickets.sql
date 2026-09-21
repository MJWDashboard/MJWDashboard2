-- Multi-user access: one developer/admin account plus invited users, each
-- scoped to their own data by the owner_id policies already on every table.

alter table profiles add column role text not null default 'user' check (role in ('admin', 'user'));

-- The account already running this deployment becomes the developer.
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'mornay22@gmail.com');

-- Self-serve signup only succeeds once (bootstrapping the first/developer
-- account). After an admin exists, a new auth.users row is only accepted
-- when raw_app_meta_data->>'invited' is true — that field can only be set
-- via the service-role admin API (lib/supabase/serviceRole.ts), never by a
-- public client-side signUp() call, so this can't be spoofed from the login
-- form.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  admin_exists boolean;
begin
  select exists(select 1 from public.profiles where role = 'admin') into admin_exists;

  if admin_exists and coalesce((new.raw_app_meta_data ->> 'invited')::boolean, false) is not true then
    raise exception 'This platform is invite-only. Ask the developer for access.';
  end if;

  insert into public.profiles (id, display_name, first_name, last_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    case when admin_exists then 'user' else 'admin' end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create sequence if not exists support_ticket_seq;

create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  ticket_number text not null unique default ('TKT-' || lpad(nextval('support_ticket_seq')::text, 5, '0')),
  reporter_email text not null,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table support_tickets enable row level security;

create policy "support_tickets: owner can insert" on support_tickets
  for insert with check (owner_id = auth.uid());

create policy "support_tickets: owner can read own" on support_tickets
  for select using (owner_id = auth.uid());

create policy "support_tickets: admin can read all" on support_tickets
  for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "support_tickets: admin can update" on support_tickets
  for update using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
