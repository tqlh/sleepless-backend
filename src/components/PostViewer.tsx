import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Bookmark, Check, Trash2 } from 'lucide-react';
import { PostData } from '../types/Post';
import TypewriterText from './TypewriterText';

interface PostViewerProps {
  posts: PostData[];
  onBookmarkToggle: (postId: string) => void;
  showBookmarksOnly: boolean;
  lastViewedPostId?: string | null;
  onCurrentPostChange?: (postId: string) => void;
  isAdmin?: boolean;
  onDeletePost?: (postId: string) => void;
}

const PostViewer: React.FC<PostViewerProps> = ({ 
  posts, 
  onBookmarkToggle, 
  showBookmarksOnly, 
  lastViewedPostId,
  onCurrentPostChange,
  isAdmin = false,
  onDeletePost
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dotPosition, setDotPosition] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shuffledPosts, setShuffledPosts] = useState<PostData[]>([]);
  const [hasSeenFirstPost, setHasSeenFirstPost] = useState(false);

  // Memoize shuffled posts to prevent unnecessary re-shuffling
  const memoizedShuffledPosts = useMemo(() => {
    if (posts.length === 0) return [];
    return [...posts].sort(() => Math.random() - 0.5);
  }, [posts]);

  // Update shuffled posts and handle index changes
  useEffect(() => {
    setShuffledPosts(memoizedShuffledPosts);
    
    if (!showBookmarksOnly && lastViewedPostId && memoizedShuffledPosts.length > 0) {
      const lastViewedIndex = memoizedShuffledPosts.findIndex(post => post.id === lastViewedPostId);
      setCurrentIndex(lastViewedIndex >= 0 ? lastViewedIndex : 0);
    } else {
      setCurrentIndex(0);
    }
  }, [memoizedShuffledPosts, showBookmarksOnly, lastViewedPostId]);

  // Reset currentIndex when posts array changes
  useEffect(() => {
    if (shuffledPosts.length > 0 && currentIndex >= shuffledPosts.length) {
      setCurrentIndex(0);
    }
  }, [shuffledPosts, currentIndex]);

  const currentPost = shuffledPosts[currentIndex];

  // Notify parent of current post changes
  useEffect(() => {
    if (currentPost && onCurrentPostChange) {
      onCurrentPostChange(currentPost.id);
    }
  }, [currentPost, onCurrentPostChange]);

  const nextPost = useCallback(() => {
    if (shuffledPosts.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      if (currentIndex === 0) {
        setHasSeenFirstPost(true);
      }
      setDotPosition((prev) => (prev + 1) % 5);
      setTimeout(() => {
        setCurrentIndex((currentIndex + 1) % shuffledPosts.length);
        setIsTransitioning(false);
      }, 150);
    }
  }, [currentIndex, shuffledPosts.length, isTransitioning]);

  const previousPost = useCallback(() => {
    if (shuffledPosts.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setDotPosition((prev) => (prev - 1 + 5) % 5);
      setTimeout(() => {
        setCurrentIndex((currentIndex - 1 + shuffledPosts.length) % shuffledPosts.length);
        setIsTransitioning(false);
      }, 150);
    }
  }, [currentIndex, shuffledPosts.length, isTransitioning]);

  // Keyboard navigation with memoized handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with text input - only handle navigation when no input is focused
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        previousPost();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextPost();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previousPost, nextPost]);

  const handleBookmarkClick = useCallback((e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }
    onBookmarkToggle(postId);
  }, [onBookmarkToggle]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }
    if (isAdmin && onDeletePost) {
      onDeletePost(postId);
    }
  }, [isAdmin, onDeletePost]);

  const formatTimestamp = useCallback((timestamp: Date) => {
    if (!timestamp) return 'unknown time';
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'moments ago';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const days = Math.floor(diffInHours / 24);
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  }, []);

  // Touch/swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextPost();
    } else if (isRightSwipe) {
      previousPost();
    }
  };

  if (shuffledPosts.length === 0 || !currentPost) {
    return (
      <div className="text-center py-20">
        <div className="relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-amber-200/30 to-transparent"></div>
          
          <div className="bg-neutral-800/30 backdrop-blur-sm rounded-3xl p-12 border border-neutral-700/30 shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-200/20 to-amber-200/5 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-amber-200/20"></div>
            </div>
            
            <h3 className="text-neutral-200 mb-3 text-xl font-title italic">
              {showBookmarksOnly ? 'No saved thoughts' : 'Nothing here yet'}
            </h3>
            <p className="text-neutral-500 text-sm leading-relaxed">
              {showBookmarksOnly 
                ? 'Bookmark thoughts to save them for later.' 
                : 'Share what\'s on your mind.'}
            </p>
          </div>
          
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-amber-200/30 to-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Main Post Card */}
      <div 
        className="relative group"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent"></div>
        
        <div className="absolute inset-0 bg-gradient-to-br from-amber-200/5 to-transparent rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500 animate-card-fade-in"></div>
        
        <div className={`relative bg-neutral-800/40 backdrop-blur-md rounded-2xl border border-neutral-700/40 shadow-2xl min-h-[200px] overflow-hidden transition-all duration-300 ${
          isTransitioning ? 'opacity-70' : 'opacity-100'
        } animate-card-fade-in`}>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-200/3 via-transparent to-neutral-900/20 rounded-2xl"></div>
          
          <div className="relative z-10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-neutral-500">
                  <div className="w-2 h-2 rounded-full bg-amber-200/60"></div>
                  <span className="text-xs font-light tracking-wide">{formatTimestamp(currentPost?.timestamp)}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => handleBookmarkClick(e, currentPost.id)}
                  className="group/bookmark p-2 text-neutral-500 hover:text-amber-200 transition-all duration-300 hover:bg-amber-200/10 rounded-full"
                  title={currentPost?.isBookmarked ? 'Remove bookmark' : 'Save this thought'}
                >
                  {currentPost?.isBookmarked ? (
                    <Bookmark className="w-4 h-4 text-amber-200 drop-shadow-sm fill-current" />
                  ) : (
                    <Bookmark className="w-4 h-4 group-hover/bookmark:scale-110 transition-transform duration-200" />
                  )}
                </button>
                
                {/* Admin delete button - only shows when isAdmin is true */}
                {isAdmin && onDeletePost && (
                  <button
                    onClick={(e) => handleDeleteClick(e, currentPost.id)}
                    className="p-2 text-neutral-500 hover:text-red-400 transition-all duration-300 hover:bg-red-400/10 rounded-full"
                    title="Delete post (admin only)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <blockquote className="text-neutral-300 leading-relaxed text-lg relative font-serif">
                <div className="absolute -left-2 -top-1 text-2xl text-amber-200/30 font-serif">"</div>
                <p className="pl-4 pr-3">
                  {currentIndex === 0 && !hasSeenFirstPost ? (
                    <TypewriterText 
                      key={currentPost.id}
                      text={currentPost?.content || ''}
                      speed={40}
                    />
                  ) : (
                    currentPost?.content || ''
                  )}
                </p>
                <div className="absolute -right-1 -bottom-2 text-2xl text-amber-200/30 font-serif">"</div>
              </blockquote>
            </div>
          </div>
        </div>
        
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent"></div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center px-2">
        <button
          onClick={previousPost}
          disabled={shuffledPosts.length === 0}
          className="flex items-center space-x-2 px-4 py-2 text-neutral-500 hover:text-neutral-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-300 hover:bg-neutral-800/30 rounded-lg group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="text-xs font-light tracking-wide">Previous</span>
        </button>
        
        {/* Sliding dot indicator */}
        <div className="flex items-center space-x-3">
          {/* Simple 5-dot indicator */}
          <div className="relative flex items-center space-x-2">
            {/* Background dots */}
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full bg-neutral-500/60 border border-neutral-400/20"
              />
            ))}
            
            {/* Moving active dot */}
            <div 
              className="absolute w-2 h-2 rounded-full bg-amber-200 shadow-lg shadow-amber-200/50 transition-transform duration-300 ease-out border border-amber-100/30"
              style={{
                transform: `translateX(${dotPosition * 16 - 8}px)`
              }}
            />
          </div>
        </div>
        
        <button
          onClick={nextPost}
          disabled={shuffledPosts.length === 0}
          className="flex items-center space-x-2 px-4 py-2 text-neutral-500 hover:text-neutral-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-300 hover:bg-neutral-800/30 rounded-lg group"
        >
          <span className="text-xs font-light tracking-wide">Next</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </div>
      
      <div className="text-center mt-4">
        <p className="text-neutral-600 text-xs tracking-wider">
          Navigate with arrow keys or swipe • Thoughts saved locally
        </p>
      </div>
    </div>
  );
};

export default PostViewer;