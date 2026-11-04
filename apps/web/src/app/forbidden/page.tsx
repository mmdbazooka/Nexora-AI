import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function Forbidden() {
  return (
    <main id="main" className="error-page">
      <div className="error-number">403</div>
      <h1>A space for someone else.</h1>
      <p>
        You don’t have access to this workspace. Ask an owner to send you an invitation, or return
        to your own.
      </p>
      <Button asChild>
        <Link href="/dashboard">Back to your workspace</Link>
      </Button>
    </main>
  );
}
