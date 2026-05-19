import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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

type Brand = { businessName: string; logoDataUrl: string | null; brandColor: string };

function GenerateScreen() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("forwardit.brand");
    if (raw) {
      try {
        setBrand(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, []);

  const initials = (brand?.businessName || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const canGenerate = Boolean(occasion && style && language);

  const handleGenerate = () => {
    // TODO: call generation API
  };

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
              3 free images remaining
            </span>
          </div>
        </header>

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

        {/* Sticky CTA */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] border-t border-border bg-background/95 backdrop-blur px-5 py-4">
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            size="lg"
            className="w-full h-12 text-base font-medium rounded-xl"
          >
            Generate Image
          </Button>
        </div>
      </div>
    </main>
  );
}
