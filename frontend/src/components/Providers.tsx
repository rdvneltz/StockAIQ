'use client'

import { QueryClient, QueryClientProvider } from '@/tanstack/react-query'
import { Toaster } from 'sonner'
import { useState, useEffect } from 'react'
import { initOneSignal } from '@/lib/onesignal'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }))

  useEffect(() => {
    // Initialize OneSignal on client-side
    if (typeof window !== 'undefined') {
      initOneSignal();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
