"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const radii = [1, 5, 10, 25, 50, 100] as const;

function accuracyLabel(meters: number) {
  if (meters <= 100) return "ดี";
  if (meters <= 1000) return "พอใช้";
  return "คลาดเคลื่อนสูง";
}

export default function NearbySettingsPanel() {
  const supabase = useMemo(() => createClient(), []);
  const [radius, setRadius] = useState<number>(10);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const updateLocation = useCallback(async () => {
    if (!navigator.geolocation) { setNotice("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง"); return; }
    setBusy(true);
    setNotice("กำลังขอตำแหน่งจากอุปกรณ์...");
    navigator.geolocation.getCurrentPosition(async (position) => {
      const measuredAccuracy = Math.round(position.coords.accuracy);
      setAccuracy(measuredAccuracy);
      if (measuredAccuracy > 1000) {
        setNotice("ตำแหน่งคลาดเคลื่อนสูง (" + measuredAccuracy + " เมตร) ระบบจึงไม่บันทึกพิกัดใหม่นี้ เพื่อป้องกันตำแหน่งผิดพลาด กรุณาเปิด Precise Location หรือทดลองกลางแจ้ง");
        setBusy(false);
        return;
      }
      try {
        const { error } = await supabase.rpc("update_my_nearby_location", { p_lat: position.coords.latitude, p_lon: position.coords.longitude });
        if (error) setNotice(error.message.toLowerCase().includes("wait") ? "เพิ่งอัปเดตตำแหน่งไป กรุณารออย่างน้อย 2 นาที" : "บันทึกตำแหน่งไม่สำเร็จ กรุณาลองอีกครั้ง");
        else setNotice("อัปเดตตำแหน่งเรียบร้อย ความแม่นยำประมาณ " + measuredAccuracy + " เมตร");
      } catch {
        setNotice("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง");
      }
      setBusy(false);
    }, (error) => {
      const message = error.code === 1 ? "ยังไม่ได้รับอนุญาต Location ให้เว็บไซต์ GMCK" : error.code === 2 ? "อุปกรณ์ระบุตำแหน่งไม่ได้ในขณะนี้ กรุณาเปิด Location Services แล้วลองอีกครั้ง" : "ใช้เวลาระบุตำแหน่งนานเกินไป ลองอีกครั้งในที่โล่ง";
      setNotice(message);
      setBusy(false);
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  }, [supabase]);

  useEffect(() => {
    const savedRadius = Number(window.localStorage.getItem("gmck_nearby_radius"));
    if ([1, 5, 10, 25, 50, 100].includes(savedRadius)) setRadius(savedRadius);
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setNotice("กรุณาเข้าสู่ระบบอีกครั้ง"); setLoading(false); return; }
      const { data, error } = await supabase.from("profiles").select("nearby_enabled").eq("id", user.id).maybeSingle();
      if (!active) return;
      if (error) setNotice("โหลดการตั้งค่า Nearby ไม่สำเร็จ");
      else setEnabled(data?.nearby_enabled ?? false);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [supabase]);

  async function toggleNearby() {
    setBusy(true);
    setNotice("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNotice("กรุณาเข้าสู่ระบบอีกครั้ง"); setBusy(false); return; }
    const next = !enabled;
    const { error } = await supabase.from("profiles").update({ nearby_enabled: next, nearby_consent_at: next ? new Date().toISOString() : null }).eq("id", user.id);
    if (error) { setNotice("บันทึกการตั้งค่าไม่สำเร็จ"); setBusy(false); return; }
    setEnabled(next);
    if (!next) {
      const { error: clearError } = await supabase.rpc("clear_my_nearby_location");
      setNotice(clearError ? "ปิด Nearby แล้ว แต่ลบตำแหน่งไม่สำเร็จ กรุณาลองใหม่" : "ปิด Nearby แล้ว และลบตำแหน่งที่บันทึกไว้");
      setBusy(false);
      return;
    }
    setBusy(false);
    await updateLocation();
  }

  return <section className="panel mt-6 p-5">
    <div className="flex items-center justify-between gap-3">
      <div><p className="text-xs font-semibold tracking-[.2em] text-purple-300">NEARBY</p><h2 className="mt-1 text-lg font-semibold">ตั้งค่าการค้นหาสมาชิกใกล้เคียง</h2></div>
      <span className={enabled ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300" : "rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400"}>{loading ? "กำลังโหลด" : enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
    </div>
    <h3 className="mt-5 text-sm font-semibold">ระยะค้นหา</h3>
    <p className="mt-1 text-xs text-zinc-400">กำหนดรัศมีสมาชิกที่จะแสดงในหน้า Nearby</p>
    <div className="mt-3 grid grid-cols-3 gap-2">{radii.map(value => <button key={value} type="button" onClick={() => { setRadius(value); window.localStorage.setItem("gmck_nearby_radius", String(value)); }} aria-pressed={radius === value} className={`rounded-xl border px-3 py-3 text-sm ${radius === value ? "border-purple-400 bg-purple-500/20 text-purple-100" : "border-white/10 bg-white/5 text-zinc-300"}`}>{value} กม.</button>)}</div>
    <p className="mt-4 text-xs leading-6 text-zinc-400">เมื่อเปิด Nearby ระบบจะอัปเดตตำแหน่งทุก 5 นาทีขณะเปิดหน้า Nearby เท่านั้น พิกัดเก็บเป็นส่วนตัวและหมดอายุภายใน 24 ชั่วโมง สมาชิกอื่นเห็นเพียงระยะทางโดยประมาณ</p>
    <button type="button" onClick={toggleNearby} disabled={loading || busy} className="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-3 text-sm font-semibold disabled:opacity-50">{loading ? "กำลังโหลด..." : busy ? "กำลังดำเนินการ..." : enabled ? "ปิด Nearby และลบตำแหน่ง" : "ยินยอมและเปิด Nearby"}</button>
    {enabled && <button type="button" onClick={() => void updateLocation()} disabled={busy || loading} className="mt-3 w-full rounded-xl border border-purple-400/40 px-4 py-3 text-sm text-purple-200 disabled:opacity-50">{busy ? "กำลังอัปเดต..." : "อัปเดตตำแหน่งตอนนี้"}</button>}
    {accuracy !== null && <p className="mt-3 text-xs text-zinc-400">GPS Accuracy: ประมาณ {accuracy.toLocaleString("th-TH")} เมตร · {accuracyLabel(accuracy)}</p>}
    {notice && <p role="status" className="mt-3 text-xs leading-6 text-purple-200">{notice}</p>}
  </section>;
}
