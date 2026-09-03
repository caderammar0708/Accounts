
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { XMarkIcon, CheckCircleIcon, InformationCircleIcon } from '../icons/Icons';

type ToastType = 'success' | 'info' | 'error';

interface Toast {
    id: number;
    type: ToastType;
    message: string;
    title?: string;
}

interface ToastContextType {
    addToast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const ToastComponent: React.FC<{ toast: Toast; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, 5000); // Auto-dismiss after 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, [toast.id, onDismiss]);

    const typeClasses = {
        success: { bg: 'bg-green-50', text: 'text-green-800', icon: <CheckCircleIcon className="h-6 w-6 text-green-500" /> },
        info: { bg: 'bg-blue-50', text: 'text-blue-800', icon: <InformationCircleIcon className="h-6 w-6 text-blue-500" /> },
        error: { bg: 'bg-red-50', text: 'text-red-800', icon: <InformationCircleIcon className="h-6 w-6 text-red-500" /> },
    };

    const classes = typeClasses[toast.type];

    return (
        <div className={`max-w-sm w-full ${classes.bg} shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden`}>
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {classes.icon}
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        {toast.title && <p className={`text-sm font-medium ${classes.text}`}>{toast.title}</p>}
                        <p className={`mt-1 text-sm ${classes.text.replace('800', '600')}`}>{toast.message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button onClick={() => onDismiss(toast.id)} className={`inline-flex rounded-md p-1.5 ${classes.bg} text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}>
                            <span className="sr-only">Close</span>
                            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToastContainer: React.FC<{ toasts: Toast[]; onDismiss: (id: number) => void }> = ({ toasts, onDismiss }) => {
    return (
        <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {toasts.map((toast) => (
                    <ToastComponent key={toast.id} toast={toast} onDismiss={onDismiss} />
                ))}
            </div>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        setToasts((currentToasts) => [...currentToasts, { ...toast, id: Date.now() + Math.random() }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
    }, []);

    const contextValue = useMemo(() => ({ addToast }), [addToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
        </ToastContext.Provider>
    );
};
