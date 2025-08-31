import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { detectLanguage, moderateContent } from '../utils/postManager';
import TypingTextarea from './TypingTextarea';

interface PostFormProps {
  onSubmit: (content: string, language: string) => void;
  canPost: boolean;
  remainingPosts: number;
  onExpandChange: (expanded: boolean) => void;
}

const PostForm: React.FC<PostFormProps> = ({ onSubmit, canPost, remainingPosts, onExpandChange }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showTextarea, setShowTextarea] = useState(false);
  const [placeholderText, setPlaceholderText] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update placeholder based on time of day
  useEffect(() => {
    const getTimeBasedPlaceholders = () => {
      const hour = new Date().getHours();
      
      if (hour >= 5 && hour < 12) {
        // Morning (5 AM - 12 PM)
        return [
          "How did you sleep?",
          "What's your morning like?",
          "Ready for the day?",
          "How did the night treat you?",
          "What's on your mind today?",
          "Morning thoughts?",
          "How are you feeling today?",
          "What's happening today?",
          "Early bird thoughts?",
          "How's your morning going?"
        ];
      } else if (hour >= 12 && hour < 17) {
        // Afternoon (12 PM - 5 PM)
        return [
          "How's your day going?",
          "What's on your mind?",
          "Afternoon reflections?",
          "How are you doing?",
          "What's happening today?",
          "How's everything going?",
          "Midday thoughts?",
          "How are you feeling?",
          "What's going through your head?",
          "How's your afternoon?"
        ];
      } else if (hour >= 17 && hour < 22) {
        // Evening (5 PM - 10 PM)
        return [
          "How was your day?",
          "What's on your mind this evening?",
          "Ready to unwind?",
          "How are you feeling tonight?",
          "Evening thoughts?",
          "How did today treat you?",
          "What's going through your mind?",
          "How are you doing tonight?",
          "Time to decompress?",
          "How's your evening going?"
        ];
      } else {
        // Late night/early morning (10 PM - 5 AM)
        return [
          "What's keeping you up tonight?",
          "Can't sleep either?",
          "Still awake?",
          "Another sleepless night?",
          "What thoughts are swirling around?",
          "Mind racing again?",
          "How are you holding up?",
          "What's going through your head?",
          "Late night musings?",
          "Insomnia thoughts?",
          "What's on your restless mind?",
          "Still up thinking?"
        ];
      }
    };
    
    const placeholders = getTimeBasedPlaceholders();
    const randomIndex = Math.floor(Math.random() * placeholders.length);
    setPlaceholderText(placeholders[randomIndex]);
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setShowTextarea(false);
    onExpandChange(false);
    setTimeout(() => {
      setIsExpanded(false);
      setIsClosing(false);
      setContent('');
    }, 400);
  }, [onExpandChange]);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    onExpandChange(true);
    // Delay textarea appearance to let expansion animation start
    setTimeout(() => {
      setShowTextarea(true);
    }, 200);
  }, [onExpandChange]);

  // Handle click outside with memoized handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node) && isExpanded) {
        handleClose();
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, handleClose]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isExpanded) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(60, textareaRef.current.scrollHeight)}px`;
    }
  }, [content, isExpanded]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || content.length > 500) return;
    
    if (!moderateContent(content)) {
      alert('Your post contains content that cannot be published. Please revise and try again.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const language = detectLanguage(content);
      onSubmit(content.trim(), language);
      setContent('');
      handleClose();
    } catch (error) {
      console.error('Error submitting post:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [content, canPost, onSubmit, handleClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: allow new line (default behavior)
        return;
      } else {
        // Enter: submit form
        e.preventDefault();
        if (content.trim() && content.length <= 500 && canPost && !isSubmitting) {
          handleSubmit(e as any);
        }
      }
    }
  }, [content, canPost, isSubmitting, handleSubmit]);
  
  const getAnimationClass = useCallback(() => {
    if (isClosing) return 'animate-slide-up';
    if (isExpanded) return 'animate-slide-down';
    return '';
  }, [isClosing, isExpanded]);

  return (
    <div ref={formRef} className="relative">
      {/* Completely fixed placeholder text - independent of form */}
      <div className="absolute top-6 left-8 text-lg text-neutral-400 pointer-events-none z-30">
        {canPost ? placeholderText : "Daily limit reached"}
      </div>
      
      <div 
        className={`bg-neutral-800/60 backdrop-blur-sm rounded-2xl border border-neutral-700/50 overflow-hidden shadow-2xl transition-all duration-300 ${getAnimationClass()}`}
        style={{
          boxShadow: isExpanded 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 25px rgba(245, 230, 163, 0.08)' 
            : '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          height: isExpanded && !isClosing ? 'auto' : '80px',
          minHeight: isExpanded && !isClosing ? '200px' : '80px',
        }}
      >
        {/* Collapsed state - clickable area */}
        {!isExpanded && (
          <button
            onClick={handleExpand}
            className="w-full h-[80px] text-left px-8 hover:bg-neutral-700/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center absolute top-0 left-0 z-20"
          >
            {/* Invisible text to maintain click area but not interfere with fixed text */}
            <span className="opacity-0">placeholder</span>
          </button>
        )}

        {/* Expanded state - form */}
        {(isExpanded || isClosing) && (
          <div className="pt-16 px-6 pb-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {showTextarea && (
                <TypingTextarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={500}
                  autoFocus
                  className="w-full bg-transparent border-none text-neutral-300 placeholder-transparent resize-none focus:outline-none focus:ring-0 leading-relaxed text-lg min-h-[60px]"
                />
              )}
              
              {showTextarea && (
                <div className="flex justify-between items-center pt-2 border-t border-neutral-700/50">
                  <div className="flex items-center space-x-4 text-sm text-neutral-500">
  <span>{content.length}/500</span>
  <span>•</span>
  <span>Posts: {remainingPosts}/5</span>
</div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-neutral-400 hover:text-neutral-200 transition-all duration-200 text-sm hover:bg-neutral-700/20 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!content.trim() || content.length > 500 || !canPost || isSubmitting}
                      className="bg-amber-200/90 hover:bg-amber-200 disabled:bg-neutral-700/50 disabled:cursor-not-allowed text-neutral-900 font-medium py-2 px-5 rounded-lg transition-all duration-200 flex items-center text-sm hover:shadow-lg transform hover:scale-105"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <>
                          <Send className="w-3 h-3 mr-2" />
                          Post
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostForm;