"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Message={id:string;sender_id:string;body:string;created_at:string};
const imagePath=(body:string)=>body.startsWith("[[image:")&&body.endsWith("]]")?body.slice(8,-2):null;
type PresenceUser={user_id:string;online_at:string};
export default function ConversationView({conversationId,status,incoming,userId,initialMessages}:{conversationId:string;status:"pending"|"accepted"|"declined";incoming:boolean;userId:string;initialMessages:Message[]}) {
  const supabase=useMemo(()=>createClient(),[]);
  const router=useRouter();
  const [messages,setMessages]=useState(initialMessages);
  const [body,setBody]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [connected,setConnected]=useState(false);
  const [otherOnline,setOtherOnline]=useState(false);
  const [otherTyping,setOtherTyping]=useState(false);
  const [imageUrls,setImageUrls]=useState<Record<string,string>>({});
  const [uploading,setUploading]=useState(false);
  const [lightboxUrl,setLightboxUrl]=useState<string|null>(null);
  const fileInputRef=useRef<HTMLInputElement|null>(null);
  const channelRef=useRef<ReturnType<typeof supabase.channel>|null>(null);
  const messagesEndRef=useRef<HTMLDivElement|null>(null);
  const typingTimeout=useRef<ReturnType<typeof setTimeout>|null>(null);
  const stopTypingTimeout=useRef<ReturnType<typeof setTimeout>|null>(null);
  const isAccepted=status==="accepted";

  useEffect(()=>{messagesEndRef.current?.scrollIntoView({behavior:"smooth",block:"end"});},[messages.length,otherTyping]);

  useEffect(()=>{
    if(!lightboxUrl)return;
    const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape")setLightboxUrl(null);};
    window.addEventListener("keydown",onKeyDown);
    return ()=>window.removeEventListener("keydown",onKeyDown);
  },[lightboxUrl]);

  useEffect(()=>{
    let active=true;
    const imageMessages=messages.filter(m=>imagePath(m.body)&&!imageUrls[m.id]);
    if(imageMessages.length){
      void Promise.all(imageMessages.map(async m=>{const path=imagePath(m.body)!;const {data}=await supabase.storage.from("gmck-chat-images").createSignedUrl(path,1800);return [m.id,data?.signedUrl??""] as const;})).then(entries=>{if(active)setImageUrls(current=>({...current,...Object.fromEntries(entries.filter(([,url])=>url))}));});
    }
    return ()=>{active=false;};
  },[messages,imageUrls,supabase]);

  useEffect(()=>{
    if(status==="declined") return;
    const channel=supabase.channel("conversation:"+conversationId,{
      config:{private:true,presence:{key:userId}}
    });
    channelRef.current=channel;
    channel
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:"conversation_id=eq."+conversationId},payload=>{
        const row=payload.new as Message;
        setMessages(current=>current.some(m=>m.id===row.id)?current:[...current,row]);
      })
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"conversations",filter:"id=eq."+conversationId},()=>{
        router.refresh();
      })
      .on("broadcast",{event:"typing"},payload=>{
        const sender=payload.payload?.user_id;
        if(sender===userId)return;
        setOtherTyping(Boolean(payload.payload?.typing));
        if(stopTypingTimeout.current)clearTimeout(stopTypingTimeout.current);
        if(payload.payload?.typing) stopTypingTimeout.current=setTimeout(()=>setOtherTyping(false),2500);
      })
      .on("presence",{event:"sync"},()=>{
        const state=channel.presenceState<PresenceUser>();
        const online=Object.values(state).flat().some((p)=>p.user_id!==userId);
        setOtherOnline(online);
      })
      .subscribe(async state=>{
        setConnected(state==="SUBSCRIBED");
        if(state==="SUBSCRIBED"){
          await channel.track({user_id:userId,online_at:new Date().toISOString()});
        }
      });
    return ()=>{
      if(typingTimeout.current)clearTimeout(typingTimeout.current);
      if(stopTypingTimeout.current)clearTimeout(stopTypingTimeout.current);
      void supabase.removeChannel(channel);
      channelRef.current=null;
    };
  },[conversationId,userId,status,router,supabase]);

  async function broadcastTyping(typing:boolean){
    const channel=channelRef.current;
    if(!channel)return;
    await channel.send({type:"broadcast",event:"typing",payload:{user_id:userId,typing}});
  }
  function handleBodyChange(value:string){
    setBody(value);
    if(!isAccepted)return;
    if(typingTimeout.current)clearTimeout(typingTimeout.current);
    void broadcastTyping(true);
    typingTimeout.current=setTimeout(()=>void broadcastTyping(false),1200);
  }
  async function respond(accept:boolean) {
    setBusy(true);setError("");
    const {error:e}=await supabase.rpc("respond_to_message_request",{p_conversation_id:conversationId,p_accept:accept});
    if(e){setError("ดำเนินการไม่สำเร็จ กรุณาลองใหม่");setBusy(false);return;}
    router.refresh();
  }
  async function sendImage(file:File) {
    if(!isAccepted||uploading||busy)return;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5*1024*1024){setError("รองรับ JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB");return;}
    setUploading(true);setError("");
    const ext=file.type==="image/jpeg"?"jpg":file.type==="image/png"?"png":"webp";
    const path=conversationId+"/"+userId+"/"+crypto.randomUUID()+"."+ext;
    const {error:uploadError}=await supabase.storage.from("gmck-chat-images").upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError){setError("อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่");setUploading(false);return;}
    const {data,error:sendError}=await supabase.rpc("send_conversation_image",{p_conversation_id:conversationId,p_path:path});
    if(sendError){await supabase.storage.from("gmck-chat-images").remove([path]);setError("ส่งรูปภาพไม่สำเร็จ กรุณาลองใหม่");setUploading(false);return;}
    const message:Message={id:data,sender_id:userId,body:"[[image:"+path+"]]",created_at:new Date().toISOString()};
    setMessages(current=>current.some(m=>m.id===data)?current:[...current,message]);
    setUploading(false);router.refresh();
  }
  async function send() {
    const message=body.trim();
    if(!message||busy)return;
    setBusy(true);setError("");
    const {data,error:e}=await supabase.rpc("send_conversation_message",{p_conversation_id:conversationId,p_body:message});
    if(e){setError("ส่งข้อความไม่สำเร็จ กรุณาลองใหม่");setBusy(false);return;}
    setMessages(current=>current.some(m=>m.id===data)?current:[...current,{id:data,sender_id:userId,body:message,created_at:new Date().toISOString()}]);
    setBody("");setBusy(false);void broadcastTyping(false);router.refresh();
  }
  return <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
    <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-2 text-xs">
      <span className="text-zinc-400">{otherTyping?"กำลังพิมพ์...":otherOnline?<span className="text-emerald-300">● ออนไลน์</span>:"ออฟไลน์"}</span>
      <span className={connected?"text-emerald-300":"text-zinc-500"}>{connected?"● เชื่อมต่อแบบเรียลไทม์":"กำลังเชื่อมต่อ..."}</span>
    </div>
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">{messages.map(m=>{const path=imagePath(m.body);return <div key={m.id} className={"flex "+(m.sender_id===userId?"justify-end":"justify-start")}>{path?<div className="max-w-[82%] overflow-hidden rounded-2xl border border-white/10 bg-white/5">{imageUrls[m.id]?<button type="button" onClick={()=>setLightboxUrl(imageUrls[m.id])} className="block cursor-zoom-in" aria-label="ขยายดูรูปภาพ"><img src={imageUrls[m.id]} alt="รูปภาพที่ส่งในแชต" className="max-h-80 max-w-full object-contain"/></button>:<p className="px-4 py-3 text-xs text-zinc-400">กำลังโหลดรูปภาพ...</p>}</div>:<p className={"max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 "+(m.sender_id===userId?"bg-purple-600/80 text-white":"bg-white/10 text-zinc-200")}>{m.body}</p>}</div>})}<div ref={messagesEndRef} className="h-1 w-full" /></div>
    {incoming && <div className="shrink-0 border-t border-white/10 bg-[#101019] px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]"><p className="text-sm leading-6 text-zinc-300">สมาชิกส่งคำขอข้อความถึงคุณ คุณสามารถยอมรับเพื่อเริ่มสนทนา หรือปฏิเสธได้</p><div className="mt-3 flex gap-2"><button disabled={busy} onClick={()=>void respond(true)} className="flex-1 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold disabled:opacity-50">ยอมรับคำขอ</button><button disabled={busy} onClick={()=>void respond(false)} className="rounded-xl border border-white/10 px-4 py-3 text-sm">ปฏิเสธ</button></div></div>}
    {isAccepted && <div className="flex shrink-0 flex-col gap-2 border-t border-white/10 bg-[#101019] px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void sendImage(file);e.currentTarget.value="";}}/>
      <div className="flex gap-2">
        <button type="button" disabled={uploading||busy} onClick={()=>fileInputRef.current?.click()} className="rounded-xl border border-purple-300/30 px-3 text-lg text-purple-200 disabled:opacity-50" aria-label="แนบรูปภาพ">＋</button>
        <input value={body} onChange={e=>handleBodyChange(e.target.value)} maxLength={2000} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}}} placeholder="พิมพ์ข้อความ..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-purple-400"/>
        <button disabled={busy||!body.trim()} onClick={()=>void send()} className="rounded-xl bg-purple-600 px-4 text-sm font-semibold disabled:opacity-50">ส่ง</button>
      </div>
      {uploading&&<p className="text-xs text-purple-200">กำลังส่งรูปภาพ...</p>}
      <p className="text-[10px] text-zinc-500">รูปภาพ JPG, PNG หรือ WebP ไม่เกิน 5 MB</p>
    </div>}
    {status==="pending"&&!incoming&&<p className="shrink-0 border-t border-white/10 px-4 py-4 text-center text-sm text-zinc-400">ส่งคำขอแล้ว รออีกฝ่ายยอมรับก่อนจึงจะส่งข้อความเพิ่มเติมได้</p>}
    {status==="declined"&&<p className="shrink-0 border-t border-white/10 px-4 py-4 text-center text-sm text-zinc-400">คำขอนี้ถูกปฏิเสธแล้ว</p>}
    {lightboxUrl&&<div role="dialog" aria-modal="true" aria-label="ดูรูปภาพขนาดใหญ่" onClick={()=>setLightboxUrl(null)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 backdrop-blur-sm"><button type="button" onClick={()=>setLightboxUrl(null)} className="absolute right-4 top-[calc(env(safe-area-inset-top)+16px)] z-10 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm text-white">ปิด ✕</button><img src={lightboxUrl} alt="รูปภาพขนาดใหญ่" onClick={e=>e.stopPropagation()} className="max-h-[88dvh] max-w-full object-contain"/></div>}
    {error&&<p role="alert" className="shrink-0 px-4 py-2 text-sm text-red-300">{error}</p>}
  </section>;
}
