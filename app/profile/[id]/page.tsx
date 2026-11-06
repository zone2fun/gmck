import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MessageRequestButton from "./message-request-button";
import MemberSafetyActions from "@/components/member-safety-actions";
import PrivateAlbumAccessButton from "./private-album-access-button";
import { FoundingAvatarMark, FoundingNameMark } from "@/components/founding-mark";

type Profile = { member_id: string; nickname: string; age: number; height_cm: number | null; body_type: string | null; interests: string[] | null; relationship_goal: string | null; bio: string | null; avatar_path: string | null };
const goals: Record<string,string> = { friends:"หาเพื่อน", chat:"พูดคุย", casual:"ความสัมพันธ์แบบสบาย ๆ", dating:"เดต", long_term:"ความสัมพันธ์จริงจัง", open_to_all:"เปิดใจ" };
const bodies: Record<string,string> = { slim:"ผอม", average:"สมส่วน", athletic:"นักกีฬา", muscular:"มีกล้าม", stocky:"หุ่นใหญ่", prefer_not_say:"ไม่ระบุ" };

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || typeof claims?.claims?.sub !== "string") redirect("/auth");
  const { data, error } = await supabase.rpc("get_discoverable_profile", { p_member_id: id });
  if (error || !data?.length) notFound();
  const profile = data[0] as Profile;
  const [{ data: conversations }, { data: photo }, { data: founderBadges }] = await Promise.all([
    supabase.rpc("get_my_conversations"),
    profile.avatar_path
      ? supabase.storage.from("profile-photos").createSignedUrl(profile.avatar_path, 1800)
      : Promise.resolve({ data: null }),
    supabase.rpc("get_visible_gmck_founder_badges", { p_member_ids: [profile.member_id] }),
  ]);
  const existingConversation = ((conversations ?? []) as { conversation_id: string; other_user_id: string; status: "pending" | "accepted" | "declined"; is_incoming_request: boolean }[])
    .find((item) => item.other_user_id === profile.member_id);
  const avatarUrl = photo?.signedUrl ?? null;
  const founder = founderBadges?.[0] as { founder_number: number; founder_role: "founding_council" | "community_ambassador" | "founding_member" } | undefined;
  return <main className="app-shell">
    <header className="flex items-center justify-between"><Link href="/discover" className="text-sm text-purple-200 underline">← กลับไปค้นหา</Link><Link href="/messages" className="text-sm text-purple-200 underline">ข้อความ</Link></header>
    <section className="panel mt-8 p-6">
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-purple-500/15">{avatarUrl ? <img src={avatarUrl} alt="รูปโปรไฟล์" className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-3xl text-purple-200">{profile.nickname.slice(0,1)}</div>}{founder&&<FoundingAvatarMark founderNumber={founder.founder_number} founderRole={founder.founder_role}/>}</div>
        <div><h1 className="text-2xl font-semibold">{profile.nickname}{founder&&<FoundingNameMark founderNumber={founder.founder_number} founderRole={founder.founder_role}/>}, {profile.age}</h1><p className="mt-2 text-sm text-zinc-400">{[profile.height_cm ? profile.height_cm+" ซม." : "", profile.body_type ? bodies[profile.body_type] ?? "" : ""].filter(Boolean).join(" · ")}</p>{profile.relationship_goal && <p className="mt-2 text-sm text-purple-200">{goals[profile.relationship_goal] ?? profile.relationship_goal}</p>}</div>
      </div>
      {profile.bio && <div className="mt-6"><h2 className="font-semibold">เกี่ยวกับฉัน</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{profile.bio}</p></div>}
      {!!profile.interests?.length && <div className="mt-6"><h2 className="font-semibold">ความสนใจ</h2><div className="mt-3 flex flex-wrap gap-2">{profile.interests.map((x) => <span key={x} className="pill rounded-full px-3 py-2 text-xs">{x}</span>)}</div></div>}
    </section>
    <MessageRequestButton recipientId={profile.member_id} conversationId={existingConversation?.conversation_id ?? null} conversationStatus={existingConversation?.status ?? null} isIncomingRequest={existingConversation?.is_incoming_request ?? false}/>
    <PrivateAlbumAccessButton ownerId={profile.member_id}/>
    <MemberSafetyActions memberId={profile.member_id} returnTo="/discover"/>
    <p className="mt-5 text-center text-xs leading-6 text-zinc-500">ส่งข้อความแรกได้ 1 ข้อความ สมาชิกอีกฝ่ายต้องยอมรับคำขอก่อนจึงจะสนทนาต่อได้</p>
  </main>;
}
