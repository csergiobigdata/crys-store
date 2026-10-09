"use client";

import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AREA_LABELS,
  AREA_ORDER,
  PRESENCE_CHANNEL,
  summarizePresence,
  type PresencePayload,
  type PresenceSummary,
} from "@/lib/site/presence";
import { createClient } from "@/lib/supabase/client";

/**
 * Contador "online agora" do painel: quantas abas do site estão abertas e em
 * qual área (catálogo, carrinho, checkout...). Anônimo — sem nomes.
 */
export function OnlineNow() {
  // O cliente é criado uma vez; se faltar configuração, o card mostra "indisponível".
  const [supabase] = useState(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  });
  const [summary, setSummary] = useState<PresenceSummary | null>(null);
  const [status, setStatus] = useState<"connecting" | "live" | "error">(
    supabase ? "connecting" : "error",
  );

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel(PRESENCE_CHANNEL);
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresencePayload>() as unknown as Record<
          string,
          PresencePayload[]
        >;
        setSummary(summarizePresence(state));
      })
      .subscribe((subscribeStatus) => {
        if (subscribeStatus === "SUBSCRIBED") setStatus("live");
        else if (subscribeStatus === "CHANNEL_ERROR" || subscribeStatus === "TIMED_OUT") {
          setStatus("error");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  const total = summary?.total ?? 0;
  const areas = AREA_ORDER.filter((area) => (summary?.byArea[area] ?? 0) > 0);

  return (
    <section className="mt-8 rounded-2xl border border-rose-light bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-plum">
          <Users className="h-5 w-5 text-rose-dark" aria-hidden="true" />
          Online agora
        </h2>
        <span className="flex items-center gap-2 text-xs text-plum-soft">
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${
              status === "live"
                ? "animate-pulse bg-success"
                : status === "error"
                  ? "bg-error"
                  : "bg-rose/50"
            }`}
          />
          {status === "live" ? "ao vivo" : status === "error" ? "indisponível" : "conectando…"}
        </span>
      </div>

      {status === "error" ? (
        <p className="mt-3 text-sm text-plum-soft">
          Não foi possível conectar ao serviço de tempo real agora. Atualize a página para tentar
          de novo.
        </p>
      ) : (
        <>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-4xl font-semibold text-plum">{total}</span>
            <span className="text-sm text-plum-soft">
              {total === 1 ? "aba aberta" : "abas abertas"}
              {summary && summary.logged > 0 ? ` · ${summary.logged} com cliente logado` : ""}
            </span>
          </p>

          {areas.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {areas.map((area) => (
                <li
                  key={area}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    area === "checkout" ? "bg-rose-light/60 font-medium text-plum" : "bg-rose-light/25 text-plum-soft"
                  }`}
                >
                  <span>{AREA_LABELS[area]}</span>
                  <span className="font-semibold text-plum">{summary?.byArea[area]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-plum-soft">Ninguém no site neste momento.</p>
          )}

          <p className="mt-4 text-xs text-plum-soft">
            Contagem anônima, por aba aberta (uma pessoa com duas abas conta duas vezes). Não
            inclui a equipe no painel administrativo.
          </p>
        </>
      )}
    </section>
  );
}
