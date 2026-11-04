'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerSchema, loginSchema, passwordSchema } from '@nexora/shared';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { api, json } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/common';
import { Logo } from '@/components/logo';
const copy: Record<string, { title: string; subtitle: string; cta: string }> = {
  login: {
    title: 'Welcome back.',
    subtitle: 'A fresh start, right where you left off.',
    cta: 'Sign in to your workspace',
  },
  register: {
    title: 'Make room for what’s next.',
    subtitle: 'Your best work starts with a little space.',
    cta: 'Create your account',
  },
  'forgot-password': {
    title: 'Let’s get you back in.',
    subtitle: 'We’ll send a secure link to reset your password.',
    cta: 'Send reset link',
  },
  'reset-password': {
    title: 'A fresh start.',
    subtitle: 'Choose a strong password you haven’t used before.',
    cta: 'Update password',
  },
  'verify-email': {
    title: 'One last little step.',
    subtitle: 'Verify your email to start collaborating.',
    cta: 'Verify my email',
  },
};
export function AuthForm({ action }: { action: string }) {
  const router = useRouter(),
    params = useSearchParams(),
    client = useQueryClient();
  const [error, setError] = useState(''),
    [success, setSuccess] = useState(''),
    [showPassword, setShowPassword] = useState(false);
  const schema =
    action === 'register'
      ? registerSchema
      : action === 'login'
        ? loginSchema
        : action === 'forgot-password'
          ? z.object({ email: z.email() })
          : action === 'reset-password'
            ? z.object({ password: passwordSchema })
            : z.object({});
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, string>>({
    resolver: zodResolver(schema as z.ZodType<Record<string, string>, Record<string, string>>),
  });
  const info = copy[action];
  const submit = handleSubmit(async (data) => {
    setError('');
    try {
      const body = ['reset-password', 'verify-email'].includes(action)
        ? { ...data, token: params.get('token') || '' }
        : data;
      const result = await api<{ message?: string }>(`/auth/${action}`, json('POST', body));
      if (action === 'login' || action === 'register') {
        client.clear();
        router.push('/dashboard');
        router.refresh();
      } else setSuccess(result.message || 'Done. You’re all set.');
    } catch (e) {
      setError((e as Error).message);
    }
  });
  return (
    <main id="main" className="auth-page">
      <aside className="auth-aside">
        <Logo />
        <div className="auth-story">
          <span className="eyebrow">A little less busy</span>
          <h2>
            Good things happen
            <br />
            when you find
            <br />
            <span className="accent">your flow.</span>
          </h2>
          <p>
            One thoughtfully connected home for your ideas, your people, and the work that matters.
          </p>
          <div className="auth-orbit">
            <span className="brand-mark">
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
        </div>
        <p className="auth-footer">Projects. Notes. Intelligence. A little more connected.</p>
      </aside>
      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="mobile-only">
            <Logo />
          </div>
          <Link href="/" className="auth-back">
            <ArrowLeft size={13} />
            Back to Nexora
          </Link>
          <h1>{info.title}</h1>
          <span className="muted">{info.subtitle}</span>
          {success ? (
            <div>
              <div className="notice" role="status">
                <CheckCircle2 size={20} className="accent" style={{ marginBottom: 10 }} />
                {success}
              </div>
              <Button asChild variant="secondary">
                <Link href={action === 'verify-email' ? '/dashboard' : '/login'}>
                  Continue
                  <ArrowRight size={15} />
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              {action === 'register' && (
                <Field label="Full name" error={errors.name?.message}>
                  <input autoComplete="name" placeholder="Alex Morgan" {...register('name')} />
                </Field>
              )}
              {['login', 'register', 'forgot-password'].includes(action) && (
                <Field label="Email address" error={errors.email?.message}>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@yourcompany.com"
                    {...register('email')}
                  />
                </Field>
              )}
              {['login', 'register', 'reset-password'].includes(action) && (
                <>
                  <Field label="Password" error={errors.password?.message}>
                    <div style={{ position: 'relative' }}>
                      <input
                        style={{ width: '100%', paddingRight: 42 }}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={action === 'login' ? 'current-password' : 'new-password'}
                        placeholder={
                          action === 'login' ? 'Enter your password' : 'At least 10 characters'
                        }
                        {...register('password')}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        style={{ position: 'absolute', right: 4, top: 4 }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </Field>
                  {action === 'login' && (
                    <div style={{ textAlign: 'right', margin: '-7px 0 20px', fontSize: 11 }}>
                      <Link href="/forgot-password" className="accent">
                        Forgot your password?
                      </Link>
                    </div>
                  )}
                </>
              )}
              {action === 'verify-email' && (
                <p className="notice">
                  {params.get('token')
                    ? 'Your verification link is ready. Confirm below to verify your address.'
                    : 'Check your inbox for your verification email. You can resend it from your workspace profile settings.'}
                </p>
              )}
              {error && (
                <p className="notice error" role="alert">
                  {error}
                </p>
              )}
              <Button
                disabled={isSubmitting || (action === 'verify-email' && !params.get('token'))}
              >
                {isSubmitting ? <LoaderCircle size={15} className="spin" /> : null}
                {isSubmitting ? 'Just a moment…' : info.cta}
                {!isSubmitting && <ArrowRight size={15} />}
              </Button>
            </form>
          )}
          {action === 'register' && (
            <p
              style={{
                fontSize: 10,
                color: 'var(--subtle)',
                lineHeight: 1.8,
                textAlign: 'center',
                marginTop: 16,
              }}
            >
              By creating an account, you agree to our{' '}
              <Link className="accent" href="/terms">
                Terms
              </Link>{' '}
              and{' '}
              <Link className="accent" href="/privacy">
                Privacy Policy
              </Link>
              .
            </p>
          )}
          <p className="form-switch">
            {action === 'login' ? (
              <>
                New around here? <Link href="/register">Create an account</Link>
              </>
            ) : action === 'register' ? (
              <>
                Already have a space? <Link href="/login">Sign in</Link>
              </>
            ) : (
              <Link href="/login">Back to sign in</Link>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
