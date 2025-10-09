import React, { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';

const ToastContext = createContext(null);

export const useToast = () => {
  return useContext(ToastContext);
};

const Toast = ({ id, message, type }) => {
  const bg = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-indigo-600';
  return (
    <div className={`text-white px-4 py-2 rounded shadow-md ${bg} mb-2`} role="status" aria-live="polite">
      {message}
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div aria-live="polite" className="fixed top-4 right-4 z-50 w-80 pointer-events-none">
          <div className="pointer-events-auto">
            {toasts.map((t) => (
              <Toast key={t.id} id={t.id} message={t.message} type={t.type} />
            ))}
          </div>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
