import type { Metadata } from 'next';
import { ProfileClient } from '@/components/portal/ProfileClient';

export const metadata: Metadata = { title: 'Your profile' };

export default function ProfilePage() {
  return <ProfileClient />;
}
