import React, { useState, useEffect } from 'react';

interface ImageUploaderProps {
  label?: string;
  value: File | string | null; // accept File or URL
  onChange: (file: File | null) => void;
  onUpload?: (file: File) => void; // triggers automatic upload
  error?: string;
  disabled?: boolean;
  className?: string; // optional container class
  aspectRatio?: number; // width / height
  height?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  value,
  onChange,
  onUpload,
  error,
  disabled,
  className = '',
  aspectRatio = 3 / 4,
  height = '10rem',
}) => {
  const [preview, setPreview] = useState<string | null>(typeof value === 'string' ? value : null);

  // Update preview when value changes
  useEffect(() => {
    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    } else if (typeof value === 'string') {
      setPreview(value);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      alert('Only JPG and PNG images are allowed.');
      e.target.value = '';
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('File size cannot exceed 3MB.');
      e.target.value = '';
      return;
    }

    onChange(file);
    if (file && onUpload) onUpload(file); // auto upload
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {label && <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>}

      <div
        className="relative group rounded-lg shadow-sm border bg-white overflow-hidden"
        style={{
          height: height,
          width: `calc(${height} * ${aspectRatio})`,
          maxWidth: '100%'
        }}
      >
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center w-full h-full">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="text-center text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xs mt-2">Passport Photo</p>
            </div>
          )}
        </div>

        {!disabled && (
          <label
            htmlFor="imageUpload"
            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 cursor-pointer flex items-center justify-center text-white text-sm rounded-lg transition-opacity"
          >
            <span className="opacity-0 group-hover:opacity-100 flex flex-col items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mb-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Change
            </span>
          </label>
        )}

        <input
          type="file"
          id="imageUpload"
          accept="image/png, image/jpeg"
          className="hidden"
          onChange={handleImageChange}
          disabled={disabled}
        />
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default ImageUploader;
