"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Member = {
  member_id: string; nickname: string; age: number; height_cm: number | null;
  body_type: string | null; interests: string[] | null; relationship_goal: string | null;
  bio: string | null; avatar_path?: string | null; avatar_url?: string | null;
};

const bodyLabels: Record<string, string> = { slim:"ผอม", average:"สมส่วน", athletic:"นักกีฬา", muscular:"มีกล้าม", stocky:"หุ่นใหญ่", prefer_not_say:"ไม่ระบุ" };
const goalLabels: Record<string, string> = { friends:"หาเพื่อน", chat:"พูดคุย", casual:"สบาย ๆ", dating:"เดต", long_term:"จริงจัง", open_to_all:"เปิดใจ" };

export default function MemberSearch() {
  const supabase = useMemo(() => createClient(), []);
  const [term, setTerm] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    setLoading(true); setError(""); setSearched(true);
    const { data, error: searchError } = await supabase.rpc("discover_members", { search_text: term.trim() || null });
    if (searchError) {
      setError("ค้นหาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"); setMembers([]);
    } else {
      const rows = (data ?? []) as Member[];
      const withPhotos = await Promise.all(rows.map(async member => {
        if (!member.avatar_path) return { ...member, avatar_url: null };
        const { data: photo } = await supabase.storage.from("profile-photos").createSignedUrl(member.avatar_path, 1800);
        return { ...member, avatar_url: photo?.signedUrl ?? null };
      }));
      setMembers(withPhotos);
    }
    setLoading(false);
  }

  return <section className="mt-7">
    <form onSubmit={e => { e.preventDefault(); void search(); }} className="flex gap-2">
      <input value={term} onChange={e => setTerm(e.target.value)} maxLength={60} placeholder="ค้นหาชื่อเล่นหรือความสนใจ" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-purple-400" />
      <button disabled={loading} className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold disabled:opacity-50">{loading ? "ค้นหา..." : "ค้นหา"}</button>
    </form>
    {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
    {searched && !loading && !error && members.length === 0 && <div className="panel mt-5 p-6 text-center"><p className="font-semibold">ยังไม่พบสมาชิก</p><p className="mt-2 text-sm leading-6 text-zinc-400">ลองค้นหาด้วยคำอื่น หรือกลับมาดูอีกครั้งภายหลัง</p></div>}
    <div className="member-grid mt-5">
      {members.map(member => <Link key={member.member_id} href={`/profile/${member.member_id}`} className="member-tile group">
        <div className="member-tile-photo">
          {member.avatar_url ? <img src={member.avatar_url} alt={`รูปโปรไฟล์ของ ${member.nickname}`} loading="lazy" /> : <div className="member-tile-placeholder"><span>{member.nickname.slice(0,1).toUpperCase()}</span></div>}
          <div className="member-tile-gradient" />
          {member.relationship_goal && <span className="member-tile-tag">{goalLabels[member.relationship_goal] ?? member.relationship_goal}</span>}
          <div className="member-tile-caption"><h2>{member.nickname}, {member.age}</h2><p>{[member.height_cm ? `${member.height_cm} ซม.` : "", member.body_type ? bodyLabels[member.body_type] ?? "" : ""].filter(Boolean).join(" · ")}</p></div>
        </div>
        {member.interests?.length ? <div className="member-tile-interests">{member.interests.slice(0,2).map(item => <span key={item}>{item}</span>)}</div> : <div className="member-tile-interests"><span>ดูโปรไฟล์</span></div>}
      </Link>)}
    </div>
    {!searched && <p className="mt-8 text-center text-sm text-zinc-500">พิมพ์คำค้นหาแล้วกดค้นหาเพื่อเริ่มต้น</p>}
  </section>;
}
