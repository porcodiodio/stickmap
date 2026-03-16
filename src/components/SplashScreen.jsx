import { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onFinish, 800); // Final removal after fade out
    }, 2500); // Show for 2.5s

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a] transition-all duration-700 ease-in-out ${isExiting ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'}`}>
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-white/20 blur-[60px] rounded-full animate-pulse" />
        
        {/* The Square Icon with Animation */}
        <div className={`relative w-32 h-32 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl animate-splash-pop ${isExiting ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}>
          <img 
            src="/apple-touch-icon.png" 
            alt="Logo" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Subtle Text */}
        <div className={`mt-8 text-center transition-all duration-500 delay-200 ${isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <h1 className="text-white font-bold tracking-[0.2em] text-sm uppercase opacity-40">
            Milano Stickerini
          </h1>
        </div>
      </div>
    </div>
  );
}
