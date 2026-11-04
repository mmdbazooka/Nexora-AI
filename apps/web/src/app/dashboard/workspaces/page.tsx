import { Suspense } from 'react';
import { Workspaces } from '@/features/workspaces';
import { Loading } from '@/components/ui/common';
export default function WorkspacesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Workspaces />
    </Suspense>
  );
}
