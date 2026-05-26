import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, AlertTriangle, Lock } from "lucide-react";
import { supabase, SUPABASE_FUNCTIONS_URL } from "@/lib/supabase";

export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [{ title: "Generate — Forwardit" }],
  }),
  component: GenerateScreen,
});

const STYLES = [
  { name: "Vibrant", desc: "Bold colours, festive energy" },
  { name: "Minimal", desc: "Clean, modern, lots of space" },
  { name: "Elegant", desc: "Refined, premium, sophisticated" },
];

const LANGUAGES = ["English", "Hindi", "Marathi"] as const;

const STEPS = [
  { label: "Creating your greeting" },
  { label: "Generating image" },
  { label: "Adding your brand" },
];

type Brand = { businessName: string; logoDataUrl: string | null; brandColor: string };
type Phase = "idle" | "loading" | "result" | "error";

const FREE_LIMIT = 3;
const PAID_LIMIT = 10;

function GenerateScreen() {
  const navigate = useNavigate();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubscribed] = useState(false); // Placeholder for billing state.

  const [occasion, setOccasion] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [usedCount, setUsedCount] = useState(0);
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const limit = isSubscribed ? PAID_LIMIT : FREE_LIMIT;
  const overLimit = usedCount >= limit;

  const loadUsage = async (uid: string) => {
    let query = supabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid);
    if (isSubscribed) {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      query = query.gte("created_at", start.toISOString());
    }
    const { count } = await query;
    setUsedCount(count ?? 0);
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        navigate({ to: "/" });
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_name, logo_url, brand_colour")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile) {
        navigate({ to: "/brand-setup" });
        return;
      }
      setBrand({
        businessName: profile.business_name,
        logoDataUrl: profile.logo_url,
        brandColor: profile.brand_colour,
      });
      await loadUsage(user.id);
    })();

    return () => {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    };
  }, [navigate]);

  const initials = (brand?.businessName || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const canGenerate =
    Boolean(occasion && style && language) && phase === "idle" && !overLimit;

  const startStepAnimation = () => {
    setActiveStep(0);
    if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
    stepIntervalRef.current = setInterval(() => {
      setActiveStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 2500);
  };

  const stopStepAnimation = () => {
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
      stepIntervalRef.current = null;
    }
  };

  const handleGenerate = async () => {
    setPhase("loading");
    setErrorMsg(null);
    startStepAnimation();

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not signed in");

      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ occasion, style, language }),
      });
      if (!res.ok) throw new Error(`Generation failed (${res.status})`);
      const json = (await res.json()) as { imageUrl: string };
      if (!json.imageUrl) throw new Error("No image returned");

      // Save to db.
      if (userId) {
        await supabase.from("generations").insert({
          user_id: userId,
          occasion,
          style,
          language,
          image_url: json.imageUrl,
        });
        await loadUsage(userId);
      }

      setImageUrl(json.imageUrl);
      stopStepAnimation();
      setActiveStep(STEPS.length);
      setPhase("result");
    } catch (e) {
      stopStepAnimation();
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
      setPhase("error");
    }
  };

  const handleReset = () => {
    stopStepAnimation();
    setOccasion(null);
    setStyle(null);
    setLanguage(null);
    setActiveStep(0);
    setImageUrl(null);
    setPhase("idle");
  };

  const handleShareWhatsApp = () => {
    const text = imageUrl
      ? `Check out my festival greeting! ${imageUrl}`
      : "Check out my festival greeting!";
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const showSelectors = phase === "idle" && !overLimit;

  // Paywall
  if (overLimit) {
    return (
      <main className="min-h-[100dvh] bg-background flex justify-center">
        <div className="w-full max-w-[430px] flex flex-col items-center justify-center px-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="size-7" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-foreground">
            You've used all {limit} free images this month
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Upgrade to continue generating images
          </p>
          <Button size="lg" className="mt-8 h-12 px-8 rounded-xl">
            Upgrade
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-background flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col pb-32">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-xl font-bold tracking-tight text-primary">
              Forwardit
            </span>
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </div>
          </div>
          <div className="px-5 pb-3">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {isSubscribed
                ? `${usedCount} of ${PAID_LIMIT} images used this month`
                : `${usedCount} of ${FREE_LIMIT} free images used`}
            </span>
          </div>
        </header>

        {showSelectors && (
          <div className="animate-fade-in">
            <section className="pt-6 px-5">
              <h2 className="text-sm font-semibold text-foreground">
                Enter an occasion
              </h2>
              <Input
                value={occasion ?? ""}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="e.g. Diwali, Holi, Store Anniversary..."
                className="mt-3 h-11 rounded-xl text-base"
              />
            </section>

            <section className="pt-8 px-5">
              <h2 className="text-sm font-semibold text-foreground">Choose a style</h2>
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {STYLES.map((s) => {
                  const selected = style === s.name;
                  return (
                    <button
                      key={s.name}
                      onClick={() => setStyle(s.name)}
                      className={`flex flex-col items-start rounded-xl border-2 bg-background p-3 text-left transition-colors ${
                        selected
                          ? "border-primary"
                          : "border-input hover:border-muted-foreground/30"
                      }`}
                    >
                      <span className="text-sm font-semibold text-foreground">
                        {s.name}
                      </span>
                      <span className="mt-1 text-[11px] leading-snug text-muted-foreground">
                        {s.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="pt-8 px-5">
              <h2 className="text-sm font-semibold text-foreground">
                Choose a language
              </h2>
              <div className="mt-3 flex gap-2">
                {LANGUAGES.map((l) => {
                  const selected = language === l;
                  return (
                    <button
                      key={l}
                      onClick={() => setLanguage(l)}
                      className={`flex-1 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {phase === "loading" && (
          <section className="px-5 pt-12 animate-fade-in">
            <ol className="flex flex-col gap-5 max-w-xs mx-auto">
              {STEPS.map((step, i) => {
                const complete = i < activeStep;
                const active = i === activeStep;
                return (
                  <li key={step.label} className="flex items-center gap-3">
                    <span
                      className={`relative flex size-6 items-center justify-center rounded-full border transition-colors ${
                        complete
                          ? "bg-primary border-primary text-primary-foreground"
                          : active
                          ? "border-primary"
                          : "border-border bg-muted"
                      }`}
                    >
                      {complete && <Check className="size-3.5" strokeWidth={3} />}
                      {active && (
                        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                      )}
                      {active && (
                        <span className="size-2 rounded-full bg-primary" />
                      )}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        active || complete
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {phase === "error" && (
          <section className="px-5 pt-16 flex flex-col items-center text-center animate-fade-in">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <AlertTriangle className="size-7" />
            </div>
            <p className="mt-4 text-base font-medium text-foreground">
              {errorMsg || "Something went wrong. Please try again."}
            </p>
            <Button
              onClick={handleGenerate}
              size="lg"
              className="mt-6 h-12 px-8 rounded-xl"
            >
              Try Again
            </Button>
          </section>
        )}

        {phase === "result" && (
          <section className="px-5 pt-6 animate-fade-in">
            <div className="aspect-square w-full rounded-xl bg-muted flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Generated greeting"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  Your image will appear here
                </span>
              )}
            </div>
            <div className="mt-5 flex flex-col gap-2.5">
              <Button
                onClick={handleShareWhatsApp}
                size="lg"
                className="w-full h-12 text-base font-medium rounded-xl"
              >
                Share on WhatsApp
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
                className="w-full h-12 text-base font-medium rounded-xl"
              >
                Generate Another
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Something looks off? Take a screenshot and WhatsApp me at xxxxx
              </p>
            </div>
          </section>
        )}

        {(phase === "idle" || phase === "loading") && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] border-t border-border bg-background/95 backdrop-blur px-5 py-4">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              size="lg"
              className="w-full h-12 text-base font-medium rounded-xl"
            >
              {phase === "loading" ? "Generating..." : "Generate Image"}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
