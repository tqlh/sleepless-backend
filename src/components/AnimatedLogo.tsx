import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

const AnimatedLogo: React.FC = () => {
  const [sunProgress, setSunProgress] = useState(0);
  const [moonProgress, setMoonProgress] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
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