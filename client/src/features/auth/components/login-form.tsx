'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiError, apiFetch, setAccessToken } from '@/lib/api-client';
import { applyServerErrors } from '@/lib/forms';
import { Button } from '@/components/ui/button';
import { FormField, Input } from '@/components/ui/input';

// Form-only schema for now. It moves to shared/src/schemas/auth.ts the day the
// auth module is built, so the browser and the API check the same rules.
// No transform and no coerce here: the form type must equal the request type.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INDIA_MOBILE = /^(\+91)?[6-9]\d{9}$/;

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Enter your email address or mobile number.')
    .refine(
      (value) => EMAIL.test(value) || INDIA_MOBILE.test(value.replace(/[\s-]/g, '')),
      'Enter a valid email address or a 10-digit mobile number.',
    ),
  password: z.string().min(8, 'Your password is at least 8 characters long.'),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LoginResponse {
  accessToken: string;
}

/** Where to land after a successful sign-in, from ?next= on the current URL. */
function nextPath(): string {
  if (typeof window === 'undefined') return '/dashboard';
  const next = new URLSearchParams(window.location.search).get('next');
  // Only a path of our own, so a crafted link cannot bounce the user elsewhere.
  return next !== null && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
}

export function LoginForm(): ReactNode {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setNotice(null);
    try {
      const result = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: values,
      });
      setAccessToken(result.accessToken);
      router.push(nextPath());
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      // The login route arrives on Day 8 of the sprint. Until then the call
      // either finds nothing or finds no API at all, and that is not a bug.
      if (error.status === 404 || error.status === 0) {
        setNotice('Sign-in is not built yet. It arrives with the authentication module.');
        return;
      }
      applyServerErrors(form.setError, error, ['identifier', 'password']);
    }
  });

  const errors = form.formState.errors;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <h1 className="text-h1 text-ink">Sign in</h1>

      <FormField
        label="Email or mobile number"
        isRequired
        errorText={errors.identifier?.message}
        helperText="Use the email or number your institute registered."
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            {...form.register('identifier')}
            type="text"
            autoComplete="username"
            inputMode="email"
          />
        )}
      </FormField>

      <FormField label="Password" isRequired errorText={errors.password?.message}>
        {(fieldProps) => (
          <Input
            {...fieldProps}
            {...form.register('password')}
            type="password"
            autoComplete="current-password"
          />
        )}
      </FormField>

      {errors.root?.server?.message === undefined ? null : (
        <p role="alert" className="rounded-sm bg-danger-soft px-3 py-2 text-small text-danger-text">
          {errors.root.server.message}
        </p>
      )}
      {notice === null ? null : (
        <p role="status" className="rounded-sm bg-info-soft px-3 py-2 text-small text-primary-hover">
          {notice}
        </p>
      )}

      <Button type="submit" isLoading={form.formState.isSubmitting}>
        Sign in
      </Button>
      <p className="text-small text-ink-subtle">
        Parents and students sign in with a one-time code. That screen arrives with the portal.
      </p>
    </form>
  );
}
