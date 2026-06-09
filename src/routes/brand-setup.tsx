import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, ImageIcon, Sparkles, Check } from "lucide-react";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";

const LATIN_FONTS = ["DM Sans", "Playfair Display", "Oswald"] as const;
const DEVANAGARI_FONTS = ["Tiro Devanagari Hindi", "Rozha One", "Baloo 2"] as const;
const TEXT_LOGO_COLORS = ["#013375", "#014944", "#6a004a", "#D30000", "#d7701c"] as const;
const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@700&family=Playfair+Display:wght@700&family=Oswald:wght@700&family=Tiro+Devanagari+Hindi&family=Rozha+One&family=Baloo+2:wght@700&display=swap";

function ensureGoogleFontsLoaded() {
  if (typeof document === "undefined") return;
  if (document.getElementById("text-logo-fonts")) return;
  const link = document.createElement("link");
  link.id = "text-logo-fonts";
  link.rel = "stylesheet";
  link.href = GOOGLE_FONTS_HREF;
  document.head.appendChild(link);
}

function isDevanagari(s: string) {
  return /[\u0900-\u097F]/.test(s);
}

// Compute a font size + line layout that fits text within container at 90% width.
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  startSize: number,
  minSize: number,
  maxWidth: number,
): { size: number; lines: string[] } {
  const upper = text.toUpperCase();
  const words = upper.split(/\s+/).filter(Boolean);

  // 1. Try to fit on a single line from startSize down to minSize.
  for (let size = startSize; size >= minSize; size -= 2) {
    ctx.font = `700 ${size}px "${font}", system-ui, sans-serif`;
    if (ctx.measureText(upper).width <= maxWidth) {
      return { size, lines: [upper] };
    }
  }

  // 2. Multi-word: wrap to 2 lines at minSize on a word boundary.
  if (words.length > 1) {
    ctx.font = `700 ${minSize}px "${font}", system-ui, sans-serif`;
    let best: { a: string; b: string; worst: number } | null = null;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(" ");
      const b = words.slice(i).join(" ");
      const worst = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
      if (!best || worst < best.worst) best = { a, b, worst };
    }
    if (best && best.worst <= maxWidth) {
      return { size: minSize, lines: [best.a, best.b] };
    }
  }

  // 3. Single word (or 2-line wrap still overflows): shrink further on one line — never break a word.
  for (let size = minSize - 1; size >= 6; size -= 1) {
    ctx.font = `700 ${size}px "${font}", system-ui, sans-serif`;
    if (ctx.measureText(upper).width <= maxWidth) {
      return { size, lines: [upper] };
    }
  }
  return { size: 6, lines: [upper] };
}

function drawTextLogo(
  canvas: HTMLCanvasElement,
  opts: { text: string; font: string; color: string; scale: number },
) {
  const { text, font, color, scale } = opts;
  const W = 256 * scale;
  const H = 102 * scale;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);

  const outerStroke = 3 * scale;
  const innerStroke = 2 * scale;
  const innerGap = 6 * scale;
  const radius = 16 * scale;

  // Fill container
  const x = outerStroke / 2;
  const y = outerStroke / 2;
  const w = W - outerStroke;
  const h = H - outerStroke;

  // Rounded rect path
  const rr = (cx: number, cy: number, cw: number, ch: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(cx + r, cy);
    ctx.arcTo(cx + cw, cy, cx + cw, cy + ch, r);
    ctx.arcTo(cx + cw, cy + ch, cx, cy + ch, r);
    ctx.arcTo(cx, cy + ch, cx, cy, r);
    ctx.arcTo(cx, cy, cx + cw, cy, r);
    ctx.closePath();
  };

  // Fill
  ctx.fillStyle = color;
  rr(x, y, w, h, radius);
  ctx.fill();

  // Outer stroke (same colour)
  ctx.strokeStyle = color;
  ctx.lineWidth = outerStroke;
  rr(x, y, w, h, radius);
  ctx.stroke();

  // Inner white border, inset by innerGap from inside edge
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = innerStroke;
  rr(
    x + innerGap,
    y + innerGap,
    w - innerGap * 2,
    h - innerGap * 2,
    Math.max(2, radius - innerGap),
  );
  ctx.stroke();

  // Text
  const startSize = 48 * scale;
  const minSize = (scale >= 2 ? 44 : 22);
  const maxWidth = w * 0.9;
  const { size, lines } = fitText(ctx, text, font, startSize, minSize, maxWidth);

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${size}px "${font}", system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lineHeight = size * 1.1;
  const totalH = lineHeight * lines.length;
  const startY = H / 2 - totalH / 2 + lineHeight / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], W / 2, startY + i * lineHeight);
  }
}

