"use client";

import { useEffect, useState } from "react";

type Photo = { id: string; url: string | null };

export default function AlbumLightbox({ photos }: { photos: Photo[] }) {
 const [active,setActive]=useState<number|null>(null);
 useEffect(()=>{
  if(active===null)return;
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==="Escape")setActive(null);
   if(event.key==="ArrowRight")setActive(current=>current===null?null:(current+1)%photos.length);
   if(event.key==="ArrowLeft")setActive(current=>current===null?null:(current-1+photos.length)%photos.length);
  };
  document.addEventListener("keydown",onKey);
  document.body.style.overflow="hidden";
  return()=>{document.removeEventListener("keydown",onKey);document.body.style.overflow="";};
 },[active,photos.length]);
 return <>
  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
   {photos.map((photo,index)=><button type="button" key={photo.id} onClick={()=>setActive(index)} disabled={!photo.url} aria-label={`ขยายรูปที่ ${index+1}`} className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left">
    {photo.url?<img src={photo.url} alt="รูปในอัลบั้มส่วนตัว คลิกเพื่อขยาย" className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"/>:<div className="aspect-square"/>}
   </button>)}
  </div>
  {active!==null&&photos[active]?.url&&<div role="dialog" aria-modal="true" aria-label="ดูรูปภาพขนาดใหญ่" onClick={()=>setActive(null)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 sm:p-8">
   <button type="button" onClick={()=>setActive(null)} aria-label="ปิด" className="absolute right-4 top-4 z-10 rounded-full bg-white/10 px-4 py-2 text-2xl text-white">×</button>
   <button type="button" onClick={e=>{e.stopPropagation();setActive((active-1+photos.length)%photos.length)}} aria-label="รูปก่อนหน้า" className="absolute left-2 z-10 rounded-full bg-white/10 px-3 py-3 text-white sm:left-6">‹</button>
   <img src={photos[active].url!} alt={`รูปที่ ${active+1} จาก ${photos.length}`} onClick={e=>e.stopPropagation()} className="max-h-[88dvh] max-w-[88vw] rounded-lg object-contain"/>
   <button type="button" onClick={e=>{e.stopPropagation();setActive((active+1)%photos.length)}} aria-label="รูปถัดไป" className="absolute right-2 z-10 rounded-full bg-white/10 px-3 py-3 text-white sm:right-6">›</button>
   <p className="absolute bottom-4 text-xs text-white/70">{active+1} / {photos.length} · กด Esc เพื่อปิด</p>
  </div>}
 </>;
}
