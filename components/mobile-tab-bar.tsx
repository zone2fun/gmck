"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const tabs = [
  { href: "/nearby", label: "ใกล้ฉัน", icon: "⌖", match: ["/nearby"] },
  { href: "/discover", label: "ค้นหา", icon: "♡", match: ["/discover"] },
  { href: "/messages", label: "ข้อความ", icon: "✉", match: ["/messages"] },
  { href: "/notifications", label: "แจ้งเตือน", icon: "♢", match: ["/notifications"] },
  { href: "/settings", label: "ตั้งค่า", icon: "⚙", match: ["/settings", "/profile/setup", "/album", "/blocked"] },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [authenticated, setAuthenticated] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!alive) return;
      setAuthenticated(!!user);
      if (!user) return;
      const refresh = async () => {
        const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
        if (alive) setUnread(count ?? 0);
      };
      await refresh();
      channel = supabase.channel("mobile-tabs-notifications")
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, refresh)
        .subscribe();
    };
    void load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session?.user);
      if (!session?.user) setUnread(0);
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
      if (channel) void supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (!authenticated || pathname === "/" || pathname.startsWith("/auth")) return null;

  return (
    <nav aria-label="เมนูหลัก" className="mobile-tabbar">
      {tabs.map((tab) => {
        const active = tab.match.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
        return (
          <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined}
            className={`mobile-tab ${active ? "mobile-tab-active" : ""}`}>
            <span className="mobile-tab-icon-wrap">
              <span className="mobile-tab-icon">{tab.icon}</span>
              {tab.href === "/notifications" && unread > 0 && <span className="mobile-tab-badge">{unread > 99 ? "99+" : unread}</span>}
            </span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
