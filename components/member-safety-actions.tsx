"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const reasons = [
  ["harassment", "คุกคามหรือใช้ถ้อยคำไม่เหมาะสม"],
  ["spam", "สแปมหรือหลอกลวง"],
  ["fake_profile", "โปรไฟล์ปลอมหรือแอบอ้าง"],
  ["underage", "สงสัยว่าอายุต่ำกว่า 18 ปี"],
  ["nudity", "ภาพเปลือยหรือเนื้อหาทางเพศที่ไม่เหมาะสม"],
  ["threats", "ข่มขู่หรือทำให้รู้สึกไม่ปลอดภัย"],
  ["other", "อื่น ๆ"],
] as const;

export default function MemberSafetyActions({ memberId, returnTo = "/discover" }: { memberId: string; returnTo?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("harassment");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const supabase = createClient();

  async function blockMember() {
    if (!window.confirm("ต้องการบล็อกสมาชิกนี้ใช่หรือไม่? คุณจะไม่เห็นโปรไฟล์หรือแชตของกันและกัน และจะส่งข้อความหากันไม่ได้")) return;
    setBusy(true);
    setNotice("");
    const { error } = await supabase.rpc("block_member", { p_blocked_user_id: memberId });
    setBusy(false);
    if (error) { setNotice("บล็อกไม่สำเร็จ กรุณาลองใหม่"); return; }
    router.replace(returnTo);
    router.refresh();
  }

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const { error } = await supabase.rpc("report_member", {
      p_reported_user_id: memberId,
      p_reason: reason,
      p_details: details.trim() || null,
    });
    setBusy(false);
    if (error) { setNotice(error.message.includes("rate limit") ? "ส่งรายงานครบจำนวนที่กำหนดแล้ว กรุณาลองใหม่ภายหลัง" : "ส่งรายงานไม่สำเร็จ กรุณาลองใหม่"); return; }
    setOpen(false);
    setDetails("");
    setNotice("ส่งรายงานแล้ว ทีมงานจะตรวจสอบข้อมูล");
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-center gap-5 text-xs">
        <button type="button" disabled={busy} onClick={() => setOpen(true)} className="text-zinc-400 underline underline-offset-4 hover:text-purple-200">รายงานสมาชิก</button>
        <button type="button" disabled={busy} onClick={() => void blockMember()} className="text-red-300 underline underline-offset-4 hover:text-red-200">บล็อกสมาชิก</button>
      </div>
      {notice && <p role="status" className="mt-3 text-center text-xs text-purple-200">{notice}</p>}
      {open && <div className="mt-4 rounded-2xl border border-white/10 bg-[#14131d] p-4">
        <form onSubmit={submitReport}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">รายงานสมาชิก</h3>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-zinc-400">ปิด</button>
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-400">เลือกเหตุผลที่ตรงที่สุด รายงานจะถูกส่งให้ทีมงานตรวจสอบ ไม่ได้ทำให้สมาชิกถูกลงโทษโดยอัตโนมัติ</p>
          <label className="mt-4 block text-xs text-zinc-300">เหตุผล</label>
          <select value={reason} onChange={e => setReason(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090f] px-3 py-3 text-sm text-white">
            {reasons.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <label className="mt-4 block text-xs text-zinc-300">รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
          <textarea value={details} onChange={e => setDetails(e.target.value)} maxLength={1000} rows={3} placeholder="อธิบายสิ่งที่เกิดขึ้น โดยไม่ใส่ข้อมูลส่วนตัวที่ไม่จำเป็น" className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#09090f] px-3 py-3 text-sm text-white outline-none focus:border-purple-400" />
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-white/10 px-3 py-3 text-sm">ยกเลิก</button>
            <button type="submit" disabled={busy} className="flex-1 rounded-xl bg-purple-600 px-3 py-3 text-sm font-semibold disabled:opacity-50">{busy ? "กำลังส่ง..." : "ส่งรายงาน"}</button>
          </div>
        </form>
      </div>}
    </div>
  );
}
