"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const radii = [1, 5, 10, 25, 50, 100] as const;
type Member = {
  member_id: string; nickname: string; age: number; height_cm: number | null; avatar_path: string | null; avatar_url?: string | null;
  body_type: string | null; interests: string[] | null;
  relationship_goal: string | null; bio: string | null; distance_label: string;
};
const bodyLabels: Record<string, string> = {
  slim: "ผอม", average: "สมส่วน", athletic: "นักกีฬา",
  muscular: "มีกล้าม", stocky: "หุ่นใหญ่", prefer_not_say: "ไม่ระบุ",
};
const goalLabels: Record<string, string> = {
  friends: "หาเพื่อน", chat: "พูดคุย", casual: "ความสัมพันธ์แบบสบาย ๆ",
  dating: "เดต", long_term: "ความสัมพันธ์จริงจัง", open_to_all: "เปิดใจ",
};

export default function NearbyPage() {
  const [radius, setRadius] = useState<number>(10);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [notice, setNotice] = useState("");
  const supabase = useMemo(() => createClient(), []);

  const searchMembers = useCallback(async (selectedRadius = radius) => {
    setBusy(true);
    setNotice("");
    const { data, error } = await supabase.rpc("search_nearby_members", { p_radius_km: selectedRadius });
    if (error) {
      setMembers([]);
      setNotice(error.message.includes("Location unavailable")
        ? "ยังไม่มีตำแหน่งล่าสุด กดรีเฟรชเพื่อแชร์ตำแหน่งปัจจุบัน"
        : "ค้นหาสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } else {
      const rows = (data ?? []) as Member[];
      const withAvatars = await Promise.all(rows.map(async (member) => {
        if (!member.avatar_path) return { ...member, avatar_url: null };
        const { data: imageData } = await supabase.storage.from("profile-photos").createSignedUrl(member.avatar_path, 30 * 60);
        return { ...member, avatar_url: imageData?.signedUrl ?? null };
      }));
      setMembers(withAvatars);
      if (!data?.length) setNotice("ยังไม่พบสมาชิกในระยะนี้ที่เปิด Nearby และเปิดให้ค้นพบโปรไฟล์");
    }
    setBusy(false);
  }, [radius, supabase]);

  const updateLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setNotice("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    setBusy(true);
    setNotice("กำลังขอตำแหน่งจากอุปกรณ์...");
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { error } = await supabase.rpc("update_my_nearby_location", {
        p_lat: position.coords.latitude, p_lon: position.coords.longitude,
      });
      if (error) {
        setNotice(error.message.includes("wait") ? "เพิ่งอัปเดตตำแหน่งไป กรุณารออย่างน้อย 2 นาทีแล้วลองใหม่" : "บันทึกตำแหน่งไม่สำเร็จ ตรวจสอบว่าเปิด Nearby แล้ว");
        setBusy(false);
        return;
      }
      await searchMembers();
    }, () => {
      setNotice("ยังรับตำแหน่งไม่ได้ โปรดอนุญาต Location ให้เว็บไซต์ GMCK และลองอีกครั้ง");
      setBusy(false);
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  }, [searchMembers, supabase]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setNotice("กรุณาเข้าสู่ระบบอีกครั้ง"); setLoading(false); return; }
      const { data, error } = await supabase.from("profiles").select("nearby_enabled").eq("id", user.id).maybeSingle();
      if (!active) return;
      if (error) setNotice("โหลดการตั้งค่า Nearby ไม่สำเร็จ");
      else {
        setEnabled(data?.nearby_enabled ?? false);
        if (data?.nearby_enabled) void searchMembers();
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [searchMembers, supabase]);

  async function toggleNearby() {
    setBusy(true);
    setNotice("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNotice("กรุณาเข้าสู่ระบบอีกครั้ง"); setBusy(false); return; }
    const next = !enabled;
    const { error } = await supabase.from("profiles").update({
      nearby_enabled: next, nearby_consent_at: next ? new Date().toISOString() : null,
    }).eq("id", user.id);
    if (error) { setNotice("บันทึกการตั้งค่าไม่สำเร็จ"); setBusy(false); return; }
    setEnabled(next);
    if (!next) {
      await supabase.rpc("clear_my_nearby_location");
      setMembers([]);
      setNotice("ปิด Nearby แล้ว และลบตำแหน่งที่บันทึกไว้");
      setBusy(false);
      return;
    }
    setBusy(false);
    await updateLocation();
  }

  return (
    <main className="app-shell">
      <header className="flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-3"><span className="brand-mark">G</span><span className="text-lg font-bold tracking-[.18em]">GMCK</span></Link>
        <Link href="/profile/setup" className="text-xs text-purple-200 underline">โปรไฟล์</Link>
      </header>
      <section className="mt-9">
        <p className="text-xs font-semibold tracking-[.22em] text-purple-300">NEARBY</p>
        <h1 className="glow mt-3 text-3xl font-semibold">สมาชิกใกล้เคียง</h1>
        <p className="mt-2 text-sm leading-7 text-zinc-400">แสดงสมาชิกที่เปิด Nearby และยินยอมให้ค้นพบ เรียงจากใกล้ไปไกล โดยไม่เปิดเผยพิกัดจริง</p>
      </section>

      <section className="panel mt-7 p-5">
        <h2 className="font-semibold">ระยะค้นหา</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {radii.map((value) => <button key={value} type="button" onClick={() => { setRadius(value); if (enabled) void searchMembers(value); }} aria-pressed={radius === value}
            className={`rounded-xl border px-3 py-3 text-sm transition ${radius === value ? "border-purple-400 bg-purple-500/20 text-purple-100" : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20"}`}>{value} กม.</button>)}
        </div>
        <p className="mt-3 text-xs text-zinc-500">เลือกระยะเพื่อค้นหาสมาชิกภายในรัศมีที่กำหนด</p>
      </section>

      <section className="panel mt-4 p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl text-purple-300">⌖</span>
          <div><h2 className="font-semibold">การใช้ตำแหน่ง</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">ใช้ตำแหน่งเฉพาะเมื่อเปิด Nearby และรีเฟรชเท่านั้น ไม่ติดตามเบื้องหลัง ระบบเก็บพิกัดไว้ในฐานข้อมูลส่วนตัวและลบเมื่อหมดอายุ 24 ชั่วโมง ระยะทางที่แสดงเป็นช่วงโดยประมาณ</p>
          </div>
        </div>
        <button type="button" onClick={toggleNearby} disabled={loading || busy}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-3 text-sm font-semibold disabled:opacity-50">
          {loading ? "กำลังโหลด..." : busy ? "กำลังดำเนินการ..." : enabled ? "ปิด Nearby" : "ยินยอมและเปิด Nearby"}
        </button>
        <p className="mt-3 text-xs text-zinc-500">สถานะ: {enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}</p>
        {enabled && <button type="button" onClick={() => void updateLocation()} disabled={busy} className="mt-3 w-full rounded-xl border border-purple-400/40 px-4 py-3 text-sm text-purple-200 disabled:opacity-50">รีเฟรชตำแหน่งและค้นหา</button>}
        {notice && <p role="status" className="mt-3 text-xs leading-6 text-purple-200">{notice}</p>}
      </section>

      {enabled && <section className="mt-7">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">สมาชิกใกล้คุณ</h2><span className="text-xs text-zinc-500">{members.length} คน</span></div>
        {busy && <p className="mt-4 text-sm text-zinc-400">กำลังค้นหาสมาชิก...</p>}
        {!busy && members.length === 0 && <div className="panel mt-4 p-5 text-center text-sm leading-6 text-zinc-400">ยังไม่มีสมาชิกแสดงในระยะนี้ ลองขยายรัศมีหรือกลับมาดูอีกครั้ง</div>}
        <div className="mt-4 space-y-3">
          {members.map((member) => <article key={member.member_id} className="panel p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-purple-500/15 text-2xl font-semibold text-purple-200">
                {member.avatar_url ? <img src={member.avatar_url} alt="รูปโปรไฟล์" className="h-full w-full object-cover" /> : member.nickname.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold">{member.nickname}, {member.age}</h3>
              <p className="mt-1 text-xs text-zinc-400">{[member.height_cm ? `${member.height_cm} ซม.` : "", member.body_type ? bodyLabels[member.body_type] ?? "" : ""].filter(Boolean).join(" · ") || "ยังไม่ได้ระบุข้อมูลเพิ่มเติม"}</p>
            </div><span className="pill shrink-0 rounded-full px-3 py-1 text-xs">{member.distance_label}</span></div>
            </div>
            {member.relationship_goal && <p className="mt-3 text-xs text-purple-200">{goalLabels[member.relationship_goal] ?? member.relationship_goal}</p>}
            {member.bio && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{member.bio}</p>}
            {!!member.interests?.length && <div className="mt-3 flex flex-wrap gap-2">{member.interests.map((interest) => <span key={interest} className="pill rounded-full px-3 py-1 text-xs">{interest}</span>)}</div>}
          </article>)}
        </div>
      </section>}
      <p className="mt-7 text-center text-xs text-zinc-600">สมาชิกที่แสดงต้องเปิด Nearby และตั้งค่าโปรไฟล์ให้ค้นพบได้ คุณปิด Nearby ได้ทุกเมื่อ</p>
    </main>
  );
}
