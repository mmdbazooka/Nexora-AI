'use client';
import { ErrorState } from '@/components/ui/common';
export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState error={error} retry={reset} />;
}
