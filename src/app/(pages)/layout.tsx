import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="overflow-x-clip px-5 pb-24 pt-36 sm:px-8">
        <article className="mx-auto max-w-3xl">{children}</article>
      </main>
      <SiteFooter />
    </>
  );
}
