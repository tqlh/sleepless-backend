import React, { useState, useRef, useEffect, forwardRef } from 'react';

interface TypingTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
  maxLength?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}

const TypingTextarea = forwardRef<HTMLTextAreaElement, TypingTextareaProps>(({
  value,
  onChange,
  onKeyDown,
  className = '',
  maxLength,
  disabled,
  autoFocus,
  placeholder = ''
}, ref) => {
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const lastValueRef = useRef('');
  const cursorPositionRef = useRef(0);

  // Combine refs
  const combinedRef = (node: HTMLTextAreaElement) => {
    textareaRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(60, textareaRef.current.scrollHeight)}px`;
    }
  }, [value]);

  // Handle typing animation
  useEffect(() => {
    if (value === lastValueRef.current) return;
    
    const isDeleting = value.length < lastValueRef.current.length;
    const isAdding = value.length > lastValueRef.current.length;
    
    if (isDeleting) {
      // Instant deletion
      setIsTyping(false);
      lastValueRef.current = value;
      return;
    }
    
    if (isAdding) {
      setIsTyping(true);
      
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Store cursor position before animation
      if (textareaRef.current) {
        cursorPositionRef.current = textareaRef.current.selectionStart;
      }
      
      // Animate typing for new characters
      const startIndex = lastValueRef.current.length;
      const endIndex = value.length;
      let currentCharIndex = startIndex;
      
      const typeNextChar = () => {
        if (currentCharIndex < endIndex) {
          currentCharIndex++;
          
          // Variable typing speed - faster for spaces, slower for punctuation
          const char = value[currentCharIndex - 1];
          let delay = 50; // Base delay
          
          if (char === ' ') delay = 30;
          else if (['.', ',', '!', '?', ';', ':'].includes(char)) delay = 150;
          else if (char === '\n') delay = 100;
          else delay = 40 + Math.random() * 40; // 40-80ms variation
          
          typingTimeoutRef.current = setTimeout(typeNextChar, delay);
        } else {
          setIsTyping(false);
          // Restore cursor position after animation
          if (textareaRef.current) {
            setTimeout(() => {
              textareaRef.current?.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
            }, 0);
          }
        }
      };
      
      typeNextChar();
    }
    
    lastValueRef.current = value;
  }, [value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Store cursor position
    cursorPositionRef.current = e.target.selectionStart;
    onChange(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow normal typing behavior
    if (e.key === 'Backspace' || e.key === 'Delete') {
      setIsTyping(false);
    }
    
    // Call parent's keyDown handler if provided
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <textarea
      ref={combinedRef}
      value={value} // Use actual value instead of displayValue
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className={className}
      maxLength={maxLength}
      disabled={disabled}
      autoFocus={autoFocus}
      placeholder={placeholder}
    />
  );
});

TypingTextarea.displayName = 'TypingTextarea';

export default TypingTextarea;
