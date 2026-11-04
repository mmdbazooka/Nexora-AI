import { Suspense } from 'react';
import { AuthForm } from '@/features/auth-form';
import { Loading } from '@/components/ui/common';
export const metadata = { title: 'Reset Password', robots: { index: false, follow: false } };
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthForm action="reset-password" />
    </Suspense>
  );
}
