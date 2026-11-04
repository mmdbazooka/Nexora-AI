import Link from 'next/link';
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" aria-label="Nexora AI home" className="brand">
      <span className="brand-mark">
        <i />
        <i />
        <i />
        <i />
      </span>
      {!compact && (
        <span>
          Nexora<span className="brand-ai">AI</span>
        </span>
      )}
    </Link>
  );
}
