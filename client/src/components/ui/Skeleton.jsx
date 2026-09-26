import clsx from 'clsx';

/**
 * Animated Skeleton placeholder component with subtle shimmer sweep effect.
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-md bg-zinc-150 dark:bg-zinc-800/80 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/30 dark:before:via-white/5 before:to-transparent',
        className
      )}
      {...props}
    />
  );
}
