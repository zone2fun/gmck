create or replace function public.get_visible_gmck_founder_badges(p_member_ids uuid[])
returns table (member_id uuid, founder_number integer, founder_role text)
language plpgsql stable security definer set search_path = ''
as $function$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_member_ids is null or cardinality(p_member_ids) = 0 then return; end if;
  return query
  select f.user_id, f.founder_number, f.founder_role
  from public.gmck_founders f
  join public.profiles p on p.id = f.user_id
  where f.status = 'active'
    and f.user_id = any(p_member_ids)
    and p.profile_completed is true
    and (p.is_discoverable is true or exists (
      select 1 from public.private_album_access a
      where a.owner_id = v_uid and a.viewer_id = p.id and a.status in ('pending', 'approved')
    ))
    and not private.are_users_blocked(v_uid, p.id);
end;
$function$;
revoke all on function public.get_visible_gmck_founder_badges(uuid[]) from public, anon;
grant execute on function public.get_visible_gmck_founder_badges(uuid[]) to authenticated;
