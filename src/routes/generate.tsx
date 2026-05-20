import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Check, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [{ title: "Generate — Forwardit" }],
  }),
  component: GenerateScreen,
});

const OCCASIONS = [
  "Diwali",
  "Holi",
  "Eid",
  "Christmas",
  "New Year",
  "Independence Day",
  "Republic Day",
  "Women's Day",
  "Valentine's Day",
  "Mother's Day",
];

const STYLES = [
  { name: "Vibrant", desc: "Bold colours, festive energy" },
  { name: "Minimal", desc: "Clean, modern, lots of space" },
  { name: "Elegant", desc: "Refined, premium, sophisticated" },
];

const LANGUAGES = ["English", "Hindi", "Marathi"] as const;

const STEPS = [
  { label: "Creating your greeting", duration: 2000 },
  { label: "Generating image", duration: 6000 },
  { label: "Adding your brand", duration: 2000 },
];

type Brand = { businessName: string; logoDataUrl: string | null; brandColor: string };
type Phase = "idle" | "loading" | "result" | "error";

// Toggle to simulate a failure during generation for testing.
const SIMULATE_FAILURE = false;

function GenerateScreen() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [credits, setCredits] = useState(3);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("forwardit.brand");
    if (raw) {
      try {
        setBrand(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const initials = (brand?.businessName || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const canGenerate = Boolean(occasion && style && language) && phase === "idle";

  const clearTimers = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const runMockGeneration = () => {
    clearTimers();
    setActiveStep(0);
    setPhase("loading");

    let elapsed = 0;
    STEPS.forEach((step, i) => {
      elapsed += step.duration;
      const isLast = i === STEPS.length - 1;
      const t = setTimeout(() => {
        if (SIMULATE_FAILURE && i === 1) {
          setPhase("error");
          return;
        }
        if (isLast) {
          setCredits((c) => Math.max(0, c - 1));
          setPhase("result");
        } else {
          setActiveStep(i + 1);
        }
      }, elapsed);
      timeoutsRef.current.push(t);
    });
  };

  const handleGenerate = async () => {
    // Placeholder for Supabase Edge Function call.
    runMockGeneration();
  };

  const handleReset = () => {
    clearTimers();
    setOccasion(null);
    setStyle(null);
    setLanguage(null);
    setActiveStep(0);
    setPhase("idle");
  };

  const handleShareWhatsApp = () => {
    window.open(
      "https://wa.me/?text=Check%20out%20my%20festival%20greeting!",
      "_blank",
      "noopener,noreferrer",
    );
  };

  const showSelectors = phase === "idle";

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
              {credits} free image{credits === 1 ? "" : "s"} remaining
            </span>
          </div>
        </header>

        {/* Idle: selectors */}
        {showSelectors && (
          <div className="animate-fade-in">
            {/* Occasion */}
            <section className="pt-6">
              <h2 className="px-5 text-sm font-semibold text-foreground">
                Choose an occasion
              </h2>
              <div className="mt-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {OCCASIONS.map((o) => {
                  const selected = occasion === o;
                  return (
                    <button
                      key={o}
                      onClick={() => setOccasion(o)}
                      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {o}
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    const custom = window.prompt("Enter custom occasion");
                    if (custom?.trim()) setOccasion(custom.trim());
                  }}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full border border-dashed px-4 py-2 text-sm font-medium transition-colors ${
                    occasion && !OCCASIONS.includes(occasion)
                      ? "border-primary text-primary"
                      : "border-input text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Plus className="size-3.5" />
                  {occasion && !OCCASIONS.includes(occasion) ? occasion : "Custom"}
                </button>
              </div>
            </section>

            {/* Style */}
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

            {/* Language */}
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

        {/* Loading */}
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
                        active
                          ? "text-foreground"
                          : complete
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

        {/* Error */}
        {phase === "error" && (
          <section className="px-5 pt-16 flex flex-col items-center text-center animate-fade-in">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <AlertTriangle className="size-7" />
            </div>
            <p className="mt-4 text-base font-medium text-foreground">
              Something went wrong. Please try again.
            </p>
            <Button
              onClick={runMockGeneration}
              size="lg"
              className="mt-6 h-12 px-8 rounded-xl"
            >
              Try Again
            </Button>
          </section>
        )}

        {/* Result */}
        {phase === "result" && (
          <section className="px-5 pt-6 animate-fade-in">
            <div className="aspect-square w-full rounded-xl bg-muted flex items-center justify-center">
              <span className="text-sm text-muted-foreground">
                Your image will appear here
              </span>
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
            </div>
          </section>
        )}

        {/* Sticky CTA (only in idle/loading) */}
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
