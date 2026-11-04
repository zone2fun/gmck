"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  recipientId: string;
  conversationId?: string | null;
  conversationStatus?: "pending" | "accepted" | "declined" | null;
  isIncomingRequest?: boolean;
};

export default function MessageRequestButton({ recipientId, conversationId = null, conversationStatus = null, isIncomingRequest = false }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [open,setOpen] = useState(false);
  const [body,setBody] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");

  async function send() {
    if (body.trim().length < 1 || body.length > 1000) { setError("ข้อความต้องมี 1–1,000 ตัวอักษร"); return; }
    setBusy(true); setError("");
    const { data, error: resultError } = await supabase.rpc("create_message_request",{p_recipient_id:recipientId,p_body:body.trim()});
    if (resultError) { setError(resultError.message.includes("already exists") ? "คุณมีคำขอหรือบทสนทนากับสมาชิกนี้อยู่แล้ว" : "ส่งคำขอไม่สำเร็จ กรุณาลองใหม่"); setBusy(false); return; }
    router.push("/messages/"+data);
    router.refresh();
  }

  if (conversationId && conversationStatus === "accepted") return (
    <section className="panel mt-4 p-5">
      <Link href={"/messages/"+conversationId} className="block w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-3 text-center font-semibold">เปิดบทสนทนา</Link>
    </section>
  );
  if (conversationId && conversationStatus === "pending") return (
    <section className="panel mt-4 p-5">
      <Link href={"/messages/"+conversationId} className="block w-full rounded-xl border border-purple-300/30 px-4 py-3 text-center font-semibold text-purple-200">{isIncomingRequest ? "ตอบรับคำขอข้อความ" : "รออีกฝ่ายตอบรับคำขอ"}</Link>
    </section>
  );
  if (conversationId && conversationStatus === "declined") return (
    <section className="panel mt-4 p-5">
      <p className="text-center text-sm text-zinc-400">คำขอข้อความก่อนหน้านี้ไม่ได้รับการตอบรับ</p>
    </section>
  );

  return <section className="panel mt-4 p-5">
    {!open ? <button onClick={()=>setOpen(true)} className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-3 font-semibold">ส่งข้อความแรก</button> : <>
      <label className="text-sm font-medium">ข้อความแรกของคุณ</label>
      <textarea value={body} onChange={e=>setBody(e.target.value)} maxLength={1000} rows={4} placeholder="ทักทายอย่างสุภาพและเป็นตัวเอง..." className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm outline-none focus:border-purple-400"/>
      <p className="mt-1 text-right text-xs text-zinc-500">{body.length}/1000</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
      <div className="mt-3 flex gap-2"><button disabled={busy} onClick={()=>void send()} className="flex-1 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold disabled:opacity-50">{busy?"กำลังส่ง...":"ส่งคำขอข้อความ"}</button><button disabled={busy} onClick={()=>setOpen(false)} className="rounded-xl border border-white/10 px-4 py-3 text-sm">ยกเลิก</button></div>
    </>}
  </section>;
}