const EXTRA_INFO_MAX = 56;

export const Route = createFileRoute("/brand-setup")({
  head: () => ({
    meta: [{ title: "Set up your brand — Navo" }],
  }),
  component: BrandSetupScreen,
});

// Crude average-color extraction for a quick brand-color guess from the logo.
function extractDominantColor(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  const size = 32;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "#006AFF";
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  let r = 0,
    g = 0,
    b = 0,
    count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 128) continue;
    const cr = data[i],
      cg = data[i + 1],
      cb = data[i + 2];
    // skip near-white and near-black pixels
    const max = Math.max(cr, cg, cb);
    const min = Math.min(cr, cg, cb);
    if (max > 240 && min > 240) continue;
    if (max < 20) continue;
    r += cr;
    g += cg;
    b += cb;
    count++;
  }
  if (!count) return "#006AFF";
  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function BrandSetupScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [businessName, setBusinessName] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [brandColor, setBrandColor] = useState<string>("");
  const [contactNumber, setContactNumber] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savedLogoUrl, setSavedLogoUrl] = useState<string | null>(null);
  const [showTextGen, setShowTextGen] = useState(false);
  const [selectedFont, setSelectedFont] = useState<string>("DM Sans");
  const [selectedTextColor, setSelectedTextColor] = useState<string>("#013375");
  const [generatingLogo, setGeneratingLogo] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const fontOptions = useMemo(
    () => (isDevanagari(businessName) ? DEVANAGARI_FONTS : LATIN_FONTS),
    [businessName],
  );

  // Keep selectedFont valid for the current script
  useEffect(() => {
    if (!fontOptions.includes(selectedFont as never)) {
      setSelectedFont(fontOptions[0]);
    }
  }, [fontOptions, selectedFont]);

  useEffect(() => {
    if (showTextGen) ensureGoogleFontsLoaded();
  }, [showTextGen]);

  // Live preview redraw
  useEffect(() => {
    if (!showTextGen || !previewCanvasRef.current || !businessName.trim()) return;
    const canvas = previewCanvasRef.current;
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      drawTextLogo(canvas, {
        text: businessName.trim(),
        font: selectedFont,
        color: selectedTextColor,
        scale: 1,
      });
    };
    draw();
    // Redraw once the chosen font is ready
    if (typeof document !== "undefined" && (document as any).fonts?.load) {
      (document as any).fonts
        .load(`700 48px "${selectedFont}"`)
        .then(() => draw())
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [showTextGen, businessName, selectedFont, selectedTextColor]);

  const handleUseTextLogo = async () => {
    if (!businessName.trim()) return;
    setGeneratingLogo(true);
    try {
      // Ensure chosen font is loaded before rendering export canvas
      if (typeof document !== "undefined" && (document as any).fonts?.load) {
        try {
          await (document as any).fonts.load(`700 96px "${selectedFont}"`);
        } catch {}
      }
      const exportCanvas = document.createElement("canvas");
      drawTextLogo(exportCanvas, {
        text: businessName.trim(),
        font: selectedFont,
        color: selectedTextColor,
        scale: 2,
      });
      const blob: Blob = await new Promise((resolve, reject) =>
        exportCanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))),
          "image/png",
        ),
      );
      const file = new File([blob], "text-logo.png", { type: "image/png" });
      setLogoFile(file);
      const dataUrl = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(blob);
      });
      setLogoDataUrl(dataUrl);
      setBrandColor(selectedTextColor);
      setShowTextGen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingLogo(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate({ to: "/" });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("business_name, logo_url, brand_colour, contact_number, extra_info")
        .eq("user_id", data.session.user.id)
        .maybeSingle();
      if (profile) {
        setIsEditing(true);
        if (profile.business_name) setBusinessName(profile.business_name);
        if (profile.brand_colour) setBrandColor(profile.brand_colour);
        if (profile.contact_number) setContactNumber(profile.contact_number);
        if (profile.extra_info) setExtraInfo(profile.extra_info);
        if (profile.logo_url) {
          setLogoDataUrl(profile.logo_url);
          setSavedLogoUrl(profile.logo_url);
        }
      }
    });
  }, [navigate]);

  const hasLogo = logoFile !== null || (isEditing && savedLogoUrl !== null);
  const canSubmit =
    businessName.trim().length > 0 &&
    hasLogo &&
    brandColor !== "" &&
    contactNumber.trim().length > 0 &&
    !saving;

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLogoDataUrl(dataUrl);
      const img = new Image();
      img.onload = () => setBrandColor(extractDominantColor(img));
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session?.user) {
        navigate({ to: "/" });
        return;
      }
      const user = session.user;

      let logo_url: string | null = null;

      if (logoFile) {
        // Force the supabase client to refresh its internal auth headers
        // (storage client occasionally misses the freshly-hydrated token).
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        const path = `${user.id}/logo.png`;

        // Upload via raw fetch so we can explicitly attach the bearer token
        // and rule out any client-side header propagation issue.
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/logos/${path}`;
        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: SUPABASE_ANON_KEY,
            "Content-Type": logoFile.type,
            "x-upsert": "true",
            "cache-control": "3600",
          },
          body: logoFile,
        });
        if (!uploadRes.ok) {
          const txt = await uploadRes.text();
          throw new Error(`Storage upload failed (${uploadRes.status}): ${txt}`);
        }

        const { data: pub } = supabase.storage.from("logos").getPublicUrl(path);
        logo_url = pub.publicUrl;
      } else if (isEditing && savedLogoUrl) {
        logo_url = savedLogoUrl;
      }

      if (!logo_url) {
        throw new Error("No logo available");
      }

      const { error: insErr } = await supabase.from("profiles").upsert({
        user_id: user.id,
        business_name: businessName,
        logo_url,
        brand_colour: brandColor,
        contact_number: contactNumber,
        extra_info: extraInfo.trim() ? extraInfo.trim() : null,
      });
      if (insErr) throw insErr;

      localStorage.setItem(
        "forwardit.brand",
        JSON.stringify({ businessName, logoDataUrl: logo_url, brandColor, contactNumber }),
      );
      navigate({ to: "/generate" });
    } catch (e) {
      console.error("Error at step X:", e);
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-background flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col px-6 pt-12 pb-10">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Set up your brand
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Done once. Used on every image.
          </p>
        </header>

        <div className="mt-8 flex flex-col gap-6">
          {/* Business name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="business-name" className="text-sm font-medium">
              Business name
            </Label>
            <Input
              id="business-name"
              placeholder="e.g. Sharma Electronics"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="h-12 rounded-xl text-base"
            />
          </div>

          {/* Logo upload */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Your Logo (PNG preferred)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group flex items-center gap-3 rounded-xl border border-dashed border-input bg-muted/30 px-4 py-4 text-left transition-colors hover:bg-muted/60"
            >
              <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-background border border-input overflow-hidden">
                {logoDataUrl ? (
                  <img
                    src={logoDataUrl}
                    alt="Logo preview"
                    className="size-full object-contain"
                  />
                ) : (
                  <ImageIcon className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {logoDataUrl ? "Replace logo" : "Tap to upload"}
                </span>
                <span className="text-xs text-muted-foreground">
                  PNG with transparent background works best
                </span>
              </div>
              <Upload className="ml-auto size-4 text-muted-foreground" />
            </button>

            {/* Text logo generator trigger */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTextGen((v) => !v)}
              className="mt-1 h-11 rounded-xl bg-transparent hover:bg-transparent"
            >
              <Sparkles className="size-4" />
              Don't have a logo? Generate one
            </Button>

            {showTextGen && (
              <div className="mt-3 flex flex-col gap-4 rounded-xl border border-input bg-muted/20 p-4">
                {!businessName.trim() && (
                  <p className="text-xs text-muted-foreground">
                    Enter your business name above to preview the text logo.
                  </p>
                )}

                {/* Font options */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Choose a font
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {fontOptions.map((font) => {
                      const active = selectedFont === font;
                      return (
                        <button
                          key={font}
                          type="button"
                          onClick={() => setSelectedFont(font)}
                          style={{ fontFamily: `"${font}", system-ui, sans-serif` }}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            active
                              ? "bg-foreground text-background"
                              : "bg-background text-foreground border border-input"
                          }`}
                        >
                          {businessName.trim() || "Your Brand"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Colour swatches */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Choose a colour
                  </Label>
                  <div className="flex gap-3">
                    {TEXT_LOGO_COLORS.map((c) => {
                      const active = selectedTextColor === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          aria-label={c}
                          onClick={() => setSelectedTextColor(c)}
                          className={`size-9 rounded-full flex items-center justify-center transition-transform ${
                            active ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""
                          }`}
                          style={{ backgroundColor: c }}
                        >
                          {active && <Check className="size-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live preview */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Preview
                  </Label>
                  <div className="flex justify-center">
                    <canvas
                      ref={previewCanvasRef}
                      width={320}
                      height={128}
                      style={{ width: 320, height: 128 }}
                      className="rounded-lg"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={!businessName.trim() || generatingLogo}
                  onClick={handleUseTextLogo}
                  className="h-11 rounded-xl bg-transparent hover:bg-transparent"
                >
                  {generatingLogo ? "Generating..." : "Use this as my logo"}
                </Button>
              </div>
            )}
          </div>


          {/* Brand color */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Brand Colour</Label>
            <div className="flex items-center gap-3 rounded-xl border border-input bg-background px-3 py-2.5">
              <label
                className="relative size-10 shrink-0 rounded-lg border border-input overflow-hidden cursor-pointer"
                style={{ backgroundColor: brandColor || "#f1f1f1" }}
              >
                <input
                  type="color"
                  value={brandColor || "#006AFF"}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="absolute inset-0 size-full opacity-0 cursor-pointer"
                  aria-label="Pick brand colour"
                />
              </label>
              <div className="flex flex-col">
                <span className="text-sm font-medium uppercase tracking-wide">
                  {brandColor || "Auto-extracted from logo"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Tap the swatch to change
                </span>
              </div>
            </div>
          </div>

          {/* Contact number */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-number" className="text-sm font-medium">
              Contact Number
            </Label>
            <Input
              id="contact-number"
              placeholder="e.g. 98765 43210"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="h-12 rounded-xl text-base"
            />
          </div>

          {/* Extra info */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="extra-info" className="text-sm font-medium">
              Extra info (optional)
            </Label>
            <Textarea
              id="extra-info"
              placeholder="e.g. Address, Instagram handle, Tagline, etc."
              value={extraInfo}
              maxLength={EXTRA_INFO_MAX}
              rows={1}
              onChange={(e) => {
                setExtraInfo(e.target.value);
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
              className="min-h-12 rounded-xl text-base resize-none overflow-hidden whitespace-pre-wrap break-words py-3"
            />
            <p
              className="text-xs"
              style={{
                color:
                  extraInfo.length <= 40
                    ? "#888888"
                    : extraInfo.length <= 50
                      ? "#F59E0B"
                      : "#EF4444",
              }}
            >
              {extraInfo.length === EXTRA_INFO_MAX
                ? `${extraInfo.length}/${EXTRA_INFO_MAX} characters — limit reached`
                : `${extraInfo.length}/${EXTRA_INFO_MAX} characters`}
            </p>
          </div>
        </div>


        <div className="mt-auto pt-10">
          {error && (
            <p className="mb-3 text-xs text-destructive text-center">{error}</p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="lg"
            className="w-full h-12 text-base font-medium rounded-xl"
          >
            {saving ? "Saving..." : isEditing ? "Save changes" : "Get started"}
          </Button>
        </div>
      </div>
    </main>
  );
}
