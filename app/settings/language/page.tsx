"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function LanguageSettingsPage() {
  const { language, setLanguage } = useLanguage();
  return <main className="app-shell">
    <header className="flex items-center justify-between">
      <Link href="/settings" className="text-sm text-purple-200">{language === "th" ? "← การตั้งค่า" : "← Settings"}</Link>
      <span className="text-lg font-bold tracking-[.18em]">GMCK</span>
    </header>
    <section className="mt-8">
      <p className="text-xs tracking-[.2em] text-purple-300">PREFERENCES</p>
      <h1 className="glow mt-2 text-3xl font-semibold">{language === "th" ? "ภาษา" : "Language"}</h1>
      <p className="mt-2 text-sm text-zinc-400">{language === "th" ? "เลือกภาษาที่ใช้ในแอป GMCK" : "Choose the language used in GMCK"}</p>
    </section>
    <div className="mt-6 space-y-3">
      <button type="button" onClick={() => setLanguage("th")} aria-pressed={language === "th"} className={`panel flex w-full items-center justify-between p-5 text-left ${language === "th" ? "border-purple-400 bg-purple-500/10" : ""}`}>
        <span className="flex items-center gap-3"><span className="text-2xl">🇹🇭</span><span><span className="block font-semibold">ไทย</span><span className="text-xs text-zinc-400">Thai</span></span></span>
        <span className="text-purple-300">{language === "th" ? "✓" : ""}</span>
      </button>
      <button type="button" onClick={() => setLanguage("en")} aria-pressed={language === "en"} className={`panel flex w-full items-center justify-between p-5 text-left ${language === "en" ? "border-purple-400 bg-purple-500/10" : ""}`}>
        <span className="flex items-center gap-3"><span className="text-2xl">🇬🇧</span><span><span className="block font-semibold">English</span><span className="text-xs text-zinc-400">English</span></span></span>
        <span className="text-purple-300">{language === "en" ? "✓" : ""}</span>
      </button>
    </div>
    <p className="mt-5 text-xs leading-6 text-zinc-500">{language === "th" ? "ภาษาที่เลือกจะถูกบันทึกไว้ในอุปกรณ์นี้และใช้กับหน้าต่าง ๆ ของ GMCK" : "Your language choice is saved on this device and applied across GMCK."}</p>
  </main>;
}
