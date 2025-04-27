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
  isCondensed?: boolean;
  onEdit?: () => void;
  initialValue?: string;
  onEditSubmit?: () => void;
}

export const TextInput: React.FC<TextInputProps> = ({
  onSubmit,
  onFileUpload,
  placeholder = 'Send a message...',
  isLoading = false,
  className,
  isCondensed = false,
  onEdit,
  initialValue = '',
  onEditSubmit,
}) => {
  const [value, setValue] = useState(initialValue);
  const [fileName, setFileName] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevIsLoadingRef = useRef<boolean | undefined>(undefined);

  // --- Loading State ---
  const [loadingMessage, setLoadingMessage] = useState('');
  const loadingMessages = [
    'Processing input...',
    'Analyzing message...',
    'Connecting to Society...',
    'Almost there...',
  ];
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  // --- End Loading State ---

  // Auto-resize textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [value]);

  // --- Loading Simulation Effect ---
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isLoading) {
      setLoadingMessageIndex(0); // Start from the first message
      setLoadingMessage(loadingMessages[0]);
      intervalId = setInterval(() => {
        setLoadingMessageIndex((prevIndex) => {
          const nextIndex = prevIndex + 1; // Cycle through messages once
          // Use modulo if you want infinite cycling: (prevIndex + 1) % loadingMessages.length;
          if (nextIndex < loadingMessages.length) {
            setLoadingMessage(loadingMessages[nextIndex]);
            return nextIndex;
          } else {
            // Optional: Stop interval or keep showing last message if needed
            if (intervalId) clearInterval(intervalId);
            return prevIndex; // Keep last index
          }
        });
      }, 1500); // Change message every 1.5 seconds
    } else {
      // Clear message when not loading
      setLoadingMessage('');
      setLoadingMessageIndex(0);
    }

    return () => {
      // Cleanup interval on component unmount or when isLoading changes
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading]); // Depend on isLoading
  // --- End Loading Simulation Effect ---

  // --- Clear Input on Loading Finish Effect ---
  useEffect(() => {
    // We'll leave this empty and handle clearing in a different way
    // to prevent layout shifts during the loading state
    
    // Just update the ref for future reference
    prevIsLoadingRef.current = isLoading;
  }, [isLoading]);
  // --- End Clear Input Effect ---

  // Initialize with initialValue when it changes
  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
    }
  }, [initialValue]);

  const handleSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (value.trim() && !isLoading) {
      if (isCondensed && onEditSubmit) {
        onEditSubmit();
      }
      onSubmit(value.trim());
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
    <div 
    className={cn(
        "relative flex flex-col items-start",
        "bg-white/40 backdrop-filter backdrop-blur-md",
        "transition-all duration-300 ease-in-out",
        "transform-gpu", // Added transform-gpu for smoother transitions
        isCondensed ? "py-3" : "py-6",
        "border border-gray-200 rounded",
        className
      )}
      style={{ 
        transformOrigin: 'top', // Ensuring transform origin is set in style too
        marginBottom: 'auto' // Prevents recentering by anchoring to the top
      }}
    >
      <div className={cn(
      "w-full transition-all duration-400 ease-out",
    )}>
      <label 
        htmlFor="message-input"
        className={cn(
          "text-sm font-geist-mono uppercase",
          "text-gray-700 dark:text-gray-300",
          "px-5",
          isCondensed ? "mb-0" : "mb-2"
        )}
      >
        {isCondensed ? "Your message:" : "What is your message for Society?"}
      </label>
      
      {/* Show textarea only when not condensed */}
      {!isCondensed && (
        <form
          onSubmit={handleSubmit}
          className={cn(
            'w-full max-w-[500px] px-5'
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
            className="w-full resize-none bg-transparent rounded outline-none placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white text-sm max-h-40 mb-5 overflow-y-auto"
            style={{ scrollbarWidth: 'none' }}
          />
        </form>
      )}
      
      {/* Show message display when condensed */}
      {isCondensed && (
        <div className="px-5 text-sm text-gray-800 font-medium overflow-hidden text-ellipsis w-[calc(100%-80px)]">
          {value}
        </div>
      )}

      {/* Loading message display */}
      {isLoading && (
        <div className="mt-3 px-5 text-sm text-gray-600 dark:text-gray-400 font-geist-mono animate-pulse">
          {loadingMessage || 'Processing...'} {/* Fallback message */}
        </div>
      )}
    </div>
      <button
        type="button"
        onClick={() => isCondensed ? onEdit?.() : handleSubmit()}
        disabled={isLoading || (!isCondensed && !value.trim())}
        className={cn(
          'absolute bottom-3 right-5',
          'px-4 py-1 rounded transition-colors text-sm font-medium flex items-center space-x-1',
          isLoading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : (isCondensed || value.trim())
            ? 'bg-black text-white hover:bg-[#262626]'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        )}
      >
        {isLoading ? (
           <span>Processing...</span> // Updated loading text
        ) : isCondensed ? (
          <span>Edit</span>
        ) : (
          <>
            <span>Enter</span>
            <span className="text-base">{ '\u23CE' }</span>
          </>
        )}
      </button>
    </div>
  );
};