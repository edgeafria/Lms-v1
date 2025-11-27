// src/components/ServerAwake.tsx
import React, { useState, useEffect } from 'react';

// 🛠️ Replace with your actual Backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/v1';

const LOADING_MESSAGES = [
  "Connecting to Edges Africa...",
  "Establishing secure connection...",
  "Waking up the cloud server...",
  "Preparing your dashboard...",
  "Almost there..."
];

const ServerAwake: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isServerReady, setIsServerReady] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const wakeUpServer = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok && isMounted) {
          setIsServerReady(true);
        } else {
          throw new Error('Server starting...');
        }
      } catch (error) {
        // If failed, wait 2 seconds then try again
        // AND change the message to keep the user interested
        setTimeout(() => {
          if (isMounted) {
            setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
            wakeUpServer(); // Recursive call
          }
        }, 2000);
      }
    };

    wakeUpServer();

    return () => { isMounted = false; };
  }, []);

  // 🛑 Server Sleeping? Show the Skeleton
  if (!isServerReady) {
    return (
      <div className="min-h-screen w-screen flex flex-col bg-gray-50 font-sans overflow-hidden">
        
        {/* Navbar Skeleton */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-md opacity-80 animate-pulse"></div>
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        </div>

        <div className="flex-1 flex bg-gray-100">
          
          {/* Sidebar Skeleton (Hidden on Mobile) */}
          <div className="hidden lg:flex w-[260px] bg-white border-r border-gray-200 flex-col p-5 gap-4 h-full">
            <div className="w-full h-10 bg-gray-100 rounded mb-4"></div>
            <div className="w-full h-3 bg-gray-100 rounded"></div>
            <div className="w-full h-3 bg-gray-100 rounded"></div>
            <div className="w-3/4 h-3 bg-gray-100 rounded"></div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex items-center justify-center p-6">
            
            {/* Center Card */}
            <div className="bg-white p-10 rounded-xl shadow-sm text-center flex flex-col items-center gap-6 w-[90%] max-w-md">
              
              {/* Spinner */}
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 border-r-blue-500 rounded-full animate-spin"></div>
              
              <div>
                <h2 className="text-gray-800 font-bold text-xl mb-2">Edges Africa LMS</h2>
                
                {/* ✨ CHANGING TEXT HERE ✨ */}
                <p className="text-gray-500 text-sm font-medium animate-pulse transition-all duration-300">
                  {LOADING_MESSAGES[messageIndex]}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ✅ Server Ready? Render the real app
  return <>{children}</>;
};

export default ServerAwake;