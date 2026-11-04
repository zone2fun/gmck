"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Member = { member_id:string; nickname:string; age:number; height_cm:number|null; avatar_path:string|null; avatar_url?:string|null; body_type:string|null; interests:string[]|null; relationship_goal:string|null; bio:string|null; distance_label:string };
const bodyLabels:Record<string,string>={slim:"ผอม",average:"สมส่วน",athletic:"นักกีฬา",muscular:"มีกล้าม",stocky:"หุ่นใหญ่",prefer_not_say:"ไม่ระบุ"};
const goalLabels:Record<string,string>={friends:"หาเพื่อน",chat:"พูดคุย",casual:"ความสัมพันธ์แบบสบาย ๆ",dating:"เดต",long_term:"ความสัมพันธ์จริงจัง",open_to_all:"เปิดใจ"};

export default function NearbyPage() {
 const supabase=useMemo(()=>createClient(),[]);
 const [enabled,setEnabled]=useState(false);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [members,setMembers]=useState<Member[]>([]);
 const [notice,setNotice]=useState("");
 const [radius,setRadius]=useState(10);

 const searchMembers=useCallback(async()=>{
  setBusy(true);setNotice("");
  const {data,error}=await supabase.rpc("search_nearby_members",{p_radius_km:radius});
  if(error){setMembers([]);setNotice(error.message.includes("Location unavailable")?"ยังไม่มีตำแหน่งล่าสุด กรุณาอัปเดตตำแหน่งในการตั้งค่า":"ค้นหาสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");}
  else {
   const rows=(data??[]) as Member[];
   const paths=[...new Set(rows.map(m=>m.avatar_path).filter((p):p is string=>Boolean(p)))];
   const {data:photos}=paths.length?await supabase.storage.from("profile-photos").createSignedUrls(paths,1800):{data:[]};
   const photoByPath=new Map((photos??[]).map(photo=>[photo.path,photo.signedUrl]));
   setMembers(rows.map(m=>({...m,avatar_url:m.avatar_path?photoByPath.get(m.avatar_path)??null:null})));
   if(!rows.length)setNotice("ยังไม่พบสมาชิกในระยะนี้ที่เปิด Nearby และเปิดให้ค้นพบโปรไฟล์");
  }
  setBusy(false);
 },[radius,supabase]);

 const refreshLocation=useCallback(async()=>{
  if(!navigator.geolocation){setNotice("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง");return;}
  setBusy(true);setNotice("กำลังอัปเดตตำแหน่ง...");
  navigator.geolocation.getCurrentPosition(async pos=>{
   const {error}=await supabase.rpc("update_my_nearby_location",{p_lat:pos.coords.latitude,p_lon:pos.coords.longitude});
   if(error){setNotice(error.message.includes("wait")?"เพิ่งอัปเดตตำแหน่งไป กรุณารออย่างน้อย 2 นาที":"อัปเดตตำแหน่งไม่สำเร็จ");setBusy(false);return;}
   await searchMembers();
  },()=>{setNotice("โปรดอนุญาต Location ให้เว็บไซต์ GMCK");setBusy(false);},{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
 },[searchMembers,supabase]);

 useEffect(()=>{let active=true;(async()=>{
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){setNotice("กรุณาเข้าสู่ระบบอีกครั้ง");setLoading(false);return;}
  const {data:profile}=await supabase.from("profiles").select("nearby_enabled").eq("id",user.id).maybeSingle();
  if(!active)return;
  setEnabled(profile?.nearby_enabled??false);
  const savedRadius=Number(window.localStorage.getItem("gmck_nearby_radius"));
  if([1,5,10,25,50,100].includes(savedRadius)) setRadius(savedRadius);
  if(profile?.nearby_enabled) void searchMembers();
  setLoading(false);
 })();return()=>{active=false};},[supabase,searchMembers]);

 return <main className="app-shell">
  <header className="flex items-center justify-between"><Link href="/discover" className="flex items-center gap-3"><span className="brand-mark">G</span><span className="text-lg font-bold tracking-[.18em]">GMCK</span></Link><Link href="/settings/nearby" className="text-sm text-purple-200">ตั้งค่า <span aria-hidden>⚙</span></Link></header>
  <section className="mt-9"><p className="text-xs font-semibold tracking-[.22em] text-purple-300">NEARBY</p><h1 className="glow mt-3 text-3xl font-semibold">สมาชิกใกล้เคียง</h1><p className="mt-2 text-sm leading-7 text-zinc-400">ค้นหาสมาชิกที่เปิด Nearby และยินยอมให้ค้นพบ โดยไม่เปิดเผยพิกัดจริง</p></section>
  <section className="panel mt-6 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Nearby {enabled?"เปิดใช้งาน":"ปิดใช้งาน"}</p><p className="mt-1 text-xs text-zinc-400">ระยะค้นหา {radius} กม.</p></div><Link href="/settings/nearby" className="rounded-xl border border-purple-300/30 px-3 py-2 text-xs text-purple-200">จัดการการตั้งค่า</Link></div></section>
  {enabled&&<button type="button" onClick={()=>void refreshLocation()} disabled={busy||loading} className="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-3 text-sm font-semibold disabled:opacity-50">{busy?"กำลังค้นหา...":"อัปเดตตำแหน่งและค้นหา"}</button>}
  {notice&&<p role="status" className="mt-4 text-sm leading-6 text-purple-200">{notice}</p>}
  {enabled&&<section className="mt-7"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">สมาชิกใกล้คุณ</h2><span className="text-xs text-zinc-500">{members.length} คน</span></div>{busy&&<p className="mt-4 text-sm text-zinc-400">กำลังค้นหาสมาชิก...</p>}{!busy&&!members.length&&<div className="panel mt-4 p-5 text-center text-sm leading-6 text-zinc-400">ยังไม่มีสมาชิกแสดงในระยะนี้ ลองเปลี่ยนรัศมีในการตั้งค่าหรือกลับมาดูอีกครั้ง</div>}
  <div className="member-grid mt-4">{members.map(m=><Link key={m.member_id} href={"/profile/"+m.member_id} className="member-tile group"><div className="member-tile-photo">{m.avatar_url?<img src={m.avatar_url} alt={"รูปโปรไฟล์ของ "+m.nickname} loading="lazy"/>:<div className="member-tile-placeholder"><span>{m.nickname.slice(0,1).toUpperCase()}</span></div>}<div className="member-tile-gradient"/><span className="member-tile-tag">{m.distance_label}</span><div className="member-tile-caption"><h3>{m.nickname}, {m.age}</h3><p>{[m.height_cm?m.height_cm+" ซม.":"",m.body_type?bodyLabels[m.body_type]??"":""] .filter(Boolean).join(" · ")}</p></div></div>{m.relationship_goal&&<div className="member-tile-interests"><span>{goalLabels[m.relationship_goal]??m.relationship_goal}</span></div>}</Link>)}</div></section>}
  {!enabled&&!loading&&<div className="panel mt-6 p-6 text-center"><p className="font-semibold">คุณยังไม่ได้เปิด Nearby</p><p className="mt-2 text-sm leading-6 text-zinc-400">ไปที่การตั้งค่าเพื่อเปิดใช้งานและกำหนดระยะค้นหา</p><Link href="/settings/nearby" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold">ไปที่การตั้งค่า</Link></div>}
  <p className="mt-7 text-center text-xs text-zinc-600">คุณสามารถปิด Nearby และลบตำแหน่งได้ทุกเมื่อในการตั้งค่า</p>
 </main>;
}
