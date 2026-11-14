import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  success: () => { },
  error: () => { },
  info: () => { },
  warning: () => { },
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = useCallback((title: string, message?: string) => addToast('success', title, message), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast('error', title, message), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast('info', title, message), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast('warning', title, message), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-20 md:bottom-5 right-3 sm:right-5 z-50 flex flex-col gap-2 max-w-[calc(100vw-24px)] sm:max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const borderClass =
            t.type === 'success'
                ? 'border-emerald-500/40'
                : t.type === 'error'
                    ? 'border-rose-500/40'
                    : t.type === 'warning'
                  ? 'border-amber-500/40'
          : 'border-blue-500/40';

        const icon =
        t.type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        ) : t.type === 'error' ? (
        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
        ) : t.type === 'warning' ? (
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        ) : (
        <Info className="w-5 h-5 text-blue-500 shrink-0" />
        );

        const progressColor =
        t.type === 'success'
        ? 'bg-emerald-500'
        : t.type === 'error'
        ? 'bg-rose-500'
        : t.type === 'warning'
        ? 'bg-amber-500'
        : 'bg-blue-500';

        return (
        <div
          key={t.id}
          className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 p-3.5 pb-4 rounded-xl bg-card border ${borderClass} shadow-xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2`}
        >
          {icon}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary">{t.title}</p>
            {t.message && <p className="text-[11px] text-text-secondary mt-0.5 break-words">{t.message}</p>}
          </div>
          <button
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss notification"
            className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Moving Countdown Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-border/50 overflow-hidden">
              <div
                className={`h-full ${progressColor} animate-toast-progress`}
              />
            </div>
          </div>
          );
        })}
        </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

