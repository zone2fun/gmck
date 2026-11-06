"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Role = "founding_council" | "community_ambassador" | "founding_member";
type Founder = {
  founder_number: number;
  founder_role: Role;
  status: "active" | "revoked";
  created_at: string;
  revoked_at: string | null;
} | null;
type Capacity = { founder_role: Role; capacity: number; claimed: number; remaining: number };

const roles: { id: Role; title: string; subtitle: string; description: string; capacity: number }[] = [
  { id: "founding_council", title: "Founding Council", subtitle: "30 ที่นั่ง", description: "ร่วมให้คำแนะนำ ทดสอบฟีเจอร์ และสะท้อนเสียงของสมาชิกต่อทีม GMCK", capacity: 30 },
  { id: "community_ambassador", title: "Community Ambassador", subtitle: "70 ที่นั่ง", description: "ช่วยแนะนำ GMCK ให้คนที่สนใจและร่วมสร้างชุมชนอย่างเป็นมิตร", capacity: 70 },
  { id: "founding_member", title: "Founding Member", subtitle: "200 ที่นั่ง", description: "เป็นสมาชิกกลุ่มแรก ทดลองใช้งาน และแบ่งปันความคิดเห็นเพื่อพัฒนาแอป", capacity: 200 },
];

const roleLabel: Record<Role, string> = {
  founding_council: "Founding Council",
  community_ambassador: "Community Ambassador",
  founding_member: "Founding Member",
};

export default function FoundingEnrollment({
  userId,
  initialFounder,
  initialCapacity,
}: {
  userId: string;
  initialFounder: Founder;
  initialCapacity: Capacity[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [founder, setFounder] = useState<Founder>(initialFounder);
  const [capacity, setCapacity] = useState<Capacity[]>(initialCapacity);
  const [selectedRole, setSelectedRole] = useState<Role>("founding_member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function claimSlot() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data, error: insertError } = await supabase
        .from("gmck_founders")
        .insert({ user_id: userId, founder_role: selectedRole })
        .select("founder_number,founder_role,status,created_at,revoked_at")
        .single();
      if (insertError) throw insertError;
      setFounder(data as Founder);
      setNotice("สมัคร Founding 300 เรียบร้อยแล้ว");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  const remainingFor = (role: Role) => capacity.find((item) => item.founder_role === role)?.remaining;

  return (
    <section className="mt-7 space-y-4">
      {founder?.status === "active" ? (
        <div className="panel overflow-hidden p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-300/40 bg-purple-500/15 text-3xl text-purple-200">✦</div>
          <p className="mt-4 text-xs font-semibold tracking-[.2em] text-purple-300">LIFETIME FOUNDING MEMBER</p>
          <p className="glow mt-2 text-4xl font-bold">#{String(founder.founder_number).padStart(3, "0")}</p>
          <h2 className="mt-3 text-lg font-semibold">{roleLabel[founder.founder_role]}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">คุณเป็นหนึ่งในผู้ร่วมก่อตั้ง GMCK สถานะนี้ผูกกับบัญชีนี้ตลอดชีพและไม่สามารถโอนสิทธิ์ได้</p>
          <div className="mt-5 inline-flex rounded-full border border-purple-300/30 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-200">GMCK FOUNDING 300 · LIFETIME</div>
        </div>
      ) : (
        <>
          <div className="panel p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">เลือกบทบาทที่คุณอยากร่วมสร้าง</h2>
              <span className="text-xs text-purple-300">300 ที่นั่ง</span>
            </div>
            <div className="mt-4 space-y-3">
              {roles.map((role) => {
                const remaining = remainingFor(role.id);
                const full = remaining === 0;
                const selected = selectedRole === role.id;
                return (
                  <button
                    type="button"
                    key={role.id}
                    disabled={full || busy}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${selected ? "border-purple-300 bg-purple-500/10" : "border-white/10 bg-black/20"} ${full ? "cursor-not-allowed opacity-45" : "hover:border-purple-300/50"}`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{role.title}</span>
                      <span className="text-xs text-purple-200">{remaining === undefined ? role.subtitle : full ? "เต็มแล้ว" : `เหลือ ${remaining} / ${role.capacity}`}</span>
                    </span>
                    <span className="mt-2 block text-xs leading-6 text-zinc-400">{role.description}</span>
                    {selected && <span className="mt-2 block text-xs font-semibold text-purple-200">เลือกบทบาทนี้แล้ว</span>}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={claimSlot}
              disabled={busy || remainingFor(selectedRole) === 0}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-950/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "กำลังยืนยันสิทธิ์..." : `สมัครเป็น ${roleLabel[selectedRole]}`}
            </button>
            <p className="mt-3 text-center text-xs leading-6 text-zinc-500">การสมัครจะยืนยันเมื่อระบบจัดสรรหมายเลขให้สำเร็จเท่านั้น หนึ่งบัญชีรับได้หนึ่งหมายเลข</p>
          </div>
          {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          {notice && <p role="status" className="rounded-xl border border-purple-400/20 bg-purple-400/10 p-3 text-sm text-purple-100">{notice}</p>}
        </>
      )}
    </section>
  );
}
