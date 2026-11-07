'use client';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { api, json } from '@/lib/api';
import { Button } from './ui/button';
import { Field } from './ui/common';
export function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<{ name: string; email: string; message: string }>();
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  if (process.env.NEXT_PUBLIC_EMAIL_DISABLED === 'true')
    return <p className="notice">The contact form is unavailable in this demo.</p>;
  return (
    <form
      className="contact-form"
      onSubmit={handleSubmit(async (data) => {
        setError('');
        try {
          const r = await api<{ message: string }>('/auth/contact', json('POST', data));
          setResult(r.message);
        } catch (e) {
          setError((e as Error).message);
        }
      })}
    >
      {result ? (
        <p className="notice" role="status">
          {result}
        </p>
      ) : (
        <>
          <Field label="Your name" error={errors.name?.message}>
            <input
              autoComplete="name"
              {...register('name', {
                required: 'Tell us your name',
                minLength: { value: 2, message: 'Use at least 2 characters' },
              })}
            />
          </Field>
          <Field label="Email address" error={errors.email?.message}>
            <input
              type="email"
              autoComplete="email"
              {...register('email', { required: 'Enter your email' })}
            />
          </Field>
          <Field label="What’s on your mind?" error={errors.message?.message}>
            <textarea
              rows={5}
              {...register('message', {
                required: 'Write a message',
                minLength: { value: 10, message: 'Tell us a little more (at least 10 characters)' },
              })}
            />
          </Field>
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <Button disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send your message'}
            <ArrowUpRight size={15} />
          </Button>
        </>
      )}
    </form>
  );
}
