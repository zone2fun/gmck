import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ConversationView from "./conversation-view";

type Conversation = { id: string; requester_id: string; recipient_id: string; status: "pending"|"accepted"|"declined" };
type Message = { id: string; sender_id: string; body: string; created_at: string };
export default async function ConversationPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const supabase=await createClient();
  const {data:claims,error}=await supabase.auth.getClaims();
  const userId=claims?.claims?.sub;
  if(error||typeof userId!=="string") redirect("/auth");
  const {data:conversation}=await supabase.from("conversations").select("id,requester_id,recipient_id,status").eq("id",id).maybeSingle();
  if(!conversation) notFound();
  const c=conversation as Conversation;
  const otherId=c.requester_id===userId?c.recipient_id:c.requester_id;
  const {data:profile}=await supabase.rpc("get_discoverable_profile",{p_member_id:otherId});
  const {data:messages}=await supabase.from("messages").select("id,sender_id,body,created_at").eq("conversation_id",id).order("created_at",{ascending:true});
  const otherName=profile?.[0]?.nickname ?? "สมาชิก GMCK";
  return <main className="app-shell">
    <header className="flex items-center justify-between"><Link href="/messages" className="text-sm text-purple-200 underline">← ข้อความ</Link><Link href={"/profile/"+otherId} className="text-sm text-purple-200 underline">ดูโปรไฟล์</Link></header>
    <section className="mt-7"><p className="text-xs tracking-[.2em] text-purple-300">CONVERSATION</p><h1 className="mt-2 text-2xl font-semibold">{otherName}</h1><p className="mt-1 text-xs text-zinc-500">{c.status==="accepted"?"บทสนทนาที่เปิดแล้ว":c.status==="pending"?(c.recipient_id===userId?"คำขอข้อความใหม่":"รออีกฝ่ายตอบรับคำขอ"):"คำขอนี้ถูกปฏิเสธ"}</p></section>
    <ConversationView conversationId={id} status={c.status} incoming={c.recipient_id===userId&&c.status==="pending"} userId={userId} initialMessages={(messages??[]) as Message[]}/>
  </main>;
}
