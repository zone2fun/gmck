import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NotificationsRealtime from "./notifications-realtime";
import NotificationActions from "./notification-actions";
import PushNotificationSettings from "./push-notification-settings";

type Notice = { id:string; actor_id:string|null; event_type:string; entity_id:string|null; created_at:string; read_at:string|null };
const labels:Record<string,{title:string;href:string}> = {
 message_request:{title:"คุณได้รับคำขอข้อความใหม่",href:"/messages"},
 message_request_accepted:{title:"คำขอข้อความของคุณได้รับการตอบรับ",href:"/messages"},
 message_request_declined:{title:"คำขอข้อความของคุณไม่ได้รับการตอบรับ",href:"/messages"},
 album_access_request:{title:"มีสมาชิกขอเข้าดูอัลบั้มส่วนตัว",href:"/album"},
 album_access_approved:{title:"คำขอเข้าดูอัลบั้มส่วนตัวได้รับอนุมัติ",href:"/album"},
 album_access_revoked:{title:"สิทธิ์เข้าดูอัลบั้มส่วนตัวมีการเปลี่ยนแปลง",href:"/album"},
};
export default async function NotificationsPage(){
 const supabase=await createClient();
 const {data:claims,error}=await supabase.auth.getClaims();
 const userId=claims?.claims?.sub;
 if(error||typeof userId!=="string") redirect("/auth");
 const {data}=await supabase.from("notifications").select("id,actor_id,event_type,entity_id,created_at,read_at").eq("user_id",userId).order("created_at",{ascending:false}).limit(100);
 const items=(data??[]) as Notice[];
 const actorIds=[...new Set(items.map(x=>x.actor_id).filter((x):x is string=>!!x))];
 const {data:profiles}=actorIds.length?await supabase.from("profiles").select("id,nickname").in("id",actorIds):{data:[]};
 const names=new Map((profiles??[]).map((p:{id:string;nickname:string})=>[p.id,p.nickname]));
 return <main className="app-shell">
  <NotificationsRealtime userId={userId}/>
  <header className="flex items-center justify-between"><Link href="/home" className="text-sm text-purple-200 underline">← หน้าแรก</Link><span className="text-lg font-bold tracking-[.18em]">GMCK</span></header>
  <section className="mt-8"><p className="text-xs tracking-[.2em] text-purple-300">ACTIVITY</p><h1 className="glow mt-2 text-3xl font-semibold">การแจ้งเตือน</h1><p className="mt-2 text-sm text-zinc-400">แจ้งเตือนกิจกรรมในบัญชีของคุณ</p></section>
  <NotificationActions/>
  <PushNotificationSettings/>
  <div className="mt-5 space-y-3">{items.map(item=>{const meta=labels[item.event_type]??{title:"มีกิจกรรมใหม่",href:"/notifications"};const href=item.event_type==="new_message"&&item.entity_id?"/messages/"+item.entity_id:meta.href;return <Link key={item.id} href={href} className={`panel block p-4 transition hover:border-purple-300/40 ${item.read_at?"opacity-70": "border-purple-400/40"}`}>
   <div className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-fuchsia-400"/><div className="min-w-0 flex-1"><p className="font-medium">{meta.title}</p><p className="mt-1 text-xs text-zinc-400">{item.actor_id?(names.get(item.actor_id)??"สมาชิก GMCK")+" · ":""}{new Date(item.created_at).toLocaleString("th-TH",{dateStyle:"medium",timeStyle:"short"})}</p></div><span className="text-purple-300">›</span></div>
  </Link>})}</div>
  {items.length===0&&<div className="panel mt-6 p-6 text-center text-sm text-zinc-400">ยังไม่มีการแจ้งเตือน</div>}
 </main>;
}
