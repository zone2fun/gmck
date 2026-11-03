"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
          window.location.href = "/welcome";
          return;
        }
        setMessage("สมัครสมาชิกเรียบร้อยแล้ว กรุณาเปิดอีเมลเพื่อกดยืนยันบัญชีก่อนเข้าสู่ระบบ");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        window.location.href = "/welcome";
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
        <Link href="/" className="flex items-center gap-3">
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
