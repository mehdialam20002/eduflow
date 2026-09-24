import type { ReactNode } from 'react';
import Link from 'next/link';
import { buttonClassName } from '@/components/ui/button';

export default function LandingPage(): ReactNode {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-4 py-16">
      <p className="text-h3 text-primary">EduFlow</p>
      <h1 className="text-display text-ink">
        One simple system to run a school or coaching institute.
      </h1>
      <p className="text-body text-ink-muted">
        Admissions, attendance, fees, exams, staff and parent communication, in one place. Set it
        up in a day, use it from your phone.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/login" className={buttonClassName()}>
          Sign in
        </Link>
        <Link href="/dashboard" className={buttonClassName('secondary')}>
          Open the dashboard
        </Link>
      </div>
      <p className="text-small text-ink-subtle">
        Built for institutes of every size. Your data stays inside your own organization.
      </p>
    </main>
  );
}
