import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, AlertTriangle, Download, MessageCircle } from "lucide-react";
import { supabase, SUPABASE_FUNCTIONS_URL } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [{ title: "Generate — Navo" }],
  }),
  component: GenerateScreen,
});

const STYLES = [
  { name: "Vibrant", desc: "Bold colours, festive energy" },
  { name: "Minimal", desc: "Clean, modern, lots of space" },
  { name: "Elegant", desc: "Refined, premium, sophisticated" },
  { name: "Word Art", desc: "Bold text, creative layouts" },
];

const LANGUAGES = ["English", "Hindi", "Marathi"] as const;

const STEPS = [
  { label: "Creating your greeting" },
  { label: "Generating image" },
  { label: "Adding your brand" },
];

type Brand = { businessName: string; logoDataUrl: string | null; brandColor: string; contactNumber: string; extraInfo: string | null };
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
  const [showPaywall, setShowPaywall] = useState(false);

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
        .select("business_name, logo_url, brand_colour, contact_number, extra_info")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!profile) {
        navigate({ to: "/brand-setup" });
        return;
      }
      setBrand({
        businessName: profile.business_name,
        logoDataUrl: profile.logo_url,
        brandColor: profile.brand_colour,
        contactNumber: profile.contact_number ?? "",
        extraInfo: profile.extra_info ?? null,
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
    Boolean(occasion && style && language) && phase === "idle";

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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const compositeImage = async (aiImageUrl: string, brand: Brand): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("No canvas context");

      const brandBarHeight = 256;
      const brandBarTop = 1024 - brandBarHeight;

      // Helper: find tight bounding box of non-white, non-transparent pixels
      const getContentBounds = (img: HTMLImageElement) => {
        const offscreen = document.createElement("canvas");
        offscreen.width = img.width;
        offscreen.height = img.height;
        const octx = offscreen.getContext("2d")!;
        octx.drawImage(img, 0, 0);
        const { data, width, height } = octx.getImageData(0, 0, img.width, img.height);
        let minX = width, minY = height, maxX = 0, maxY = 0;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
            if (a < 20) continue; // transparent
            if (r > 240 && g > 240 && b > 240) continue; // near-white
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
        if (maxX < minX) return { x: 0, y: 0, w: width, h: height }; // fallback
        return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
      };

      const aiImg = new Image();
      aiImg.crossOrigin = "anonymous";
      aiImg.onload = () => {
        ctx.drawImage(aiImg, 0, 0, 1024, 1024);

        // Brand bar background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, brandBarTop, 1024, brandBarHeight);

        // 8px top stroke in brand colour
        ctx.fillStyle = brand.brandColor || "#006AFF";
        ctx.fillRect(0, brandBarTop, 1024, 8);

        const drawText = (_logoDrawnWidth: number) => {
          const rightColLeft = Math.round(1024 * 0.55); // 562
          const rightColPadL = 24;
          const rightColPadR = 24;
          const rightColInnerLeft = rightColLeft + rightColPadL; // 586
          const rightColInnerRight = 1024 - rightColPadR; // 1000
          const rightColInnerWidth = rightColInnerRight - rightColInnerLeft; // 414
          const extra = (brand.extraInfo ?? "").trim();

          ctx.textBaseline = "middle";

          if (extra) {
            // --- Extra info: wrap to max 2 lines ---
            ctx.font = `400 22px 'Noto Sans', 'Noto Sans Devanagari', sans-serif`;
            ctx.fillStyle = "#444444";
            ctx.textAlign = "left";

            const words = extra.split(/\s+/);
            const lines: string[] = [];
            let current = "";
            for (const w of words) {
              const test = current ? current + " " + w : w;
              if (ctx.measureText(test).width <= rightColInnerWidth || !current) {
                current = test;
              } else {
                lines.push(current);
                current = w;
                if (lines.length === 1) break;
              }
            }
            if (current && lines.length < 2) lines.push(current);
            // If we broke early due to 2-line cap, append remaining words to line 2
            if (lines.length === 2) {
              const consumed = lines.join(" ").split(/\s+/).length;
              const rest = words.slice(consumed).join(" ");
              if (rest) lines[1] = lines[1] + " " + rest;
            }

            const lineHeight = 28;
            // Upper half of right column, vertically centred
            const upperHalfCenter = brandBarTop + brandBarHeight * 0.25 + 4;
            const blockHeight = lines.length * lineHeight;
            const firstY = upperHalfCenter - blockHeight / 2 + lineHeight / 2;
            lines.forEach((ln, i) => {
              ctx.fillText(ln, rightColInnerLeft, firstY + i * lineHeight);
            });

            // --- Divider ---
            const dividerY = brandBarTop + brandBarHeight / 2;
            ctx.fillStyle = "#DDDDDD";
            ctx.fillRect(rightColInnerLeft, dividerY, rightColInnerWidth, 1);

            // --- Phone number, lower half ---
            ctx.font = `600 32px DM Sans, sans-serif`;
            ctx.fillStyle = "#222222";
            ctx.textAlign = "left";
            const phoneText = "✆  " + brand.contactNumber;
            const phoneY = brandBarTop + brandBarHeight * 0.75 + 4;
            ctx.fillText(phoneText, rightColInnerLeft, phoneY);
          } else {
            // Original: phone number right-aligned, vertically centred
            ctx.font = `600 32px DM Sans, sans-serif`;
            ctx.fillStyle = "#222222";
            const phoneText = "✆  " + brand.contactNumber;
            const rightMargin = 40;
            const textX = 1024 - rightMargin;
            const textY = brandBarTop + 4 + (brandBarHeight - 4) / 2;
            ctx.textAlign = "right";
            ctx.fillText(phoneText, textX, textY);
          }
          ctx.textAlign = "left"; // reset
          resolve(canvas.toDataURL("image/png"));
        };

        if (brand.logoDataUrl) {
          const logoImg = new Image();
          logoImg.crossOrigin = "anonymous";
          logoImg.onload = () => {
            const bounds = getContentBounds(logoImg);
            const maxLogoHeight = 190;
            const maxLogoWidth = 320;
            const scale = Math.min(maxLogoHeight / bounds.h, maxLogoWidth / bounds.w);
            const logoW = bounds.w * scale;
            const logoH = bounds.h * scale;
            const logoX = 32;
            const logoY = brandBarTop + 4 + (brandBarHeight - 4) / 2 - logoH / 2;
            ctx.drawImage(
              logoImg,
              bounds.x, bounds.y, bounds.w, bounds.h,
              logoX, logoY, logoW, logoH
            );
            drawText(logoW);
          };
          logoImg.onerror = () => drawText(0);
          logoImg.src = brand.logoDataUrl;
        } else {
          drawText(0);
        }
      };
      aiImg.onerror = reject;
      aiImg.src = aiImageUrl;
    });
  };

  const handleDownload = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const fileName = `forwardit-${(occasion || 'greeting').replace(/\s+/g, '-').toLowerCase()}.png`;
      if (navigator.canShare && navigator.share) {
        const file = new File([blob], fileName, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: fileName });
            return;
          } catch (e) {
            // User cancelled or share failed — fall through to download
          }
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const handleGenerate = async () => {
    // Re-check the limit before calling the edge function.
    if (userId) {
      let q = supabase
        .from("generations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if (isSubscribed) {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        q = q.gte("created_at", start.toISOString());
      }
      const { count } = await q;
      const used = count ?? 0;
      setUsedCount(used);
      if (used >= limit) {
        setShowPaywall(true);
        return;
      }
    }

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

      const compositedUrl = await compositeImage(json.imageUrl, brand!);

      // Save to db.
      if (userId) {
        await supabase.from("generations").insert({
          user_id: userId,
          occasion,
          style,
          language,
          image_url: compositedUrl,
        });
        await loadUsage(userId);
      }

      setImageUrl(compositedUrl);
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

  const handleWhatsAppShare = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const fileName = `forwardit-${(occasion ?? '').replace(/\s+/g, '-').toLowerCase()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
        } catch (e) {
          // user cancelled
        }
      } else {
        window.open('https://wa.me/', '_blank');
      }
    }, 'image/png');
  };

  const showSelectors = phase === "idle";

  return (
    <main className="min-h-[100dvh] bg-background flex justify-center">
      <Toaster />
      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="max-w-[360px] rounded-2xl bg-white sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {isSubscribed
                ? `You've used your ${PAID_LIMIT} images this month`
                : `You've used your ${FREE_LIMIT} free images`}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Subscribe to generate {PAID_LIMIT} branded images every month — at a fraction of what a designer would charge.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button
              onClick={() => toast("Coming soon")}
              size="lg"
              className="w-full h-12 text-base font-medium rounded-xl text-white"
              style={{ backgroundColor: '#0073F8' }}
            >
              Subscribe for ₹499/month
            </Button>
            <Button
              onClick={() => setShowPaywall(false)}
              variant="outline"
              size="lg"
              className="w-full h-12 text-base font-medium rounded-xl"
            >
              Maybe later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="w-full max-w-[430px] flex flex-col pb-32">
        <canvas ref={canvasRef} className="hidden" />
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-xl font-bold tracking-tight text-primary">
              Navo
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPaywall(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                style={{ borderColor: '#0073F8', color: '#0073F8', backgroundColor: 'transparent' }}
              >
                Upgrade to Pro ✦
              </button>
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </div>
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
                onClick={handleDownload}
                size="lg"
                className="w-full h-12 text-base font-medium rounded-xl text-white"
                style={{ backgroundColor: '#0073F8' }}
              >
                <Download className="size-5" />
                Download Image
              </Button>
              <Button
                onClick={handleWhatsAppShare}
                size="lg"
                className="w-full h-12 text-base font-medium rounded-xl text-white"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle className="size-5" />
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
