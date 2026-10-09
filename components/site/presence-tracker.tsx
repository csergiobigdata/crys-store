"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  areaFromPath,
  isTrackedPath,
  PRESENCE_CHANNEL,
  type PresencePayload,
} from "@/lib/site/presence";
import { createClient } from "@/lib/supabase/client";

/**
 * Anuncia, de forma anônima, que esta aba está aberta e em qual área do site
 * (para o contador "online agora" do painel). Não guarda nada no banco: a
 * presença some sozinha quando a aba fecha. Se o Realtime estiver indisponível,
 * o site segue funcionando normalmente.
 */
export function PresenceTracker({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const tracked = isTrackedPath(pathname);
  const area = areaFromPath(pathname);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const readyRef = useRef(false);
  const latestRef = useRef<PresencePayload>({ area, logged: isLoggedIn });

  // Atualiza a área quando a pessoa navega (ou quando entra/sai da conta).
  useEffect(() => {
    latestRef.current = { area, logged: isLoggedIn };
    if (readyRef.current && channelRef.current) {
      void channelRef.current.track(latestRef.current);
    }
  }, [area, isLoggedIn]);

  // Entra no canal uma única vez por aba (nas páginas de cliente, não no painel).
  useEffect(() => {
    if (!tracked) return;

    let cancelled = false;
    let supabase: ReturnType<typeof createClient>;
    let channel: RealtimeChannel;
    try {
      supabase = createClient();
      channel = supabase.channel(PRESENCE_CHANNEL, {
        config: { presence: { key: crypto.randomUUID() } },
      });
    } catch {
      return; // Sem Realtime: o site segue normalmente.
    }

    channelRef.current = channel;
    channel.subscribe((status) => {
      if (cancelled) return;
      if (status === "SUBSCRIBED") {
        readyRef.current = true;
        void channel.track(latestRef.current);
      }
    });

    return () => {
      cancelled = true;
      readyRef.current = false;
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [tracked]);

  return null;
}
