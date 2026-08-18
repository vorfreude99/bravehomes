import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PortalShell, type SessionUser } from '@/components/portal/PortalShell';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The proxy already guards this, but a layout that assumes a user
  // must verify one — never trust the redirect to have happened.
  if (!user) redirect('/login?next=/portal');

  const metadataName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : '';

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email ?? '',
    name: metadataName.trim() || user.email?.split('@')[0] || 'Member',
  };

  return <PortalShell user={sessionUser}>{children}</PortalShell>;
}
