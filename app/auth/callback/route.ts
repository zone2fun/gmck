import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/nearby";
  const providerError = url.searchParams.get("error");

  if (providerError) {
    const errorCode = providerError === "access_denied" ? "oauth_cancelled" : "oauth_failed";
    return NextResponse.redirect(new URL(`/auth?error=${errorCode}`, url.origin));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const safeNext = next === "/nearby" ? "/nearby" : "/nearby";
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }
    const errorCode = url.searchParams.has("next") ? "oauth_failed" : "confirmation_failed";
    return NextResponse.redirect(new URL(`/auth?error=${errorCode}`, url.origin));
  }

  const errorCode = url.searchParams.has("next") ? "oauth_failed" : "confirmation_failed";
  return NextResponse.redirect(new URL(`/auth?error=${errorCode}`, url.origin));
}
