import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { AppProviders } from '@/providers/app-providers';
import './globals.css';

// The system font stack is used instead of next/font. next/font needs Next's native SWC binary,
// which this machine's Application Control policy blocks, and system fonts download nothing at
// all, so pages paint sooner on the slow connections our parents use. See docs/tech-debt.md.

export const metadata: Metadata = {
  title: {
    default: 'EduFlow',
    template: '%s | EduFlow',
  },
  description:
    'One simple system to run a school or coaching institute: admissions, attendance, ' +
    'fees, exams, staff and parent communication.',
  applicationName: 'EduFlow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563EB',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
