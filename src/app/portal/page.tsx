import type { Metadata } from 'next';
import { PortalHome } from '@/components/portal/PortalHome';

export const metadata: Metadata = { title: 'Your home' };

export default function PortalIndexPage() {
  return <PortalHome />;
}
