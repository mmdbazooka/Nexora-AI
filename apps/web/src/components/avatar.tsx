import Image from 'next/image';
import { initials } from '@/lib/utils';
export function Avatar({
  name = '?',
  src,
  className = '',
}: {
  name?: string;
  src?: string;
  className?: string;
}) {
  return (
    <span className={`avatar ${className}`} title={name}>
      {src ? <Image src={src} alt={name} width={60} height={60} unoptimized /> : initials(name)}
    </span>
  );
}
