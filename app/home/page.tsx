import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const goalLabels: Record<string, string> = {
  friends: "หาเพื่อน", chat: "พูดคุย", casual: "ความสัมพันธ์แบบสบาย ๆ",
  dating: "เดต", long_term: "ความสัมพันธ์จริงจัง", open_to_all: "เปิดใจ",
};
const bodyLabels: Record<string, string> = {
  slim: "ผอม", average: "สมส่วน", athletic: "นักกีฬา",
  muscular: "มีกล้าม", stocky: "หุ่นใหญ่", prefer_not_say: "ไม่ระบุ",
};

export default async function MemberHomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname,birth_date,height_cm,body_type,interests,relationship_goal,bio,avatar_path,profile_completed")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.profile_completed) redirect("/profile/setup");

  let avatarUrl: string | null = null;
  if (profile.avatar_path) {
    const { data: photo } = await supabase.storage.from("profile-photos").createSignedUrl(profile.avatar_path, 3600);
    avatarUrl = photo?.signedUrl ?? null;
  }

  const age = profile.birth_date
    ? Math.max(0, new Date().getFullYear() - new Date(profile.birth_date).getFullYear() -
      (new Date() < new Date(new Date(profile.birth_date).setFullYear(new Date().getFullYear())) ? 1 : 0))
    : null;

  return (
    <main className="app-shell">
      <header className="flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-3"><span className="brand-mark">G</span><span className="text-lg font-bold tracking-[.18em]">GMCK</span></Link>
        <span className="pill rounded-full px-3 py-1 text-xs">MEMBER</span>
      </header>

      <section className="mt-9">
        <p className="text-xs font-semibold tracking-[.22em] text-purple-300">WELCOME TO GMCK</p>
        <h1 className="glow mt-3 text-3xl font-semibold">สวัสดี, {profile.nickname}</h1>
        <p className="mt-2 text-sm leading-7 text-zinc-400">โปรไฟล์ของคุณพร้อมแล้ว มาเริ่มทำความรู้จักกัน</p>
      </section>

      <section className="panel mt-7 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-2xl text-purple-200">
            {avatarUrl ? <img src={avatarUrl} alt="รูปโปรไฟล์" className="h-full w-full object-cover" /> : "G"}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold">{profile.nickname}{age ? `, ${age}` : ""}</h2>
            <p className="mt-1 text-xs text-zinc-400">{profile.height_cm ? `${profile.height_cm} ซม. · ` : ""}{profile.body_type ? bodyLabels[profile.body_type] ?? "" : ""}</p>
            {profile.relationship_goal && <p className="mt-2 text-xs text-purple-200">{goalLabels[profile.relationship_goal] ?? profile.relationship_goal}</p>}
          </div>
        </div>
        {profile.bio && <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{profile.bio}</p>}
        {profile.interests?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{profile.interests.map((item: string) => <span key={item} className="pill rounded-full px-3 py-1.5 text-xs">{item}</span>)}</div>}
        <Link href="/profile/setup" className="mt-5 block rounded-xl border border-purple-300/30 px-4 py-3 text-center text-sm font-medium text-purple-200 transition hover:bg-purple-500/10">แก้ไขโปรไฟล์</Link>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">เริ่มต้นใช้งาน</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link href="/nearby" className="panel block p-4 transition hover:border-purple-300/40">
            <span className="text-2xl text-purple-300">⌖</span>
            <h3 className="mt-3 font-semibold">สมาชิกใกล้เคียง</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-400">เลือกช่วงระยะค้นหาและตั้งค่าสิทธิ์ตำแหน่ง</p>
            <span className="mt-3 inline-block text-xs text-purple-300">ตั้งค่า Nearby →</span>
          </Link>
          <Link href="/discover" className="panel block p-4 transition hover:border-purple-300/40">
            <span className="text-2xl text-purple-300">♡</span>
            <h3 className="mt-3 font-semibold">ค้นหาสมาชิก</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-400">ค้นหาคนที่มีความสนใจตรงกัน</p>
            <span className="mt-3 inline-block text-xs text-purple-300">ค้นหาตอนนี้ →</span>
          </Link>
          <Link href="/messages" className="panel block p-4 transition hover:border-purple-300/40">
            <span className="text-2xl text-purple-300">✉</span>
            <h3 className="mt-3 font-semibold">ข้อความ</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-400">พูดคุยและจัดการคำขอข้อความ</p>
            <span className="mt-3 inline-block text-xs text-purple-300">เปิดข้อความ →</span>
          </Link>
          <Link href="/album" className="panel block p-4 transition hover:border-purple-300/40">
            <span className="text-2xl text-purple-300">▧</span>
            <h3 className="mt-3 font-semibold">อัลบั้มส่วนตัว</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-400">จัดการรูปและอนุมัติผู้เข้าดู</p>
            <span className="mt-3 inline-block text-xs text-purple-300">จัดการอัลบั้ม →</span>
          </Link>
          <Link href="/blocked" className="panel block p-4 transition hover:border-purple-300/40">
            <span className="text-2xl text-purple-300">◇</span>
            <h3 className="mt-3 font-semibold">ความปลอดภัย</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-400">จัดการสมาชิกที่คุณบล็อกไว้</p>
            <span className="mt-3 inline-block text-xs text-purple-300">จัดการรายการบล็อก →</span>
          </Link>
        </div>
      </section>

      <footer className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-zinc-500">
        <span>GMCK · พื้นที่ที่เคารพความเป็นส่วนตัว</span>
        <form action="/auth/signout" method="post"><button className="underline">ออกจากระบบ</button></form>
      </footer>
    </main>
  );
}
