'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function SlideOver({ open, onClose, title, children, className, action }: SlideOverProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      
      <div
        role="dialog"
        aria-modal
        aria-labelledby="slideover-title"
        className={cn(
          'fixed right-0 top-2 bottom-2 z-50 flex h-auto w-full max-w-2xl flex-col rounded-l-2xl bg-white shadow-2xl',
          'animate-in slide-in-from-right duration-300',
          className
        )}
      >
        {/* Close button - positioned near the left edge of the panel */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -left-12 top-0 z-60 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-50"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6">
          <h2 id="slideover-title" className="text-xl font-semibold text-slate-900">
            {title}
          </h2>
          {action && <div>{action}</div>}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">{children}</div>
      </div>
    </div>
  );
}
