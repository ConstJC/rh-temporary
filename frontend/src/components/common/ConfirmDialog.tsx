'use client';

import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  async function handleConfirm() {
    await onConfirm();
    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} aria-hidden />
      <div
        role="dialog"
        className="relative z-50 w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50',
              variant === 'destructive' ? 'bg-danger-600 hover:bg-danger-700' : 'bg-primary-700 hover:bg-primary-600'
            )}
          >
            {loading ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
