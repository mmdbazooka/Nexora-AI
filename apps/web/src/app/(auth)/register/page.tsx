import { Suspense } from 'react';
import { AuthForm } from '@/features/auth-form';
import { Loading } from '@/components/ui/common';
export const metadata = { title: 'Register', robots: { index: false, follow: false } };
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthForm action="register" />
    </Suspense>
  );
}
