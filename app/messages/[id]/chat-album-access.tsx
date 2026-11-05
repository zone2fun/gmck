"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AccessRow = { owner_id: string; viewer_id: string; status: string };
type IconName = "images" | "inbox" | "send" | "check" | "clock" | "lock" | "x";

function AccessIcon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
 const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
 return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...common}>
  {name === "images" && <><rect x="3" y="4" width="14" height="14" rx="2"/><path d="m5 16 4-4 3 3 2-2 3 3"/><path d="M7 4V3h14v14h-4"/><circle cx="12" cy="8" r="1.2"/></>}
  {name === "inbox" && <><path d="M4 4h16l2 11v4H2v-4L4 4Z"/><path d="M2 15h6l2 2h4l2-2h6"/></>}
  {name === "send" && <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>}
  {name === "check" && <path d="m5 12 4 4L19 6"/>}
  {name === "clock" && <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>}
  {name === "lock" && <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>}
  {name === "x" && <><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/></>}
 </svg>;
}

function StatusBadge({ status, outgoing = false }: { status: string; outgoing?: boolean }) {
 const approved = status === "approved";
 const pending = status === "pending";
 const revoked = status === "revoked";
 const label = approved ? (outgoing ? "ได้รับอนุมัติ" : "อนุมัติแล้ว") : pending ? (outgoing ? "รออนุมัติ" : "รออนุมัติ") : revoked ? "ยกเลิกแล้ว" : "ยังไม่มีคำขอ";
 const tone = approved ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : pending ? "border-amber-400/20 bg-amber-400/10 text-amber-200" : revoked ? "border-zinc-500/20 bg-zinc-500/10 text-zinc-400" : "border-white/10 bg-white/5 text-zinc-400";
 return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${tone}`}>
  <AccessIcon name={approved ? "check" : pending ? "clock" : revoked ? "lock" : "images"} className="h-3 w-3"/>{label}
 </span>;
}

export default function ChatAlbumAccess({ownerId,otherId,incomingStatus,outgoingStatus,conversationAccepted}:{ownerId:string;otherId:string;incomingStatus:string;outgoingStatus:string;conversationAccepted:boolean}) {
 const supabase=useMemo(()=>createClient(),[]);
 const router=useRouter();
 const [incoming,setIncoming]=useState(incomingStatus);
 const [outgoing,setOutgoing]=useState(outgoingStatus);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");

 useEffect(()=>{setIncoming(incomingStatus);setOutgoing(outgoingStatus);},[incomingStatus,outgoingStatus]);

 useEffect(()=>{
  const channel=supabase
   .channel("chat-album-access-"+[ownerId,otherId].sort().join("-"))
   .on("postgres_changes",{event:"*",schema:"public",table:"private_album_access"},(payload)=>{
    const row=(payload.new??payload.old) as AccessRow;
    if(!row?.owner_id||!row?.viewer_id) return;
    if(row.owner_id===ownerId&&row.viewer_id===otherId) setIncoming(row.status??"none");
    if(row.owner_id===otherId&&row.viewer_id===ownerId) setOutgoing(row.status??"none");
   })
   .subscribe();
  return ()=>{void supabase.removeChannel(channel);};
 },[supabase,ownerId,otherId]);

 async function request(){setBusy(true);setMessage("");const {data,error}=await supabase.rpc("request_private_album_access",{p_owner_id:otherId});if(error){setMessage(error.message.includes("accepted conversation")?"ต้องยอมรับคำขอข้อความก่อนจึงจะขออัลบั้มได้":"ส่งคำขอไม่สำเร็จ");}else{setOutgoing(typeof data==="string"?data:"pending");setMessage(data==="approved"?"ได้รับอนุญาตแล้ว":"ส่งคำขอแล้ว");router.refresh();}setBusy(false);}
 async function respond(approve:boolean){setBusy(true);setMessage("");const {data,error}=await supabase.rpc("respond_private_album_access",{p_viewer_id:otherId,p_approve:approve});if(error||data!==true){setMessage("ดำเนินการไม่สำเร็จ");setBusy(false);return;}setIncoming(approve?"approved":"revoked");setMessage(approve?"อนุมัติแล้ว":"ยกเลิกคำขอแล้ว");setBusy(false);router.refresh();}
 async function cancel(){setBusy(true);setMessage("");const {data,error}=await supabase.rpc("cancel_private_album_access_request",{p_owner_id:otherId});if(error||data!==true){setMessage("ยกเลิกคำขอไม่สำเร็จ");setBusy(false);return;}setOutgoing("revoked");setMessage("ยกเลิกคำขอแล้ว");setBusy(false);router.refresh();}

 return <section className="shrink-0 border-b border-white/10 bg-[#0d0c15] px-3 py-3 sm:px-4">
  <div className="overflow-hidden rounded-2xl border border-purple-300/15 bg-gradient-to-br from-[#211a35] via-[#171523] to-[#11101a] shadow-[0_8px_28px_rgba(0,0,0,0.18)]">
   <div className="flex items-center gap-3 border-b border-white/[0.07] px-3.5 py-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-300/20 bg-purple-400/10 text-purple-200"><AccessIcon name="images" className="h-5 w-5"/></div>
    <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold text-purple-100">อัลบั้มส่วนตัว</h2><p className="mt-0.5 text-[11px] text-zinc-400">จัดการสิทธิ์การเข้าถึงอัลบั้มในแชทนี้</p></div>
    <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] text-zinc-400">PRIVATE</span>
   </div>
   {conversationAccepted ? <div className="space-y-2.5 p-3">
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/15 p-3">
     <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300"><AccessIcon name="inbox"/></div>
     <div className="min-w-0 flex-1"><p className="text-xs font-medium text-zinc-100">คำขอที่ส่งถึงคุณ</p><p className="mt-0.5 text-[11px] text-zinc-500">อีกฝ่ายต้องการเข้าถึงอัลบั้มของคุณ</p></div>
     <StatusBadge status={incoming}/>
    </div>
    {incoming==="pending"&&<div className="flex justify-end gap-2 px-1">
     <button disabled={busy} onClick={()=>void respond(false)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/5 disabled:opacity-50">ปฏิเสธ</button>
     <button disabled={busy} onClick={()=>void respond(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"><AccessIcon name="check" className="h-3.5 w-3.5"/>อนุมัติ</button>
    </div>}
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/15 p-3">
     <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300"><AccessIcon name="send"/></div>
     <div className="min-w-0 flex-1"><p className="text-xs font-medium text-zinc-100">คำขอของคุณ</p><p className="mt-0.5 text-[11px] text-zinc-500">สถานะการขอเข้าถึงอัลบั้มของอีกฝ่าย</p></div>
     <StatusBadge status={outgoing} outgoing/>
    </div>
    <div className="flex flex-wrap justify-end gap-2 px-1">
     {outgoing==="pending"?<button disabled={busy} onClick={()=>void cancel()} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/5 disabled:opacity-50">ยกเลิกคำขอ</button>:outgoing==="none"||outgoing==="revoked"?<button disabled={busy} onClick={()=>void request()} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"><AccessIcon name="images" className="h-3.5 w-3.5"/>ขอดูอัลบั้ม</button>:<a href={"/album/"+otherId} className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300/20 bg-purple-400/10 px-3 py-2 text-xs font-medium text-purple-200 transition hover:bg-purple-400/15"><AccessIcon name="images" className="h-3.5 w-3.5"/>เปิดอัลบั้ม</a>}
    </div>
   </div>:<div className="flex items-start gap-2.5 p-3.5"><div className="mt-0.5 text-amber-300"><AccessIcon name="lock"/></div><p className="text-xs leading-5 text-zinc-400">ต้องยอมรับคำขอข้อความก่อน จึงจะใช้ระบบอัลบั้มส่วนตัวได้</p></div>}
   {message&&<p role="status" className="mx-3 mb-3 rounded-lg border border-purple-300/10 bg-purple-400/10 px-3 py-2 text-xs text-purple-200">{message}</p>}
  </div>
 </section>;
}
