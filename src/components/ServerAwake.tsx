import React, { useState, useEffect } from 'react';
import { Book, GraduationCap, Lightbulb, PenTool } from 'lucide-react';

// 🛠️ Replace with your actual Backend URL
// Ensure no trailing slash if your logic adds one later
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.edgesafrica.org/v1';

const LOADING_MESSAGES = [
  "Initializing secure connection...",
  "Syncing with Edges Africa cloud...",
  "Preparing your digital classroom...",
  "Verifying student credentials...",
  "Almost there..."
];

const ServerAwake: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isServerReady, setIsServerReady] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);

  // 15 seconds before showing the "Force Enter" button
  // (Faster than the HTML loader because if React is loaded, we expect the API to be ready soon)
  const MAX_ATTEMPTS = 5; 

  useEffect(() => {
    let isMounted = true;

    const wakeUpServer = async () => {
      // 🛑 ESCAPE HATCH: If we've tried 5 times, let the user in.
      // The AuthProvider will handle the actual error state inside.
      if (attempt >= MAX_ATTEMPTS) {
        if (isMounted) setIsServerReady(true);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok && isMounted) {
          setIsServerReady(true);
        } else {
          throw new Error('Server starting...');
        }
      } catch (error) {
        // Retry logic
        setTimeout(() => {
          if (isMounted) {
            setAttempt(prev => prev + 1);
            setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
          }
        }, 2000); // Check every 2 seconds
      }
    };

    wakeUpServer();

    return () => { isMounted = false; };
  }, [attempt]);

  // 🛑 Server Sleeping? Show the "Netflix-Style" Animation
  if (!isServerReady) {
    return (
      <div className="min-h-screen w-screen flex flex-col bg-gray-50 font-sans overflow-hidden relative">
        
        {/* Navbar Skeleton (Matches index.html) */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20 relative">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-500/20 rounded-md opacity-50"></div>
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        </div>

        <div className="flex-1 flex bg-gray-100 relative overflow-hidden">
          
          {/* 1. AMBIENT BLOBS (High Visibility) */}
          <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] bg-green-300 rounded-full blur-[50px] opacity-50 animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] bg-yellow-300 rounded-full blur-[50px] opacity-50 animate-pulse delay-1000"></div>

          {/* 2. FLOATING ICONS (Matches index.html positions) */}
          <Book className="absolute top-[15%] left-[10%] w-[120px] h-[120px] text-primary-500 opacity-10 animate-bounce duration-[3000ms]" />
          <GraduationCap className="absolute bottom-[20%] right-[10%] w-[140px] h-[140px] text-tech-500 opacity-10 animate-bounce delay-1000 duration-[4000ms]" />
          <Lightbulb className="absolute top-[20%] right-[20%] w-[80px] h-[80px] text-secondary-500 opacity-10 animate-bounce delay-2000 duration-[3500ms]" />
          <PenTool className="absolute bottom-[15%] left-[20%] w-[90px] h-[90px] text-primary-500 opacity-10 animate-bounce delay-3000 duration-[4500ms]" />

          {/* Sidebar Skeleton */}
          <div className="hidden lg:flex w-[260px] bg-white border-r border-gray-200 flex-col p-5 gap-4 h-full z-20 relative">
            <div className="w-full h-10 bg-gray-100 rounded mb-4"></div>
            <div className="w-full h-3 bg-gray-100 rounded"></div>
            <div className="w-full h-3 bg-gray-100 rounded"></div>
            <div className="w-full h-3 bg-gray-100 rounded"></div>
            <div className="w-3/4 h-3 bg-gray-100 rounded"></div>
          </div>

          {/* 3. CENTER STAGE (The "Netflix" Effect) */}
          <div className="flex-1 flex items-center justify-center p-6 z-10 relative">
            
            <div className="flex flex-col items-center gap-8 w-[90%] max-w-md text-center relative z-10">
              
              {/* 🖼️ LOGO + RIPPLE */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Immediate Ping (Signal) */}
                <div className="absolute inset-0 rounded-full border-2 border-primary-500/40 opacity-0 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                <div className="absolute inset-0 rounded-full border-2 border-primary-500/40 opacity-0 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] delay-500"></div>
                
                {/* The Logo */}
                <img 
                  src="/logo-color.png" 
                  alt="Loading..." 
                  className="relative z-10 w-28 h-auto object-contain drop-shadow-xl animate-pulse" 
                />
              </div>
              
              <div className="w-full space-y-4">
                <h2 className="text-gray-800 font-headline font-bold text-2xl tracking-tight">
                  Edges Africa
                </h2>
                
                {/* Dynamic Message */}
                <div className="h-6 overflow-hidden">
                   <p className="text-gray-500 text-sm font-medium animate-pulse transition-all duration-300">
                    {LOADING_MESSAGES[messageIndex]}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden max-w-[200px] mx-auto">
                  <div className="h-full bg-primary-500 rounded-full w-full origin-left animate-[grow_2s_ease-in-out_infinite]"></div>
                </div>
              </div>

              {/* Manual Button (Appears after 10s) */}
              {attempt > 4 && (
                <button 
                  onClick={() => setIsServerReady(true)}
                  className="mt-2 text-xs bg-white border border-primary-200 text-primary-600 px-5 py-2 rounded-full hover:bg-primary-50 font-medium transition-colors shadow-sm animate-in fade-in zoom-in"
                >
                  Connection slow? Click to enter.
                </button>
              )}
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