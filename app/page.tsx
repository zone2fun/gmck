import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const features = [
  { icon: "⌖", title: "เริ่มจากคนใกล้คุณ", detail: "เลือกค้นหาตามระยะทาง โดยไม่เปิดเผยตำแหน่งจริง" },
  { icon: "♡", title: "ความสัมพันธ์ในแบบของคุณ", detail: "เพื่อน คนคุย เดต หรือความสัมพันธ์ระยะยาว" },
  { icon: "◇", title: "ความปลอดภัยต้องมาก่อน", detail: "ควบคุมความเป็นส่วนตัว บล็อก และรายงานได้" },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (typeof data?.claims?.sub === "string") redirect("/nearby");

  return (
    <main className="app-shell flex flex-col">
      <header className="flex items-center justify-between">
        <Image src="/gmck-header.png" alt="GMCK" width={1200} height={400} priority className="h-12 w-40 object-contain object-left" />
        <span className="pill rounded-full px-3 py-1 text-xs">18+ COMMUNITY</span>
      </header>

      <section className="flex flex-1 flex-col justify-center py-14">
        <p className="mb-5 text-xs font-semibold tracking-[.28em] text-purple-300">MEET NEARBY · CONNECT GENUINELY</p>
        <h1 className="glow text-5xl font-semibold leading-[1.12] tracking-tight">
          พบคนใหม่<br />ในแบบที่เป็นคุณ
        </h1>
        <p className="mt-6 max-w-sm text-base leading-8 text-zinc-400">
          พื้นที่ทำความรู้จักสำหรับผู้ชายเกย์และไบเซ็กชวล
          จะหาเพื่อน คนคุย หรือความสัมพันธ์ดี ๆ ก็เริ่มต้นได้ที่นี่
        </p>

        <Link
          href="/founding"
          className="group mt-7 flex items-center gap-3 rounded-2xl border border-purple-400/25 bg-gradient-to-r from-purple-950/80 to-zinc-900/90 px-4 py-3 shadow-lg shadow-purple-950/20 transition hover:border-purple-300/50 hover:brightness-110"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-300/20 bg-purple-500/15 text-2xl text-purple-200">
            ♛
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold tracking-[.2em] text-purple-300">GMCK FOUNDER · FOUNDING 300</span>
            <span className="mt-1 block text-sm font-semibold text-white">ร่วมเป็นหนึ่งใน 300 ผู้บุกเบิก GMCK</span>
            <span className="mt-0.5 block text-xs text-zinc-400">ดูรายละเอียดและสิทธิ์สมาชิกผู้ก่อตั้ง</span>
          </span>
          <span aria-hidden="true" className="text-lg text-purple-300 transition-transform group-hover:translate-x-1">→</span>
        </Link>

        <div className="panel mt-10 space-y-5 p-5">
          {features.map((feature) => (
            <div className="flex gap-4" key={feature.title}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-xl text-purple-300">
                {feature.icon}
              </span>
              <div>
                <h2 className="font-semibold">{feature.title}</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-400">{feature.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/auth"
          className="mt-8 block w-full rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-6 py-4 text-center font-semibold text-white shadow-lg shadow-purple-950/40 transition hover:brightness-110"
        >
          สมัครสมาชิก / เข้าสู่ระบบ
        </Link>
        <p className="mt-4 text-center text-xs leading-6 text-zinc-500">
          สำหรับผู้มีอายุ 18 ปีขึ้นไป · เคารพความเป็นส่วนตัวของทุกคน
        </p>
      </section>

      <footer className="border-t border-white/10 pt-5 text-center text-xs text-zinc-600">
        GMCK © {new Date().getFullYear()} · Built with privacy in mind
      </footer>
    </main>
  );
}
