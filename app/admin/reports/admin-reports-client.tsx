"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Report = {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  details: string | null;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  created_at: string;
};
type Profile = { id: string; nickname: string | null };
type Audit = { id: string; report_id: string; actor_id: string | null; old_status: string; new_status: string; created_at: string };

const reasonLabels: Record<string,string> = {
  harassment: "คุกคามหรือใช้ถ้อยคำไม่เหมาะสม",
  spam: "สแปมหรือหลอกลวง",
  fake_profile: "โปรไฟล์ปลอมหรือแอบอ้าง",
  underage: "สงสัยว่าอายุต่ำกว่า 18 ปี",
  nudity: "ภาพเปลือยหรือเนื้อหาทางเพศที่ไม่เหมาะสม",
  threats: "ข่มขู่หรือทำให้รู้สึกไม่ปลอดภัย",
  other: "อื่น ๆ",
};
const statusLabels: Record<string,string> = {
  pending: "รอตรวจสอบ",
  reviewing: "กำลังตรวจสอบ",
  resolved: "ดำเนินการแล้ว",
  dismissed: "ปิดรายงาน",
};

export default function AdminReportsClient({ reports, profiles, audits }: { reports: Report[]; profiles: Profile[]; audits: Audit[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [filter, setFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const profileMap = new Map(profiles.map(p => [p.id, p.nickname || "ไม่ระบุชื่อ"]));
  const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter);
  const counts = {
    pending: reports.filter(r => r.status === "pending").length,
    reviewing: reports.filter(r => r.status === "reviewing").length,
    resolved: reports.filter(r => r.status === "resolved").length,
    dismissed: reports.filter(r => r.status === "dismissed").length,
  };

  async function changeStatus(report: Report, status: Report["status"]) {
    setBusyId(report.id);
    setError("");
    const { error: updateError } = await supabase.from("user_reports").update({ status }).eq("id", report.id);
    setBusyId(null);
    if (updateError) {
      setError("เปลี่ยนสถานะไม่สำเร็จ ตรวจสอบสิทธิ์ Admin และลองเข้าสู่ระบบใหม่");
      return;
    }
    router.refresh();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-24 pt-8 text-white sm:px-6">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[.24em] text-fuchsia-300">GMCK ADMIN · SAFETY CENTER</p>
          <h1 className="mt-2 text-2xl font-bold">ศูนย์จัดการรายงาน</h1>
          <p className="mt-1 text-sm text-zinc-400">ตรวจสอบรายงานสมาชิกและติดตามผลการดำเนินการ</p>
        </div>
        <button type="button" onClick={() => router.refresh()} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-200 hover:border-purple-400/50">รีเฟรช</button>
      </div>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["pending","reviewing","resolved","dismissed"] as const).map(status => (
          <button key={status} type="button" onClick={() => setFilter(status)}
            className={"rounded-2xl border p-4 text-left transition " + (filter === status ? "border-fuchsia-400/60 bg-fuchsia-500/10" : "border-white/10 bg-white/[.03]")}>
            <span className="block text-2xl font-bold tabular-nums">{counts[status]}</span>
            <span className="mt-1 block text-xs text-zinc-400">{statusLabels[status]}</span>
          </button>
        ))}
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">รายการรายงาน <span className="text-zinc-500">({filtered.length})</span></h2>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#171421] px-3 py-2 text-sm">
          <option value="all">ทุกสถานะ</option>
          {Object.entries(statusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[.03] px-5 py-14 text-center">
          <p className="text-base font-semibold">ไม่พบรายงาน</p>
          <p className="mt-2 text-sm text-zinc-500">เมื่อสมาชิกส่งรายงาน รายการจะแสดงที่หน้านี้</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => {
            const history = audits.filter(a => a.report_id === report.id);
            return (
              <article key={report.id} className="rounded-2xl border border-white/10 bg-[#14111d] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-500/10 px-2.5 py-1 text-[11px] text-fuchsia-200">{reasonLabels[report.reason] || report.reason}</span>
                    <p className="mt-3 text-sm">ผู้ถูกรายงาน: <strong>{profileMap.get(report.reported_user_id) || "ไม่พบโปรไฟล์"}</strong></p>
                    <p className="mt-1 text-xs text-zinc-500">ผู้รายงาน: {profileMap.get(report.reporter_id) || "ไม่พบโปรไฟล์"}</p>
                    <p className="mt-1 break-all text-[10px] text-zinc-600">Report ID: {report.id}</p>
                  </div>
                  <time className="text-xs text-zinc-500">{new Date(report.created_at).toLocaleString("th-TH")}</time>
                </div>
                {report.details && <div className="mt-4 rounded-xl bg-black/25 p-3 text-sm leading-6 text-zinc-300 whitespace-pre-wrap">{report.details}</div>}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <label className="flex items-center gap-2 text-xs text-zinc-400">
                    สถานะ
                    <select disabled={busyId === report.id} value={report.status} onChange={e => void changeStatus(report, e.target.value as Report["status"])}
                      className="rounded-lg border border-white/10 bg-[#201b2b] px-3 py-2 text-sm text-white disabled:opacity-50">
                      {Object.entries(statusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  {history.length > 0 && <span className="text-[11px] text-zinc-500">มีประวัติเปลี่ยนสถานะ {history.length} ครั้ง</span>}
                </div>
                {history.length > 0 && <details className="mt-3 text-xs text-zinc-500">
                  <summary className="cursor-pointer">ดูประวัติการดำเนินการ</summary>
                  <ul className="mt-2 space-y-1">
                    {history.map(item => <li key={item.id}>{new Date(item.created_at).toLocaleString("th-TH")} · {statusLabels[item.old_status] || item.old_status} → {statusLabels[item.new_status] || item.new_status}</li>)}
                  </ul>
                </details>}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
