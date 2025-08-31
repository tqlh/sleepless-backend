import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  speed = 50, 
  onComplete,
  className = '' 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setShowCursor(true);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed + Math.random() * 30); // Add slight randomness to typing speed

      return () => clearTimeout(timer);
    } else {
      // Hide cursor after typing is complete
      const cursorTimer = setTimeout(() => {
        setShowCursor(false);
        if (onComplete) onComplete();
      }, 1000);

      return () => clearTimeout(cursorTimer);
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {showCursor && (
        <span className="animate-pulse text-amber-200/80 ml-0.5">|</span>
      )}
    </span>
  );
};

export default TypewriterText;