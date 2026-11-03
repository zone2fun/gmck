import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
export default async function MemberPrivateAlbumPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const supabase=await createClient();
 const {data:claims,error:authError}=await supabase.auth.getClaims();
 if(authError||typeof claims?.claims?.sub!=="string")redirect("/auth");
 const {data,error}=await supabase.rpc("get_member_private_album",{p_owner_id:id});
 if(error)notFound();
 const photos=await Promise.all((data??[]).map(async(item:{id:string;path:string;created_at:string})=>{
  const {data:signed}=await supabase.storage.from("gmck-private-albums").createSignedUrl(item.path,300);
  return {...item,url:signed?.signedUrl??null};
 }));
 return <main className="app-shell"><header className="flex items-center justify-between"><Link href={"/profile/"+id} className="text-sm text-purple-200 underline">← กลับโปรไฟล์</Link><span className="text-lg font-bold tracking-[.18em]">GMCK</span></header>
 <section className="mt-8"><p className="text-xs tracking-[.2em] text-purple-300">PRIVATE ALBUM</p><h1 className="glow mt-2 text-3xl font-semibold">อัลบั้มส่วนตัว</h1><p className="mt-2 text-sm text-zinc-400">รูปภาพที่เจ้าของอนุญาตให้คุณดู</p></section>
 {photos.length?<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map(p=><div key={p.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/5">{p.url?<img src={p.url} alt="รูปในอัลบั้มส่วนตัว" className="aspect-square w-full object-cover"/>:<div className="aspect-square"/>}</div>)}</div>:<div className="panel mt-6 p-6 text-center text-sm text-zinc-400">เจ้าของอัลบั้มยังไม่มีรูปภาพ</div>}
 </main>;
}
