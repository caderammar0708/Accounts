import React, { useState } from 'react';
import Modal from '@/Components/Modal';
import CommonButton from '@/Components/CommonButton';
import CommonInput from '@/Components/CommonInput';

export default function PinPromptModal({ isOpen, onClose, onSubmit, errorMessage }) {
    const [pin, setPin] = useState('');

    React.useEffect(() => {
        if (!isOpen) {
            setPin('');
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(pin);
        setPin(''); // Clear pin after submit
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="sm">
            <form onSubmit={handleSubmit} className="p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Books Locked</h2>
                <p className="text-sm text-gray-600 mb-4">
                    This transaction is on or before the books lock date. Please enter the 6-digit PIN to bypass the lock and modify it.
                </p>
                <div className="mb-4">
                    <CommonInput
                        type="password"
                        label="6-Digit PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        error={errorMessage}
                        maxLength={6}
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <CommonButton type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </CommonButton>
                    <CommonButton type="submit" variant="primary">
                        Submit PIN
                    </CommonButton>
                </div>
            </form>
        </Modal>
    );
}
