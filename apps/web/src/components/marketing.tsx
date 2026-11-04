'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  Menu,
  X,
  Plus,
  Check,
  Sparkles,
  Command,
  LayoutDashboard,
  FolderKanban,
  CheckCheck,
  FileText,
  ChartNoAxesCombined,
  Settings,
  Search,
  Bell,
  ChevronRight,
  CheckCircle2,
  Clock,
  PanelLeft,
  ArrowUp,
  Users,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Logo } from './logo';
import { Button } from './ui/button';
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <Logo />
        <div className={`site-nav-links ${open ? 'open' : ''}`}>
          <Link onClick={() => setOpen(false)} href="/features">
            Features
          </Link>
          <Link onClick={() => setOpen(false)} href="/solutions">
            Solutions
          </Link>
          <Link onClick={() => setOpen(false)} href="/pricing">
            Pricing
          </Link>
          <Link onClick={() => setOpen(false)} href="/about">
            Our story
          </Link>
        </div>
        <div className="site-actions">
          <Link href="/login">Log in</Link>
          <Button asChild size="sm">
            <Link href="/register">
              Get started <ArrowUpRight size={14} />
            </Link>
          </Button>
          <button
            className="btn btn-icon btn-ghost mobile-only"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </nav>
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Logo />
          <p>
            A little less busy.
            <br />A lot more possible.
          </p>
        </div>
        <div className="footer-col">
          <strong>Product</strong>
          <Link href="/features">Features</Link>
          <Link href="/solutions">Solutions</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/demo">Explore the demo</Link>
        </div>
        <div className="footer-col">
          <strong>Company</strong>
          <Link href="/about">Our story</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/faq">FAQs</Link>
          <a href="https://github.com/mmdbazooka/Nexora-AI" target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        </div>
        <div className="footer-col">
          <strong>The details</strong>
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/terms">Terms of service</Link>
          <Link href="/login">Sign in</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Nexora AI. Built with intention.</span>
        <span className="status-dot">
          <i className="dot" />
          Independent portfolio project
        </span>
      </div>
    </footer>
  );
}
const previewTabs = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Projects', icon: FolderKanban },
  { label: 'My tasks', icon: CheckCheck },
  { label: 'Notes & docs', icon: FileText },
  { label: 'AI assistant', icon: Sparkles },
  { label: 'Analytics', icon: ChartNoAxesCombined },
];
export function ProductPreview() {
  const [tab, setTab] = useState('Overview');
  return (
    <div>
      <div className="product-preview" aria-label="Interactive product illustration">
        <aside className="preview-sidebar">
          <div className="preview-workspace">
            <span className="workspace-symbol">S</span>Studio workspace
            <ChevronRight size={12} />
          </div>
          <div className="preview-nav">
            {previewTabs.map(({ label, icon: Icon }) => (
              <button
                key={label}
                aria-label={label}
                className={tab === label ? 'active' : ''}
                onClick={() => setTab(label)}
              >
                <Icon size={13} />
                {label}
                {label === 'AI assistant' && <span>✦</span>}
              </button>
            ))}
          </div>
          <div className="preview-label">Your projects</div>
          <div className="preview-project">
            <i />
            Website redesign
          </div>
          <div className="preview-project">
            <i style={{ background: '#65d5b3' }} />
            Product launch
          </div>
          <div className="preview-project">
            <i style={{ background: '#e8ac79' }} />
            Brand exploration
          </div>
          <div className="preview-nav" style={{ marginTop: 30 }}>
            <button onClick={() => setTab('Settings')}>
              <Settings size={13} />
              Settings
            </button>
          </div>
        </aside>
        <div className="preview-main">
          <div className="preview-topbar">
            <span className="flex items-center gap-2">
              <PanelLeft size={12} />
              Workspace <ChevronRight size={10} />
              <span>{tab}</span>
            </span>
            <span className="flex items-center gap-3">
              <Search size={12} />
              <Bell size={12} />
              <span className="avatar" style={{ width: 21, height: 21, fontSize: 8 }}>
                JL
              </span>
            </span>
          </div>
          <div className="preview-content">
            {tab === 'Overview' || tab === 'Analytics' ? (
              <>
                <div className="flex justify-between items-center">
                  <h3>Your next big thing starts here.</h3>
                  <span className="badge violet">✦ Your workspace</span>
                </div>
                <p>A clear view of what matters. A little momentum for what’s next.</p>
                <div className="preview-stats">
                  {[
                    {
                      label: 'Tasks completed',
                      value: '24',
                      change: '+8 this week',
                      icon: CheckCircle2,
                    },
                    {
                      label: 'Active projects',
                      value: '6',
                      change: '2 near the finish',
                      icon: FolderKanban,
                    },
                    {
                      label: 'Focus score',
                      value: '92',
                      change: 'Looking good',
                      icon: ChartNoAxesCombined,
                    },
                  ].map(({ label, value, change, icon: Icon }) => (
                    <div className="preview-stat" key={label}>
                      <span>
                        {label}
                        <Icon size={12} />
                      </span>
                      <strong>
                        {value}
                        <small>{change}</small>
                      </strong>
                    </div>
                  ))}
                </div>
                <div className="preview-bottom">
                  <div className="mini-chart">
                    <div>
                      <strong>Making progress, every day</strong>
                      <span className="muted">This week⌄</span>
                    </div>
                    <svg
                      viewBox="0 0 400 100"
                      role="img"
                      aria-label="Illustrative upward task completion trend"
                    >
                      <defs>
                        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity=".3" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[20, 50, 80].map((y) => (
                        <line
                          key={y}
                          x1="0"
                          x2="400"
                          y1={y}
                          y2={y}
                          stroke="var(--border)"
                          strokeDasharray="3 5"
                        />
                      ))}
                      <path
                        d="M0 85 C25 80 35 88 65 70 S105 80 130 59 S170 65 195 43 S235 60 265 34 S310 50 330 20 S370 29 400 8 L400 100 L0 100Z"
                        fill="url(#chartFill)"
                      />
                      <path
                        d="M0 85 C25 80 35 88 65 70 S105 80 130 59 S170 65 195 43 S235 60 265 34 S310 50 330 20 S370 29 400 8"
                        fill="none"
                        stroke="#a78bfa"
                        strokeWidth="2.5"
                      />
                    </svg>
                    <div className="chart-labels">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mini-chart">
                    <div>
                      <strong>Up next</strong>
                      <ArrowUpRight size={12} />
                    </div>
                    {[
                      'Explore the new brand direction',
                      'Review landing page designs',
                      'Prepare product launch notes',
                    ].map((s, i) => (
                      <div className="preview-task" key={s}>
                        {i === 0 ? <Clock size={11} /> : <CheckCircle2 size={11} />}
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : tab === 'AI assistant' ? (
              <>
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="accent" />
                  <h3>A fresh perspective, on demand.</h3>
                </div>
                <div className="chat-bubble">
                  Help me turn our launch plan into clear next steps.
                </div>
                <div className="chat-answer">
                  Let’s make it manageable. Here are three good places to start:
                </div>
                {[
                  'Define what a successful launch looks like',
                  'Create the launch checklist',
                  'Share a first draft with your team',
                ].map((s, i) => (
                  <div key={s} className="chat-task-pill">
                    <CheckCircle2 size={12} />
                    {s}
                    <span>Step {i + 1}</span>
                  </div>
                ))}
                <Link className="btn btn-primary btn-sm" style={{ marginTop: 15 }} href="/register">
                  Try your own conversation
                  <ArrowRight size={12} />
                </Link>
              </>
            ) : tab === 'Projects' || tab === 'My tasks' ? (
              <>
                <h3>Big ideas. Clear next steps.</h3>
                <p>Move work forward, one thoughtfully planned task at a time.</p>
                <div
                  className="mini-kanban"
                  style={{ width: '100%', transform: 'none', marginTop: 25 }}
                >
                  {['To do', 'In progress', 'Done'].map((s, i) => (
                    <div key={s} style={{ width: '33.33%' }}>
                      {s} <span className="muted">{i === 1 ? '2' : '3'}</span>
                      {(i === 0
                        ? [
                            'Map out the experience',
                            'Gather design references',
                            'Write the first draft',
                          ]
                        : i === 1
                          ? ['Design the new homepage', 'Refine the visual direction']
                          : ['Set the project goals', 'Create the moodboard', 'Meet the team']
                      ).map((t) => (
                        <p key={t}>{t}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3>
                  {tab === 'Settings'
                    ? 'Make space for your way of working.'
                    : 'Ideas deserve a place to grow.'}
                </h3>
                <p>
                  {tab === 'Settings'
                    ? 'Your profile, preferences, and workspace. All in one place.'
                    : 'Capture the first thought. Come back to something great.'}
                </p>
                <div className="mini-chart" style={{ marginTop: 25, padding: 25 }}>
                  <h3 style={{ fontSize: 17 }}>
                    {tab === 'Settings'
                      ? 'Thoughtfully personal'
                      : 'A few thoughts on what comes next'}
                  </h3>
                  <p className="muted" style={{ fontSize: 12, marginTop: 15 }}>
                    A workspace should make your day simpler. Nexora brings your ideas,
                    conversations, and next steps closer together.
                  </p>
                  <Link
                    href="/register"
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 20 }}
                  >
                    Create your workspace
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="preview-sample-label">
        <Command size={10} />
        Interactive preview · Illustrative data, not a live workspace
      </div>
    </div>
  );
}
export const features = [
  {
    icon: FolderKanban,
    title: 'A home for every big idea.',
    text: 'Give projects a clear direction. Keep priorities, people, and deadlines in the same conversation.',
  },
  {
    icon: CheckCheck,
    title: 'Less juggling. More doing.',
    text: 'Turn the overwhelming into the achievable with flexible Kanban boards, priorities, and subtasks.',
  },
  {
    icon: Sparkles,
    title: 'Your thinking partner.',
    text: 'Plan a launch, untangle an idea, or find the next step with an AI assistant that understands your project.',
  },
  {
    icon: FileText,
    title: 'Catch the thought.',
    text: 'From a fleeting idea to the final brief. Write, organize, and find your notes without losing your flow.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'See the bigger picture.',
    text: 'Understand where work stands with clear progress charts, completion trends, and upcoming deadlines.',
  },
  {
    icon: Users,
    title: 'Better, together.',
    text: 'Bring your people into a shared workspace, with invitations and roles that keep responsibilities clear.',
  },
];
export function FeatureGrid() {
  return (
    <div className="feature-grid">
      {features.map(({ icon: Icon, title, text }) => (
        <article className="feature-card" key={title}>
          <div className="feature-icon">
            <Icon size={20} strokeWidth={1.5} />
          </div>
          <h3>{title}</h3>
          <p>{text}</p>
        </article>
      ))}
    </div>
  );
}
export const faqs = [
  {
    q: 'What is Nexora AI?',
    a: 'Nexora is a full-stack workspace for managing projects, tasks, notes, and AI conversations. This independent portfolio project is designed to demonstrate a connected, real-world product workflow.',
  },
  {
    q: 'Can I use it without an AI API key?',
    a: 'Absolutely. Projects, tasks, notes, team workspaces, and analytics work independently. The AI assistant becomes available when the deployment owner configures an OpenAI-compatible provider on the backend.',
  },
  {
    q: 'Is my workspace data actually saved?',
    a: 'Yes. In the application, your projects, tasks, notes, and conversations are stored through the Express API in MongoDB. The illustrations on this marketing site are clearly labeled sample data.',
  },
  {
    q: 'Can I invite my team?',
    a: 'Yes. Workspace owners and admins can send invitations by email. Verify your email first; invited teammates sign in, verify their own address, and accept their invitation.',
  },
  {
    q: 'Are the pricing plans live?',
    a: 'No. Pricing is a product concept for this portfolio project. There is no billing integration and no payment is collected. All implemented features are available without a subscription.',
  },
  {
    q: 'Where does the AI run?',
    a: 'AI requests are made by the backend to the configured OpenAI-compatible provider. Your provider API key never goes to the browser. Messages and the project context you select are sent to that provider.',
  },
];
export function FAQ() {
  return (
    <div className="faq-list">
      {faqs.map(({ q, a }) => (
        <details key={q}>
          <summary>
            {q}
            <Plus size={17} />
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
export function Pricing() {
  return (
    <>
      <div className="pricing-grid">
        {[
          {
            name: 'Personal',
            desc: 'For your next side project. And the one after.',
            price: '0',
            items: [
              'Your personal workspace',
              'Projects, tasks, and notes',
              'A calmer place to get things done',
            ],
            cta: 'Start creating',
          },
          {
            name: 'Studio',
            desc: 'For small teams with big things in mind.',
            price: '12',
            items: [
              'Everything in Personal',
              'Shared team workspaces',
              'AI-assisted planning and writing',
              'Progress and productivity insights',
            ],
            cta: 'Build something together',
          },
          {
            name: 'Scale',
            desc: 'More room for your team to do its thing.',
            price: '24',
            items: [
              'Everything in Studio',
              'Workspace roles and permissions',
              'Connected project context',
              'Session and account controls',
            ],
            cta: 'Find your flow',
          },
        ].map((p, i) => (
          <article className={`price-card ${i === 1 ? 'featured' : ''}`} key={p.name}>
            {i === 1 && <span className="popular">A little more possibility</span>}
            <h3>{p.name}</h3>
            <p>{p.desc}</p>
            <div className="price">
              ${p.price}
              <small> / person / month</small>
            </div>
            <Button variant={i === 1 ? 'primary' : 'secondary'} asChild>
              <Link href="/register">
                {p.cta}
                <ArrowUpRight size={14} />
              </Link>
            </Button>
            <ul className="check-list">
              {p.items.map((item) => (
                <li key={item}>
                  <Check size={14} />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="pricing-disclaimer">
        Illustrative plans for a portfolio project. No payments, subscriptions, or feature gates are
        enabled.
      </p>
    </>
  );
}
export function FinalCTA() {
  return (
    <section className="final-cta">
      <span className="eyebrow">A little space. A lot of possibility.</span>
      <h2 style={{ marginTop: 17 }}>Make room for your best work.</h2>
      <p>Your ideas, your people, your next big thing. Finally, connected.</p>
      <Button asChild>
        <Link href="/register">
          Find your flow
          <ArrowRight size={16} />
        </Link>
      </Button>
    </section>
  );
}
export function Landing() {
  const reduce = useReducedMotion();
  return (
    <div className="marketing">
      <SiteHeader />
      <main id="main">
        <section className="hero">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <Link href="/features" className="hero-pill">
              <span>Meet Nexora</span>A fresh perspective on your work
              <ArrowRight size={12} />
            </Link>
            <h1>
              Less busywork.
              <br />
              <em>More possibility.</em>
            </h1>
            <p>
              A thoughtful home for your projects, notes, and next big ideas.
              <br className="desktop-only" />
              With a little intelligence to help it all come together.
            </p>
            <div className="hero-ctas">
              <Button asChild>
                <Link href="/register">
                  Get started for free
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/demo">
                  <PanelLeft size={15} />
                  Take a look inside
                </Link>
              </Button>
            </div>
            <div className="hero-note">
              <Check size={12} />
              No credit card. Just a little curiosity.
            </div>
          </motion.div>
          <motion.div
            className="hero-preview-wrap"
            initial={reduce ? false : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <ProductPreview />
          </motion.div>
        </section>
        <section className="trust-section">
          <p>Designed for the way ambitious teams work.</p>
          <div className="trust-names">
            <span>◒ orbit</span>
            <span>Layers</span>
            <span>✳ Studio North</span>
            <span>acme®</span>
            <span>∞ Capsule</span>
          </div>
          <p style={{ fontSize: 9, marginTop: 17 }}>
            Illustrative team identities. No customer endorsements implied.
          </p>
        </section>
        <section className="public-section" id="features">
          <div className="section-intro center">
            <span className="eyebrow">Everything, a little more connected</span>
            <h2>
              All the moving parts.
              <br />
              One clear picture.
            </h2>
            <p>
              Good work needs space to happen. Bring your tools closer together and give your
              attention back to what matters.
            </p>
          </div>
          <FeatureGrid />
        </section>
        <section className="ai-showcase">
          <div className="public-section split-section">
            <div>
              <div className="section-intro">
                <span className="eyebrow">Meet your thinking partner</span>
                <h2>
                  A second perspective.
                  <br />
                  Whenever you need one.
                </h2>
                <p>
                  Get past the blank page. Turn a messy idea into a clear plan. Find the next step
                  without breaking your stride.
                </p>
              </div>
              <ul className="check-list">
                <li>
                  <Check size={15} />
                  Conversations that remember where you left off
                </li>
                <li>
                  <Check size={15} />
                  Project context, when you choose to share it
                </li>
                <li>
                  <Check size={15} />
                  From a good suggestion to an actionable task
                </li>
              </ul>
              <Button asChild variant="secondary">
                <Link href="/features#assistant">
                  Explore the assistant
                  <ArrowUpRight size={14} />
                </Link>
              </Button>
            </div>
            <div className="ai-preview">
              <div className="ai-preview-top">
                <Sparkles size={17} className="accent" />
                Nexora Assistant<small>Illustrative conversation</small>
              </div>
              <div className="chat-bubble">We’re refreshing our brand. Where should we start?</div>
              <div className="chat-answer">
                <strong>Start with the story you want to tell.</strong>
                <br />
                Here’s a simple way to turn that into momentum:
              </div>
              {[
                'Write a one-page brand brief',
                'Collect a visual moodboard',
                'Plan your first design review',
              ].map((t, i) => (
                <div className="chat-task-pill" key={t}>
                  <CheckCheck size={12} />
                  {t}
                  <span>0{i + 1}</span>
                </div>
              ))}
              <div
                className="flex items-center justify-between"
                style={{ marginTop: 20, fontSize: 10, color: 'var(--subtle)' }}
              >
                <span>What else is on your mind?</span>
                <span className="workspace-symbol">
                  <ArrowUp size={14} />
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="public-section">
          <div className="section-intro center">
            <span className="eyebrow">From the first thought to the finish line</span>
            <h2>A flow that feels like yours.</h2>
            <p>Structure when you need it. Flexibility when you don’t.</p>
          </div>
          <div className="workflow-grid">
            {[
              {
                title: 'Make a little space.',
                text: 'Create a workspace, invite your people, and give your next project a home.',
              },
              {
                title: 'Find your next step.',
                text: 'Capture notes, break things into tasks, and think it through with your AI assistant.',
              },
              {
                title: 'See it come together.',
                text: 'Follow the progress, celebrate what’s done, and make room for what comes next.',
              },
            ].map((s, i) => (
              <article className="workflow-step" key={s.title}>
                <span>0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="public-section" style={{ paddingTop: 20 }}>
          <div className="feature-card feature-wide">
            <div>
              <span className="eyebrow">Clarity comes standard</span>
              <h3 style={{ fontSize: 29, marginTop: 15 }}>
                Small steps.
                <br />
                Visible progress.
              </h3>
              <p>
                Know what’s moving, what needs a nudge, and what’s already worth celebrating. Your
                analytics follow the work you actually do.
              </p>
              <Link href="/features" className="btn btn-secondary btn-sm" style={{ marginTop: 20 }}>
                Find your overview
                <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="mini-kanban">
              <div>
                <span className="flex items-center gap-2">
                  <i className="dot accent" />
                  In progress
                </span>
                <p>Shape the big idea</p>
                <p>Bring the vision to life</p>
              </div>
              <div>
                <span className="flex items-center gap-2">
                  <i className="dot green" />
                  Done
                </span>
                <p>Find your people ✓</p>
                <p>Make a little space ✓</p>
                <p>Take the first step ✓</p>
              </div>
            </div>
          </div>
        </section>
        <section className="public-section" id="pricing">
          <div className="section-intro center">
            <span className="eyebrow">Room to grow</span>
            <h2>Big ambitions. Simple plans.</h2>
            <p>A product concept built around your next chapter.</p>
          </div>
          <Pricing />
        </section>
        <section className="public-section" style={{ paddingTop: 25 }}>
          <div className="section-intro center">
            <span className="eyebrow">A few things you might be wondering</span>
            <h2>Good questions.</h2>
          </div>
          <FAQ />
        </section>
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}
