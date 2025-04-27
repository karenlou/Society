'use client';

import React, { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a utility for classnames

interface TextInputProps {
  onSubmit: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
}

// Simple Paper Plane icon component
const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22V2L5 9l-3 3 10 10 3-3 7-7-7-7z" />
  </svg>
);

export const TextInput: React.FC<TextInputProps> = ({
  onSubmit,
  placeholder = 'Send a message...',
  isLoading = false,
  className,
}) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [value]);

  const handleSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (value.trim() && !isLoading) {
      onSubmit(value.trim());
      setValue(''); // Clear input after submit
      // Optionally reset height explicitly if needed
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Handle Shift+Enter for newline, Enter for submit
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default Enter behavior (newline)
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex items-end p-2 space-x-2 bg-white border-[0.5px] border-gray-200 rounded-lg w-[60px]',
        className
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={2}
        disabled={isLoading}
        className="flex-grow resize-none bg-transparent p-2 outline-none placeholder-gray-400 text-gray-900 text-sm max-h-40 overflow-y-auto"
        style={{ scrollbarWidth: 'none' }} // Hide scrollbar for Firefox
      />
      <button
        type="submit"
        disabled={isLoading || !value.trim()} // Disable if loading or empty
        className={cn(
          'p-2 rounded-md transition-colors',
          isLoading
            ? 'text-gray-400 cursor-not-allowed'
            : value.trim()
            ? 'bg-black text-white hover:bg-gray-800'
            : 'text-gray-400 cursor-not-allowed'
        )}
      >
        {/* Basic Send Icon or Loading indicator */} 
        {isLoading ? (
           <div className="w-5 h-5 border-2 border-t-transparent border-gray-400 rounded-full animate-spin"></div>
        ) : (
          <SendIcon className="w-5 h-5" />
        )}
      </button>
    </form>
  );
};
