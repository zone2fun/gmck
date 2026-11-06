import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BlockedMembersList from "./blocked-members-list";
export default async function BlockedMembersPage() {
 const supabase=await createClient(); const {data:auth}=await supabase.auth.getClaims();
 if(typeof auth?.claims?.sub!=="string")redirect("/auth");
 const {data}=await supabase.rpc("get_my_blocked_members");
 const members=await Promise.all((data??[]).map(async(member:{blocked_user_id:string;nickname:string;avatar_path:string|null;blocked_at:string})=>{
  if(!member.avatar_path)return {...member,avatar_url:null as string|null};
  const {data:photo,error}=await supabase.storage.from("profile-photos").createSignedUrl(member.avatar_path,1800);
  return {...member,avatar_url:error?null:photo?.signedUrl??null};
 }));
 return <main className="app-shell"><header className="flex items-center gap-3"><Link href="/home" className="text-sm text-purple-200">← กลับ</Link><h1 className="text-xl font-semibold">สมาชิกที่บล็อกไว้</h1></header><p className="mt-3 text-sm leading-6 text-zinc-400">สมาชิกในรายการนี้จะไม่เห็นกันใน Discover หรือ Nearby และจะส่งข้อความหากันไม่ได้ คุณสามารถปลดบล็อกได้ทุกเมื่อ</p><BlockedMembersList initialMembers={members}/></main>;
}