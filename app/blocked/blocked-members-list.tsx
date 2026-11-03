"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type BlockedMember = { blocked_user_id: string; nickname: string; avatar_path: string | null; blocked_at: string };

export default function BlockedMembersList({ initialMembers }: { initialMembers: BlockedMember[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function unblock(id: string) {
    if (!window.confirm("ต้องการปลดบล็อกสมาชิกคนนี้ใช่หรือไม่?")) return;
    setBusyId(id);
    setNotice("");
    const { error } = await supabase.rpc("unblock_member", { p_blocked_user_id: id });
    setBusyId(null);
    if (error) { setNotice("ปลดบล็อกไม่สำเร็จ กรุณาลองใหม่"); return; }
    setMembers(current => current.filter(member => member.blocked_user_id !== id));
    setNotice("ปลดบล็อกเรียบร้อยแล้ว");
    router.refresh();
  }

  return <section className="mt-6 space-y-3">
    {notice && <p role="status" className="text-center text-sm text-purple-200">{notice}</p>}
    {members.length === 0 ? <div className="panel p-6 text-center text-sm text-zinc-400">ยังไม่มีสมาชิกที่คุณบล็อกไว้</div> :
      members.map(member => <article key={member.blocked_user_id} className="panel flex items-center gap-3 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-lg text-purple-200">G</div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{member.nickname}</p>
          <p className="mt-1 text-xs text-zinc-500">บล็อกเมื่อ {new Date(member.blocked_at).toLocaleDateString("th-TH")}</p>
        </div>
        <button type="button" disabled={busyId === member.blocked_user_id} onClick={() => void unblock(member.blocked_user_id)} className="rounded-xl border border-purple-300/30 px-3 py-2 text-xs font-medium text-purple-200 disabled:opacity-50">
          {busyId === member.blocked_user_id ? "กำลังทำ..." : "ปลดบล็อก"}
        </button>
      </article>)
    }
  </section>;
}
