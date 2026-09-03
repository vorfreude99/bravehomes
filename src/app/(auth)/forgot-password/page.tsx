import type { Metadata } from 'next';
import { ForgotPasswordClient } from '@/components/auth/ForgotPasswordClient';

export const metadata: Metadata = { title: 'Forgot password' };

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
