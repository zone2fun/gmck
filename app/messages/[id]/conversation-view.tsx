"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
type Message={id:string;sender_id:string;body:string;created_at:string};
export default function ConversationView({conversationId,status,incoming,userId,initialMessages}:{conversationId:string;status:"pending"|"accepted"|"declined";incoming:boolean;userId:string;initialMessages:Message[]}) {
  const supabase=useMemo(()=>createClient(),[]);
  const router=useRouter();
  const [messages,setMessages]=useState(initialMessages);
  const [body,setBody]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  async function respond(accept:boolean) {
    setBusy(true);setError("");
    const {error:e}=await supabase.rpc("respond_to_message_request",{p_conversation_id:conversationId,p_accept:accept});
    if(e){setError("ดำเนินการไม่สำเร็จ กรุณาลองใหม่");setBusy(false);return;}
    router.refresh();
  }
  async function send() {
    if(!body.trim())return;
    setBusy(true);setError("");
    const {data,error:e}=await supabase.rpc("send_conversation_message",{p_conversation_id:conversationId,p_body:body.trim()});
    if(e){setError("ส่งข้อความไม่สำเร็จ กรุณาลองใหม่");setBusy(false);return;}
    setMessages(current=>[...current,{id:data,sender_id:userId,body:body.trim(),created_at:new Date().toISOString()}]);
    setBody("");setBusy(false);router.refresh();
  }
  return <section className="panel mt-6 p-4">
    <div className="max-h-[55vh] min-h-48 space-y-3 overflow-y-auto">{messages.map(m=><div key={m.id} className={"flex "+(m.sender_id===userId?"justify-end":"justify-start")}><p className={"max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 "+(m.sender_id===userId?"bg-purple-600/80 text-white":"bg-white/10 text-zinc-200")}>{m.body}</p></div>)}</div>
    {incoming && <div className="mt-5 border-t border-white/10 pt-4"><p className="text-sm leading-6 text-zinc-300">สมาชิกส่งคำขอข้อความถึงคุณ คุณสามารถยอมรับเพื่อเริ่มสนทนา หรือปฏิเสธได้</p><div className="mt-3 flex gap-2"><button disabled={busy} onClick={()=>void respond(true)} className="flex-1 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold disabled:opacity-50">ยอมรับคำขอ</button><button disabled={busy} onClick={()=>void respond(false)} className="rounded-xl border border-white/10 px-4 py-3 text-sm">ปฏิเสธ</button></div></div>}
    {status==="accepted" && <div className="mt-4 flex gap-2 border-t border-white/10 pt-4"><input value={body} onChange={e=>setBody(e.target.value)} maxLength={2000} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}}} placeholder="พิมพ์ข้อความ..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-purple-400"/><button disabled={busy||!body.trim()} onClick={()=>void send()} className="rounded-xl bg-purple-600 px-4 text-sm font-semibold disabled:opacity-50">ส่ง</button></div>}
    {status==="pending"&&!incoming&&<p className="mt-5 border-t border-white/10 pt-4 text-center text-sm text-zinc-400">ส่งคำขอแล้ว รออีกฝ่ายยอมรับก่อนจึงจะส่งข้อความเพิ่มเติมได้</p>}
    {status==="declined"&&<p className="mt-5 border-t border-white/10 pt-4 text-center text-sm text-zinc-400">คำขอนี้ถูกปฏิเสธแล้ว</p>}
    {error&&<p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
  </section>;
}
