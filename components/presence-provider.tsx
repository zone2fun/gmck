"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PresencePayload = { user_id: string; online_at: string };
const OnlineMembersContext = createContext<string[]>([]);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [onlineIds, setOnlineIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setUserId(data.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!userId) {
      setOnlineIds([]);
      return;
    }

    const channel = supabase.channel("gmck:presence", {
      config: { private: true, presence: { key: userId } },
    });
    const syncPresence = () => {
      const state = channel.presenceState<PresencePayload>();
      const ids = new Set<string>();
      Object.values(state).flat().forEach((presence) => {
        if (presence.user_id) ids.add(presence.user_id);
      });
      setOnlineIds([...ids]);
    };

    channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: userId, online_at: new Date().toISOString() });
          syncPresence();
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  return <OnlineMembersContext.Provider value={onlineIds}>{children}</OnlineMembersContext.Provider>;
}

export function MemberOnlineBadge({ memberId, className = "" }: { memberId: string; className?: string }) {
  const onlineIds = useContext(OnlineMembersContext);
  const online = onlineIds.includes(memberId);
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${online ? "text-emerald-300" : "text-zinc-500"} ${className}`}
      aria-label={online ? "ออนไลน์" : "ออฟไลน์"}
    >
      <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.65)]" : "bg-zinc-600"}`} />
      {online ? "ออนไลน์" : "ออฟไลน์"}
    </span>
  );
}
