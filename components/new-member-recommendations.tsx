"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FoundingAvatarMark, FoundingNameMark } from "@/components/founding-mark";
import { MemberOnlineBadge } from "@/components/presence-provider";

type Recommendation = {
  member_id: string;
  nickname: string;
  age: number;
  height_cm: number | null;
  body_type: string | null;
  interests: string[] | null;
  relationship_goal: string | null;
  bio: string | null;
  avatar_path: string | null;
  avatar_url?: string | null;
  founder_number?: number;
  founder_role?: "founding_council" | "community_ambassador" | "founding_member";
};

const bodyLabels: Record<string, string> = {
  slim: "ผอม", average: "สมส่วน", athletic: "นักกีฬา", muscular: "มีกล้าม",
  stocky: "หุ่นใหญ่", prefer_not_say: "ไม่ระบุ",
};
const goalLabels: Record<string, string> = {
  friends: "หาเพื่อน", chat: "พูดคุย", casual: "สบาย ๆ",
  dating: "เดต", long_term: "จริงจัง", open_to_all: "เปิดใจ",
};

export default function NewMemberRecommendations() {
  const supabase = useMemo(() => createClient(), []);
  const [members, setMembers] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.rpc("get_new_member_recommendations", { p_limit: 12 });
      if (error) {
        if (active) { setFailed(true); setLoading(false); }
        return;
      }

      const rows = (data ?? []) as Recommendation[];
      const paths = [...new Set(rows.map(member => member.avatar_path).filter((path): path is string => Boolean(path)))];
      const [{ data: photos }, { data: badges }] = await Promise.all([
        paths.length
          ? supabase.storage.from("profile-photos").createSignedUrls(paths, 1800)
          : Promise.resolve({ data: [] }),
        rows.length
          ? supabase.rpc("get_visible_gmck_founder_badges", { p_member_ids: rows.map(member => member.member_id) })
          : Promise.resolve({ data: [] }),
      ]);

      if (!active) return;
      const photoByPath = new Map<string, string | null>(
        (photos ?? []).flatMap(photo => photo.path ? [[photo.path, photo.signedUrl] as const] : [])
      );
      const badgeById = new Map<string, { member_id: string; founder_number: number; founder_role: "founding_council" | "community_ambassador" | "founding_member" }>(
        (badges ?? []).map((badge: { member_id: string; founder_number: number; founder_role: "founding_council" | "community_ambassador" | "founding_member" }) => [badge.member_id, badge] as const)
      );
      setMembers(rows.map(member => ({
        ...member,
        avatar_url: member.avatar_path ? photoByPath.get(member.avatar_path) ?? null : null,
        ...(badgeById.get(member.member_id) ?? {}),
      })));
      setLoading(false);
    })();
    return () => { active = false; };
  }, [supabase]);

  return <section className="mt-7">
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold tracking-[.2em] text-purple-300">FRESH FACES</p>
        <h1 className="glow mt-1 text-2xl font-semibold">แนะนำสมาชิกใหม่</h1>
        <p className="mt-1 text-xs text-zinc-500">ทำความรู้จักสมาชิกที่เพิ่งเข้าร่วม GMCK</p>
      </div>
      <Link href="/discover" className="shrink-0 pb-1 text-xs font-medium text-purple-300">ค้นหาทั้งหมด →</Link>
    </div>

    {loading && <div className="flex gap-2.5 overflow-hidden" aria-label="กำลังโหลดสมาชิกใหม่">
      {Array.from({ length: 4 }).map((_, index) => <div key={index} className="min-w-0 flex-1">
        <div className="aspect-[4/5] animate-pulse rounded-2xl border border-white/5 bg-white/[.06]" />
        <div className="mt-2 h-3 animate-pulse rounded bg-white/[.06]" />
        <div className="mt-1 h-2.5 w-2/3 animate-pulse rounded bg-white/[.04]" />
      </div>)}
    </div>}

    {!loading && failed && <div className="panel p-4 text-center text-xs text-zinc-400">ยังโหลดคำแนะนำไม่ได้ กรุณาลองใหม่อีกครั้ง</div>}
    {!loading && !failed && members.length === 0 && <div className="panel p-4 text-center text-xs leading-6 text-zinc-400">สมาชิกใหม่จะปรากฏที่นี่เมื่อมีผู้เข้าร่วม GMCK และเปิดให้ค้นพบโปรไฟล์</div>}

    {!loading && !failed && members.length > 0 && <div
      className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory"
      aria-label="เลื่อนดูสมาชิกใหม่ในแนวนอน"
      style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
    >
      {members.map(member => <Link
        key={member.member_id}
        href={"/profile/" + member.member_id}
        className="group min-w-0 shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-[#14131d] transition hover:border-purple-300/50"
        style={{ flexBasis: "calc((100% - 30px) / 4)" }}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-purple-950 to-zinc-900">
          {member.avatar_url
            ? <img src={member.avatar_url} alt={"รูปโปรไฟล์ของ " + member.nickname} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
            : <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(192,132,252,.25),transparent_50%)] text-2xl font-bold text-purple-100">{member.nickname.slice(0, 1).toUpperCase()}</div>}
          {member.founder_number && member.founder_role && <FoundingAvatarMark founderNumber={member.founder_number} founderRole={member.founder_role} />}
          <MemberOnlineBadge memberId={member.member_id} dotOnly className="absolute left-2 top-2 z-10 bg-black/70 shadow-lg" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="absolute inset-x-2 bottom-2 min-w-0 text-white">
            <h2 className="truncate text-[11px] font-bold leading-tight">{member.founder_number && member.founder_role && <FoundingNameMark founderNumber={member.founder_number} founderRole={member.founder_role} />}{member.nickname}, {member.age}</h2>
            <p className="mt-1 truncate text-[9px] text-white/70">{[member.height_cm ? member.height_cm + " ซม." : "", member.body_type ? bodyLabels[member.body_type] ?? "" : ""].filter(Boolean).join(" · ") || "สมาชิก GMCK"}</p>
          </div>
        </div>
        <div className="min-h-7 overflow-hidden px-1.5 py-1.5">
          <span className="block truncate text-center text-[9px] text-purple-200">{member.relationship_goal ? goalLabels[member.relationship_goal] ?? member.relationship_goal : "ดูโปรไฟล์"}</span>
        </div>
      </Link>)}
    </div>}
  </section>;
}
