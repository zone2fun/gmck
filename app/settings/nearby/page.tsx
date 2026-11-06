import Link from "next/link";
import NearbySettingsPanel from "@/components/nearby-settings-panel";

export default function NearbySettingsPage() {
  return <main className="app-shell">
    <header className="flex items-center justify-between"><Link href="/settings" className="text-sm text-purple-200">← การตั้งค่า</Link><span className="text-lg font-bold tracking-[.18em]">GMCK</span></header>
    <section className="mt-8"><p className="text-xs tracking-[.2em] text-purple-300">NEARBY PREFERENCES</p><h1 className="glow mt-2 text-3xl font-semibold">ตั้งค่า Nearby</h1><p className="mt-2 text-sm leading-6 text-zinc-400">กำหนดระยะค้นหาและควบคุมการใช้ตำแหน่งได้จากที่นี่</p></section>
    <NearbySettingsPanel />
    <Link href="/nearby" className="mt-6 block rounded-xl border border-purple-300/30 px-4 py-3 text-center text-sm text-purple-200">กลับไปหน้าสมาชิกใกล้ฉัน</Link>
  </main>;
}
