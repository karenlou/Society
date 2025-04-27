'use client';

import React from 'react';

export default function Chat2() {
  return (
    <div className="fixed bottom-0 left-0 right-0 px-0 pb-2 z-20">
      <input
        type="text"
        placeholder="Type your message..."
        className="w-full p-2 focus:outline-none bg-transparent text-black placeholder:text-gray-500 border-t border-gray-200 px-4"
      />
    </div>
  );
}