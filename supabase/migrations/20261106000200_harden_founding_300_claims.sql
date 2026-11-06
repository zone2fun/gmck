-- Replace the public SECURITY DEFINER RPC/view with a constrained insert trigger
-- and a public aggregate-only capacity table.

drop function if exists public.claim_gmck_founder_slot(text);
drop view if exists public.gmck_founder_capacity;

create table public.gmck_founder_capacity (
  founder_role text primary key check (founder_role in ('founding_council', 'community_ambassador', 'founding_member')),
  capacity integer not null check (capacity > 0),
  claimed integer not null default 0 check (claimed >= 0 and claimed <= capacity),
  remaining integer generated always as (capacity - claimed) stored
);

insert into public.gmck_founder_capacity (founder_role, capacity, claimed)
values
  ('founding_council', 30, (select count(*)::integer from public.gmck_founders where founder_role='founding_council')),
  ('community_ambassador', 70, (select count(*)::integer from public.gmck_founders where founder_role='community_ambassador')),
  ('founding_member', 200, (select count(*)::integer from public.gmck_founders where founder_role='founding_member'));

alter table public.gmck_founder_capacity enable row level security;
revoke all on public.gmck_founder_capacity from anon, authenticated;
grant select on public.gmck_founder_capacity to authenticated;
create policy "Signed-in members can read aggregate founder capacity"
on public.gmck_founder_capacity for select to authenticated using (true);

create policy "Members can claim one founding slot for themselves"
on public.gmck_founders for insert to authenticated
with check ((select auth.uid()) = user_id and status = 'active');
grant insert on public.gmck_founders to authenticated;

create or replace function public.assign_gmck_founder_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_capacity integer;
  v_claimed integer;
  v_next_number integer;
begin
  if auth.uid() is null or auth.uid() <> new.user_id then
    raise exception 'ไม่สามารถสมัคร Founding ในนามบัญชีอื่นได้';
  end if;

  if not exists (
    select 1 from public.profiles p
     where p.id = auth.uid() and p.profile_completed = true
  ) then
    raise exception 'กรุณาสร้างโปรไฟล์ให้เสร็จก่อนสมัคร Founding 300';
  end if;

  if new.founder_role not in ('founding_council', 'community_ambassador', 'founding_member') then
    raise exception 'บทบาท Founding ไม่ถูกต้อง';
  end if;

  lock table public.gmck_founders in exclusive mode;

  select c.capacity, c.claimed
    into v_capacity, v_claimed
    from public.gmck_founder_capacity c
   where c.founder_role = new.founder_role
   for update;

  if not found or v_claimed >= v_capacity then
    raise exception 'บทบาทนี้เต็มแล้ว กรุณาเลือกบทบาทอื่น';
  end if;

  select coalesce(max(f.founder_number), 0) + 1
    into v_next_number
    from public.gmck_founders f;

  if v_next_number > 300 then
    raise exception 'Founding 300 ครบจำนวนแล้ว';
  end if;

  new.founder_number := v_next_number;
  new.user_id := auth.uid();
  new.status := 'active';
  new.created_at := now();
  new.revoked_at := null;

  update public.gmck_founder_capacity
     set claimed = claimed + 1
   where founder_role = new.founder_role;

  return new;
end;
$$;

revoke all on function public.assign_gmck_founder_slot() from public, anon, authenticated;
drop trigger if exists on_gmck_founder_insert_assign_slot on public.gmck_founders;
create trigger on_gmck_founder_insert_assign_slot
before insert on public.gmck_founders
for each row execute function public.assign_gmck_founder_slot();