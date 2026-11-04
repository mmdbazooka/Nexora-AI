'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="error-page">
      <div className="error-number">500</div>
      <h1>A little pause in the flow.</h1>
      <p>
        Something unexpected happened. Try again, and we’ll help you pick up where you left off.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
