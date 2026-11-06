import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MemberSearch from "./member-search";
import DemoProfiles from "@/components/demo-profiles";

export default async function DiscoverPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || typeof data?.claims?.sub !== "string") redirect("/auth");

  return (
    <main className="app-shell">
      <header className="flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-3"><span className="brand-mark">G</span><span className="text-lg font-bold tracking-[.18em]">GMCK</span></Link>
        <Link href="/profile/setup" className="text-xs text-purple-200 underline">แก้ไขโปรไฟล์</Link>
      </header>
      <section className="mt-9">
        <p className="text-xs font-semibold tracking-[.22em] text-purple-300">DISCOVER MEMBERS</p>
        <h1 className="glow mt-3 text-3xl font-semibold">ค้นหาสมาชิก</h1>
        <p className="mt-2 text-sm leading-7 text-zinc-400">ค้นหาจากชื่อเล่น ความสนใจ หรือคำแนะนำตัว ระบบจะแสดงเฉพาะสมาชิกที่อนุญาตให้ค้นพบโปรไฟล์</p>
      </section>
      <MemberSearch />
      <DemoProfiles />
      <p className="mt-7 text-center text-xs text-zinc-600">GMCK ไม่แสดงพิกัดจริงหรือระยะทางที่ระบุตำแหน่งได้</p>
    </main>
  );
}
