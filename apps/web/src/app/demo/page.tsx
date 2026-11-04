import { SiteHeader, SiteFooter, ProductPreview } from '@/components/marketing';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
export const metadata = { title: 'Explore the workspace' };
export default function Demo() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="public-section" style={{ paddingTop: 60 }}>
        <div className="section-intro center">
          <span className="eyebrow">A little look inside</span>
          <h2>Your work, with a clearer view.</h2>
          <p>
            Try the navigation in this illustrated preview. To create and save real work, start your
            own account.
          </p>
        </div>
        <ProductPreview />
        <div style={{ textAlign: 'center', marginTop: 35 }}>
          <Button asChild>
            <Link href="/register">
              Create a real workspace
              <ArrowRight size={15} />
            </Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
