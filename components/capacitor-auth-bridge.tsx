"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function isAuthCallback(value: string): URL | null {
  try {
    const url = new URL(value);
    return ["com.gmck.app:", "gmck:"].includes(url.protocol) && url.hostname === "auth" && url.pathname === "/callback" ? url : null;
  } catch {
    return null;
  }
}

export default function CapacitorAuthBridge() {
  useEffect(() => {
    let active = true;
    const handled = new Set<string>();
    let removeListener: (() => void) | undefined;

    async function handleUrl(value: string) {
      const url = isAuthCallback(value);
      if (!url || !active || handled.has(value)) return;
      handled.add(value);

      const { Browser } = await import("@capacitor/browser");
      await Browser.close().catch(() => undefined);

      const providerError = url.searchParams.get("error");
      if (providerError) {
        const reason = providerError === "access_denied" ? "oauth_cancelled" : "oauth_failed";
        window.location.replace(`/auth?error=${reason}`);
        return;
      }

      const code = url.searchParams.get("code");
      if (!code) {
        window.location.replace("/auth?error=oauth_failed");
        return;
      }

      // Use the same Supabase browser client/storage that initiated the OAuth PKCE flow.
      try {
        const { error } = await createClient().auth.exchangeCodeForSession(code);
        if (!active) return;
        window.location.replace(error ? "/auth?error=oauth_failed" : "/nearby");
      } catch {
        if (active) window.location.replace("/auth?error=oauth_failed");
      }
    }

    async function register() {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;
      const { App } = await import("@capacitor/app");
      const listener = await App.addListener("appUrlOpen", ({ url }) => {
        void handleUrl(url);
      });
      removeListener = () => { void listener.remove(); };

      const launch = await App.getLaunchUrl();
      if (launch?.url) await handleUrl(launch.url);
    }

    void register().catch(() => undefined);
    return () => {
      active = false;
      removeListener?.();
    };
  }, []);

  return null;
}
