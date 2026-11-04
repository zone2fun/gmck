import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrivateAlbumManager from "./private-album-manager";

export default async function MyPrivateAlbumPage(){
 const supabase=await createClient();
 const {data:claims,error}=await supabase.auth.getClaims();
 if(error||typeof claims?.claims?.sub!=="string")redirect("/auth");
 const [items,requests,members]=await Promise.all([
  supabase.rpc("get_my_private_album"),supabase.rpc("get_private_album_requests"),supabase.rpc("get_private_album_members")
 ]);
 const requestRows=(requests.data??[]) as {viewer_id:string;nickname:string;requested_at:string}[];
 const {data:requestProfiles}=requestRows.length
  ? await supabase.rpc("get_private_album_request_profiles")
  : {data:[]};
 const profileRows=(requestProfiles??[]) as {viewer_id:string;nickname:string;avatar_path:string|null}[];
 const enrichedRequests=await Promise.all(requestRows.map(async (r)=>{
  const profile=profileRows.find((p)=>p.viewer_id===r.viewer_id);
  const path=profile?.avatar_path;
  if(!path)return {...r,nickname:profile?.nickname??r.nickname,avatar_url:null as string|null};
  const {data:photo,error:photoError}=await supabase.storage.from("profile-photos").createSignedUrl(path,1800);
  return {...r,nickname:profile?.nickname??r.nickname,avatar_url:photoError?null:(photo?.signedUrl??null)};
 }));
 const photos=await Promise.all((items.data??[]).map(async (item:{id:string;path:string;created_at:string})=>{
  const {data}=await supabase.storage.from("gmck-private-albums").createSignedUrl(item.path,900);
  return {...item,url:data?.signedUrl??null};
 }));
 return <main className="app-shell">
  <header className="flex items-center justify-between"><Link href="/home" className="text-sm text-purple-200 underline">← หน้าแรก</Link><span className="text-lg font-bold tracking-[.18em]">GMCK</span></header>
  <section className="mt-8"><p className="text-xs tracking-[.2em] text-purple-300">PRIVATE ALBUM</p><h1 className="glow mt-2 text-3xl font-semibold">อัลบั้มส่วนตัว</h1><p className="mt-2 text-sm leading-6 text-zinc-400">จัดการรูปภาพและเลือกสมาชิกที่สามารถเข้าดูอัลบั้มของคุณได้</p></section>
  <PrivateAlbumManager photos={photos} requests={enrichedRequests} members={members.data??[]}/>
 </main>;
}
