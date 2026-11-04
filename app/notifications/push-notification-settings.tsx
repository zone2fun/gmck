"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function decodeKey(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

export default function PushNotificationSettings() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(available);
    if (available) {
      navigator.serviceWorker.register("/sw.js").then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        setEnabled(Boolean(subscription));
      }).catch(() => setMessage("ไม่สามารถเตรียมระบบแจ้งเตือนบนอุปกรณ์นี้ได้"));
    }
  }, []);

  async function enable() {
    setBusy(true);
    setMessage("");
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("ยังไม่ได้ตั้งค่า VAPID Public Key ในระบบ");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("คุณยังไม่ได้อนุญาตให้ส่งการแจ้งเตือน");

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeKey(publicKey) as BufferSource,
        });
      }

      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("กรุณาเข้าสู่ระบบ GMCK ใหม่ แล้วลองอีกครั้ง");

      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        subscription: subscription.toJSON(),
        user_agent: navigator.userAgent,
      }, { onConflict: "endpoint" });
      if (error) throw error;
      setEnabled(true);
      setMessage("เปิดรับการแจ้งเตือนบนอุปกรณ์นี้แล้ว");
    } catch (error) {
      const detail =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: unknown }).message)
          : error instanceof Error
            ? error.message
            : JSON.stringify(error);
      setMessage(detail || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const supabase = createClient();
        const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        if (error) throw error;
        await subscription.unsubscribe();
      }
      setEnabled(false);
      setMessage("ปิดการแจ้งเตือนบนอุปกรณ์นี้แล้ว");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ไม่สามารถปิดการแจ้งเตือนได้");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel mt-5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">Push Notification</h2>
          <p className="mt-1 text-xs leading-5 text-zinc-400">
            รับแจ้งเตือนคำขอข้อความและอัลบั้มส่วนตัว แม้ไม่ได้เปิด GMCK อยู่
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${enabled ? "bg-emerald-400/10 text-emerald-300" : "bg-zinc-400/10 text-zinc-300"}`}>
          {enabled ? "เปิดอยู่" : "ปิดอยู่"}
        </span>
      </div>
      {!supported ? (
        <p className="mt-3 text-xs text-amber-300">เบราว์เซอร์นี้ยังไม่รองรับ Push Notification</p>
      ) : (
        <button
          type="button"
          onClick={enabled ? disable : enable}
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "กำลังดำเนินการ…" : enabled ? "ปิดการแจ้งเตือนบนอุปกรณ์นี้" : "เปิดรับการแจ้งเตือนบนอุปกรณ์นี้"}
        </button>
      )}
      {message && <p role="status" className="mt-3 text-xs text-purple-200">{message}</p>}
      <p className="mt-3 text-[11px] leading-5 text-zinc-500">
        iPhone/iPad: เพิ่ม GMCK ไปยังหน้าจอโฮมและเปิดเว็บจากไอคอนก่อน จากนั้นจึงกดอนุญาตการแจ้งเตือน
      </p>
    </section>
  );
}
