"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const radii = [1, 5, 10, 25, 50, 100];

export default function NearbyPage() {
  const [radius, setRadius] = useState(10);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadPreference() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotice("กรุณาเข้าสู่ระบบอีกครั้ง");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("nearby_enabled")
        .eq("id", user.id)
        .maybeSingle();
      if (error) setNotice("โหลดการตั้งค่า Nearby ไม่สำเร็จ กรุณาลองใหม่");
      else setEnabled(data?.nearby_enabled ?? false);
      setLoading(false);
    }
    void loadPreference();
  }, []);

  async function toggleNearby() {
    setSaving(true);
    setNotice("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setNotice("กรุณาเข้าสู่ระบบอีกครั้ง");
      setSaving(false);
      return;
    }

    const nextEnabled = !enabled;
    const { error } = await supabase
      .from("profiles")
      .update({
        nearby_enabled: nextEnabled,
        nearby_consent_at: nextEnabled ? new Date().toISOString() : null,
      })
      .eq("id", user.id);

    if (error) {
      setNotice("บันทึกการตั้งค่าไม่สำเร็จ กรุณาลองอีกครั้ง");
      setSaving(false);
      return;
    }

    setEnabled(nextEnabled);
    if (!nextEnabled) {
      setNotice("ปิด Nearby แล้ว ระบบจะไม่ใช้ตำแหน่งของคุณ");
      setSaving(false);
      return;
    }

    if (!( "geolocation" in navigator)) {
      setNotice("บันทึกความยินยอมแล้ว แต่เบราว์เซอร์นี้ไม่รองรับการใช้ตำแหน่ง");
      setSaving(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => setNotice("เปิด Nearby และอนุญาตตำแหน่งบนอุปกรณ์แล้ว ขณะนี้ยังไม่มีการส่งหรือจัดเก็บพิกัด และยังไม่แสดงผลค้นหาจริง"),
      (error) => {
        setNotice(error.code === error.PERMISSION_DENIED
          ? "บันทึกการตั้งค่าแล้ว แต่คุณยังไม่อนุญาตตำแหน่ง สามารถเปิดสิทธิ์ได้จากการตั้งค่าเว็บไซต์"
          : "บันทึกการตั้งค่าแล้ว แต่ยังรับตำแหน่งไม่ได้ กรุณาลองใหม่ภายหลัง");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
    setSaving(false);
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
        <p className="mt-2 text-sm leading-7 text-zinc-400">ค้นหาคนในระยะที่คุณเลือก โดย GMCK จะไม่แสดงตำแหน่งจริงหรือพิกัดบ้านของคุณ</p>
      </section>

      <section className="panel mt-7 p-5">
        <h2 className="font-semibold">ระยะค้นหา</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {radii.map((value) => (
            <button key={value} type="button" onClick={() => setRadius(value)} aria-pressed={radius === value}
              className={`rounded-xl border px-3 py-3 text-sm transition ${radius === value ? "border-purple-400 bg-purple-500/20 text-purple-100" : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20"}`}>
              {value} กม.
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-500">ระยะที่เลือก: {radius} กิโลเมตร (การค้นหาจริงกำลังพัฒนา)</p>
      </section>

      <section className="panel mt-4 p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl text-purple-300">⌖</span>
          <div>
            <h2 className="font-semibold">ความยินยอมในการใช้ตำแหน่ง</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">เปิดใช้เฉพาะเมื่อคุณต้องการค้นหาสมาชิกใกล้เคียง ระบบจะไม่แสดงพิกัดจริง และคุณปิดได้ทุกเมื่อ การเปิดตอนนี้เป็นการบันทึกความยินยอมและทดสอบสิทธิ์ตำแหน่งบนอุปกรณ์เท่านั้น ยังไม่มีการส่งหรือจัดเก็บพิกัด</p>
          </div>
        </div>
        <button type="button" onClick={toggleNearby} disabled={loading || saving}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-3 text-sm font-semibold disabled:opacity-50">
          {loading ? "กำลังโหลด..." : saving ? "กำลังบันทึก..." : enabled ? "ปิด Nearby" : "ยินยอมและเปิด Nearby"}
        </button>
        <p className="mt-3 text-xs text-zinc-500">สถานะ: {enabled ? "เปิดใช้งาน (ยังไม่ค้นหาจริง)" : "ปิดใช้งาน"}</p>
        {notice && <p role="status" className="mt-3 text-xs leading-6 text-purple-200">{notice}</p>}
      </section>

      <section className="panel mt-4 p-5 text-center">
        <p className="font-semibold">ระบบค้นหา Nearby กำลังพัฒนา</p>
        <p className="mt-2 text-sm leading-6 text-zinc-400">เราจะเชื่อมการค้นหาหลังจากทดสอบการจำกัดสิทธิ์เข้าถึง การปัดค่าพิกัด การป้องกันการไล่เดาตำแหน่ง และการลบข้อมูลตำแหน่งหมดอายุเรียบร้อยแล้ว</p>
      </section>
      <p className="mt-7 text-center text-xs text-zinc-600">คุณสามารถปิด Nearby ได้จากหน้านี้ หรือปิดสิทธิ์ตำแหน่งจากการตั้งค่าเว็บไซต์</p>
    </main>
  );
}
