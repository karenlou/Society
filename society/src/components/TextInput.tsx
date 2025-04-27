'use client';

import React, { useState, useRef, useEffect, FormEvent, KeyboardEvent, ChangeEvent } from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a utility for classnames
import { MediaType } from '@/lib/api';

interface TextInputProps {
  onSubmit: (value: string) => void;
  onFileUpload?: (file: File, mediaType: MediaType) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  onSubmit,
  onFileUpload,
  placeholder = 'Send a message...',
  isLoading = false,
  className,
}) => {
  const [value, setValue] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!onFileUpload || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setFileName(file.name);
    
    // Determine media type based on file MIME type
    let mediaType: MediaType;
    if (file.type.startsWith('video/')) {
      mediaType = MediaType.VIDEO;
    } else if (file.type.startsWith('audio/')) {
      mediaType = MediaType.AUDIO;
    } else if (file.type.startsWith('image/')) {
      mediaType = MediaType.IMAGE;
    } else {
      alert('Unsupported file type. Please upload a video, audio, or image file.');
      return;
    }
    
    onFileUpload(file, mediaType);
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
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
          placeholder={fileName ? `File selected: ${fileName}` : placeholder}
          rows={2}
          disabled={isLoading}
          className="flex-grow resize-none bg-transparent p-2 outline-none placeholder-gray-400 text-gray-900 text-sm max-h-40 overflow-y-auto"
          style={{ scrollbarWidth: 'none' }} // Hide scrollbar for Firefox
        />
        
        {/* Hidden file input */}
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*, video/*, audio/*"
        />
        
        {/* Attach file button */}
        {onFileUpload && (
          <button
            type="button"
            onClick={handleAttachClick}
            disabled={isLoading}
            className={cn(
              'p-2 rounded-md transition-colors',
              isLoading
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-200'
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
        )}
        
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
