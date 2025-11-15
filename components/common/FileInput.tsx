
import React, { useRef, useState } from 'react';
import { Icon } from '../Icon';

interface FileInputProps {
  onFileSelect: (file: File) => void;
  accept: string;
  label: string;
}

export const FileInput: React.FC<FileInputProps> = ({ onFileSelect, accept, label }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        <Icon name="upload" className="w-5 h-5 mr-2" />
        {label}
      </button>
      {fileName && <p className="mt-2 text-sm text-center text-gray-500">{fileName}</p>}
    </div>
  );
};
