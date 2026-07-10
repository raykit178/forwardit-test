import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { compositeBrandBar } from "@/lib/composite-brand-bar";

export const Route = createFileRoute("/test/brand-bar")({
  head: () => ({
    meta: [{ title: "Test Brand Bar" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: TestBrandBar,
});

// Simple 1x1 blue PNG as AI background
const AI_BG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

const LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'>
       <rect width='400' height='400' fill='#FF6B35'/>
       <text x='50%' y='50%' font-family='DM Sans, sans-serif' font-size='120' font-weight='700'
             fill='white' text-anchor='middle' dominant-baseline='central'>TB</text>
     </svg>`,
  );

function TestBrandBar() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const brand = {
      businessName: "Test Business",
      logoDataUrl: LOGO,
      brandColor: "#0073F8",
      contactNumber: "9876543211",
      extraInfo: "Ward No. 45, Gandhi Chowk, Mangalwar Peth, Pune",
      brandBarStyle: "style_2" as const,
    };
    compositeBrandBar(AI_BG, brand, canvasRef.current).then(setImageUrl).catch(console.error);
  }, []);

  return (
    <main className="min-h-screen p-5">
      <h1 className="text-xl font-bold mb-4">Style 2 Brand Bar Test</h1>
      <canvas ref={canvasRef} className="hidden" />
      {imageUrl && (
        <img src={imageUrl} alt="Style 2 brand bar" className="w-[400px] rounded-xl border" />
      )}
    </main>
  );
}
