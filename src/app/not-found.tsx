import { LinkButton } from '@/components/ui/Button';
import { BrandLock } from '@/components/ui/Brand';

export default function NotFound() {
  return (
    <div className="flex min-h-[100svh] flex-col px-5 py-8 sm:px-10">
      <BrandLock />
      <main id="main" className="flex flex-1 items-center justify-center py-16">
        <div className="max-w-lg text-center">
          <h1 className=" font-serif text-4xl font-medium text-forest">
            That door doesn’t open
          </h1>
          <p className="mt-3 text-lg text-olive">
            The page you were looking for isn’t here. Let’s get you back somewhere
            warm.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/" size="lg">
              Back to the front
            </LinkButton>
            <LinkButton href="/portal" variant="secondary" size="lg">
              Go to my portal
            </LinkButton>
          </div>
        </div>
      </main>
    </div>
  );
}
