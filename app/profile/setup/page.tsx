import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./profile-form";

export default async function ProfileSetupPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || typeof userId !== "string") redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname,birth_date,height_cm,body_type,interests,relationship_goal,about_me,avatar_path")
    .eq("id", userId)
    .maybeSingle();

  return (
    <main className="app-shell">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3"><span className="brand-mark">G</span><span className="text-lg font-bold tracking-[.18em]">GMCK</span></Link>
        <span className="pill rounded-full px-3 py-1 text-xs">ขั้นตอน 1 / 2</span>
      </header>
      <div className="mt-9">
        <p className="text-xs font-semibold tracking-[.22em] text-purple-300">YOUR PROFILE</p>
        <h1 className="glow mt-3 text-3xl font-semibold">สร้างโปรไฟล์ของคุณ</h1>
        <p className="mt-3 text-sm leading-7 text-zinc-400">เริ่มต้นด้วยข้อมูลที่คุณสบายใจจะแบ่งปัน คุณสามารถกลับมาแก้ไขได้ภายหลัง</p>
      </div>
      <ProfileForm userId={userId} initialProfile={profile} />
      <form action="/auth/signout" method="post" className="mt-5 text-center">
        <button type="submit" className="text-xs text-zinc-500 underline">ออกจากระบบ</button>
      </form>
    </main>
  );
}
