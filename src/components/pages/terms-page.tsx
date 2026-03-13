import { Breadcrumb } from "@/components/layout/breadcrumb"
import type { Locale } from "@/i18n/config"

interface TermsPageProps {
  locale: Locale
}

export function TermsPage({ locale }: TermsPageProps) {
  return (
    <div className="relative mx-auto max-w-4xl px-4 py-8">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-full -translate-x-1/2 bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />

      <Breadcrumb items={[{ label: "Terms of Service" }]} locale={locale} />

      <div className="mb-12 mt-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: March 14, 2026
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing and using Pokopia Guide (
            <a
              href="https://pokopiaguide.com"
              className="text-primary hover:underline"
            >
              pokopiaguide.com
            </a>
            ), you agree to be bound by these Terms of Service. If you do not
            agree to these terms, please do not use our website.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">2. Description of Service</h2>
          <p className="text-muted-foreground leading-relaxed">
            Pokopia Guide is an unofficial, community-driven fan website that
            provides game guides, data, and tools for Pok&eacute;mon Pokopia.
            Our content includes Pok&eacute;dex information, crafting recipes,
            habitat data, item catalogs, and other game-related resources.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">3. Disclaimer</h2>
          <p className="text-muted-foreground leading-relaxed">
            Pokopia Guide is not affiliated with, endorsed by, or connected to
            Nintendo, The Pok&eacute;mon Company, or Game Freak. All
            Pok&eacute;mon-related content, names, and images are trademarks and
            copyrights of their respective owners.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Game data and information are provided &quot;as is&quot; without
            warranty of any kind. While we strive for accuracy, we cannot
            guarantee that all information is complete or up to date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">4. User Conduct</h2>
          <p className="text-muted-foreground leading-relaxed">
            When using our website, you agree not to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>
              Use automated tools to scrape or download content in bulk without
              permission.
            </li>
            <li>
              Attempt to disrupt or interfere with the website&apos;s operation.
            </li>
            <li>
              Use the website for any unlawful purpose or in violation of any
              applicable laws.
            </li>
            <li>
              Reproduce, distribute, or modify our original content without
              attribution.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold">5. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            The original content created for Pokopia Guide, including guides,
            translations, tools, and website design, is the property of Pokopia
            Guide. Game assets, Pok&eacute;mon names, and related imagery belong
            to their respective copyright holders.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">6. Third-Party Links</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our website may contain links to third-party websites. We are not
            responsible for the content, privacy policies, or practices of these
            external sites.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">7. Advertisements</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our website may display advertisements provided by Google AdSense
            and other advertising partners. These advertisements may use cookies
            and similar technologies. Please refer to our{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>{" "}
            for more information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">8. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            Pokopia Guide shall not be liable for any direct, indirect,
            incidental, or consequential damages arising from your use of the
            website. This includes, but is not limited to, errors in game data,
            service interruptions, or loss of locally stored data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">9. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to modify these Terms of Service at any time.
            Changes will be posted on this page with an updated revision date.
            Continued use of the website after changes constitutes acceptance of
            the new terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold">10. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about these Terms of Service, please
            contact us at{" "}
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
