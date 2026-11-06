import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || typeof data?.claims?.sub !== "string") redirect("/auth");
  return <main className="app-shell">
    <header className="flex items-center justify-between"><Link href="/discover" className="text-sm text-purple-200">← กลับ</Link><span className="text-lg font-bold tracking-[.18em]">GMCK</span></header>
    <section className="mt-8"><p className="text-xs tracking-[.2em] text-purple-300">PREFERENCES</p><h1 className="glow mt-2 text-3xl font-semibold">การตั้งค่า</h1><p className="mt-2 text-sm text-zinc-400">จัดการการใช้งานและความเป็นส่วนตัวของคุณ</p></section>
    <div className="mt-6 space-y-3">
      <Link href="/founding" className="panel flex items-center gap-4 p-5"><span className="text-2xl text-purple-300">✦</span><div className="min-w-0 flex-1"><h2 className="font-semibold">GMCK Founding 300</h2><p className="mt-1 text-xs text-zinc-400">สมัครหรือดูสถานะสมาชิกผู้ก่อตั้งตลอดชีพ</p></div><span className="text-purple-300">›</span></Link>
      <Link href="/settings/nearby" className="panel flex items-center gap-4 p-5"><span className="text-2xl text-purple-300">⌖</span><div className="min-w-0 flex-1"><h2 className="font-semibold">Nearby และตำแหน่ง</h2><p className="mt-1 text-xs text-zinc-400">กำหนดระยะค้นหา เปิดหรือปิดการแชร์ตำแหน่ง</p></div><span className="text-purple-300">›</span></Link>
      <Link href="/profile/setup" className="panel flex items-center gap-4 p-5"><span className="text-2xl text-purple-300">◉</span><div className="min-w-0 flex-1"><h2 className="font-semibold">แก้ไขโปรไฟล์</h2><p className="mt-1 text-xs text-zinc-400">ข้อมูลส่วนตัว รูปภาพ และความสนใจ</p></div><span className="text-purple-300">›</span></Link>
      <Link href="/album" className="panel flex items-center gap-4 p-5"><span className="text-2xl text-purple-300">▧</span><div className="min-w-0 flex-1"><h2 className="font-semibold">อัลบั้มส่วนตัว</h2><p className="mt-1 text-xs text-zinc-400">จัดการรูปภาพและสิทธิ์การเข้าถึง</p></div><span className="text-purple-300">›</span></Link>
      <Link href="/blocked" className="panel flex items-center gap-4 p-5"><span className="text-2xl text-purple-300">◇</span><div className="min-w-0 flex-1"><h2 className="font-semibold">สมาชิกที่บล็อก</h2><p className="mt-1 text-xs text-zinc-400">จัดการรายการสมาชิกที่คุณบล็อกไว้</p></div><span className="text-purple-300">›</span></Link>
    </div>
    <form action="/auth/signout" method="post" className="mt-8 text-center"><button className="text-sm text-zinc-500 underline">ออกจากระบบ</button></form>
  </main>;
}
