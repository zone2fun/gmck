import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FoundingEnrollment from "./founding-enrollment";

export default async function FoundingPage() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  if (authError || typeof userId !== "string") redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.profile_completed) redirect("/profile/setup");

  const [{ data: founder }, { data: capacity }] = await Promise.all([
    supabase
      .from("gmck_founders")
      .select("founder_number,founder_role,status,created_at,revoked_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("gmck_founder_capacity")
      .select("founder_role,capacity,claimed,remaining")
      .order("capacity", { ascending: true }),
  ]);

  return (
    <main className="app-shell">
      <header className="flex items-center justify-between">
        <Link href="/settings" className="text-sm text-purple-200">← การตั้งค่า</Link>
        <span className="text-lg font-bold tracking-[.18em]">GMCK</span>
      </header>
      <section className="mt-8 text-center">
        <p className="text-xs font-semibold tracking-[.24em] text-purple-300">BE PART OF THE BEGINNING</p>
        <h1 className="glow mt-3 text-3xl font-semibold">FOUNDING 300</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-zinc-400">
          ร่วมเป็นหนึ่งในสมาชิกผู้ก่อตั้ง GMCK สถานะนี้เป็นเกียรติประวัติตลอดชีพ ไม่สามารถซื้อหรือโอนให้ผู้อื่นได้
        </p>
      </section>
      <FoundingEnrollment
        initialFounder={founder}
        initialCapacity={capacity ?? []}
      />
      <p className="mt-8 text-center text-xs leading-6 text-zinc-500">
        การลบบัญชีจะทำให้สถานะ Founding ถูกเพิกถอนถาวร หมายเลขเดิมจะไม่ถูกนำกลับมาใช้ แม้สมัครใหม่ในภายหลัง
      </p>
    </main>
  );
}
