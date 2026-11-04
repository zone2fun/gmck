"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ChatAlbumAccess({ownerId,otherId,isOwner,initialStatus,conversationAccepted}:{ownerId:string;otherId:string;isOwner:boolean;initialStatus:string;conversationAccepted:boolean}) {
 const supabase=createClient(); const router=useRouter();
 const [status,setStatus]=useState(initialStatus); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
 async function request(){
  setBusy(true);setMessage("");
  const {data,error}=await supabase.rpc("request_private_album_access",{p_owner_id:ownerId});
  if(error){setMessage(error.message.includes("accepted conversation")?"ต้องเป็นบทสนทนาที่ตอบรับแล้วจึงขอเข้าดูอัลบั้มได้":"ส่งคำขอไม่สำเร็จ กรุณาลองใหม่");}
  else {setStatus(typeof data==="string"?data:"pending");setMessage(data==="approved"?"คุณได้รับอนุญาตให้ดูอัลบั้มนี้แล้ว":"ส่งคำขอแล้ว รอเจ้าของอัลบั้มอนุมัติ");router.refresh();}
  setBusy(false);
 }
 async function respond(approve:boolean){
  setBusy(true);setMessage("");
  const {data,error}=await supabase.rpc("respond_private_album_access",{p_viewer_id:otherId,p_approve:approve});
  if(error||data!==true){setMessage("ดำเนินการไม่สำเร็จ กรุณาลองใหม่");setBusy(false);return;}
  setStatus(approve?"approved":"revoked");setMessage(approve?"อนุมัติให้ดูอัลบั้มแล้ว":"ยกเลิกคำขอแล้ว");setBusy(false);router.refresh();
 }
 async function cancel(){
  setBusy(true);setMessage("");
  const {data,error}=await supabase.rpc("cancel_private_album_access_request",{p_owner_id:ownerId});
  if(error||data!==true){setMessage("ยกเลิกคำขอไม่สำเร็จ");setBusy(false);return;}
  setStatus("revoked");setMessage("ยกเลิกคำขอแล้ว");setBusy(false);router.refresh();
 }
 return <section className="shrink-0 border-b border-white/10 bg-[#11101a] px-4 py-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <div className="min-w-0"><p className="text-xs font-semibold text-purple-200">อัลบั้มส่วนตัว</p><p className="mt-1 text-xs text-zinc-400">{isOwner?(status==="pending"?"อีกฝ่ายขอเข้าดูอัลบั้มของคุณ":status==="approved"?"คุณอนุมัติให้อีกฝ่ายดูอัลบั้มแล้ว":"ยังไม่มีคำขอ"):status==="approved"?"คุณได้รับอนุญาตให้ดูอัลบั้มนี้":status==="pending"?"ส่งคำขอแล้ว รอเจ้าของอัลบั้มอนุมัติ":"ขอเข้าดูอัลบั้มส่วนตัวของอีกฝ่ายได้ที่นี่"}</p></div>
   {conversationAccepted && (isOwner
    ? status==="pending" ? <div className="flex gap-2"><button disabled={busy} onClick={()=>void respond(false)} className="rounded-lg border border-white/15 px-3 py-2 text-xs disabled:opacity-50">ยกเลิก</button><button disabled={busy} onClick={()=>void respond(true)} className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold disabled:opacity-50">อนุมัติ</button></div>
      : status==="approved" ? <span className="rounded-lg border border-emerald-400/20 px-3 py-2 text-xs text-emerald-200">อนุมัติแล้ว</span> : null
    : status==="pending" ? <button disabled={busy} onClick={()=>void cancel()} className="rounded-lg border border-white/15 px-3 py-2 text-xs disabled:opacity-50">ยกเลิกคำขอ</button>
      : status==="approved" ? <span className="rounded-lg border border-emerald-400/20 px-3 py-2 text-xs text-emerald-200">เข้าดูได้แล้ว</span>
      : <button disabled={busy} onClick={()=>void request()} className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold disabled:opacity-50">ขอดูอัลบั้ม</button>)}
  </div>
  {status==="approved" && !isOwner && <a href={"/album/"+ownerId} className="mt-2 inline-block text-xs text-purple-200 underline">เปิดอัลบั้มส่วนตัว</a>}
  {message&&<p role="status" className="mt-2 text-xs text-purple-200">{message}</p>}
  {!conversationAccepted&&<p className="mt-2 text-[11px] text-zinc-500">เริ่มใช้คำขออัลบั้มได้หลังจากยอมรับการสนทนาแล้ว</p>}
 </section>;
}
