"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function ChatAlbumAccess({ownerId,otherId,incomingStatus,outgoingStatus,conversationAccepted}:{ownerId:string;otherId:string;incomingStatus:string;outgoingStatus:string;conversationAccepted:boolean}) {
 const supabase=createClient();const router=useRouter();
 const [incoming,setIncoming]=useState(incomingStatus);const [outgoing,setOutgoing]=useState(outgoingStatus);
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function request(){setBusy(true);setMessage("");const {data,error}=await supabase.rpc("request_private_album_access",{p_owner_id:otherId});if(error){setMessage(error.message.includes("accepted conversation")?"ต้องยอมรับคำขอข้อความก่อนจึงจะขออัลบั้มได้":"ส่งคำขอไม่สำเร็จ");}else{setOutgoing(typeof data==="string"?data:"pending");setMessage(data==="approved"?"ได้รับอนุญาตแล้ว":"ส่งคำขอแล้ว");router.refresh();}setBusy(false);}
 async function respond(approve:boolean){setBusy(true);setMessage("");const {data,error}=await supabase.rpc("respond_private_album_access",{p_viewer_id:otherId,p_approve:approve});if(error||data!==true){setMessage("ดำเนินการไม่สำเร็จ");setBusy(false);return;}setIncoming(approve?"approved":"revoked");setMessage(approve?"อนุมัติแล้ว":"ยกเลิกคำขอแล้ว");setBusy(false);router.refresh();}
 async function cancel(){setBusy(true);setMessage("");const {data,error}=await supabase.rpc("cancel_private_album_access_request",{p_owner_id:otherId});if(error||data!==true){setMessage("ยกเลิกคำขอไม่สำเร็จ");setBusy(false);return;}setOutgoing("revoked");setMessage("ยกเลิกคำขอแล้ว");setBusy(false);router.refresh();}
 return <section className="shrink-0 space-y-3 border-b border-white/10 bg-[#11101a] px-4 py-3">
  <div><p className="text-xs font-semibold text-purple-200">อัลบั้มส่วนตัวในแชท</p>
   {conversationAccepted?<div className="mt-2 space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-zinc-300">คำขอที่ส่งถึงคุณ: {incoming==="pending"?"รออนุมัติ":incoming==="approved"?"อนุมัติแล้ว":"ไม่มีคำขอค้าง"}</p>{incoming==="pending"&&<div className="flex gap-2"><button disabled={busy} onClick={()=>void respond(false)} className="rounded-lg border border-white/15 px-3 py-2 text-xs">ยกเลิก</button><button disabled={busy} onClick={()=>void respond(true)} className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold">อนุมัติ</button></div>}</div>
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-zinc-300">คำขอของคุณ: {outgoing==="pending"?"รอเจ้าของอนุมัติ":outgoing==="approved"?"ได้รับอนุมัติ":"ยังไม่ได้ขอ"}</p>{outgoing==="pending"?<button disabled={busy} onClick={()=>void cancel()} className="rounded-lg border border-white/15 px-3 py-2 text-xs">ยกเลิกคำขอ</button>:outgoing==="none"||outgoing==="revoked"?<button disabled={busy} onClick={()=>void request()} className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold">ขอดูอัลบั้มอีกฝ่าย</button>:<a href={"/album/"+otherId} className="text-xs text-purple-200 underline">เปิดอัลบั้ม</a>}</div>
   </div>:<p className="mt-1 text-xs text-zinc-500">ต้องยอมรับคำขอข้อความก่อน จึงจะใช้ระบบอัลบั้มส่วนตัวได้</p>}
  </div>{message&&<p role="status" className="text-xs text-purple-200">{message}</p>}
 </section>;
}
