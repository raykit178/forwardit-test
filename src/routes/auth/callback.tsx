import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Signing you in — Forwardit" }],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href,
        );
        if (error) throw error;

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) throw new Error("No session after exchange");

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle();

        if (cancelled) return;
        window.history.replaceState({}, "", window.location.pathname);
        navigate({ to: profile ? "/generate" : "/brand-setup" });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Sign-in failed";
        navigate({ to: "/", search: { error: msg } as never });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="min-h-[100dvh] bg-background flex items-center justify-center">
      <div className="text-sm text-muted-foreground">Signing you in…</div>
    </main>
  );
}
