import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Forwardit — Your brand. Every festival. 30 seconds." },
      {
        name: "description",
        content:
          "AI-powered WhatsApp festival greeting image generator for Indian small business owners.",
      },
    ],
  }),
  component: SignInScreen,
});

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.2 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5.1 0 9.7-1.9 13.2-5.1l-6.1-5c-2 1.4-4.5 2.2-7.1 2.2-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.6 39 16.3 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.1 5c-.4.4 6.8-4.9 6.8-14.7 0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function SignInScreen() {
  const navigate = useNavigate();

  const handleGoogle = () => {
    // TODO: wire to Supabase Auth (Google OAuth)
    navigate({ to: "/" });
  };

  const handleEmail = () => {
    // TODO: wire to Supabase Auth (email)
    navigate({ to: "/" });
  };

  return (
    <main className="min-h-[100dvh] bg-background flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col px-6 pt-20 pb-10">
        <header className="flex flex-col items-start">
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            Forwardit
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Your brand. Every festival. 30 seconds.
          </p>
        </header>

        <div className="mt-auto flex flex-col gap-3 pt-16">
          <Button
            onClick={handleGoogle}
            size="lg"
            className="w-full h-12 text-base font-medium rounded-xl"
          >
            <GoogleIcon />
            <span className="ml-1">Continue with Google</span>
          </Button>

          <Button
            onClick={handleEmail}
            variant="outline"
            size="lg"
            className="w-full h-12 text-base font-medium rounded-xl border-input"
          >
            <Mail className="size-5" />
            <span className="ml-1">Continue with email</span>
          </Button>

          <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed px-4">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </main>
  );
}
