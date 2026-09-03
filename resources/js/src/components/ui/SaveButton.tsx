import React from 'react';

interface SaveButtonProps {
    isDirty?: boolean;
    isLocked?: boolean;
    processing?: boolean;
    onClick: () => void;
}

const SaveButton: React.FC<SaveButtonProps> = ({
    isDirty = false,
    isLocked = false,
    processing = false,
    onClick
}) => (
    <button
        onClick={onClick}
        disabled={isLocked || !isDirty || processing}
        className={`px-4 py-2 text-white text-sm font-medium rounded-md transition-colors ${
            isDirty && !processing ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'
        } disabled:bg-gray-400 disabled:cursor-not-allowed`}
    >
        {processing ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}
    </button>
);

export default SaveButton;

