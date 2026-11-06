insert into public.profile_photos (user_id, path, position)
select p.id, p.avatar_path, 0
from public.profiles p
where p.avatar_path is not null
  and not exists (
    select 1 from public.profile_photos pp where pp.user_id = p.id
  )
on conflict (path) do nothing;