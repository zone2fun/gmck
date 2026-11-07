"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PushState = {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
  registered: boolean;
};

const initialState: PushState = {
  supported: false,
  permission: "unsupported",
  subscribed: false,
  registered: false,
};

function decodeKey(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

export default function PushNotificationSettings() {
  const [state, setState] = useState<PushState>(initialState);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const refreshState = useCallback(async () => {
    setChecking(true);
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    if (!supported) {
      setState({ ...initialState, supported: false });
      setChecking(false);
      return;
    }

    const permission = Notification.permission;
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      let registered = false;

      if (subscription) {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (user) {
          const { data, error } = await supabase
            .from("push_subscriptions")
            .select("endpoint")
            .eq("user_id", user.id)
            .eq("endpoint", subscription.endpoint)
            .maybeSingle();
          if (error) throw error;
          registered = Boolean(data);
        }
      }

      setState({
        supported: true,
        permission,
        subscribed: Boolean(subscription),
        registered,
      });
    } catch {
      setState((current) => ({
        ...current,
        supported: true,
        permission,
        registered: false,
      }));
      setMessage("ตรวจสอบสถานะการแจ้งเตือนในบัญชี GMCK ไม่สำเร็จ");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const check = async () => {
      if (!active) return;
      await refreshState();
    };
    void check();

    const onFocus = () => { void check(); };
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshState]);

  const enabled = state.permission === "granted" && state.subscribed && state.registered;

  async function enable() {
    setBusy(true);
    setMessage("");
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("ยังไม่ได้ตั้งค่า VAPID Public Key ในระบบ");

      const permission = Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();

      if (permission !== "granted") {
        await refreshState();
        throw new Error(
          permission === "denied"
            ? "เบราว์เซอร์ปฏิเสธการแจ้งเตือนแล้ว กรุณาเปลี่ยนสิทธิ์เว็บไซต์ GMCK ในการตั้งค่าเบราว์เซอร์"
            : "คุณยังไม่ได้อนุญาตให้ส่งการแจ้งเตือน"
        );
      }

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

      await refreshState();
      setMessage("เปิดรับการแจ้งเตือนบนอุปกรณ์นี้แล้ว และบันทึกอุปกรณ์ใน GMCK เรียบร้อย");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองอีกครั้ง";
      setMessage(detail);
      await refreshState();
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
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (user) {
          const { error } = await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", user.id)
            .eq("endpoint", subscription.endpoint);
          if (error) throw error;
        }
        await subscription.unsubscribe();
      }

      await refreshState();
      setMessage("ปิดการรับแจ้งเตือนบนอุปกรณ์นี้แล้ว (สิทธิ์เบราว์เซอร์ยังคงอนุญาตอยู่)");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ไม่สามารถปิดการแจ้งเตือนได้");
      await refreshState();
    } finally {
      setBusy(false);
    }
  }

  const statusLabel = !state.supported
    ? "ไม่รองรับ"
    : state.permission === "denied"
      ? "ถูกบล็อก"
      : enabled
        ? "เปิดใช้งาน"
        : state.permission === "granted" && state.subscribed && !state.registered
          ? "ยังไม่เชื่อมกับบัญชี"
          : state.permission === "granted"
            ? "อนุญาตแล้ว · ยังไม่เปิดใช้"
            : "ยังไม่อนุญาต";

  const statusClass = enabled
    ? "bg-emerald-400/10 text-emerald-300"
    : state.permission === "denied"
      ? "bg-rose-400/10 text-rose-300"
      : "bg-zinc-400/10 text-zinc-300";

  return (
    <section className="panel mt-5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">Push Notification</h2>
          <p className="mt-1 text-xs leading-5 text-zinc-400">
            รับแจ้งเตือนคำขอข้อความและอัลบั้มส่วนตัว แม้ไม่ได้เปิด GMCK อยู่
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${statusClass}`}>
          {checking ? "กำลังตรวจสอบ…" : statusLabel}
        </span>
      </div>

      {!state.supported ? (
        <p className="mt-3 text-xs text-amber-300">เบราว์เซอร์นี้ยังไม่รองรับ Push Notification</p>
      ) : (
        <>
          <button
            type="button"
            onClick={enabled ? disable : enable}
            disabled={busy || checking || state.permission === "denied"}
            className="mt-4 w-full rounded-xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy
              ? "กำลังดำเนินการ…"
              : checking
                ? "กำลังตรวจสอบสถานะ…"
                : enabled
                  ? "ปิดการรับแจ้งเตือนบนอุปกรณ์นี้"
                  : state.permission === "denied"
                    ? "โปรดอนุญาต GMCK ในการตั้งค่าเบราว์เซอร์"
                    : "เปิดรับการแจ้งเตือนบนอุปกรณ์นี้"}
          </button>
          {state.permission === "denied" && (
            <p className="mt-3 text-xs leading-5 text-amber-300">
              เบราว์เซอร์บล็อกการแจ้งเตือนอยู่ ต้องเข้าไปอนุญาตเว็บไซต์ GMCK ในการตั้งค่าเว็บไซต์ก่อน
            </p>
          )}
          {state.permission === "granted" && !enabled && !checking && (
            <p className="mt-3 text-xs leading-5 text-zinc-400">
              เบราว์เซอร์อนุญาตแล้ว แต่ระบบยังไม่พบการสมัครรับแจ้งเตือนที่เชื่อมกับบัญชี GMCK ครบถ้วน
            </p>
          )}
        </>
      )}

      {message && <p role="status" className="mt-3 text-xs text-purple-200">{message}</p>}
      <p className="mt-3 text-[11px] leading-5 text-zinc-500">
        iPhone/iPad: เพิ่ม GMCK ไปยังหน้าจอโฮมและเปิดเว็บจากไอคอนก่อน จากนั้นจึงกดอนุญาตการแจ้งเตือน
      </p>
    </section>
  );
}
