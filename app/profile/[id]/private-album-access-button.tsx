"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {createClient} from "@/lib/supabase/client";
export default function PrivateAlbumAccessButton({ownerId}:{ownerId:string}){
 const supabase=useMemo(()=>createClient(),[]);const [status,setStatus]=useState<string>("loading");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 useEffect(()=>{let active=true;void supabase.from("private_album_access").select("status").eq("owner_id",ownerId).maybeSingle().then(({data})=>{if(active)setStatus(data?.status??"none");});return()=>{active=false;};},[ownerId,supabase]);
 async function request(){setBusy(true);setError("");const {data,error:e}=await supabase.rpc("request_private_album_access",{p_owner_id:ownerId});if(e)setError("ส่งคำขอไม่สำเร็จ กรุณาลองใหม่");else setStatus(data);setBusy(false);}
 if(status==="approved")return <Link href={"/album/"+ownerId} className="mt-4 block rounded-xl border border-purple-300/30 px-4 py-3 text-center text-sm text-purple-200">ดูอัลบั้มส่วนตัว</Link>;
 return <div className="mt-4">{status==="pending"?<p className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-zinc-400">ส่งคำขอเข้าดูอัลบั้มแล้ว · รอเจ้าของอนุมัติ</p>:<button type="button" disabled={busy||status==="loading"} onClick={()=>void request()} className="w-full rounded-xl border border-purple-300/30 px-4 py-3 text-sm text-purple-200 disabled:opacity-50">{busy?"กำลังส่งคำขอ...":"ขอเข้าดูอัลบั้มส่วนตัว"}</button>}{error&&<p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}</div>;
}
