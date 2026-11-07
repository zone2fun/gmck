import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MemberSearch from "./member-search";

export default async function DiscoverPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || typeof data?.claims?.sub !== "string") redirect("/auth");

  return (
    <main className="app-shell">
      <header className="flex items-center justify-between">
        <Link href="/home" aria-label="GMCK" className="flex items-center"><img src="/gmck-header.png" alt="GMCK" className="h-10 w-auto object-contain" /></Link>
        <Link href="/profile/setup" className="text-xs text-purple-200 underline">แก้ไขโปรไฟล์</Link>
      </header>
      <section className="mt-9">
        <p className="text-xs font-semibold tracking-[.22em] text-purple-300">DISCOVER MEMBERS</p>
        <h1 className="glow mt-3 text-3xl font-semibold">ค้นหาสมาชิก</h1>
        <p className="mt-2 text-sm leading-7 text-zinc-400">ค้นหาจากชื่อเล่น ความสนใจ หรือคำแนะนำตัว ระบบจะแสดงเฉพาะสมาชิกที่อนุญาตให้ค้นพบโปรไฟล์</p>
      </section>
      <MemberSearch />
      <p className="mt-7 text-center text-xs text-zinc-600">GMCK ไม่แสดงพิกัดจริงหรือระยะทางที่ระบุตำแหน่งได้</p>
    </main>
  );
}
