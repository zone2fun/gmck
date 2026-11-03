"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Photo={id:string;path:string;created_at:string;url:string|null};
type Request={viewer_id:string;nickname:string;requested_at:string};
type Member={viewer_id:string;nickname:string;approved_at:string};

export default function PrivateAlbumManager({photos:initialPhotos,requests:initialRequests,members:initialMembers}:{photos:Photo[];requests:Request[];members:Member[]}) {
 const supabase=createClient(); const router=useRouter();
 const [photos,setPhotos]=useState(initialPhotos); const [requests,setRequests]=useState(initialRequests); const [members,setMembers]=useState(initialMembers);
 const [busy,setBusy]=useState(false); const [notice,setNotice]=useState(""); const [error,setError]=useState("");
 async function upload(file:File){
  setNotice("");setError("");
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5*1024*1024){setError("รองรับ JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB");return;}
  setBusy(true);
  const {data:{user}}=await supabase.auth.getUser(); if(!user){setError("กรุณาเข้าสู่ระบบใหม่");setBusy(false);return;}
  const ext=file.type==="image/jpeg"?"jpg":file.type==="image/png"?"png":"webp";
  const path=user.id+"/"+crypto.randomUUID()+"."+ext;
  const {error:upErr}=await supabase.storage.from("gmck-private-albums").upload(path,file,{contentType:file.type,upsert:false});
  if(upErr){setError("อัปโหลดไม่สำเร็จ");setBusy(false);return;}
  const {data,error:dbErr}=await supabase.from("private_album_items").insert({owner_id:user.id,path}).select("id,path,created_at").single();
  if(dbErr){await supabase.storage.from("gmck-private-albums").remove([path]);setError("บันทึกรูปไม่สำเร็จ");setBusy(false);return;}
  const {data:signed}=await supabase.storage.from("gmck-private-albums").createSignedUrl(path,900);
  setPhotos(current=>[{...data,url:signed?.signedUrl??null},...current]);
  setNotice("เพิ่มรูปในอัลบั้มแล้ว");setBusy(false);router.refresh();
 }
 async function remove(photo:Photo){
  if(!window.confirm("ลบรูปนี้ออกจากอัลบั้มใช่หรือไม่?"))return;
  setBusy(true);setError("");
  const {error:storageErr}=await supabase.storage.from("gmck-private-albums").remove([photo.path]);
  if(storageErr){setError("ลบรูปไม่สำเร็จ");setBusy(false);return;}
  const {error:dbErr}=await supabase.from("private_album_items").delete().eq("id",photo.id);
  if(dbErr){setError("ลบไฟล์แล้ว แต่ไม่สามารถอัปเดตรายการได้");setBusy(false);return;}
  setPhotos(current=>current.filter(p=>p.id!==photo.id));setBusy(false);setNotice("ลบรูปแล้ว");
 }
 async function respond(id:string,approve:boolean){
  setBusy(true);setError("");
  const {error:e}=await supabase.rpc("respond_private_album_access",{p_viewer_id:id,p_approve:approve});
  if(e){setError("ดำเนินการไม่สำเร็จ");setBusy(false);return;}
  setRequests(current=>current.filter(r=>r.viewer_id!==id));
  if(approve){const req=requests.find(r=>r.viewer_id===id);if(req)setMembers(current=>[{viewer_id:id,nickname:req.nickname,approved_at:new Date().toISOString()},...current]);}
  setBusy(false);setNotice(approve?"อนุมัติให้ดูอัลบั้มแล้ว":"ปฏิเสธคำขอแล้ว");router.refresh();
 }
 async function revoke(id:string){
  if(!window.confirm("เพิกถอนสิทธิ์ดูอัลบั้มของสมาชิกคนนี้ใช่หรือไม่?"))return;
  setBusy(true);const {error:e}=await supabase.rpc("revoke_private_album_access",{p_viewer_id:id});
  if(e)setError("เพิกถอนสิทธิ์ไม่สำเร็จ");else{setMembers(current=>current.filter(m=>m.viewer_id!==id));setNotice("เพิกถอนสิทธิ์แล้ว");}
  setBusy(false);router.refresh();
 }
 return <div className="mt-6 space-y-6">
  <section className="panel p-5"><h2 className="font-semibold">อัลบั้มส่วนตัว</h2><p className="mt-1 text-xs leading-6 text-zinc-400">รูปในอัลบั้มนี้เป็นส่วนตัว คนอื่นจะดูได้เฉพาะเมื่อคุณอนุมัติเท่านั้น</p>
   <label className="mt-4 inline-flex cursor-pointer rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold">{busy?"กำลังดำเนินการ...":"＋ เพิ่มรูปภาพ"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.currentTarget.value="";}}/></label>
   <p className="mt-2 text-[11px] text-zinc-500">JPG, PNG หรือ WebP ไม่เกิน 5 MB ต่อรูป</p>
   {photos.length? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map(photo=><div key={photo.id} className="overflow-hidden rounded-xl border border-white/10">{photo.url?<img src={photo.url} alt="รูปในอัลบั้มส่วนตัว" className="aspect-square w-full object-cover"/>:<div className="aspect-square bg-white/5"/>}<button disabled={busy} onClick={()=>void remove(photo)} className="w-full py-2 text-xs text-red-300">ลบรูป</button></div>)}</div>:<p className="mt-5 text-sm text-zinc-500">ยังไม่มีรูปในอัลบั้ม</p>}
  </section>
  <section className="panel p-5"><h2 className="font-semibold">คำขอเข้าดูอัลบั้ม {requests.length>0&&<span className="text-purple-300">({requests.length})</span>}</h2>
   {requests.length?requests.map(r=><div key={r.viewer_id} className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{r.nickname}</p><p className="text-xs text-zinc-500">ขอเข้าถึงอัลบั้ม</p></div><button disabled={busy} onClick={()=>void respond(r.viewer_id,false)} className="rounded-lg border border-white/10 px-3 py-2 text-xs">ปฏิเสธ</button><button disabled={busy} onClick={()=>void respond(r.viewer_id,true)} className="rounded-lg bg-purple-600 px-3 py-2 text-xs">อนุมัติ</button></div>):<p className="mt-3 text-sm text-zinc-500">ไม่มีคำขอใหม่</p>}
  </section>
  <section className="panel p-5"><h2 className="font-semibold">สมาชิกที่อนุมัติแล้ว</h2>
   {members.length?members.map(m=><div key={m.viewer_id} className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3"><p className="min-w-0 flex-1 truncate text-sm">{m.nickname}</p><button disabled={busy} onClick={()=>void revoke(m.viewer_id)} className="text-xs text-red-300 underline">เพิกถอนสิทธิ์</button></div>):<p className="mt-3 text-sm text-zinc-500">ยังไม่มีสมาชิกที่ได้รับอนุมัติ</p>}
  </section>
  {notice&&<p role="status" className="text-sm text-purple-200">{notice}</p>}{error&&<p role="alert" className="text-sm text-red-300">{error}</p>}
 </div>;
}
