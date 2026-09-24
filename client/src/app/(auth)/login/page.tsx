import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { LoginForm } from '@/features/auth';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage(): ReactNode {
  return <LoginForm />;
}
