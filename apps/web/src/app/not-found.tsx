import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
export default function NotFound() {
  return (
    <main id="main" className="error-page">
      <Logo />
      <div className="error-number">404</div>
      <span className="eyebrow" style={{ marginBottom: 15 }}>
        A small detour
      </span>
      <h1>This idea is still out there.</h1>
      <p>
        The page you’re looking for may have moved, or never quite made it out of the notebook.
        Let’s get you back to familiar space.
      </p>
      <div className="flex gap-3">
        <Button asChild variant="secondary">
          <Link href="/">
            <ArrowLeft size={15} />
            Back to home
          </Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            Your workspace
            <ArrowUpRight size={15} />
          </Link>
        </Button>
      </div>
    </main>
  );
}
