import { Breadcrumb } from "@/components/layout/breadcrumb"
import type { Locale } from "@/i18n/config"

interface PrivacyPageProps {
  locale: Locale
}

export function PrivacyPage({ locale }: PrivacyPageProps) {
  return (
    <div className="relative mx-auto max-w-4xl px-4 py-8">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-full -translate-x-1/2 bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />

      <Breadcrumb items={[{ label: "Privacy Policy" }]} locale={locale} />

      <div className="mb-12 mt-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: March 14, 2026
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold">Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Pokopia Guide (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
            operates the website{" "}
            <a
              href="https://pokopiaguide.com"
              className="text-primary hover:underline"
            >
              pokopiaguide.com
            </a>
            . This Privacy Policy explains how we collect, use, and protect your
            information when you visit our website.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            We do not require you to create an account or provide personal
            information to use our website. However, we may collect the following
            types of information automatically:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>
              <strong>Usage Data:</strong> Pages visited, time spent on pages,
              referring URLs, and other standard web analytics data collected via
              Google Analytics.
            </li>
            <li>
              <strong>Device Information:</strong> Browser type, operating
              system, screen resolution, and language preferences.
            </li>
            <li>
              <strong>Cookies:</strong> Small data files stored on your device to
              remember your preferences (such as theme settings and wishlist
              data).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Local Storage</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our website uses your browser&apos;s local storage to save your
            preferences and data locally on your device, including:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Wishlist selections</li>
            <li>Collection progress</li>
            <li>Theme preferences (light/dark mode)</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            This data is stored only on your device and is not transmitted to our
            servers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Third-Party Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use the following third-party services:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>
              <strong>Google Analytics:</strong> To understand how visitors use
              our website. Google Analytics collects anonymous usage data. See{" "}
              <a
                href="https://policies.google.com/privacy"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google&apos;s Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong>Google AdSense:</strong> To display advertisements. Google
              may use cookies to serve ads based on your prior visits. See{" "}
              <a
                href="https://policies.google.com/technologies/ads"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Advertising Policies
              </a>
              .
            </li>
            <li>
              <strong>Cloudflare:</strong> For website hosting and content
              delivery. See{" "}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Cloudflare&apos;s Privacy Policy
              </a>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Children&apos;s Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our website does not knowingly collect personal information from
            children under the age of 13. If you believe we have collected such
            information, please contact us so we can promptly remove it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. Any changes
            will be posted on this page with an updated revision date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about this Privacy Policy, please contact
            us at{" "}
            <a
              href="mailto:feedback@pokopiaguide.com"
              className="text-primary hover:underline"
            >
              feedback@pokopiaguide.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
