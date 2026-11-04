import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MemberHomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || typeof userId !== "string") redirect("/auth");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("profile_completed")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.profile_completed) redirect("/profile/setup");

  // The authenticated app now opens directly on the Discover tab.
  redirect("/discover");
}
