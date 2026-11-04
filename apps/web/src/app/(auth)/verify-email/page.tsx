import { Suspense } from 'react';
import { AuthForm } from '@/features/auth-form';
import { Loading } from '@/components/ui/common';
export const metadata = { title: 'Verify Email', robots: { index: false, follow: false } };
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthForm action="verify-email" />
    </Suspense>
  );
}
