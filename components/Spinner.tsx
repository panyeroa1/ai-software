
import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-solid border-primary border-t-transparent`}
      ></div>
      {text && <p className="text-gray-500 dark:text-gray-400">{text}</p>}
    </div>
  );
};
