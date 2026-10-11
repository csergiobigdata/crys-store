"use client";

import { useEffect } from "react";
import { logoutIdle } from "@/lib/auth/actions";

const IDLE_LIMIT_MS = 15 * 60 * 1000;
const CHECK_EVERY_MS = 15 * 1000;
const STORAGE_KEY = "chrys:last-activity";
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

/**
 * Encerra a sessão depois de 15 minutos sem nenhuma atividade (mouse, teclado,
 * rolagem ou toque) e leva a pessoa de volta ao login. O último momento de
 * atividade fica no localStorage para valer para todas as abas abertas: mexer
 * em uma aba mantém as outras logadas.
 */
export function IdleLogout() {
  useEffect(() => {
    let lastActivity = Date.now();
    let loggingOut = false;

    function remember(time: number) {
      lastActivity = time;
      try {
        localStorage.setItem(STORAGE_KEY, String(time));
      } catch {
        // Sem localStorage vale só a atividade desta aba.
      }
    }

    function sharedLastActivity() {
      try {
        const stored = Number(localStorage.getItem(STORAGE_KEY));
        if (Number.isFinite(stored) && stored > lastActivity) return stored;
      } catch {
        // ignora
      }
      return lastActivity;
    }

    function onActivity() {
      const now = Date.now();
      // Grava no máximo uma vez por segundo (mousemove dispara o tempo todo).
      if (now - lastActivity >= 1000) remember(now);
    }

    function check() {
      if (loggingOut) return;
      if (Date.now() - sharedLastActivity() >= IDLE_LIMIT_MS) {
        loggingOut = true;
        void logoutIdle();
      }
    }

    remember(Date.now());
    ACTIVITY_EVENTS.forEach((name) =>
      window.addEventListener(name, onActivity, { passive: true }),
    );
    document.addEventListener("visibilitychange", check);
    const timer = window.setInterval(check, CHECK_EVERY_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
      document.removeEventListener("visibilitychange", check);
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
