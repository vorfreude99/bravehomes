import type { Metadata } from 'next';
import { PersonClient } from '@/components/portal/PersonClient';

export const metadata: Metadata = { title: 'Profile' };

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PersonClient id={id} />;
}
