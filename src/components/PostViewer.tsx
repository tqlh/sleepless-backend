import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Bookmark, Check, Trash2 } from 'lucide-react';
import { PostData } from '../types/Post';
import TypewriterText from './TypewriterText';
import { needsSupport, getSupportMessage, getRandomPostsExcludingRecent, addToPostHistory, getPreviousPost, removeFromPostHistory, addToRecentlyShown } from '../utils/postManager';

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
  const [currentPost, setCurrentPost] = useState<PostData | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [firstPostSeen, setFirstPostSeen] = useState(false);
  const [firstPostId, setFirstPostId] = useState<string | null>(null);

  // Initialize with first post
  useEffect(() => {
    if (posts.length > 0 && !currentPost) {
      const firstPost = posts[0];
      setCurrentPost(firstPost);
      setFirstPostId(firstPost.id);
    }
  }, [posts, currentPost]);

  // Notify parent of current post changes
  useEffect(() => {
    if (currentPost && onCurrentPostChange) {
      onCurrentPostChange(currentPost.id);
    }
  }, [currentPost, onCurrentPostChange]);

  const nextPost = useCallback(() => {
    if (posts.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      
      // Get random post excluding recent ones
      const randomPosts = getRandomPostsExcludingRecent(posts, 1);
      const newPost = randomPosts[0];
      
      if (newPost) {
        // Add current post to history before moving to next
        if (currentPost) {
          addToPostHistory(currentPost.id);
        }
        
        // Mark this post as recently seen
        addToRecentlyShown(newPost.id);
        
        setTimeout(() => {
          setCurrentPost(newPost);
          setIsTransitioning(false);
          
          // Mark that we've seen the first post after navigating
          if (firstPostId && newPost.id !== firstPostId) {
            setFirstPostSeen(true);
          }
        }, 150);
      }
    }
  }, [posts, isTransitioning, firstPostId, currentPost]);

  const previousPost = useCallback(() => {
    if (posts.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      
      // Get previous post from history
      const previousPost = getPreviousPost(posts);
      
      if (previousPost) {
        // Remove current post from history
        removeFromPostHistory();
        
        setTimeout(() => {
          setCurrentPost(previousPost);
          setIsTransitioning(false);
          
          // Mark that we've seen the first post after navigating
          if (firstPostId && previousPost.id !== firstPostId) {
            setFirstPostSeen(true);
          }
        }, 150);
      } else {
        // No history available, just get a random post
        const randomPosts = getRandomPostsExcludingRecent(posts, 1);
        const randomPost = randomPosts[0];
        
        if (randomPost) {
          addToRecentlyShown(randomPost.id);
          
          setTimeout(() => {
            setCurrentPost(randomPost);
            setIsTransitioning(false);
            
            if (firstPostId && randomPost.id !== firstPostId) {
              setFirstPostSeen(true);
            }
          }, 150);
        }
      }
    }
  }, [posts, isTransitioning, firstPostId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    console.log('handleDeleteClick called:', { isAdmin, onDeletePost, postId });
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
    if (days === 1) return 'last night';
    if (days <= 3) return 'a few nights ago';
    return 'several nights ago';
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

  // Memoize support message for current post with error handling
  const supportMessage = useMemo(() => {
    try {
      if (!currentPost || !currentPost.content) return null;
      
      const needsSupportResult = needsSupport(currentPost.content);
      if (!needsSupportResult) return null;
      
      const message = getSupportMessage(currentPost.content);
      return message;
    } catch (error) {
      console.error('Error in support message memoization:', error);
      return null;
    }
  }, [currentPost?.id, currentPost?.content]);

  if (posts.length === 0 || !currentPost) {
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
        
        <div className="absolute inset-0 bg-gradient-to-br from-amber-200/5 to-transparent rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
        
        <div className="relative bg-neutral-800/40 backdrop-blur-md rounded-2xl border border-neutral-700/40 shadow-2xl min-h-[200px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-200/3 via-transparent to-neutral-900/20 rounded-2xl"></div>
          
          <div className="relative z-10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-neutral-500">
                  <div 
                    className="w-2 h-2 rounded-full bg-amber-200/60"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8)) drop-shadow(0 0 12px rgba(251, 191, 36, 0.4))'
                    }}
                  ></div>
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
              <blockquote className="text-amber-50 leading-relaxed text-lg relative font-serif font-light">
                <div className="absolute -left-2 -top-1 text-2xl text-amber-200/30 font-serif">"</div>
                <p className={`pl-4 pr-3 transition-opacity duration-150 ${
                  isTransitioning ? 'opacity-40' : 'opacity-100'
                }`}>
                  {currentPost?.id === firstPostId && !firstPostSeen ? (
                    <TypewriterText 
                      key={currentPost.id}
                      text={currentPost?.content || ''}
                      speed={35}
                    />
                  ) : (
                    currentPost?.content || ''
                  )}
                </p>
                <div className="absolute -right-1 -bottom-2 text-2xl text-amber-200/30 font-serif">"</div>
              </blockquote>
              
              {/* Support Message - only appears when needed */}
              {supportMessage && (
                <div className={`mt-4 p-3 rounded-lg bg-amber-200/10 border border-amber-200/20 transition-opacity duration-150 ${
                  isTransitioning ? 'opacity-0' : 'opacity-100'
                }`}>
                  <p className="text-amber-200/80 text-xs">
                    {supportMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-amber-200/40 to-transparent"></div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center px-2">
        <button
          onClick={previousPost}
          disabled={posts.length === 0}
          className="flex items-center space-x-2 px-4 py-2 text-neutral-500 hover:text-neutral-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-300 hover:bg-neutral-800/30 rounded-lg group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="text-xs font-light tracking-wide">Previous</span>
        </button>
        
        <button
          onClick={nextPost}
          disabled={posts.length === 0}
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
