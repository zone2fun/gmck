"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function NotificationsRealtime({userId}:{userId:string}){
 const router=useRouter();
 useEffect(()=>{
  const supabase=createClient();
  const channel=supabase.channel("member-notifications-"+userId)
   .on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:"user_id=eq."+userId},()=>router.refresh())
   .subscribe();
  return()=>{void supabase.removeChannel(channel)};
 },[router,userId]);
 return null;
}
