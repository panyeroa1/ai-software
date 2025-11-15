
import React from 'react';
import { Icon } from '../Icon';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ value, onChange, onSubmit, placeholder, disabled }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) {
        onSubmit();
      }
    }
  };

  return (
    <div className="flex items-center p-2 bg-gray-100 dark:bg-secondary rounded-lg">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Type your message...'}
        disabled={disabled}
        rows={1}
        className="flex-1 w-full p-2 bg-transparent resize-none focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={onSubmit}
        disabled={disabled || value.trim() === ''}
        className="p-2 ml-2 text-white rounded-full bg-primary disabled:bg-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <Icon name="send" className="w-5 h-5" />
      </button>
    </div>
  );
};