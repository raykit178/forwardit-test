import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Navo" },
      {
        name: "description",
        content: "Navo Privacy Policy",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="mx-auto max-w-[720px] px-6 py-12">
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </Link>

        <header className="mt-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Navo
          </h1>
        </header>

        <div className="mt-10 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Privacy Policy
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Last updated: June 2026
            </p>
          </div>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              1. Who we are
            </h3>
            <p className="text-base text-foreground leading-relaxed">
              Navo ("we", "our", "us") is a web application available at{" "}
              <span className="font-medium">getnavo.in</span> that helps small
              businesses generate branded festival greeting images. For any
              privacy-related queries, contact us at{" "}
              <span className="font-medium">hello.getnavo@outlook.com</span>.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              2. What information we collect
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-base text-foreground leading-relaxed">
              <li>
                <span className="font-medium">Account information:</span> your
                email address when you sign up
              </li>
              <li>
                <span className="font-medium">Business information:</span> your
                business name, logo, brand colour, contact number, and any extra
                info you provide during brand setup
              </li>
              <li>
                <span className="font-medium">Usage data:</span> the occasions
                and styles you generate images for, and how many images you've
                generated
              </li>
              <li>
                <span className="font-medium">Payment information:</span> we do
                not store your payment details — all payments are processed
                securely by Razorpay
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              3. How we use your information
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-base text-foreground leading-relaxed">
              <li>
                To provide the Navo service — generating and compositing your
                branded images
              </li>
              <li>To manage your account and subscription</li>
              <li>
                To send you sign-in links and service-related emails
              </li>
              <li>To improve the product based on usage patterns</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              4. Who we share your information with
            </h3>
            <p className="text-base text-foreground leading-relaxed">
              We do not sell your data. We share it only with the services that
              power Navo:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-base text-foreground leading-relaxed">
              <li>
                <span className="font-medium">Supabase</span> — database and
                authentication
              </li>
              <li>
                <span className="font-medium">OpenAI</span> — image generation
                (occasion and style data only, no personal information)
              </li>
              <li>
                <span className="font-medium">Google</span> — greeting text
                generation (occasion and language only)
              </li>
              <li>
                <span className="font-medium">Razorpay</span> — payment
                processing
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              5. Data retention
            </h3>
            <p className="text-base text-foreground leading-relaxed">
              We retain your account and business data for as long as your
              account is active. Generated image records are retained for up to
              12 months. You can request deletion of your data at any time by
              emailing{" "}
              <span className="font-medium">hello.getnavo@outlook.com</span>.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              6. Your rights
            </h3>
            <p className="text-base text-foreground leading-relaxed">
              You have the right to access, correct, or delete your personal
              data. To exercise any of these rights, email us at{" "}
              <span className="font-medium">hello.getnavo@outlook.com</span> and
              we will respond within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              7. Cookies
            </h3>
            <p className="text-base text-foreground leading-relaxed">
              Navo uses only essential cookies required for authentication. We
              do not use advertising or tracking cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              8. Changes to this policy
            </h3>
            <p className="text-base text-foreground leading-relaxed">
              We may update this policy as the product evolves. We will notify
              you of significant changes via email.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">9. Contact</h3>
            <p className="text-base text-foreground leading-relaxed">
              <span className="font-medium">hello.getnavo@outlook.com</span>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
