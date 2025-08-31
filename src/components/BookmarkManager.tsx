import React, { useCallback } from 'react';
import { PostData } from '../types/Post';
import { Bookmark, Check } from 'lucide-react';

interface BookmarkManagerProps {
  posts: PostData[];
  onBookmarkToggle: (postId: string) => void;
}

const BookmarkManager: React.FC<BookmarkManagerProps> = ({ posts, onBookmarkToggle }) => {
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

  const handleBookmarkClick = useCallback((e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onBookmarkToggle(postId);
  }, [onBookmarkToggle]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-light text-amber-200/90 mb-2">Saved Whispers</h2>
        <p className="text-neutral-500 text-sm">{posts.length} thoughts preserved</p>
      </div>

      {/* List of bookmarked posts */}
      <div className="space-y-3">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="group relative bg-neutral-800/30 backdrop-blur-sm rounded-xl border border-neutral-700/30 p-4 hover:bg-neutral-800/40 hover:border-neutral-600/40 transition-all duration-300"
          >
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-200/2 via-transparent to-amber-200/1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="relative z-10">
              {/* Header with timestamp and bookmark */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 text-neutral-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-200/60"></div>
                  <span className="text-xs font-light tracking-wide">{formatTimestamp(post.timestamp)}</span>
                </div>
                
                <button
                  onClick={(e) => handleBookmarkClick(e, post.id)}
                  className="p-1.5 text-amber-200 hover:text-amber-100 transition-all duration-200 hover:bg-amber-200/10 rounded-full group/bookmark"
                  title="Remove bookmark"
                >
                  <Bookmark className="w-4 h-4 group-hover/bookmark:scale-110 transition-transform duration-200 fill-current" />
                </button>
              </div>
              
              {/* Content */}
              <div className="text-neutral-300 leading-relaxed">
                <p className="text-base line-clamp-3 group-hover:text-neutral-200 transition-colors duration-200">
                  {post.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer note */}
      <div className="text-center mt-8 pt-6 border-t border-neutral-700/20">
        <p className="text-neutral-600 text-xs tracking-wider italic">
          Your most treasured midnight thoughts
        </p>
      </div>
    </div>
  );
};

export default BookmarkManager;