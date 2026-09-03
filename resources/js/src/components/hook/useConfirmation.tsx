import React, { useState } from 'react';
import ConfirmationModal from '@/src/components/ui/ConfirmationModal';

export interface ConfirmationOptions {
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  confirmButtonClass?: string;
  onConfirm: () => void;
}

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);

  const openConfirmation = (opts: ConfirmationOptions) => {
    setOptions(opts);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    options?.onConfirm?.();
    setIsOpen(false);
    setOptions(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setOptions(null);
  };

  const ConfirmationModalComponent = () => {
    if (!options) return null;

    return (
      <ConfirmationModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={options.title}
        confirmText={options.confirmText}
        confirmButtonClass={options.confirmButtonClass}
      >
        {options.message}
      </ConfirmationModal>
    );
  };

  return { openConfirmation, ConfirmationModalComponent };
};
