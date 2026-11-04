import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { sanitizeNote, pagination } from '../src/resources/routes.js';
import { hash, randomToken } from '../src/auth/service.js';
import { csrf } from '../src/auth/middleware.js';
import { HttpError } from '../src/core/errors.js';
function csrfRequest({
  origin = 'http://localhost:3000',
  cookie = 'a'.repeat(64),
  header = 'a'.repeat(64),
  method = 'POST',
} = {}) {
  const req = {
    method,
    cookies: { nx_csrf: cookie },
    get: (name: string) => (name === 'origin' ? origin : header),
  } as unknown as Request;
  const next = vi.fn();
  csrf(req, {} as Response, next as NextFunction);
  return next;
}
describe('CSRF origin and token protection', () => {
  it('accepts a matching token only from the configured origin', () => {
    expect(csrfRequest()).toHaveBeenCalledWith();
  });
  it('rejects a cross-site request with a matching token', () => {
    const next = csrfRequest({ origin: 'https://attacker.example' });
    expect(next.mock.calls[0][0]).toBeInstanceOf(HttpError);
    expect(next.mock.calls[0][0].status).toBe(403);
  });
  it('rejects a missing origin', () => {
    expect(csrfRequest({ origin: '' }).mock.calls[0][0].status).toBe(403);
  });
  it('rejects mismatched and malformed tokens without crashing', () => {
    expect(csrfRequest({ header: 'b'.repeat(64) }).mock.calls[0][0].status).toBe(403);
    expect(csrfRequest({ header: 'short' }).mock.calls[0][0].status).toBe(403);
  });
  it('rejects non-ASCII token payloads without a timing-safe comparison error', () => {
    expect(csrfRequest({ header: 'é'.repeat(64) }).mock.calls[0][0].status).toBe(403);
  });
  it('allows safe read methods without a token', () => {
    expect(
      csrfRequest({ method: 'GET', origin: '', cookie: '', header: '' }),
    ).toHaveBeenCalledWith();
  });
});
describe('stored rich text security', () => {
  it('removes scripts, event handlers, links and SVG payloads', () => {
    const html = sanitizeNote(
      '<p onclick="alert(1)">Hello</p><script>alert(1)</script><svg onload="alert(1)"></svg><a href="javascript:alert(1)">link</a><img src=x onerror=alert(1)>',
    );
    expect(html).toBe('<p>Hello</p>link');
  });
  it('preserves supported editorial formatting', () => {
    expect(
      sanitizeNote(
        '<h2>Ideas</h2><ul><li><strong>One</strong></li></ul><pre><code>const x = 1;</code></pre>',
      ),
    ).toBe(
      '<h2>Ideas</h2><ul><li><strong>One</strong></li></ul><pre><code>const x = 1;</code></pre>',
    );
  });
});
describe('token and list controls', () => {
  it('creates high-entropy tokens and stores only deterministic digests', () => {
    const a = randomToken(),
      b = randomToken();
    expect(a).toHaveLength(64);
    expect(a).not.toBe(b);
    expect(hash(a)).toHaveLength(64);
    expect(hash(a)).not.toBe(a);
    expect(hash(a)).toBe(hash(a));
  });
  it('caps untrusted pagination input', () => {
    expect(pagination({ page: '-3', limit: '999999' })).toEqual({ page: 1, limit: 100 });
    expect(pagination({ page: 'bad', limit: 'bad' })).toEqual({ page: 1, limit: 50 });
  });
});
