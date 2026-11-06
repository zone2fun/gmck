create or replace function public.get_new_member_recommendations(p_limit integer default 12)
returns table (
  member_id uuid,
  nickname text,
  age integer,
  height_cm smallint,
  body_type text,
  interests text[],
  relationship_goal text,
  bio text,
  avatar_path text
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_limit is null or p_limit < 4 or p_limit > 24 then
    raise exception 'Invalid recommendation limit';
  end if;

  return query
  select
    p.id,
    p.nickname,
    extract(year from age(current_date, p.birth_date))::integer,
    p.height_cm,
    p.body_type,
    p.interests,
    p.relationship_goal,
    p.bio,
    p.avatar_path
  from public.profiles p
  where p.profile_completed is true
    and p.is_discoverable is true
    and p.id <> v_uid
    and not private.are_users_blocked(v_uid, p.id)
  order by p.created_at desc, p.id desc
  limit p_limit;
end;
$function$;

revoke all on function public.get_new_member_recommendations(integer) from public, anon;
grant execute on function public.get_new_member_recommendations(integer) to authenticated;