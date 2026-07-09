import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BrandSetupScreen, type MockProfile } from "./brand-setup";

export const Route = createFileRoute("/dev-preview/brand-setup")({
  head: () => ({
    meta: [
      { title: "DEV PREVIEW — Brand Setup" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DevPreviewBrandSetup,
});

function DevPreviewBrandSetup() {
  // Local-only mock profile. Any interaction stays in this state; nothing
  // is written to Supabase because BrandSetupScreen skips its network paths
  // when mockProfile is provided.
  const [mockProfile] = useState<MockProfile>({
    business_name: "Test Business",
    business_type: null,
    logo_url: null,
    brand_colour: "#0073F8",
  });

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="sticky top-0 z-50 w-full bg-amber-400 text-black text-center text-xs font-semibold py-2 px-3 shadow">
        DEV PREVIEW — changes here are not saved
      </div>
      <BrandSetupScreen mockProfile={mockProfile} />
    </div>
  );
}
