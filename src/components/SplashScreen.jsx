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
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-all duration-700 ease-in-out ${isExiting ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'}`}>
      <div className="w-full h-full relative flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onEnded={handleExit}
          className="w-full h-full object-cover sm:object-contain"
        >
          <source src="/intro.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
