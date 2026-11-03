"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function NotificationActions(){
 const [busy,setBusy]=useState(false);
 const router=useRouter();
 async function markAll(){
  setBusy(true);
  const supabase=createClient();
  const {data:auth}=await supabase.auth.getUser();
  if(auth.user) await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("user_id",auth.user.id).is("read_at",null);
  setBusy(false);router.refresh();
 }
 return <button onClick={markAll} disabled={busy} className="mt-5 rounded-xl border border-purple-300/30 px-4 py-2 text-sm text-purple-200 disabled:opacity-50">{busy?"กำลังบันทึก…":"ทำเครื่องหมายว่าอ่านแล้วทั้งหมด"}</button>;
}
