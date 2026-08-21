"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, LogOut } from "lucide-react";

import { Strava } from "@/components/icons/strava";
import { cn } from "@/lib/utils";
import { usePoster, STRAVA_DISCONNECTED_EVENT } from "@/components/poster-provider";

type AuthState = {
  checked: boolean;
  connected: boolean;
  athleteName: string | null;
};

export function StravaAuth() {
  const { reset } = usePoster();
  const [auth, setAuth] = useState<AuthState>({
    checked: false,
    connected: false,
    athleteName: null,
  });
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch("/api/strava/auth/status", { cache: "no-store" });
          const data = (await res.json()) as {
            connected: boolean;
            athlete?: { firstName?: string | null; lastName?: string | null } | null;
          };
          if (cancelled) return;
          const first = data.athlete?.firstName?.trim() ?? "";
          const last = data.athlete?.lastName?.trim() ?? "";
          const full = [first, last].filter(Boolean).join(" ");
          setAuth({
            checked: true,
            connected: Boolean(data.connected),
            athleteName: full || null,
          });
        } catch {
          if (!cancelled) {
            setAuth({ checked: true, connected: false, athleteName: null });
          }
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, []);

  const handleDisconnect = async () => {
    if (disconnecting) return;
    setDisconnecting(true);
    try {
      await fetch("/api/strava/auth/logout", { method: "POST" });
    } catch {
      /* ignore — we still want to clear local state */
    }
    reset();
    setAuth({ checked: true, connected: false, athleteName: null });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(STRAVA_DISCONNECTED_EVENT));
    }
    setDisconnecting(false);
  };

  if (!auth.checked) {
    return (
      <div className="text-muted-foreground flex items-center gap-1.5 text-[0.7rem]">
        <Loader2 className="size-3 animate-spin" />
        Comprobando…
      </div>
    );
  }

  if (auth.connected) {
    return (
      <button
        type="button"
        onClick={handleDisconnect}
        disabled={disconnecting}
        className={cn(
          "group/disconnect flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs transition-colors",
          "hover:border-destructive/40",
          "disabled:pointer-events-none disabled:opacity-60",
        )}
        title="Desconectar Strava"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Strava className="size-3.5 shrink-0 text-[#fc4c02]" />
          <span className="truncate">
            {auth.athleteName ? `Conectado como ${auth.athleteName}` : "Conectado"}
          </span>
          <span className="hidden shrink-0 items-center gap-1 text-[0.65rem] text-destructive group-hover/disconnect:inline-flex">
            <LogOut className="size-2.5" />
            Desconectar
          </span>
        </span>
        <Check className="size-3.5 shrink-0 text-emerald-500 group-hover/disconnect:hidden" />
      </button>
    );
  }

  return (
    <Link
      href="/api/strava/auth/login"
      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs transition-colors hover:bg-muted"
    >
      <Strava className="size-3.5 text-[#fc4c02]" />
      <span>Conectar Strava</span>
    </Link>
  );
}
