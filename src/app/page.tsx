import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SplitHero } from '@/components/site/SplitHero';
import { HowItWorks } from '@/components/site/HowItWorks';
import { ClosingSection } from '@/components/site/ClosingSection';
import { Reveal } from '@/components/site/Reveal';

/**
 * Section rhythm is deliberate: white hero → white steps → dark close. The original version was six full-height cream blocks in a
 * row, which is why nothing stood out.
 *
 * Donating lives at /portal/donate rather than on this page; the hero,
 * the homes section and the footer all point there.
 */
export default function LandingPage() {
  return (
    <>
      <Reveal />
      <SiteHeader />

      <main id="main">
        <SplitHero />
        <HowItWorks />
        <ClosingSection />
      </main>

      <SiteFooter />
    </>
  );
}
