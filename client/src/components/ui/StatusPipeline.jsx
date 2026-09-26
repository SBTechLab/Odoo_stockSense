import clsx from 'clsx';
import { Check } from 'lucide-react';

/**
 * StatusPipeline stepper component for document forms.
 *
 * @param {Object} props
 * @param {Array<{ id: string, label: string }>} props.steps
 * @param {string} props.currentStep
 * @param {(stepId: string) => void} [props.onStepClick]
 * @param {string} [props.className]
 */
export function StatusPipeline({
  steps = [],
  currentStep,
  onStepClick,
  className,
}) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div
      className={clsx(
        'inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs select-none',
        className
      )}
    >
      {steps.map((step, idx) => {
        const isCurrent = step.id === currentStep;
        const isPast = currentIndex > idx;
        const isFuture = currentIndex < idx;

        return (
          <div
            key={step.id}
            onClick={() => onStepClick?.(step.id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-r last:border-r-0 border-zinc-200 dark:border-zinc-800',
              onStepClick && 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800',
              isCurrent &&
                'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold',
              isPast && 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20',
              isFuture && 'text-zinc-400 dark:text-zinc-600'
            )}
          >
            {isPast ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <span
                className={clsx(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px]',
                  isCurrent
                    ? 'bg-teal-600 text-white font-bold'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                )}
              >
                {idx + 1}
              </span>
            )}
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
