import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationToast from '../components/NotificationToast';

interface ToastNotification {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'task_updated';
  title: string;
  message: string;
  senderName?: string;
}

interface ToastContextType {
  showToast: (notification: Omit<ToastNotification, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback((notification: Omit<ToastNotification, 'id'>) => {
    console.log('🍞 Toast triggered:', notification);
    const id = Date.now().toString() + Math.random().toString(36);
    const newToast: ToastNotification = {
      id,
      ...notification
    };

    setToasts(prev => {
      console.log('🍞 Adding toast, current count:', prev.length);
      return [...prev, newToast];
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Render all toasts stacked */}
      <div className="fixed top-4 right-4 z-[10000] space-y-3 pointer-events-none">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="pointer-events-auto"
            style={{ marginTop: index > 0 ? '12px' : '0' }}
          >
            <NotificationToast
              id={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              senderName={toast.senderName}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
