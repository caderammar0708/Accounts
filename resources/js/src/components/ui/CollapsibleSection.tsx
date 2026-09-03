import React, { useState } from 'react';
import { ChevronDownIcon } from '../icons/Icons';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = false, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-md">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
        aria-expanded={isOpen}
      >
        <h3 className="text-md font-semibold text-gray-700">{title}</h3>
        <ChevronDownIcon className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}
        style={{ transitionProperty: 'max-height, padding, border', maxHeight: isOpen ? '1000px' : '0' }}
      >
        <div className={`p-4 border-t ${isOpen ? 'block' : 'hidden'}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;