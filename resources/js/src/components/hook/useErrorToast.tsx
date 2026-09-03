import { useEffect } from 'react';
import { useToast } from '@/src/components/ui/Toast';

export const useErrorToast = (errors?: Record<string, string | string[]>) => {
    const { addToast } = useToast();

    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            Object.values(errors).forEach((msg) => {
                if (Array.isArray(msg)) {
                    msg.forEach((m) => addToast({ type: 'error', message: m }));
                } else {
                    addToast({ type: 'error', message: msg });
                }
            });
        }
    }, [errors, addToast]);
};
