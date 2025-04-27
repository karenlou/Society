'use client';

import React, { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a utility for classnames

interface TextInputProps {
  onSubmit: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
}

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
    <div className={cn("flex flex-col items-center", className)}>
      <label 
        htmlFor="message-input"
        className="text-sm font-geist-mono uppercase
                   bg-[#2b2b2b] text-white 
                   px-4 py-1 rounded-full 
                   border border-[#4d4d4d] 
                   mb-5"
      >
        What is your message for Society?
      </label>
      <form
        onSubmit={handleSubmit}
        className={cn(
          'flex items-end p-2 space-x-2 bg-white/40 border-[0.5px] border-gray-200 rounded w-[500px] backdrop-filter backdrop-blur-md'
        )}
      >
        <textarea
          id="message-input"
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
          disabled={isLoading || !value.trim()}
          className={cn(
            'px-4 py-1 rounded-md transition-colors text-sm font-medium',
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : value.trim()
              ? 'bg-black text-white hover:bg-gray-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          )}
        >
          {isLoading ? (
             'Wait...'
          ) : (
            'Enter'
          )}
        </button>
      </form>
    </div>
  );
};
