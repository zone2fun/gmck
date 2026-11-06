"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DemoProfile = {
  id: string;
  nickname: string;
  age: number;
  height_cm: number | null;
  body_type: string | null;
  interests: string[] | null;
  relationship_goal: string | null;
  bio: string;
  is_demo: boolean;
};

const bodyLabels: Record<string, string> = {
  slim: "ผอม", average: "สมส่วน", athletic: "นักกีฬา",
  muscular: "มีกล้าม", stocky: "หุ่นใหญ่", prefer_not_say: "ไม่ระบุ",
};
const goalLabels: Record<string, string> = {
  friends: "หาเพื่อน", chat: "พูดคุย", casual: "สบาย ๆ",
  dating: "เดต", long_term: "จริงจัง", open_to_all: "เปิดใจ",
};
const avatarStyles = [
  "from-fuchsia-500/35 via-purple-800 to-zinc-950",
  "from-violet-400/30 via-indigo-900 to-zinc-950",
  "from-pink-500/25 via-purple-900 to-zinc-950",
  "from-purple-400/30 via-slate-800 to-zinc-950",
];

export default function DemoProfiles() {
  const supabase = useMemo(() => createClient(), []);
  const [profiles, setProfiles] = useState<DemoProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.rpc("get_demo_profiles");
      if (!active) return;
      if (!error) setProfiles((data ?? []) as DemoProfile[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [supabase]);

  if (loading || profiles.length === 0) return null;

  return (
    <section className="mt-7" aria-label="โปรไฟล์ตัวอย่าง GMCK">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[.2em] text-fuchsia-300">GMCK FEATURED</p>
          <h2 className="glow mt-1 text-xl font-semibold">โปรไฟล์แนะนำ</h2>
          <p className="mt-1 text-xs text-zinc-500">คาแรกเตอร์ AI เพื่อแนะนำรูปแบบโปรไฟล์ GMCK</p>
        </div>
        <span className="shrink-0 rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] text-fuchsia-200">{profiles.length} FEATURED · AI</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {profiles.map((profile, index) => (
          <article key={profile.id} className="overflow-hidden rounded-2xl border border-purple-300/15 bg-[#14111e] shadow-lg shadow-black/20">
            <div className={`relative flex aspect-[5/3] items-center justify-center bg-gradient-to-br ${avatarStyles[index % avatarStyles.length]}`}>
              <span className="text-5xl font-black tracking-tight text-white/90 drop-shadow-[0_0_18px_rgba(216,180,254,.45)]">{profile.nickname.slice(0, 1)}</span>
              <span className="absolute left-2 top-2 rounded-full border border-white/15 bg-black/65 px-2 py-1 text-[9px] font-semibold text-fuchsia-100">ตัวอย่าง</span>
              <span className="absolute bottom-2 right-2 rounded-full bg-black/65 px-2 py-1 text-[9px] text-zinc-200">AI CHARACTER</span>
            </div>
            <div className="p-3">
              <h3 className="text-sm font-bold text-white">{profile.nickname}, {profile.age}</h3>
              <p className="mt-1 text-[10px] text-zinc-400">{[profile.height_cm ? profile.height_cm + " ซม." : "", profile.body_type ? bodyLabels[profile.body_type] ?? "" : ""].filter(Boolean).join(" · ")}</p>
              <p className="mt-2 line-clamp-3 min-h-[3.75rem] text-xs leading-5 text-zinc-300">{profile.bio}</p>
              <p className="mt-2 text-[10px] font-medium text-purple-200">{profile.relationship_goal ? goalLabels[profile.relationship_goal] ?? profile.relationship_goal : "เปิดใจ"}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(profile.interests ?? []).slice(0, 3).map(tag => <span key={tag} className="rounded-full bg-white/[.06] px-2 py-1 text-[9px] text-zinc-400">{tag}</span>)}
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] leading-5 text-zinc-600">ตัวละครและข้อมูลสร้างด้วย AI ไม่ใช่สมาชิกจริง ไม่มี GPS สถานะออนไลน์ หรือระบบแชต</p>
    </section>
  );
}
