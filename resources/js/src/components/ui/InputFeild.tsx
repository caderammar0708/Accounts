
import { toCamelCase } from '@/src/utils/formHelpers';
import React, { useRef, useEffect } from 'react';

declare global {
    interface Window {
        flatpickr: any;
    }
}

// Props definitions
interface DatePickerBaseProps {
  options?: object;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onClose?: () => void;
}

interface SingleDatePickerProps extends DatePickerBaseProps {
  mode?: 'single';
  value: Date | null;
  onChange: (date: Date | null) => void;
}

interface RangeDatePickerProps extends DatePickerBaseProps {
  mode: 'range';
  value: (Date | null)[];
  onChange: (dates: (Date | null)[]) => void;
}

type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps;

const DatePicker: React.FC<DatePickerProps> = (props) => {
  const { mode = 'single', value, onChange, options = {}, placeholder, className = '', disabled = false, onClose } = props;

  const inputRef = useRef<HTMLInputElement>(null);
  const fpInstanceRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!inputRef.current) return;

    const config = {
      ...options,
      dateFormat: 'Y-m-d',
      mode: mode,
      onClose: () => {
        if (onCloseRef.current) onCloseRef.current();
      },
      onChange: (selectedDates: Date[]) => {
        if (mode === 'range') {
          if (selectedDates.length >= 1) {
            (onChangeRef.current as RangeDatePickerProps['onChange'])([selectedDates[0], selectedDates[1] || null]);
          } else {
            (onChangeRef.current as RangeDatePickerProps['onChange'])([null, null]);
          }
        } else {
          (onChangeRef.current as SingleDatePickerProps['onChange'])(selectedDates[0] || null);
        }
      },
    };
    
    fpInstanceRef.current = window.flatpickr(inputRef.current, config);
    
    return () => {
      if (fpInstanceRef.current) {
        fpInstanceRef.current.destroy();
      }
    };
  }, [mode]); 

  useEffect(() => {
    if (!fpInstanceRef.current) return;
    
    if (mode === 'range') {
        const propVal = (value as (Date|null)[]).filter(d => d !== null) as Date[];
        fpInstanceRef.current.setDate(propVal, false);
    } else {
        const propVal = value;
        fpInstanceRef.current.setDate(propVal, false);
    }
  }, [value, mode]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder || (mode === 'range' ? 'Select date range...' : 'Select date...')}
      disabled={disabled}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
    />
  );
};

export default DatePicker;


// --- Reusable Form Components ---

interface FieldProps {
    label: string;
    error?: string;
    containerClassName?: string;
}

// InputField
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement>, FieldProps {
  // autoCamelCase?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({ label, name, error, containerClassName, ...props }) => {
  //  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //       let value = e.target.value;

  //       if (autoCamelCase) {
  //           value = toCamelCase(value);
  //       }

  //       if (onChange) {
  //           onChange({
  //               ...e,
  //               target: {
  //                   ...e.target,
  //                   value,
  //               },
  //           } as any);
  //       }
  //   };

    return (
        <div className={containerClassName}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
            <input
                id={name}
                name={name}
                {...props}
                // onChange={handleChange}
                className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'} ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${props.className || ''}`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

// SelectField
interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement>, FieldProps {
    children: React.ReactNode;
}

export const SelectField: React.FC<SelectFieldProps> = ({ label, name, error, children, containerClassName, ...props }) => {
    return (
        <div className={containerClassName}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
            <select
                id={name}
                name={name}
                {...props}
                className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'} ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${props.className || ''}`}
            >
                {children}
            </select>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

// TextareaField
interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}

// FIX: Update TextareaField to support ref forwarding using React.forwardRef.
export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(({ label, name, error, containerClassName, ...props }, ref) => {
    return (
        <div className={containerClassName}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
            <textarea
                id={name}
                name={name}
                ref={ref}
                {...props}
                className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'} ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${props.className || ''}`}
            ></textarea>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
});
TextareaField.displayName = 'TextareaField';

interface DateFieldProps extends FieldProps {
    value: Date | null;
    onChange: (date: Date | null) => void;
    placeholder?: string;
    disabled?: boolean;
    options?: object;
    className?: string;
}

export const DateField: React.FC<DateFieldProps> = ({
    label,
    error,
    value,
    onChange,
    placeholder,
    disabled = false,
    options = {},
    containerClassName,
    className = '',
}) => {
    return (
        <div className={containerClassName}>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="mt-1">
                <DatePicker
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder || 'Select date...'}
                    disabled={disabled}
                    options={options}
                    className={`block w-full border rounded-md shadow-sm p-2
                        ${error
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-green-500 focus:ring-green-500'}
                        ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
                        ${className}`}
                />
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

// MonthField
interface MonthFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>, FieldProps {
    value: string; // Format: 'YYYY-MM'
    onChange: (value: string) => void;
}

export const MonthField: React.FC<MonthFieldProps> = ({
    label,
    name,
    error,
    value,
    onChange,
    containerClassName,
    ...props
}) => {
    return (
        <div className={containerClassName}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
            <input
                type="month"
                id={name}
                name={name}
                value={value}
                onChange={e => onChange(e.target.value)}
                {...props}
                className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-green-500 focus:ring-green-500'} ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${props.className || ''}`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};
