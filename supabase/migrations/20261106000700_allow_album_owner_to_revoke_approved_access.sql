create or replace function public.respond_private_album_access(p_viewer_id uuid, p_approve boolean)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
 v_uid uuid := auth.uid();
begin
 if v_uid is null then
  raise exception 'Authentication required';
 end if;

 update public.private_album_access
 set status = case when p_approve then 'approved' else 'revoked' end,
     updated_at = now()
 where owner_id = v_uid
   and viewer_id = p_viewer_id
   and (
     (p_approve = true and status = 'pending')
     or
     (p_approve = false and status in ('pending', 'approved'))
   );

 return found;
end;
$function$;

revoke all on function public.respond_private_album_access(uuid, boolean) from public, anon;
grant execute on function public.respond_private_album_access(uuid, boolean) to authenticated;
