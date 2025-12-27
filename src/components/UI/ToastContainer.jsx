import React, { useEffect } from "react";
import useUIStore from "../../store/uiStore";
import "./Toast.css";

const Toast = ({ id, message, type = "info", duration = 5000 }) => {
  const removeToast = useUIStore((state) => state.removeToast);

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, removeToast]);

  return (
    <div className={`toast toast--${type} glass-panel`}>
      <div className="toast__icon">
        {type === "error" && "🚫"}
        {type === "success" && "✅"}
        {type === "warning" && "⚠️"}
        {type === "info" && "ℹ️"}
      </div>
      <div className="toast__content">{message}</div>
      <button className="toast__close" onClick={() => removeToast(id)}>
        ×
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const toasts = useUIStore((state) => state.toasts);

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};
