import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Forwardit — Your brand. Every festival. 30 seconds." },
      {
        name: "description",
        content:
          "AI-powered WhatsApp festival greeting image generator for Indian small business owners.",
      },
    ],
  }),
  component: SignInScreen,
});

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.2 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5.1 0 9.7-1.9 13.2-5.1l-6.1-5c-2 1.4-4.5 2.2-7.1 2.2-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.6 39 16.3 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.1 5c-.4.4 6.8-4.9 6.8-14.7 0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function SignInScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"buttons" | "email">("buttons");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show a loader while we resolve the session, otherwise users returning
  // from a magic link briefly see the login screen before being redirected.
  const hasAuthInUrl =
    typeof window !== "undefined" &&
    (window.location.hash.includes("access_token") ||
      window.location.search.includes("code="));
  const [checkingSession, setCheckingSession] = useState(hasAuthInUrl);

  // Route based on session + profile. Runs on initial load and whenever the
  // auth state changes (including after detectSessionInUrl parses the magic
  // link token from the URL).
  useEffect(() => {
    let cancelled = false;
    let routed = false;

    const route = async (userId: string) => {
      if (routed) return;
      routed = true;
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      // Clean the auth token from the URL.
      if (typeof window !== "undefined" && (window.location.hash || window.location.search.includes("code="))) {
        window.history.replaceState({}, "", window.location.pathname);
      }
      navigate({ to: data ? "/generate" : "/brand-setup" });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) {
        route(s.user.id);
      } else {
        setCheckingSession(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session?.user) {
        route(data.session.user.id);
      } else if (!hasAuthInUrl) {
        setCheckingSession(false);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate, hasAuthInUrl]);

  if (checkingSession) {
    return (
      <main className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Signing you in…</div>
      </main>
    );
  }

  const handleGoogle = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  };



  const handleEmail = async () => {
    if (!email) return;
    setSending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setSending(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <main className="min-h-[100dvh] bg-background flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col px-6 pt-20 pb-10">
        <header className="flex flex-col items-start">
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            Forwardit
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Your brand. Every festival. 30 seconds.
          </p>
        </header>

        <div className="mt-auto flex flex-col gap-3 pt-16">
          {mode === "buttons" && (
            <>
              <Button
                onClick={handleGoogle}
                size="lg"
                className="w-full h-12 text-base font-medium rounded-xl"
              >
                <GoogleIcon />
                <span className="ml-1">Continue with Google</span>
              </Button>

              <Button
                onClick={() => setMode("email")}
                variant="outline"
                size="lg"
                className="w-full h-12 text-base font-medium rounded-xl border-input"
              >
                <Mail className="size-5" />
                <span className="ml-1">Continue with email</span>
              </Button>
            </>
          )}

          {mode === "email" && (
            <div className="flex flex-col gap-3">
              {sent ? (
                <div className="rounded-xl border border-input bg-muted/30 p-4 text-sm text-foreground">
                  Check your inbox for a sign-in link sent to{" "}
                  <span className="font-medium">{email}</span>.
                </div>
              ) : (
                <>
                  <Input
                    type="email"
                    placeholder="you@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl text-base"
                  />
                  <Button
                    onClick={handleEmail}
                    disabled={sending || !email}
                    size="lg"
                    className="w-full h-12 text-base font-medium rounded-xl"
                  >
                    {sending ? "Sending..." : "Send magic link"}
                  </Button>
                  <button
                    onClick={() => setMode("buttons")}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ← Back
                  </button>
                </>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed px-4">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </main>
  );
}
