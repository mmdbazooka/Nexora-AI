import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FeatureGrid, FAQ, Pricing, FinalCTA } from '@/components/marketing';
import { ContactForm } from '@/components/contact-form';
const pages: Record<
  string,
  { title: string; eyebrow: string; intro: string; sections?: { title: string; text: string }[] }
> = {
  features: {
    title: 'Everything you need. A little more connected.',
    eyebrow: 'Made for the work you care about',
    intro:
      'From the first spark to the last checkbox, find a thoughtful place for every part of your day.',
  },
  solutions: {
    title: 'Different people. Shared possibility.',
    eyebrow: 'Make it your own',
    intro: 'A flexible workspace for independent thinkers and teams building something together.',
    sections: [
      {
        title: 'For individuals & freelancers',
        text: 'Give client projects, personal goals, and side projects their own space. Capture notes as you go and turn an idea into a manageable checklist.',
      },
      {
        title: 'For product & engineering teams',
        text: 'Map out your roadmap, keep a shared Kanban board, and understand what is in progress. Keep project notes and technical conversations close to the work.',
      },
      {
        title: 'For creative studios',
        text: 'From the first brief to the final review, bring your planning and ideas together. Invite collaborators and make responsibilities visible.',
      },
      {
        title: 'For early-stage teams',
        text: 'Build good habits without adding more overhead. Track project progress and use AI as a thinking partner when your team needs another perspective.',
      },
    ],
  },
  pricing: {
    title: 'A little room for every ambition.',
    eyebrow: 'Simple by design',
    intro:
      'These plans explore how Nexora could grow. For now, this portfolio application has no billing or paid feature restrictions.',
  },
  about: {
    title: 'Good work starts with a little space.',
    eyebrow: 'The Nexora story',
    intro:
      'We believe your tools should leave you with more clarity, more focus, and a little more energy for the things you want to create.',
    sections: [
      {
        title: 'Built with intention',
        text: 'Nexora AI is an independent portfolio project by Mohammad. It brings thoughtful product design and full-stack engineering together in a working collaboration platform.',
      },
      {
        title: 'One place to find your flow',
        text: 'Projects, tasks, notes, and conversations tend to scatter. Nexora brings them together in a workspace that feels calm, connected, and useful.',
      },
      {
        title: 'Honest by design',
        text: 'We do not claim customers, certifications, or performance metrics we have not earned. Sample content is labeled, pricing is conceptual, and AI is available only when a real provider is connected.',
      },
      {
        title: 'Open to what comes next',
        text: 'The code is available on GitHub at mmdbazooka/Nexora-AI. Explore how it works, follow its progress, or get in touch with a thoughtful suggestion.',
      },
    ],
  },
  contact: {
    title: 'Let’s start a conversation.',
    eyebrow: 'Hello, possibility',
    intro:
      'Have a question, an idea, or a piece of feedback? We would love to hear what is on your mind.',
  },
  faq: {
    title: 'A little more clarity.',
    eyebrow: 'Frequently asked questions',
    intro: 'Everything you might want to know before making a little space for your work.',
  },
  privacy: {
    title: 'Your work deserves your trust.',
    eyebrow: 'Privacy notice',
    intro:
      'This notice describes how this portfolio application handles information. Deployment operators must update it with their own contact and legal details before offering a public service.',
    sections: [
      {
        title: 'Information the app stores',
        text: 'Nexora stores your name, email address, password hash, workspace memberships, projects, tasks, notes, conversations, and session information in MongoDB. Passwords are hashed with bcrypt and are never stored in plain text.',
      },
      {
        title: 'How your information is used',
        text: 'Your data is used to deliver the workspace features you choose to use. Workspace content is accessible to members of that workspace. AI conversations are scoped to the user who creates them.',
      },
      {
        title: 'AI and external providers',
        text: 'When you send an AI request, your message and any selected project context are sent to the deployment’s configured AI provider. That provider’s own data handling terms apply. Do not submit confidential information unless you trust that provider.',
      },
      {
        title: 'Cookies and browser storage',
        text: 'HTTP-only cookies are used for authentication and CSRF protection. Browser storage remembers your theme and selected workspace ID. Authentication tokens are never stored in localStorage. This application does not include advertising trackers.',
      },
      {
        title: 'Control and deletion',
        text: 'You can edit your profile, revoke sessions, and delete your account in settings. Shared workspace content may remain for other members; remove sensitive content before deleting your account. Contact the deployment operator for questions about backups, retention, or data requests.',
      },
    ],
  },
  terms: {
    title: 'A thoughtful starting point.',
    eyebrow: 'Terms of use',
    intro:
      'Nexora AI is an independent portfolio application. These terms describe the intended use of this demonstration; operators must review legal requirements before a commercial launch.',
    sections: [
      {
        title: 'Using the application',
        text: 'Use Nexora lawfully and respectfully. You are responsible for your account, the content you add, and the teammates you invite. Do not attempt to access other users’ workspaces or abuse the service.',
      },
      {
        title: 'A portfolio demonstration',
        text: 'Features may change and availability is not guaranteed. There is no payment collection or subscription contract. Marketing plans and team identities are illustrative, as labeled.',
      },
      {
        title: 'AI-generated content',
        text: 'AI output may be inaccurate, incomplete, or unsuitable for your situation. Review suggestions before relying on them. Generated tasks are presented for your approval before they are added to your workspace.',
      },
      {
        title: 'Your content',
        text: 'You retain responsibility for the content you add. Invite only people you intend to share workspace content with, and avoid storing sensitive information in publicly shared demo accounts.',
      },
      {
        title: 'Availability and responsibility',
        text: 'This software is offered as a demonstration without a service-level agreement. Keep independent backups of important work. Contact the deployment operator to resolve account or content concerns.',
      },
    ],
  },
};
export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: pages[slug]?.title || 'Not found', description: pages[slug]?.intro };
}
export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return (
    <>
      <section
        className="content-page"
        style={['features', 'pricing'].includes(slug) ? { maxWidth: 1170 } : undefined}
      >
        <span className="eyebrow">{page.eyebrow}</span>
        <h1>{page.title}</h1>
        <p className="lead">{page.intro}</p>
        {page.sections && (
          <div className="prose-content">
            {page.sections.map((s) => (
              <section key={s.title}>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
              </section>
            ))}
          </div>
        )}
        {slug === 'features' && (
          <div id="assistant">
            <FeatureGrid />
          </div>
        )}
        {slug === 'pricing' && <Pricing />}
        {slug === 'faq' && <FAQ />}
        {slug === 'contact' && <ContactForm />}
      </section>
      {!['privacy', 'terms', 'contact'].includes(slug) && <FinalCTA />}
    </>
  );
}
