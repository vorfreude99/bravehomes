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

  // `profiles.full_name` is what the Profile page actually edits — the
  // auth metadata set at signup is never touched again after that, so
  // it goes stale the moment someone changes their name and this must
  // win over it, not just fill in when it's empty.
  const metadataName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : '';

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email ?? '',
    name:
      profile?.full_name?.trim() ||
      metadataName.trim() ||
      user.email?.split('@')[0] ||
      'Member',
    isAdmin: profile?.is_admin === true,
  };

  return <PortalShell user={sessionUser}>{children}</PortalShell>;
}
