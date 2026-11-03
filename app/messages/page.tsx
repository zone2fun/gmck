import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InboxRealtime from "./inbox-realtime";

type Item = { conversation_id: string; other_user_id: string; other_nickname: string; other_avatar_path: string | null; status: "pending"|"accepted"|"declined"; last_message_at: string; last_message: string | null; is_incoming_request: boolean };
export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || typeof claims?.claims?.sub !== "string") redirect("/auth");
  const userId = claims.claims.sub;
  const { data } = await supabase.rpc("get_my_conversations");
  const items = (data ?? []) as Item[];
  const photos = await Promise.all(items.map(async item => item.other_avatar_path ? (await supabase.storage.from("profile-photos").createSignedUrl(item.other_avatar_path,1800)).data?.signedUrl ?? null : null));
  return <main className="app-shell">
    <InboxRealtime userId={userId}/>
    <header className="flex items-center justify-between"><Link href="/home" className="text-sm text-purple-200 underline">← หน้าแรก</Link><span className="text-lg font-bold tracking-[.18em]">GMCK</span></header>
    <section className="mt-8"><p className="text-xs tracking-[.2em] text-purple-300">MESSAGES</p><h1 className="glow mt-2 text-3xl font-semibold">ข้อความ</h1><p className="mt-2 text-sm text-zinc-400">คำขอข้อความและบทสนทนาของคุณ</p></section>
    <div className="mt-6 space-y-3">{items.map((item,i)=><Link key={item.conversation_id} href={"/messages/"+item.conversation_id} className="panel flex items-center gap-3 p-4 transition hover:border-purple-300/40">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-purple-500/15">{photos[i] ? <img src={photos[i]!} alt="" className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-xl text-purple-200">{item.other_nickname?.slice(0,1) ?? "G"}</div>}</div>
      <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">{item.other_nickname}</h2>{item.is_incoming_request && <span className="rounded-full bg-fuchsia-500/20 px-2 py-1 text-[10px] text-fuchsia-200">คำขอใหม่</span>}</div><p className="mt-1 truncate text-sm text-zinc-400">{item.last_message ?? "ยังไม่มีข้อความ"}</p><p className="mt-1 text-[11px] text-zinc-500">{item.status==="accepted"?"สนทนา":item.status==="pending"?(item.is_incoming_request?"รอการตอบรับจากคุณ":"รออีกฝ่ายตอบรับ"):"คำขอถูกปฏิเสธ"}</p></div><span className="text-purple-300">›</span>
    </Link>)}</div>
    {items.length===0 && <div className="panel mt-6 p-6 text-center text-sm leading-6 text-zinc-400">ยังไม่มีข้อความ เมื่อคุณพบคนที่สนใจ สามารถเปิดโปรไฟล์แล้วส่งข้อความแรกได้</div>}
  </main>;
}
