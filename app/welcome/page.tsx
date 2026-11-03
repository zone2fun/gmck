import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function WelcomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/auth");

  return (
    <main className="app-shell flex min-h-svh flex-col">
      <header className="flex items-center gap-3">
        <span className="brand-mark">G</span>
        <span className="text-lg font-bold tracking-[.18em]">GMCK</span>
      </header>
      <section className="flex flex-1 flex-col justify-center">
        <p className="text-xs font-semibold tracking-[.24em] text-purple-300">ACCOUNT CREATED</p>
        <h1 className="glow mt-3 text-3xl font-semibold">ยินดีต้อนรับสู่ GMCK</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          คุณเข้าสู่ระบบสำเร็จแล้ว ขั้นตอนถัดไปเราจะสร้างโปรไฟล์และตั้งค่าความเป็นส่วนตัวของคุณ
        </p>
        <form action="/auth/signout" method="post" className="mt-8">
          <button className="w-full rounded-xl border border-white/15 px-5 py-3 text-sm text-zinc-200" type="submit">
            ออกจากระบบ
          </button>
        </form>
        <Link href="/" className="mt-5 text-center text-sm text-purple-300">กลับหน้าหลัก</Link>
      </section>
    </main>
  );
}
