import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

interface AnimatedLogoProps {
  isLoading?: boolean; // New prop to detect if we're on loading screen
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ isLoading = false }) => {
  const [sunProgress, setSunProgress] = useState(0);
  const [moonProgress, setMoonProgress] = useState(0);
  const [isNightTime, setIsNightTime] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Check if it's night time (6 PM to 6 AM)
      const isNight = hours >= 18 || hours < 6;
      setIsNightTime(isNight);
      
      // Sun animation progress (0 = 5AM, 0.5 = 12:30PM, 1 = 8PM)
      if (hours >= 5 && hours < 20) {
        const totalMinutes = (hours - 5) * 60 + minutes;
        const progress = totalMinutes / (15 * 60); // 15 hours (5AM to 8PM)
        setSunProgress(progress);
      } else {
        setSunProgress(0); // Reset when not in day time
      }

      // Moon animation progress (0 = 5PM, 0.5 = 12AM, 1 = 7AM)
      if (hours >= 17 || hours < 7) {
        const totalMinutes = hours >= 17 ? (hours - 17) * 60 + minutes : (hours + 7) * 60 + minutes;
        const progress = totalMinutes / (14 * 60); // 14 hours (5PM to 7AM)
        setMoonProgress(progress);
      } else {
        setMoonProgress(0); // Reset when not in night time
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // If loading, show clean centered sun/moon without portal lines
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

  // Sun Y position: starts at -30px (5AM), peaks at 4.5px (12:30PM), then back to -30px (8PM)
  const sunY = -30 + (sunProgress <= 0.5 ? sunProgress * 112 : (1 - sunProgress) * 65);

  // Moon Y position: starts at 60px (5PM), peaks at 92.5px (12AM), then back to 60px (7AM)
  const moonY = 60 + (moonProgress <= 0.5 ? moonProgress * -75 : (1 - moonProgress) * 150);

  return (
    <div className="relative w-8 h-20 overflow-hidden animate-breathe">
      {/* Top portal line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-amber-200"
        style={{ marginLeft: '-32px', marginRight: '-16px' }} />
      {/* Bottom portal line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-amber-200"
        style={{ marginLeft: '-32px', marginRight: '-16px' }} />
      
      {/* Sun - slides into portal by 8PM */}
      <Sun
        className="absolute w-8 h-8 text-amber-200 transition-all duration-1000 ease-in-out"
        style={{
          transform: `translateY(${sunY}px) translateX(0px)`,
          opacity: sunProgress > 0 ? 1 : 0,
          filter: 'drop-shadow(0 0 6px rgba(255,248,220,0.7))'
        }}
      />

      {/* Moon - slides into portal by 7AM */}
      <Moon
        className="absolute w-8 h-8 text-amber-200 transition-all duration-1000 ease-in-out"
        style={{
          transform: `translateY(${moonY}px) translateX(0px)`,
          opacity: moonProgress > 0 ? 1 : 0,
          filter: 'drop-shadow(0 0 6px rgba(255,248,220,0.7))'
        }}
      />
    </div>
  );
};

export default AnimatedLogo;
