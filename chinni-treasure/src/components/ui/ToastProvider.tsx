"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  removing?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, removing: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => {
      const next = [...prev, { id, message, type }];
      if (next.length > 5) {
        const removal = next[0];
        if (!removal.removing) {
          next[0] = { ...removal, removing: true };
          setTimeout(() => {
            setToasts((p) => p.filter((t) => t.id !== removal.id));
          }, 300);
        }
      }
      return next;
    });

    setTimeout(() => {
      dismissToast(id);
    }, 5000);
  }, [dismissToast]);

  const iconMap = { success: "✓", error: "✕", info: "●" };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.type}`}
            role="alert"
            tabIndex={0}
            style={{
              opacity: t.removing ? "0" : "1",
              transform: t.removing ? "translateX(100px)" : "translateX(0)",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
          >
            <span>{iconMap[t.type]}</span> {t.message}
            <button
              className="toast-close"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                marginLeft: "12px",
                fontSize: "1rem",
                lineHeight: 1,
                opacity: 0.7,
                color: "inherit",
                padding: "4px 8px",
                minWidth: "36px",
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
