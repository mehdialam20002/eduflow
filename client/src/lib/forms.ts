import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ApiError } from './api-client.ts';

/**
 * Puts the `details` of a VALIDATION_ERROR under the right inputs, so a form
 * never parses an error envelope by hand. A field the form does not know about
 * becomes a form-level message, which is what a 409 on a duplicate looks like.
 */
export function applyServerErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: ApiError,
  knownFields: readonly string[],
): void {
  if (error.details.length === 0) {
    setError('root.server' as Path<T>, { type: 'server', message: error.message });
    return;
  }
  for (const detail of error.details) {
    const target = knownFields.includes(detail.field) ? detail.field : 'root.server';
    setError(target as Path<T>, { type: 'server', message: detail.issue });
  }
}
