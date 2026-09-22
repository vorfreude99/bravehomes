import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';

/**
 * Appeals get their own full-width canvas — the (pages) layout's narrow
 * article column is right for terms and about, wrong for a page whose
 * job is a cinematic photograph and a give button.
 */
export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="overflow-x-clip px-5 pb-16 pt-28 sm:px-8 sm:pt-32">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
