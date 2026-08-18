import type { Metadata } from 'next';
import { HomesClient } from '@/components/portal/HomesClient';

export const metadata: Metadata = { title: 'The homes' };

export default function HomesPage() {
  return <HomesClient />;
}
