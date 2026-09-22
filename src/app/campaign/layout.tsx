import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';

/**
 * Appeals get a full-bleed canvas: no horizontal padding here at all —
 * the hero runs edge to edge and each section brings its own gutters.
 */
export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="overflow-x-clip pb-16 pt-20 sm:pt-24">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
