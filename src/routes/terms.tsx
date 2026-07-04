import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — InstaBrand" },
      {
        name: "description",
        content: "InstaBrand Terms of Service",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
            InstaBrand
          </h1>
        </header>

        <div className="mt-10 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Terms of Service
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Last updated: June 2026
            </p>
          </div>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              1. Acceptance of terms
            </h3>
            <p className="text-base text-foreground leading-relaxed">
              By signing up and using InstaBrand, you agree to these Terms of Service.
              If you do not agree, please do not use the service.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              2. What InstaBrand provides
            </h3>
            <p className="text-base text-foreground leading-relaxed">
              InstaBrand is a web application that allows small business owners to
              generate AI-powered branded festival greeting images. You provide
              your brand assets; we generate images using those assets and AI
              services.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              3. Your account
            </h3>
            <p className="text-base text-foreground leading-relaxed">
              You are responsible for maintaining the security of your account.
              You must provide accurate information during sign-up and brand
              setup. You must be at least 18 years old to use InstaBrand.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              4. Acceptable use
            </h3>
            <p className="text-base text-foreground leading-relaxed">
              You agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-base text-foreground leading-relaxed">
              <li>
                Upload logos or content that you do not have the right to use
              </li>
              <li>
                Use InstaBrand to generate images that are offensive, misleading, or
                illegal
              </li>
              <li>
                Attempt to circumvent the generation limits or payment system
              </li>
              <li>Reverse engineer or misuse the service</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              5. Subscription and payments
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-base text-foreground leading-relaxed">
              <li>
                <span className="font-medium">Free tier:</span> 3 lifetime
                image generations at no charge
              </li>
              <li>
                <span className="font-medium">Monthly plan:</span> ₹499/month,
                10 images per month, resets on the 1st of each month
              </li>
              <li>
                <span className="font-medium">Annual plan:</span> ₹3,999/year,
                10 images per month
              </li>
              <li>
                All payments are processed by Razorpay and are subject to their
                terms
              </li>
              <li>Subscriptions renew automatically unless cancelled</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              6. Cancellation and refunds
            </h3>
            <p className="text-base text-foreground leading-relaxed">
              You may cancel your subscription at any time from your account. We
              do not offer refunds for partial billing periods. If you believe
              you have been charged in error, contact us at{" "}
              <span className="font-medium">hello.instabrand@gmail.com</span>.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              7. Intellectual property
            </h3>
            <p className="text-base text-foreground leading-relaxed">
              You retain ownership of your logo and brand assets. You own the
              images generated using your brand assets. We retain no rights to
              your generated images.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              8. Disclaimers
            </h3>
            <p className="text-base text-foreground leading-relaxed">
              InstaBrand is provided "as is." AI-generated images may occasionally be
              imperfect. We do not guarantee that every generated image will meet
              your expectations. We are not liable for any indirect or
              consequential damages arising from use of the service.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">
              9. Changes to the service
            </h3>
            <p className="text-base text-foreground leading-relaxed">
              We may update features, pricing, or these terms as the product
              evolves. We will notify you of significant changes via email.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">10. Contact</h3>
            <p className="text-base text-foreground leading-relaxed">
              <span className="font-medium">hello.instabrand@gmail.com</span>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
