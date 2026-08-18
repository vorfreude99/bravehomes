import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ChatClient } from '@/components/portal/ChatClient';

export const metadata: Metadata = { title: 'Chat' };

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-ink-muted">Loading your chats…</div>}>
      <ChatClient />
    </Suspense>
  );
}
