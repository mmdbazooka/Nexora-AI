import { notFound } from 'next/navigation';
import { Settings } from '@/features/settings';
export default async function SettingsPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!['profile', 'security', 'appearance', 'notifications'].includes(section)) notFound();
  return <Settings key={section} section={section} />;
}
