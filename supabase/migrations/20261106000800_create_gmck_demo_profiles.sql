create table if not exists public.demo_profiles (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(trim(nickname)) between 2 and 24),
  age smallint not null check (age between 18 and 99),
  height_cm smallint check (height_cm between 120 and 230),
  body_type text check (body_type in ('slim','average','athletic','muscular','stocky','prefer_not_say')),
  interests text[] not null default '{}',
  relationship_goal text check (relationship_goal in ('friends','chat','dating','casual','long_term','open_to_all')),
  bio text not null default '' check (char_length(bio) <= 500),
  is_demo boolean not null default true check (is_demo is true),
  sort_order smallint not null unique,
  created_at timestamptz not null default now()
);

alter table public.demo_profiles enable row level security;
drop policy if exists "Authenticated users can view demo profiles" on public.demo_profiles;
create policy "Authenticated users can view demo profiles"
  on public.demo_profiles for select to authenticated using (true);
revoke all on public.demo_profiles from anon, public;
grant select on public.demo_profiles to authenticated;

insert into public.demo_profiles
  (nickname, age, height_cm, body_type, interests, relationship_goal, bio, sort_order)
values
  ('นนท์', 29, 176, 'athletic', array['ฟิตเนส','กาแฟ','ท่องเที่ยว'], 'dating', 'ทำงานสายการตลาด ชอบออกกำลังกายหลังเลิกงาน วันหยุดชอบหาร้านกาแฟใหม่ ๆ ถ้าคุยกันถูกคอก็อยากลองนัดเจอครับ', 1),
  ('เจ', 32, 180, 'muscular', array['เวทเทรนนิ่ง','หนัง','ทำอาหาร'], 'long_term', 'เป็นคนค่อนข้างเรียบง่าย จริงจังกับงานแต่ก็แบ่งเวลาให้คนสำคัญ ชอบทำอาหารกินเองและดูหนังอยู่บ้าน', 2),
  ('ภูมิ', 27, 172, 'average', array['ดนตรี','คาเฟ่','วิ่ง'], 'chat', 'ทำงานกราฟิก ชอบฟังเพลงอินดี้กับเดินเล่นถ่ายรูป คุยได้เรื่อย ๆ ไม่รีบครับ', 3),
  ('อาร์ม', 35, 178, 'stocky', array['อาหาร','เดินทาง','กาแฟ'], 'friends', 'เจ้าของกิจการเล็ก ๆ ชอบลองร้านอาหารและขับรถเที่ยวต่างจังหวัด มองหาคนคุยสบาย ๆ และเพื่อนใหม่', 4),
  ('คิม', 30, 174, 'athletic', array['ว่ายน้ำ','ซีรีส์','สัตว์เลี้ยง'], 'open_to_all', 'ทำงานออฟฟิศ ชอบว่ายน้ำตอนเช้า เลี้ยงแมวหนึ่งตัว เป็นคนตรงไปตรงมาและให้เกียรติกัน', 5),
  ('วิน', 38, 182, 'muscular', array['ฟิตเนส','ธุรกิจ','ไวน์'], 'long_term', 'ทำงานบริหาร เวลาว่างเข้ายิมหรืออ่านหนังสือธุรกิจ ชอบคนมีวุฒิภาวะและสื่อสารกันชัดเจน', 6),
  ('บอส', 26, 170, 'slim', array['เกม','อนิเมะ','บอร์ดเกม'], 'chat', 'สายไอทีที่ชอบเกมกับบอร์ดเกมมาก วันหยุดชอบหาร้านนั่งเล่นหรือดูหนังกับเพื่อน', 7),
  ('แทน', 33, 177, 'average', array['จักรยาน','ธรรมชาติ','ถ่ายภาพ'], 'dating', 'ชอบปั่นจักรยานและออกไปเที่ยวธรรมชาติ ถ่ายรูปเรื่อยเปื่อย เป็นคนใจเย็น ชอบบทสนทนาที่มีสาระปนมุก', 8),
  ('ไมค์', 31, 175, 'muscular', array['เวทเทรนนิ่ง','แฟชั่น','คอนเสิร์ต'], 'casual', 'ทำงานด้านดีไซน์ ชอบแต่งตัวและไปคอนเสิร์ต ออกกำลังกายเป็นประจำ เปิดใจทำความรู้จักแบบไม่กดดัน', 9),
  ('ก้อง', 40, 173, 'stocky', array['ทำอาหาร','สวน','ท่องเที่ยว'], 'friends', 'ชอบทำอาหารและปลูกต้นไม้เล็ก ๆ ที่บ้าน วันหยุดมักออกไปเที่ยวใกล้ ๆ อยากรู้จักเพื่อนใหม่ที่คุยกันได้ทุกเรื่อง', 10)
on conflict (sort_order) do update set
  nickname = excluded.nickname,
  age = excluded.age,
  height_cm = excluded.height_cm,
  body_type = excluded.body_type,
  interests = excluded.interests,
  relationship_goal = excluded.relationship_goal,
  bio = excluded.bio;

create or replace function public.get_demo_profiles()
returns table (
  id uuid,
  nickname text,
  age smallint,
  height_cm smallint,
  body_type text,
  interests text[],
  relationship_goal text,
  bio text,
  is_demo boolean
)
language plpgsql
stable
security invoker
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  return query
  select d.id, d.nickname, d.age, d.height_cm, d.body_type,
         d.interests, d.relationship_goal, d.bio, d.is_demo
  from public.demo_profiles d
  order by d.sort_order;
end;
$function$;

revoke all on function public.get_demo_profiles() from public, anon;
grant execute on function public.get_demo_profiles() to authenticated;
