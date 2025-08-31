import React, { useState } from 'react';
import { Moon, Sun, Clock } from 'lucide-react';

const TimePreview: React.FC = () => {
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());

  const calculatePositions = (hour: number) => {
    // Convert hour to progress through 24-hour cycle (0-1)
    const progress = hour / 24;
    
    // Sun: visible from 6am (0.25) to 6pm (0.75)
    const sunProgress = Math.max(0, Math.min(1, (progress - 0.25) / 0.5));
    const moonProgress = progress < 0.25 || progress > 0.75 
      ? (progress < 0.25 ? (progress + 0.25) / 0.5 : (progress - 0.75) / 0.5)
      : 0;

    // Calculate vertical positions (arc movement)
    const sunY = Math.sin(sunProgress * Math.PI) * -24;
    const moonY = Math.sin(moonProgress * Math.PI) * -24;

    // Calculate opacity
    const sunOpacity = progress >= 0.25 && progress <= 0.75 
      ? Math.max(0.7, Math.sin(sunProgress * Math.PI) * 0.3 + 0.7)
      : 0.1;
    
    const moonOpacity = progress < 0.25 || progress > 0.75
      ? Math.max(0.7, Math.sin(moonProgress * Math.PI) * 0.3 + 0.7)
      : 0.1;

    return { sunY, moonY, sunOpacity, moonOpacity };
  };

  const { sunY, moonY, sunOpacity, moonOpacity } = calculatePositions(selectedHour);

  const timeSlots = [
    { hour: 0, label: 'Midnight' },
    { hour: 3, label: '3 AM' },
    { hour: 6, label: '6 AM' },
    { hour: 9, label: '9 AM' },
    { hour: 12, label: 'Noon' },
    { hour: 15, label: '3 PM' },
    { hour: 18, label: '6 PM' },
    { hour: 21, label: '9 PM' },
  ];

  return (
    <div className="bg-neutral-800/40 backdrop-blur-sm rounded-2xl border border-neutral-700/40 p-6 mb-8">
      <div className="text-center mb-6">
        <h3 className="text-xl font-light text-amber-200/90 mb-2 flex items-center justify-center gap-2">
          <Clock className="w-5 h-5" />
          Logo Time Preview
        </h3>
        <p className="text-neutral-500 text-sm">See how the logo changes throughout the day</p>
      </div>

      {/* Current time display */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center bg-neutral-700/30 rounded-xl p-4 border border-neutral-600/30">
          <div className="relative w-8 h-8 overflow-visible mr-4">
            {/* Sun */}
            <Sun 
              className="absolute w-8 h-8 text-amber-200 transition-all duration-500 ease-in-out"
              style={{
                transform: `translateY(${sunY}px)`,
                opacity: sunOpacity,
                filter: `drop-shadow(0 0 ${sunOpacity * 6}px rgba(245,230,163,${sunOpacity * 0.7}))`
              }}
            />
            
            {/* Moon */}
            <Moon 
              className="absolute w-8 h-8 text-amber-200 transition-all duration-500 ease-in-out"
              style={{
                transform: `translateY(${moonY}px)`,
                opacity: moonOpacity,
                filter: `drop-shadow(0 0 ${moonOpacity * 6}px rgba(245,230,163,${moonOpacity * 0.7}))`
              }}
            />
          </div>
          <div className="text-left">
            <div className="text-lg font-medium text-neutral-200">
              {selectedHour.toString().padStart(2, '0')}:00
            </div>
            <div className="text-xs text-neutral-500">
              {selectedHour < 12 ? 'AM' : 'PM'}
            </div>
          </div>
        </div>
      </div>

      {/* Time slider */}
      <div className="mb-6">
        <input
          type="range"
          min="0"
          max="23"
          value={selectedHour}
          onChange={(e) => setSelectedHour(parseInt(e.target.value))}
          className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, 
              #1f2937 0%, 
              #1f2937 ${(6/24)*100}%, 
              #f5e6a3 ${(6/24)*100}%, 
              #f5e6a3 ${(18/24)*100}%, 
              #1f2937 ${(18/24)*100}%, 
              #1f2937 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-neutral-500 mt-2">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>12 AM</span>
        </div>
      </div>

      {/* Quick time buttons */}
      <div className="grid grid-cols-4 gap-2">
        {timeSlots.map(({ hour, label }) => (
          <button
            key={hour}
            onClick={() => setSelectedHour(hour)}
            className={`px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
              selectedHour === hour
                ? 'bg-amber-200/20 text-amber-200 border border-amber-200/30'
                : 'bg-neutral-700/30 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="text-center mt-4">
        <p className="text-neutral-600 text-xs">
          The logo follows real time - currently showing {new Date().getHours().toString().padStart(2, '0')}:00
        </p>
      </div>
    </div>
  );
};

export default TimePreview;