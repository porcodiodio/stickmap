import { useEffect, useState, useRef } from 'react';

export default function SplashScreen({ onFinish }) {
  const [isExiting, setIsExiting] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Safety timeout in case video fails or is too long
    const timeout = setTimeout(() => {
      handleExit();
    }, 6000); // Max 6 seconds

    return () => clearTimeout(timeout);
  }, []);

  const handleExit = () => {
    setIsExiting(true);
    setTimeout(onFinish, 800);
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a] transition-all duration-700 ease-in-out ${isExiting ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'}`}>
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-white/10 blur-[60px] rounded-full animate-pulse" />
        
        {/* The Square Video Container */}
        <div className={`relative w-48 h-48 rounded-[40px] overflow-hidden border border-white/10 shadow-2xl animate-splash-pop bg-black ${isExiting ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onEnded={handleExit}
            className="w-full h-full object-cover"
          >
            <source src="/intro.mp4" type="video/mp4" />
          </video>
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
