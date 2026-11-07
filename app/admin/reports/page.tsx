import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminReportsClient from "./admin-reports-client";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.app_metadata?.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0812] px-5 text-white">
        <div className="max-w-md rounded-2xl border border-white/10 bg-[#171421] p-7 text-center">
          <p className="text-xs font-bold tracking-[.2em] text-fuchsia-300">GMCK ADMIN</p>
          <h1 className="mt-3 text-xl font-bold">ไม่มีสิทธิ์เข้าถึง</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ กรุณาเข้าสู่ระบบด้วยบัญชี Admin</p>
        </div>
      </main>
    );
  }

  const { data: reports, error } = await supabase.from("user_reports")
    .select("id,reporter_id,reported_user_id,reason,details,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error("Unable to load moderation reports");

  const memberIds = [...new Set((reports ?? []).flatMap(r => [r.reporter_id, r.reported_user_id]))];
  const [{ data: profiles }, { data: audits }] = await Promise.all([
    memberIds.length ? supabase.from("profiles").select("id,nickname").in("id", memberIds) : Promise.resolve({ data: [] }),
    reports?.length ? supabase.from("user_report_audit").select("id,report_id,actor_id,old_status,new_status,created_at").in("report_id", reports.map(r => r.id)).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
  ]);

  return <AdminReportsClient reports={reports ?? []} profiles={profiles ?? []} audits={audits ?? []} />;
}
