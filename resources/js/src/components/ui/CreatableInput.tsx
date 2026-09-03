import React, { useState } from 'react';
import { Supplier } from '@/src/types';
import { PlusIcon } from '../icons/Icons';

interface CreatableInputProps {
    options: Supplier[];
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onCreate: (name: string) => void;
    placeholder?: string;
    name: string;
    disabled?: boolean;
}

const CreatableInput: React.FC<CreatableInputProps> = ({ options, value, onChange, onCreate, placeholder, name, disabled = false }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    const handleCreate = () => {
        if (newItemName.trim()) {
            onCreate(newItemName.trim());
            setNewItemName('');
            setIsCreating(false);
        }
    };
    
    return (
        <div className="space-y-2">
            <div className="flex items-center space-x-2">
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className="flex-1 block w-full border rounded-md shadow-sm p-2 border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                    <option value="">{placeholder || 'Select...'}</option>
                    {options.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={() => setIsCreating(prev => !prev)}
                    disabled={disabled}
                    className={`p-2 rounded-md ${isCreating ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed`}
                    title={isCreating ? "Cancel" : "Add new"}
                >
                    <PlusIcon className={`h-5 w-5 transition-transform ${isCreating ? 'rotate-45' : ''}`} />
                </button>
            </div>
            {isCreating && (
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="New item name..."
                        disabled={disabled}
                        className="flex-1 block w-full border rounded-md shadow-sm p-2 border-gray-300 disabled:bg-gray-100"
                    />
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={disabled}
                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm disabled:bg-gray-400"
                    >
                        Add
                    </button>
                </div>
            )}
        </div>
    );
};

export default CreatableInput;