"use client";

import Link from "next/link";
import { useState } from "react";

const radii = [1, 5, 10, 25, 50, 100];

export default function NearbyPage() {
  const [radius, setRadius] = useState(10);
  const [enabled, setEnabled] = useState(false);
  const [notice, setNotice] = useState("");

  function enableNearby() {
    if (!("geolocation" in navigator)) {
      setNotice("เบราว์เซอร์นี้ไม่รองรับการใช้ตำแหน่ง กรุณาใช้เบราว์เซอร์รุ่นใหม่");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setEnabled(true);
        setNotice("อนุญาตการใช้ตำแหน่งบนอุปกรณ์แล้ว แต่ระบบยังไม่ส่งหรือจัดเก็บพิกัด จนกว่าจะเชื่อมระบบ Nearby ที่ปลอดภัยเสร็จ");
      },
      (error) => {
        setEnabled(false);
        setNotice(error.code === error.PERMISSION_DENIED
          ? "คุณยังไม่อนุญาตให้ใช้ตำแหน่ง สามารถเปิดสิทธิ์ได้จากการตั้งค่าเว็บไซต์ในเบราว์เซอร์"
          : "ยังรับตำแหน่งไม่ได้ กรุณาลองอีกครั้งเมื่อเปิดบริการตำแหน่ง");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
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
        <p className="mt-3 text-xs text-zinc-500">ระยะที่เลือก: {radius} กิโลเมตร</p>
      </section>

      <section className="panel mt-4 p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl text-purple-300">⌖</span>
          <div>
            <h2 className="font-semibold">การใช้ตำแหน่งของคุณ</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">กดอนุญาตเมื่อคุณต้องการใช้ Nearby เท่านั้น ขณะนี้หน้านี้ทดสอบการขอสิทธิ์บนอุปกรณ์ โดยยังไม่ส่งหรือบันทึกพิกัดไปยังเซิร์ฟเวอร์</p>
          </div>
        </div>
        <button type="button" onClick={enableNearby} className="mt-5 w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-3 text-sm font-semibold">
          {enabled ? "อนุญาตบนอุปกรณ์แล้ว" : "อนุญาตใช้ตำแหน่ง"}
        </button>
        {notice && <p role="status" className="mt-3 text-xs leading-6 text-purple-200">{notice}</p>}
      </section>

      <section className="panel mt-4 p-5 text-center">
        <p className="font-semibold">ระบบค้นหา Nearby กำลังพัฒนา</p>
        <p className="mt-2 text-sm leading-6 text-zinc-400">ก่อนแสดงสมาชิกตามระยะทาง เราจะเพิ่มการจัดเก็บตำแหน่งแบบจำกัดสิทธิ์ การปัดค่าพิกัด และการป้องกันการไล่เดาตำแหน่ง เพื่อไม่ให้ระบุตำแหน่งจริงของสมาชิกได้</p>
      </section>
      <p className="mt-7 text-center text-xs text-zinc-600">คุณสามารถปิดสิทธิ์ตำแหน่งได้ทุกเมื่อจากการตั้งค่าเว็บไซต์</p>
    </main>
  );
}
