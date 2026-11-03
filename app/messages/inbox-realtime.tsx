"use client";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function InboxRealtime({userId}:{userId:string}) {
  const supabase=useMemo(()=>createClient(),[]);
  const router=useRouter();
  useEffect(()=>{
    const channel=supabase.channel("inbox:"+userId)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"messages"},()=>router.refresh())
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"conversations"},()=>router.refresh())
      .subscribe();
    return ()=>{void supabase.removeChannel(channel);};
  },[supabase,router,userId]);
  return null;
}
