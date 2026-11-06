-- GMCK Founding 300: lifetime, non-transferable founder identities.
-- Founder rows intentionally do not reference auth.users so the number survives account deletion.
create table public.gmck_founders (
  founder_number integer primary key check (founder_number between 1 and 300),
  user_id uuid unique,
  founder_role text not null check (founder_role in ('founding_council', 'community_ambassador', 'founding_member')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (
    (status = 'active' and user_id is not null and revoked_at is null)
    or
    (status = 'revoked' and user_id is null and revoked_at is not null)
  )
);

comment on table public.gmck_founders is
  'Lifetime GMCK Founding 300 registry. Founder numbers are never reused; account deletion permanently revokes status while retaining a non-identifying tombstone.';
comment on column public.gmck_founders.user_id is
  'Current account UUID only. Set to NULL on auth.users deletion so no personal identifier is retained.';
comment on column public.gmck_founders.founder_number is
  'Permanent unique founder number 1-300. Revoked numbers are never reassigned.';

alter table public.gmck_founders enable row level security;

revoke all on table public.gmck_founders from anon, authenticated;
grant select on table public.gmck_founders to authenticated;

create policy "Members can read their own founding status"
on public.gmck_founders
for select
to authenticated
using ((select auth.uid()) = user_id and status = 'active');

create or replace view public.gmck_founder_capacity
with (security_barrier = true)
as
select
  roles.founder_role,
  roles.capacity,
  count(founders.founder_number)::integer as claimed,
  greatest(roles.capacity - count(founders.founder_number)::integer, 0) as remaining
from (values
  ('founding_council'::text, 30),
  ('community_ambassador'::text, 70),
  ('founding_member'::text, 200)
) as roles(founder_role, capacity)
left join public.gmck_founders as founders
  on founders.founder_role = roles.founder_role
 and founders.status = 'active'
group by roles.founder_role, roles.capacity;

revoke all on public.gmck_founder_capacity from anon;
grant select on public.gmck_founder_capacity to authenticated;

create or replace function public.claim_gmck_founder_slot(p_role text)
returns table (
  founder_number integer,
  founder_role text,
  status text,
  message text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing record;
  v_capacity integer;
  v_claimed integer;
  v_next_number integer;
begin
  if v_user_id is null then
    raise exception 'ต้องเข้าสู่ระบบก่อนสมัคร Founding 300';
  end if;

  if p_role not in ('founding_council', 'community_ambassador', 'founding_member') then
    raise exception 'บทบาท Founding ไม่ถูกต้อง';
  end if;

  select f.founder_number, f.founder_role, f.status
    into v_existing
    from public.gmck_founders as f
   where f.user_id = v_user_id;

  if found then
    return query select v_existing.founder_number, v_existing.founder_role, v_existing.status, 'คุณมีสถานะ Founding อยู่แล้ว'::text;
    return;
  end if;

  if not exists (
    select 1 from public.profiles p
     where p.id = v_user_id and p.profile_completed = true
  ) then
    raise exception 'กรุณาสร้างโปรไฟล์ให้เสร็จก่อนสมัคร Founding 300';
  end if;

  -- Serialize claims so concurrent requests cannot overfill a role or reuse a number.
  lock table public.gmck_founders in exclusive mode;

  select f.founder_number, f.founder_role, f.status
    into v_existing
    from public.gmck_founders as f
   where f.user_id = v_user_id;

  if found then
    return query select v_existing.founder_number, v_existing.founder_role, v_existing.status, 'คุณมีสถานะ Founding อยู่แล้ว'::text;
    return;
  end if;

  v_capacity := case p_role
    when 'founding_council' then 30
    when 'community_ambassador' then 70
    else 200
  end;

  select count(*)::integer
    into v_claimed
    from public.gmck_founders f
   where f.founder_role = p_role and f.status = 'active';

  if v_claimed >= v_capacity then
    return query select null::integer, p_role, 'full'::text, 'บทบาทนี้เต็มแล้ว กรุณาเลือกบทบาทอื่น'::text;
    return;
  end if;

  select coalesce(max(f.founder_number), 0) + 1
    into v_next_number
    from public.gmck_founders f;

  if v_next_number > 300 then
    return query select null::integer, p_role, 'full'::text, 'Founding 300 ครบจำนวนแล้ว'::text;
    return;
  end if;

  insert into public.gmck_founders (founder_number, user_id, founder_role)
  values (v_next_number, v_user_id, p_role);

  return query select v_next_number, p_role, 'active'::text, 'ยินดีต้อนรับสู่ Founding 300'::text;
end;
$$;

revoke all on function public.claim_gmck_founder_slot(text) from public, anon;
grant execute on function public.claim_gmck_founder_slot(text) to authenticated;

create or replace function public.revoke_gmck_founder_on_user_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.gmck_founders
     set status = 'revoked',
         user_id = null,
         revoked_at = now()
   where user_id = old.id
     and status = 'active';

  return old;
end;
$$;

revoke all on function public.revoke_gmck_founder_on_user_delete() from public, anon, authenticated;

drop trigger if exists on_auth_user_delete_revoke_gmck_founder on auth.users;
create trigger on_auth_user_delete_revoke_gmck_founder
before delete on auth.users
for each row
execute function public.revoke_gmck_founder_on_user_delete();
