'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, PanelLeft, Search } from 'lucide-react';
import { NAV_ITEMS } from '@/config/navigation';
import { env } from '@/lib/env';
import { usePermissions } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useSession } from '@/providers/session-provider';
import { CampusSwitcher } from './campus-switcher.tsx';
import { UserMenu } from './user-menu.tsx';

export interface HeaderProps {
  onOpenDrawer: () => void;
  onToggleCollapse: () => void;
}

export function Header({ onOpenDrawer, onToggleCollapse }: HeaderProps): ReactNode {
  const { session, isPreview } = useSession();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Ctrl+K is the shortcut people already expect from every other admin tool.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 flex h-14 items-center gap-2 border-b border-line',
        'bg-surface-raised px-3 lg:px-4',
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open menu"
        onClick={onOpenDrawer}
      >
        <Menu aria-hidden="true" className="size-6" strokeWidth={2} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        aria-label="Collapse or expand the menu"
        onClick={onToggleCollapse}
      >
        <PanelLeft aria-hidden="true" className="size-6" strokeWidth={2} />
      </Button>

      <span className="text-h3 text-primary">EduFlow</span>
      <span className="hidden truncate text-label text-ink-muted sm:inline">
        {session?.organization.name ?? ''}
      </span>
      {env.appEnv === 'local' ? (
        <span className="rounded-sm bg-warning-soft px-1.5 py-0.5 text-label text-warning-text">
          LOCAL
        </span>
      ) : null}
      {isPreview ? (
        <span className="rounded-sm bg-info-soft px-1.5 py-0.5 text-label text-primary-hover">
          Sample session
        </span>
      ) : null}

      <div className="ml-auto flex items-center gap-2">
        <Button variant="secondary" aria-label="Search" onClick={() => setIsSearchOpen(true)}>
          <Search aria-hidden="true" className="size-5" strokeWidth={2} />
          <span className="hidden sm:inline">Search</span>
        </Button>
        <CampusSwitcher />
        <UserMenu />
      </div>

      <ModuleSearch open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}

/**
 * Jumps to a module by name. It searches the menu the user is allowed to see,
 * so it works with no backend, and record search joins it when the first list
 * endpoint exists.
 */
function ModuleSearch({ open, onClose }: { open: boolean; onClose: () => void }): ReactNode {
  const [term, setTerm] = useState('');
  const { can } = usePermissions();
  const router = useRouter();

  const matches = NAV_ITEMS.filter(
    (item) =>
      item.isEnabled &&
      can(item.permission) &&
      item.label.toLowerCase().includes(term.toLowerCase()),
  );

  const go = (route: string): void => {
    onClose();
    setTerm('');
    router.push(route);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Search" description="Jump to a module.">
      <Input
        autoFocus
        value={term}
        placeholder="Type a module name"
        aria-label="Search modules"
        onChange={(event) => setTerm(event.target.value)}
        onKeyDown={(event) => {
          const first = matches[0];
          if (event.key === 'Enter' && first !== undefined) go(first.route);
        }}
      />
      <ul className="mt-3 flex flex-col gap-1">
        {matches.map((item) => (
          <li key={item.route}>
            <Button variant="ghost" className="w-full justify-start" onClick={() => go(item.route)}>
              {item.label}
            </Button>
          </li>
        ))}
        {matches.length === 0 ? (
          <li className="px-2 py-3 text-small text-ink-subtle">
            No module matches that name yet. More modules arrive each week of the sprint.
          </li>
        ) : null}
      </ul>
    </Dialog>
  );
}
