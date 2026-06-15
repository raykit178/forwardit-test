import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, AlertTriangle, Download, MessageCircle, Pencil, LogOut, CreditCard } from "lucide-react";
import { supabase, SUPABASE_FUNCTIONS_URL } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { GenerateLoadingVisual, GenerateLoadingMicroCopy } from "@/components/generate-loading-visual";


export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [{ title: "Generate — Navo" }],
  }),
  component: GenerateScreen,
});

const STYLES = [
  { name: "Vibrant", desc: "Bold colours, festive energy" },
  { name: "Minimal", desc: "Clean, modern, lots of space" },
  { name: "Elegant", desc: "Refined, premium feel" },
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
  const [subscriptionStatus, setSubscriptionStatus] = useState<"free" | "active">("free");
  const [subscriptionPlan, setSubscriptionPlan] = useState<"monthly" | "annual" | null>(null);
  const isSubscribed = subscriptionStatus === "active";

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
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");
  const [subscribing, setSubscribing] = useState(false);
  const [paywallContext, setPaywallContext] = useState<"limit" | "upgrade">("limit");

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(
        'https://xmjqfzwgontqjtylcmnd.supabase.co/functions/v1/dynamic-handler',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ plan: selectedPlan }),
        }
      );
      const { subscriptionId, error } = await res.json();
      if (error) throw new Error(error);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
      script.onload = () => {
        const options = {
          key: 'rzp_live_SxPmJquc2kDBSB',
          subscription_id: subscriptionId,
          name: 'Navo',
          description: selectedPlan === 'monthly' ? 'Monthly Plan — ₹499/month' : 'Annual Plan — ₹3,999/year',
          handler: async function (response: any) {
            const { data: { session: s2 } } = await supabase.auth.getSession();
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'active',
                subscription_id: response.razorpay_subscription_id,
                subscription_plan: selectedPlan,
              })
              .eq('user_id', s2?.user?.id);
            setSubscriptionStatus('active');
            setSubscriptionPlan(selectedPlan);
            setShowPaywall(false);
            alert('Subscription activated! You can now generate up to 10 images per month.');
          },
          "modal": {
            ondismiss: async function () {
              const { data: { session: s3 } } = await supabase.auth.getSession();
              const { data: profile } = await supabase
                .from('profiles')
                .select('subscription_status, subscription_plan')
                .eq('user_id', s3?.user?.id)
                .single();

              if (profile?.subscription_status === 'active') {
                setShowPaywall(false);
                setSubscriptionStatus('active');
                setSubscriptionPlan(profile.subscription_plan);
              }
            },
          },
          prefill: {
            email: session?.user?.email,
          },
          theme: {
            color: '#0073F8',
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setSubscribing(false);
      };
      script.onerror = () => {
        setSubscribing(false);
        alert('Failed to load payment gateway. Please try again.');
      };
    } catch (err) {
      console.error('Subscription error:', err);
      alert('Something went wrong. Please try again.');
      setSubscribing(false);
    }
  };

  const loadUsage = async (uid: string, activeOverride?: boolean) => {
    const active = activeOverride ?? isSubscribed;
    let query = supabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid);
    if (active) {
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
        .select("business_name, logo_url, brand_colour, contact_number, extra_info, subscription_status, subscription_plan")
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
      const isActive = profile.subscription_status === "active";
      setSubscriptionStatus(isActive ? "active" : "free");
      setSubscriptionPlan(profile.subscription_plan ?? null);
      await loadUsage(user.id, isActive);
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
            ctx.font = `400 26px 'Noto Sans', 'Noto Sans Devanagari', sans-serif`;
            ctx.fillStyle = "#333333";
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

            const dividerY = brandBarTop + 128;
            const lineHeight = 34;
            const prevBaseline = ctx.textBaseline;
            ctx.textBaseline = "top";
            const firstY = brandBarTop + 40;
            lines.forEach((ln, i) => {
              ctx.fillText(ln, rightColInnerLeft, firstY + i * lineHeight);
            });

            // --- Divider ---
            ctx.fillStyle = "#BBBBBB";
            ctx.fillRect(rightColInnerLeft, dividerY - 0.75, rightColInnerWidth, 1.5);

            // --- Phone number, lower half ---
            ctx.font = `600 36px DM Sans, sans-serif`;
            ctx.fillStyle = "#222222";
            ctx.textAlign = "left";
            const phoneText = "✆  " + brand.contactNumber;
            const phoneY = brandBarTop + 160;
            ctx.fillText(phoneText, rightColInnerLeft, phoneY);
            ctx.textBaseline = prevBaseline;
          } else {
            // Original: phone number right-aligned, vertically centred
            ctx.font = `600 36px DM Sans, sans-serif`;
            ctx.fillStyle = "#222222";
            const phoneText = "✆  " + brand.contactNumber;
            const rightMargin = 40;
            const textX = 1024 - rightMargin;
            const textY = brandBarTop + 4 + (brandBarHeight - 4) / 2;
            ctx.textAlign = "right";
            ctx.fillText(phoneText, textX, textY);
          }
          ctx.textAlign = "left"; // reset

          // getnavo.in vertical stamp on left edge of image area
          try {
            const sample = ctx.getImageData(10, 650, 14, 80).data;
            let total = 0;
            const pixels = sample.length / 4;
            for (let i = 0; i < sample.length; i += 4) {
              total += 0.299 * sample[i] + 0.587 * sample[i + 1] + 0.114 * sample[i + 2];
            }
            const avgLum = total / pixels;
            const textColor = avgLum > 128 ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.85)";
            const pillColor = avgLum > 128 ? "rgba(0, 0, 0, 0.30)" : "rgba(255, 255, 255, 0.20)";

            ctx.save();
            ctx.translate(20, 720);
            ctx.rotate(-Math.PI / 2);

            // Semi-transparent background pill
            ctx.fillStyle = pillColor;
            ctx.beginPath();
            ctx.roundRect(-90, -10, 90, 14, 4);
            ctx.fill();

            ctx.font = `500 16px 'DM Sans'`;
            ctx.fillStyle = textColor;
            ctx.textAlign = "left";
            ctx.fillText("getnavo.in", 0, 0);

            ctx.restore();
          } catch (e) {
            // ignore sampling errors (e.g. tainted canvas)
          }

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
        setPaywallContext("limit");
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const showSelectors = phase === "idle";

  return (
    <main className="min-h-[100dvh] bg-background flex justify-center">
      <Toaster />
      <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
        <DialogContent className="max-w-[360px] rounded-2xl bg-white sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {paywallContext === "limit"
                ? `You've used your ${FREE_LIMIT} free images`
                : "Unlock Navo Pro"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {paywallContext === "limit"
                ? "Subscribe to generate 10 branded images every month — at a fraction of what a designer would charge."
                : "Generate up to 10 branded festival images every month. Always ready, always on-brand."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedPlan("monthly")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                selectedPlan === "monthly" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Monthly — ₹499/mo
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlan("annual")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                selectedPlan === "annual" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <span>Annual — ₹3,999/yr</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#0073F8] text-white">Save 2 months</span>
            </button>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button
              onClick={handleSubscribe}
              disabled={subscribing}
              size="lg"
              className="w-full h-12 text-base font-medium rounded-xl text-white"
              style={{ backgroundColor: '#0073F8' }}
            >
              {subscribing ? "Please wait..." : "Subscribe Now"}
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

      <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
        <DialogContent className="max-w-[360px] rounded-2xl bg-white sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              Your Navo Pro subscription
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {subscriptionPlan === "annual"
                ? "Annual ₹3,999/year"
                : "Monthly ₹499/month"}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            To cancel your subscription, contact us at hello.getnavo@outlook.com
          </p>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button
              onClick={() => setShowManageModal(false)}
              variant="outline"
              size="lg"
              className="w-full h-12 text-base font-medium rounded-xl"
            >
              Close
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
              {isSubscribed ? (
                <span
                  className="px-3 py-1.5 text-xs font-medium"
                  style={{ color: '#0073F8' }}
                >
                  Pro ✦
                </span>
              ) : (
                <button
                  onClick={() => { setPaywallContext("upgrade"); setShowPaywall(true); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                  style={{ borderColor: '#0073F8', color: '#0073F8', backgroundColor: 'transparent' }}
                >
                  Upgrade to Pro ✦
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Account menu"
                    className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {initials}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-52 rounded-xl bg-white shadow-lg border border-border p-1"
                >
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/brand-setup" })}
                    className="gap-2 px-3 py-2 text-sm text-foreground rounded-lg cursor-pointer"
                  >
                    <Pencil className="size-4" />
                    Edit brand details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (isSubscribed) {
                        setShowManageModal(true);
                      } else {
                        setShowPaywall(true);
                      }
                    }}
                    className="gap-2 px-3 py-2 text-sm text-foreground rounded-lg cursor-pointer"
                  >
                    <CreditCard className="size-4" />
                    Manage subscription
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="gap-2 px-3 py-2 text-sm text-foreground rounded-lg cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

        {showSelectors && (() => {
          const step1Done = Boolean(occasion && occasion.trim());
          const step2Done = Boolean(style);
          const step3Done = Boolean(language);
          const doneCount = [step1Done, step2Done, step3Done].filter(Boolean).length;
          const progressPct = doneCount === 0 ? 0 : doneCount === 1 ? 50 : 100;

          const StepCircle = ({ n, done, active }: { n: number; done: boolean; active: boolean }) => (
            <div
              className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                done
                  ? "border-primary bg-primary text-primary-foreground"
                  : active
                  ? "border-primary bg-background text-primary"
                  : "border-input bg-background text-muted-foreground"
              }`}
            >
              {n}
            </div>
          );

          return (
            <div className="animate-fade-in relative px-5 pt-6">
              {/* Connecting progress line */}
              <div className="pointer-events-none absolute left-[33px] top-[42px] bottom-[42px] w-0.5 bg-border" aria-hidden />
              <div
                className="pointer-events-none absolute left-[33px] top-[42px] w-0.5 bg-primary transition-all duration-500"
                style={{ height: `calc((100% - 84px) * ${progressPct / 100})` }}
                aria-hidden
              />

              <section className="flex gap-3">
                <StepCircle n={1} done={step1Done} active={!step1Done} />
                <div className="flex-1">
                  <h2 className="pt-1 text-sm font-semibold text-foreground">
                    Enter an occasion
                  </h2>
                  <Input
                    value={occasion ?? ""}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="e.g. Diwali, Holi, Store Anniversary..."
                    className="mt-3 h-11 rounded-xl text-base"
                  />
                </div>
              </section>

              <section className="mt-8 flex gap-3">
                <StepCircle n={2} done={step2Done} active={step1Done && !step2Done} />
                <div className="flex-1">
                  <h2 className="pt-1 text-sm font-semibold text-foreground">Choose a style</h2>
                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    {STYLES.map((s) => {
                      const selected = style === s.name;
                      return (
                        <button
                          key={s.name}
                          onClick={() => setStyle(s.name)}
                          className={`flex flex-col items-start rounded-xl border-2 bg-background p-2.5 text-left transition-colors ${
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
                </div>
              </section>

              <section className="mt-8 flex gap-3">
                <StepCircle n={3} done={step3Done} active={step1Done && step2Done && !step3Done} />
                <div className="flex-1">
                  <h2 className="pt-1 text-sm font-semibold text-foreground">
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
                </div>
              </section>
            </div>
          );
        })()}

        {phase === "loading" && (
          <section className="px-5 pt-12 animate-fade-in">
            <div className="mb-8 flex justify-center">
              <GenerateLoadingVisual />
            </div>
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
            <GenerateLoadingMicroCopy />
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
