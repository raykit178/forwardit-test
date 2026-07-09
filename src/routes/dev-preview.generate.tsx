import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { compositeBrandBar, type CompositeBrand } from "@/lib/composite-brand-bar";
import { supabase, SUPABASE_FUNCTIONS_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";

export const Route = createFileRoute("/dev-preview/generate")({
  head: () => ({
    meta: [
      { title: "Dev Preview — Generate" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DevPreviewGenerate,
});

// 1x1 blue PNG placeholder (base64) — swap freely for a real logo URL
const PLACEHOLDER_LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'>
       <rect width='400' height='400' fill='#0073F8'/>
       <text x='50%' y='50%' font-family='DM Sans, sans-serif' font-size='120' font-weight='700'
             fill='white' text-anchor='middle' dominant-baseline='central'>TB</text>
     </svg>`,
  );

const OCCASIONS = ["Diwali", "Holi", "Eid", "Christmas", "New Year", "Independence Day"];
const STYLES = ["Vibrant", "Minimal", "Elegant", "Word Art"];
const LANGUAGES = ["English", "Hindi", "Marathi"];

function DevPreviewGenerate() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [brandBarStyle, setBrandBarStyle] = useState<"style_1" | "style_2">("style_1");
  const [occasion, setOccasion] = useState<string>("Diwali");
  const [style, setStyle] = useState<string>("Vibrant");
  const [language, setLanguage] = useState<string>("English");

  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mockBrand: CompositeBrand = {
    businessName: "Test Business",
    logoDataUrl: PLACEHOLDER_LOGO,
    brandColor: "#0073F8",
    contactNumber: "9876543211",
    extraInfo: "Ward No. 45, Gandhi Chowk, Mangalwar Peth, Pune",
    brandBarStyle,
  };

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg(null);
    setImageUrl(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? SUPABASE_ANON_KEY;
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ occasion, style, language }),
      });
      if (!res.ok) throw new Error(`Generation failed (${res.status})`);
      const json = (await res.json()) as { imageUrl: string };
      if (!json.imageUrl) throw new Error("No image returned");
      const composited = await compositeBrandBar(json.imageUrl, mockBrand, canvasRef.current);
      setImageUrl(composited);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const recompositeOnly = async () => {
    if (!imageUrl) return;
    // Re-run compositor on the already-generated AI image is not possible after
    // brand bar is baked in; user should regenerate to see the alternate style.
  };

  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="sticky top-0 z-20 bg-yellow-300 text-black text-center text-xs font-semibold py-2 px-3 border-b border-yellow-500">
        DEV PREVIEW — for testing brand bar styles only, nothing is saved
      </div>

      <div className="mx-auto w-full max-w-[430px] p-5 flex flex-col gap-4">
        <canvas ref={canvasRef} className="hidden" />

        <h1 className="text-xl font-bold">Generate (Dev Preview)</h1>

        <div className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <div className="text-sm font-medium">Brand bar style</div>
            <div className="text-xs text-muted-foreground">Toggle between Style 1 and Style 2</div>
          </div>
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setBrandBarStyle("style_1")}
              className={`px-3 py-1.5 text-xs rounded-md font-medium ${
                brandBarStyle === "style_1" ? "bg-white shadow-sm" : "text-muted-foreground"
              }`}
            >
              Style 1
            </button>
            <button
              type="button"
              onClick={() => setBrandBarStyle("style_2")}
              className={`px-3 py-1.5 text-xs rounded-md font-medium ${
                brandBarStyle === "style_2" ? "bg-white shadow-sm" : "text-muted-foreground"
              }`}
            >
              Style 2
            </button>
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium">Occasion</span>
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-white"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
          >
            {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium">Style</span>
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-white"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium">Language</span>
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-white"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>

        <Button onClick={handleGenerate} disabled={loading} className="h-12 rounded-xl text-white" style={{ backgroundColor: "#0073F8" }}>
          {loading ? "Generating…" : "Generate"}
        </Button>

        {errorMsg && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {errorMsg}
          </div>
        )}

        {imageUrl && (
          <div className="flex flex-col gap-2">
            <img src={imageUrl} alt="Generated preview" className="w-full rounded-xl border" />
            <p className="text-xs text-muted-foreground">
              Toggle style above and click Generate again to compare.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
