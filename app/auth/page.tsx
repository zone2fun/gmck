"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("error");
    if (!authError) return;
    const messages: Record<string, string> = {
      oauth_cancelled: "ยกเลิกการเข้าสู่ระบบด้วย Google แล้ว คุณสามารถลองใหม่ได้",
      oauth_failed: "เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองอีกครั้ง",
    };
    setError(messages[authError] ?? "ยืนยันบัญชีไม่สำเร็จ กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ");
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  async function handleGoogleSignIn() {
    setGoogleBusy(true);
    setError("");
    setMessage("");
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.getPlatform() === "android") {
        const { Browser } = await import("@capacitor/browser");
        const { data, error: authError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: "com.gmck.app://auth/callback",
            skipBrowserRedirect: true,
          },
        });
        if (authError) throw authError;
        if (!data.url) throw new Error("ไม่สามารถเริ่มการเข้าสู่ระบบด้วย Google ได้");
        await Browser.open({ url: data.url });
        return;
      }

      // Keep the existing browser OAuth flow for web and PWA users.
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/nearby`,
        },
      });
      if (authError) throw authError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถเข้าสู่ระบบด้วย Google ได้");
      setGoogleBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (authError) throw authError;
        if (data.session) {
          window.location.href = "/nearby";
          return;
        }
        setMessage("สมัครสมาชิกเรียบร้อยแล้ว กรุณาเปิดอีเมลเพื่อกดยืนยันบัญชีก่อนเข้าสู่ระบบ");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        window.location.href = "/nearby";
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell flex flex-col">
      <header className="flex items-center justify-between">
        <Link href="/nearby" className="flex items-center gap-3">
          <span className="brand-mark">G</span>
          <span className="text-lg font-bold tracking-[.18em]">GMCK</span>
        </Link>
        <span className="pill rounded-full px-3 py-1 text-xs">18+ COMMUNITY</span>
      </header>

      <section className="flex flex-1 flex-col justify-center py-12">
        <p className="mb-3 text-xs font-semibold tracking-[.24em] text-purple-300">WELCOME TO GMCK</p>
        <h1 className="glow text-3xl font-semibold">{mode === "signup" ? "สร้างบัญชี GMCK" : "ยินดีต้อนรับกลับ"}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {mode === "signup" ? "เริ่มต้นทำความรู้จักผู้คนใหม่ ๆ อย่างเป็นส่วนตัว" : "เข้าสู่ระบบเพื่อใช้งานบัญชีของคุณ"}
        </p>

        <form onSubmit={handleSubmit} className="panel mt-8 space-y-5 p-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleBusy || busy}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white px-5 py-3.5 font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.72 7.18l7.2 5.59c4.2-3.88 6.56-9.6 6.56-17.24Z" />
              <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.79l-7.2-5.59c-2 1.35-4.56 2.15-8.7 2.15-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
            </svg>
            {googleBusy ? "กำลังเชื่อมต่อ Google..." : "ดำเนินการต่อด้วย Google"}
          </button>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="h-px flex-1 bg-white/10" />
            <span>หรือใช้อีเมล</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-zinc-300">อีเมล</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm text-zinc-300">รหัสผ่าน</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="อย่างน้อย 8 ตัวอักษร"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-purple-400"
            />
          </div>

          {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          {message && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm leading-6 text-emerald-200">{message}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3.5 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "กำลังดำเนินการ..." : mode === "signup" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
          </button>

          <p className="text-center text-sm text-zinc-400">
            {mode === "signup" ? "มีบัญชีอยู่แล้ว?" : "ยังไม่มีบัญชี?"}{" "}
            <button
              type="button"
              onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setMessage(""); }}
              className="font-semibold text-purple-300 hover:text-purple-200"
            >
              {mode === "signup" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
            </button>
          </p>
        </form>

        <p className="mt-5 text-center text-xs leading-6 text-zinc-500">
          การสมัครสมาชิกถือว่าคุณยืนยันว่ามีอายุ 18 ปีขึ้นไป ทั้งนี้การยืนยันอายุเพิ่มเติมจะถูกจัดทำในขั้นตอนถัดไป
        </p>
      </section>
    </main>
  );
}
