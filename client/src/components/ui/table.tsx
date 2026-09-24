import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// The table shell only. Sorting, filtering and paging all happen on the server,
// so a data table built on this shell holds no rows of its own.

export function TableShell({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactNode {
  return (
    <div
      className={cn('overflow-x-auto rounded-md border border-line bg-surface-raised', className)}
      {...props}
    />
  );
}

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>): ReactNode {
  return <table className={cn('w-full border-collapse text-body', className)} {...props} />;
}

export function TableHead({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>): ReactNode {
  return <thead className={cn('bg-surface-alt', className)} {...props} />;
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>): ReactNode {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>): ReactNode {
  return <tr className={cn('border-b border-line last:border-0', className)} {...props} />;
}

export interface TableHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /** Money and counts sit on the right, so the digits line up column by column. */
  isNumeric?: boolean;
}

export function TableHeaderCell({
  isNumeric = false,
  className,
  ...props
}: TableHeaderCellProps): ReactNode {
  return (
    <th
      scope="col"
      className={cn(
        'px-3 py-2 text-left text-label text-ink-subtle',
        isNumeric && 'text-right',
        className,
      )}
      {...props}
    />
  );
}

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  isNumeric?: boolean;
}

export function TableCell({ isNumeric = false, className, ...props }: TableCellProps): ReactNode {
  return (
    <td
      className={cn('px-3 py-3 text-ink align-middle', isNumeric && 'text-right', className)}
      {...props}
    />
  );
}
