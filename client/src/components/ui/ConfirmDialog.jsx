import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import { AlertTriangle, AlertCircle } from 'lucide-react';

/**
 * Standard confirmation dialog component.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {() => void} props.onConfirm
 * @param {string} [props.title='Confirm Action']
 * @param {string} props.message
 * @param {string} [props.confirmText='Confirm']
 * @param {string} [props.cancelText='Cancel']
 * @param {boolean} [props.isDanger=false]
 * @param {boolean} [props.loading=false]
 */
export function ConfirmDialog({
  isOpen,
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  variant,
  loading = false,
}) {
  const visible = isOpen ?? open;
  const danger = isDanger || variant === 'danger';
  const displayMessage = message || description;
  return (
    <Modal
      isOpen={visible}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3.5 py-1">
        {danger ? (
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 ring-1 ring-teal-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{displayMessage}</p>
        </div>
      </div>
    </Modal>
  );
}
