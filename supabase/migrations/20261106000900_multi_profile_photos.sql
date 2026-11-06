
create table if not exists public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null unique,
  position smallint not null check (position between 0 and 5),
  created_at timestamptz not null default now(),
  constraint profile_photos_user_position_key unique (user_id, position),
  constraint profile_photos_path_owner_check check (split_part(path, '/', 1) = user_id::text)
);

alter table public.profile_photos enable row level security;

drop policy if exists "Members manage own profile photos" on public.profile_photos;
create policy "Members manage own profile photos"
on public.profile_photos for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.profile_photos from anon, public;
grant select, insert, update, delete on public.profile_photos to authenticated;

create or replace function public.enforce_profile_photo_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'INSERT' then
    if (select count(*) from public.profile_photos where user_id = new.user_id) >= 6 then
      raise exception 'A maximum of 6 profile photos is allowed';
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists profile_photos_limit_trigger on public.profile_photos;
create trigger profile_photos_limit_trigger
before insert on public.profile_photos
for each row execute function public.enforce_profile_photo_limit();

drop function if exists public.get_discoverable_profile(uuid);
create function public.get_discoverable_profile(p_member_id uuid)
returns table(
  member_id uuid,
  nickname text,
  age integer,
  height_cm smallint,
  body_type text,
  interests text[],
  relationship_goal text,
  bio text,
  avatar_path text,
  profile_photo_paths text[]
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  return query
  select p.id,
         p.nickname,
         extract(year from age(current_date, p.birth_date))::integer,
         p.height_cm,
         p.body_type,
         p.interests,
         p.relationship_goal,
         p.bio,
         p.avatar_path,
         coalesce(
           (select array_agg(pp.path order by pp.position asc)
            from public.profile_photos pp where pp.user_id = p.id),
           case when p.avatar_path is not null then array[p.avatar_path] else array[]::text[] end
         )
  from public.profiles p
  where p.id = p_member_id
    and p.profile_completed is true
    and (
      p.is_discoverable is true
      or exists (
        select 1 from public.private_album_access a
        where a.owner_id = v_uid
          and a.viewer_id = p.id
          and a.status in ('pending', 'approved')
      )
    )
    and not private.are_users_blocked(v_uid, p.id);
end;
$function$;

revoke all on function public.get_discoverable_profile(uuid) from public, anon;
grant execute on function public.get_discoverable_profile(uuid) to authenticated;
