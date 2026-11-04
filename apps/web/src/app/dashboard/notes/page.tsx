import { Suspense } from 'react';
import { Notes } from '@/features/notes';
import { Loading } from '@/components/ui/common';
export default function NotesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Notes />
    </Suspense>
  );
}
