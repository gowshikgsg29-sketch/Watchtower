import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-outline-variant';
        let icon = <Info className="w-5 h-5 text-primary" />;
        let glowClass = 'shadow-lg';

        if (toast.type === 'success') {
          borderClass = 'border-tertiary/40';
          icon = <CheckCircle2 className="w-5 h-5 text-tertiary shrink-0" />;
          glowClass = 'shadow-lg shadow-tertiary/10';
        } else if (toast.type === 'error') {
          borderClass = 'border-error/40';
          icon = <AlertTriangle className="w-5 h-5 text-error shrink-0" />;
          glowClass = 'shadow-lg shadow-error/15';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-surface-container-low border ${borderClass} ${glowClass} rounded-xl p-3.5 flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-bottom-2 fade-in duration-200`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-label-md font-semibold text-on-surface leading-tight">
                {toast.title}
              </h4>
              {toast.description && (
                <p className="text-body-sm text-outline mt-0.5 line-clamp-2">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-outline hover:text-on-surface p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
