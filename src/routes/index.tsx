import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ImageCarouselHero } from "@/components/ui/ai-image-generator-hero";

const HERO_IMAGES = [
  { id: "1", src: "https://xmjqfzwgontqjtylcmnd.supabase.co/storage/v1/object/public/generations/Frwrdit%20sample%20logo%20-%20diwali.jpg", alt: "Diwali greeting", rotation: -15 },
  { id: "2", src: "https://xmjqfzwgontqjtylcmnd.supabase.co/storage/v1/object/public/generations/Frwrdit%20sample%20logo%20-%20naag.jpg", alt: "Naag greeting", rotation: -8 },
  { id: "3", src: "https://xmjqfzwgontqjtylcmnd.supabase.co/storage/v1/object/public/generations/Frwrdit%20sample%20logo%20-iday.jpg", alt: "Iday greeting", rotation: 5 },
  { id: "4", src: "https://xmjqfzwgontqjtylcmnd.supabase.co/storage/v1/object/public/generations/Frwrdit%20sample%20logo%20-xmas.jpg", alt: "Xmas greeting", rotation: 12 },
  { id: "5", src: "https://xmjqfzwgontqjtylcmnd.supabase.co/storage/v1/object/public/generations/Frwrdit%20sample%20logo%20akshay.jpg", alt: "Akshay greeting", rotation: -12 },
  { id: "6", src: "https://xmjqfzwgontqjtylcmnd.supabase.co/storage/v1/object/public/generations/Frwrdit%20sample%20logo%20dasara.jpg", alt: "Dasara greeting", rotation: 8 },
  { id: "7", src: "https://xmjqfzwgontqjtylcmnd.supabase.co/storage/v1/object/public/generations/Frwrdit%20sample%20logo%20milk.jpg", alt: "Milk greeting", rotation: -6 },
  { id: "8", src: "https://xmjqfzwgontqjtylcmnd.supabase.co/storage/v1/object/public/generations/Frwrdit%20sample%20logo.jpg", alt: "Sample logo", rotation: 10 },
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
        ctaText={
          mode === "email"
            ? sent
              ? "Magic link sent"
              : sending
                ? "Sending..."
                : "Send magic link"
            : "Continue with email"
        }
        ctaDisabled={mode === "email" && (sending || sent || !email)}
        onCtaClick={() => {
          if (mode === "buttons") {
            setMode("email");
            document.getElementById("signin-block")?.scrollIntoView({ behavior: "smooth" });
          } else if (!sent) {
            handleEmail();
          }
        }}
        aboveCta={
          mode === "email" && !sent ? (
            <div className="flex flex-col gap-2">
              <Input
                type="email"
                placeholder="you@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl text-base"
              />
              {error && (
                <p className="text-xs text-destructive text-left px-1">{error}</p>
              )}
            </div>
          ) : mode === "email" && sent ? (
            <div className="rounded-xl border border-input bg-muted/30 p-4 text-sm text-foreground text-center">
              Check your inbox for a sign-in link sent to{" "}
              <span className="font-medium">{email}</span>.
            </div>
          ) : null
        }
        belowCta={
          mode === "email" && !sent ? (
            <button
              onClick={() => {
                setMode("buttons");
                setError(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
          ) : null
        }
        images={HERO_IMAGES}
        features={[]}
      />
      <div id="signin-block" className="w-full max-w-[600px] flex flex-col px-6 pt-2 pb-10">
        <div className="flex flex-col">
          {error && mode !== "email" && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}

          <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { title: "Realistic Results", description: "Photos that look professionally crafted" },
              { title: "Fast Generation", description: "Turn ideas into images in seconds." },
              { title: "Diverse Styles", description: "Choose from a wide range of artistic options." },
            ].map((feature, index) => (
              <div
                key={index}
                className="rounded-2xl border border-border bg-card/50 p-5 text-left"
              >
                <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground leading-relaxed px-4">
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
        </div>
      </div>
    </main>
  );
}

