import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MessageRequestButton from "./message-request-button";
import MemberSafetyActions from "@/components/member-safety-actions";
import PrivateAlbumAccessButton from "./private-album-access-button";
import { FoundingAvatarMark, FoundingNameMark } from "@/components/founding-mark";
import { MemberOnlineBadge } from "@/components/presence-provider";
import ProfilePhotoCarousel from "./profile-photo-carousel";

type Profile = {
  member_id: string;
  nickname: string;
  age: number;
  height_cm: number | null;
  body_type: string | null;
  interests: string[] | null;
  relationship_goal: string | null;
  bio: string | null;
  avatar_path: string | null;
  profile_photo_paths: string[] | null;
};

const goals: Record<string, string> = {
  friends: "เพื่อนใหม่",
  chat: "พูดคุย",
  casual: "ความสัมพันธ์แบบสบาย ๆ",
  dating: "ทำความรู้จัก / เดต",
  long_term: "ความสัมพันธ์จริงจัง",
  open_to_all: "เปิดใจ",
};
const bodies: Record<string, string> = {
  slim: "ผอม",
  average: "สมส่วน",
  athletic: "นักกีฬา",
  muscular: "มีกล้าม",
  stocky: "หุ่นใหญ่",
  prefer_not_say: "ไม่ระบุ",
};

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || typeof claims?.claims?.sub !== "string") redirect("/auth");

  const { data, error } = await supabase.rpc("get_discoverable_profile", { p_member_id: id });
  if (error || !data?.length) notFound();

  const profile = data[0] as Profile;
  const [{ data: conversations }, { data: founderBadges }] = await Promise.all([
    supabase.rpc("get_my_conversations"),
    supabase.rpc("get_visible_gmck_founder_badges", { p_member_ids: [profile.member_id] }),
  ]);

  const photoPaths = profile.profile_photo_paths?.length
    ? profile.profile_photo_paths
    : profile.avatar_path ? [profile.avatar_path] : [];
  const photoResults = await Promise.all(photoPaths.map(path =>
    supabase.storage.from("profile-photos").createSignedUrl(path, 1800)
  ));
  const photoUrls = photoResults.map(result => result.data?.signedUrl).filter((url): url is string => !!url);

  const existingConversation = ((conversations ?? []) as {
    conversation_id: string;
    other_user_id: string;
    status: "pending" | "accepted" | "declined";
    is_incoming_request: boolean;
  }[]).find((item) => item.other_user_id === profile.member_id);

  const founder = founderBadges?.[0] as {
    founder_number: number;
    founder_role: "founding_council" | "community_ambassador" | "founding_member";
  } | undefined;

  return (
    <main className="app-shell !max-w-3xl !px-0 pb-10">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-4 sm:px-6">
          <Link href="/nearby" aria-label="กลับ" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-2xl text-white shadow-lg backdrop-blur-md">‹</Link>
          <MemberSafetyActions memberId={profile.member_id} returnTo="/nearby" variant="menu" />
        </div>

        <div className="relative h-[min(68vh,680px)] min-h-[390px] overflow-hidden bg-[#171020] sm:rounded-b-[2rem]">
          <ProfilePhotoCarousel photos={photoUrls} name={profile.nickname} />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#0b0911] via-[#0b0911]/65 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 z-10 sm:bottom-7 sm:left-7">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full border border-white/20 bg-black/45 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">GMCK MEMBER</span>
              {founder && <FoundingAvatarMark founderNumber={founder.founder_number} founderRole={founder.founder_role} />}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg sm:text-4xl">
              {founder && <FoundingNameMark founderNumber={founder.founder_number} founderRole={founder.founder_role} />}
              {profile.nickname}, {profile.age}
            </h1>
            <div className="mt-2"><MemberOnlineBadge memberId={profile.member_id} /></div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 sm:px-7">
        <section className="border-b border-white/10 py-5">
          <div className="flex flex-wrap gap-2">
            {profile.height_cm && <span className="rounded-full border border-purple-300/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-100">สูง {profile.height_cm} ซม.</span>}
            {profile.body_type && <span className="rounded-full border border-purple-300/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-100">{bodies[profile.body_type] ?? profile.body_type}</span>}
            {profile.relationship_goal && <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-500/10 px-4 py-2 text-sm text-fuchsia-100">{goals[profile.relationship_goal] ?? profile.relationship_goal}</span>}
          </div>
        </section>

        {profile.bio && (
          <section className="border-b border-white/10 py-5">
            <h2 className="text-xl font-bold text-white">เกี่ยวกับฉัน</h2>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-8 text-zinc-300">{profile.bio}</p>
          </section>
        )}

        {!!profile.interests?.length && (
          <section className="border-b border-white/10 py-5">
            <h2 className="text-xl font-bold text-white">ความสนใจ</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.interests.map((item) => (
                <span key={item} className="rounded-full border border-purple-300/25 bg-purple-500/10 px-4 py-2 text-sm text-purple-100">{item}</span>
              ))}
            </div>
          </section>
        )}

        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-purple-300/20 bg-gradient-to-br from-purple-500/15 to-fuchsia-500/5 p-4">
            <p className="text-xs font-semibold tracking-wide text-purple-200">พร้อมทำความรู้จัก?</p>
            <p className="mt-1 text-sm text-zinc-300">เริ่มบทสนทนาอย่างสุภาพและเป็นตัวเอง</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
            <p className="text-xs font-semibold tracking-wide text-zinc-400">ความเป็นส่วนตัว</p>
            <p className="mt-1 text-sm text-zinc-300">เจ้าของโปรไฟล์เป็นผู้ควบคุมการอนุมัติคำขอข้อความและอัลบั้มส่วนตัว</p>
          </div>
        </section>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <MessageRequestButton
            recipientId={profile.member_id}
            conversationId={existingConversation?.conversation_id ?? null}
            conversationStatus={existingConversation?.status ?? null}
            isIncomingRequest={existingConversation?.is_incoming_request ?? false}
          />
          <div className="rounded-2xl border border-purple-300/20 bg-[#171321] p-4">
            <p className="mb-2 text-sm font-semibold text-white">อัลบั้มส่วนตัว</p>
            <PrivateAlbumAccessButton ownerId={profile.member_id} />
          </div>
        </div>

        <MemberSafetyActions memberId={profile.member_id} returnTo="/nearby" />
        <p className="mt-5 text-center text-xs leading-6 text-zinc-500">ส่งข้อความแรกได้ 1 ข้อความ สมาชิกอีกฝ่ายต้องยอมรับคำขอก่อนจึงจะสนทนาต่อได้</p>
      </div>
    </main>
  );
}
