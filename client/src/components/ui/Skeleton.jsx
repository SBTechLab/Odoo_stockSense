import clsx from 'clsx';

/**
 * Animated Skeleton placeholder component.
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded bg-zinc-200 dark:bg-zinc-800',
        className
      )}
      {...props}
    />
  );
}
