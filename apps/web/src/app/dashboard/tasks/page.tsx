import { Suspense } from 'react';
import { Tasks } from '@/features/tasks';
import { Loading } from '@/components/ui/common';
export default function TasksPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Tasks />
    </Suspense>
  );
}
