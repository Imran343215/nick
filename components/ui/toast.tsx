"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastKind = "success" | "error" | "info";

type ToastItem = { id: number; kind: ToastKind; message: string };

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** useToast() — show site-wide notifications from any client component.
 *
 *  const toast = useToast();
 *  toast.success("Brand created");
 *  toast.error("Could not save brand.");
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  // Fail-safe: components outside the provider silently no-op instead of crashing.
  if (!ctx) return { success: () => {}, error: () => {}, info: () => {} };
  return ctx;
}

const ICONS: Record<ToastKind, string> = { success: "✓", error: "!", info: "i" };

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      nextId.current += 1;
      const id = nextId.current;
      // Keep at most 4 on screen so the stack never floods.
      setToasts((current) => [...current.slice(-3), { id, kind, message }]);
      window.setTimeout(() => dismiss(id), kind === "error" ? 6000 : 4000);
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
      info: (message) => push("info", message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.kind}`}>
            <span className="toast__icon" aria-hidden="true">
              {ICONS[toast.kind]}
            </span>
            <p className="toast__msg">{toast.message}</p>
            <button
              type="button"
              className="toast__close"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}