import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import { AlertTriangle } from 'lucide-react';

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
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {isDanger && (
          <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        )}
        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
}
