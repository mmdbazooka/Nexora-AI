import { AppShell } from '@/components/app-shell';
export const metadata = { title: 'Your workspace', robots: { index: false, follow: false } };
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
