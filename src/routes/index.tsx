import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ImageCarouselHero } from "@/components/ui/ai-image-generator-hero";

const HERO_IMAGES = [
  { id: "1", src: "https://images.unsplash.com/photo-1684369176170-463e84248b70?auto=format&fit=crop&q=60&w=600", alt: "AI art 1", rotation: -15 },
  { id: "2", src: "https://plus.unsplash.com/premium_photo-1677269465314-d5d2247a0b0c?auto=format&fit=crop&q=60&w=600", alt: "AI art 2", rotation: -8 },
  { id: "3", src: "https://images.unsplash.com/photo-1524673360092-e07b7ae58845?auto=format&fit=crop&q=60&w=600", alt: "AI art 3", rotation: 5 },
  { id: "4", src: "https://plus.unsplash.com/premium_photo-1680610653084-6e4886519caf?auto=format&fit=crop&q=60&w=600", alt: "AI art 4", rotation: 12 },
  { id: "5", src: "https://plus.unsplash.com/premium_photo-1680608979589-e9349ed066d5?auto=format&fit=crop&q=60&w=600", alt: "AI art 5", rotation: -12 },
  { id: "6", src: "https://images.unsplash.com/photo-1562575214-da9fcf59b907?auto=format&fit=crop&q=60&w=600", alt: "AI art 6", rotation: 8 },
  { id: "7", src: "https://plus.unsplash.com/premium_photo-1676637656210-390da73f4951?auto=format&fit=crop&q=60&w=600", alt: "AI art 7", rotation: -6 },
  { id: "8", src: "https://images.unsplash.com/photo-1664448003794-2d446c53dcae?auto=format&fit=crop&q=60&w=600", alt: "AI art 8", rotation: 10 },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Navo — Your brand. Every festival. 30 seconds." },
      {
        name: "description",
        content:
          "AI-powered WhatsApp festival greeting image generator for Indian small business owners.",
      },
    ],
  }),
  component: SignInScreen,
});


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
    <main className="min-h-[100dvh] bg-background flex flex-col items-center">
      <ImageCarouselHero
        title="Navo"
        subtitle="Your brand. Every festival. 30 seconds."
        description="AI-powered WhatsApp festival greeting images for your business"
        ctaText="Get started"
        onCtaClick={() => {
          setMode("email");
          document.getElementById("signin-block")?.scrollIntoView({ behavior: "smooth" });
        }}
        images={HERO_IMAGES}
      />
      <div id="signin-block" className="w-full max-w-[430px] flex flex-col px-6 pt-4 pb-10">
        <div className="mt-auto flex flex-col gap-3 pt-16">
          {mode === "buttons" && (
            <>
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
            By continuing, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-foreground transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            .
          </p>

          <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
