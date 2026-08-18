import type { Metadata } from 'next';
import { FindClient } from '@/components/portal/FindClient';

export const metadata: Metadata = { title: 'Find people' };

export default function FindPage() {
  return <FindClient />;
}
