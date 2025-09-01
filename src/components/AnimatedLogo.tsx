import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

interface AnimatedLogoProps {
  isLoading?: boolean; // New prop to detect if we're on loading screen
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ isLoading = false }) => {
  const [isNightTime, setIsNightTime] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      
      // Day time: 6 AM to 8 PM (show sun)
      // Night time: 8 PM to 6 AM (show moon)
      const isNight = hours >= 20 || hours < 6;
      setIsNightTime(isNight);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // If loading, show clean centered sun/moon
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative w-8 h-8 flex items-center justify-center">
          {isNightTime ? (
            // Night time - show glowing moon
            <div className="relative">
              <Moon
                className="w-8 h-8 text-amber-200"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(255,248,220,0.8)) drop-shadow(0 0 20px rgba(255,248,220,0.4))',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              />
              {/* Additional glow effect */}
              <div className="absolute inset-0 w-8 h-8 bg-amber-200/20 rounded-full blur-lg animate-pulse"></div>
            </div>
          ) : (
            // Day time - show glowing sun
            <div className="relative">
              <Sun
                className="w-8 h-8 text-amber-200"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(255,248,220,0.8)) drop-shadow(0 0 20px rgba(255,248,220,0.4))',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              />
              {/* Additional glow effect */}
              <div className="absolute inset-0 w-8 h-8 bg-amber-200/20 rounded-full blur-lg animate-pulse"></div>
            </div>
          )}
        </div>
        {/* Loading thoughts text */}
        <div className="text-amber-200 text-sm font-medium animate-pulse">
          Loading thoughts
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-8 h-20 animate-breathe">
      {/* Portal lines - now transparent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-transparent"
        style={{ marginLeft: '-32px', marginRight: '-16px' }} />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-transparent"
        style={{ marginLeft: '-32px', marginRight: '-16px' }} />
      
      {/* Sun/Moon in the center */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {isNightTime ? (
          // Night time - show moon with glow
          <div className="relative">
            <Moon
              className="w-8 h-8 text-amber-200 transition-opacity duration-1000"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(255,248,220,0.8)) drop-shadow(0 0 16px rgba(255,248,220,0.5)) drop-shadow(0 0 24px rgba(255,248,220,0.3))'
              }}
            />
            {/* Additional glow effect */}
            <div className="absolute inset-0 w-8 h-8 bg-amber-200/30 rounded-full blur-md"></div>
          </div>
        ) : (
          // Day time - show sun with glow
          <div className="relative">
            <Sun
              className="w-8 h-8 text-amber-200 transition-opacity duration-1000"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(255,248,220,0.8)) drop-shadow(0 0 16px rgba(255,248,220,0.5)) drop-shadow(0 0 24px rgba(255,248,220,0.3))'
              }}
            />
            {/* Additional glow effect */}
            <div className="absolute inset-0 w-8 h-8 bg-amber-200/30 rounded-full blur-md"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimatedLogo;
