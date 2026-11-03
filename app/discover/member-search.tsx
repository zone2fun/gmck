"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Member = {
  member_id: string;
  nickname: string;
  age: number;
  height_cm: number | null;
  body_type: string | null;
  interests: string[] | null;
  relationship_goal: string | null;
  bio: string | null;
};

const bodyLabels: Record<string, string> = {
  slim: "ผอม", average: "สมส่วน", athletic: "นักกีฬา",
  muscular: "มีกล้าม", stocky: "หุ่นใหญ่", prefer_not_say: "ไม่ระบุ",
};
const goalLabels: Record<string, string> = {
  friends: "หาเพื่อน", chat: "พูดคุย", casual: "ความสัมพันธ์แบบสบาย ๆ",
  dating: "เดต", long_term: "ความสัมพันธ์จริงจัง", open_to_all: "เปิดใจ",
};

export default function MemberSearch() {
  const supabase = useMemo(() => createClient(), []);
  const [term, setTerm] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    setLoading(true);
    setError("");
    setSearched(true);
    const { data, error: searchError } = await supabase.rpc("discover_members", { search_text: term.trim() || null });
    if (searchError) {
      setError("ค้นหาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setMembers([]);
    } else {
      setMembers((data ?? []) as Member[]);
    }
    setLoading(false);
  }

  return (
    <section className="mt-7">
      <form onSubmit={(e) => { e.preventDefault(); void search(); }} className="flex gap-2">
        <input value={term} onChange={(e) => setTerm(e.target.value)} maxLength={60} placeholder="ค้นหาชื่อเล่นหรือความสนใจ" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-purple-400" />
        <button disabled={loading} className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold disabled:opacity-50">{loading ? "ค้นหา..." : "ค้นหา"}</button>
      </form>
      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      {searched && !loading && !error && members.length === 0 && (
        <div className="panel mt-5 p-6 text-center">
          <p className="font-semibold">ยังไม่พบสมาชิก</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">อาจยังไม่มีสมาชิกที่เปิดให้ค้นพบโปรไฟล์ ลองค้นหาด้วยคำอื่น หรือกลับมาดูอีกครั้งภายหลัง</p>
        </div>
      )}
      <div className="mt-5 space-y-3">
        {members.map((member) => (
          <article key={member.member_id} className="panel p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{member.nickname}, {member.age}</h2>
              {member.relationship_goal && <span className="pill rounded-full px-3 py-1 text-[11px]">{goalLabels[member.relationship_goal] ?? member.relationship_goal}</span>}
            </div>
            <p className="mt-1 text-xs text-zinc-400">{[member.height_cm ? `${member.height_cm} ซม.` : "", member.body_type ? bodyLabels[member.body_type] ?? "" : ""].filter(Boolean).join(" · ") || "ยังไม่ได้ระบุข้อมูลเพิ่มเติม"}</p>
            {member.bio && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{member.bio}</p>}
            {member.interests?.length ? <div className="mt-3 flex flex-wrap gap-2">{member.interests.map((interest) => <span key={interest} className="pill rounded-full px-3 py-1 text-xs">{interest}</span>)}</div> : null}
          </article>
        ))}
      </div>
      {!searched && <p className="mt-8 text-center text-sm text-zinc-500">พิมพ์คำค้นหาแล้วกดค้นหาเพื่อเริ่มต้น</p>}
    </section>
  );
}
