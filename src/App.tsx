import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from './utils/apiService';
import PostForm from './components/PostForm';
import PostViewer from './components/PostViewer';
import BookmarkManager from './components/BookmarkManager';
import { PostData } from './types/Post';
import { getStoredPosts, storePost, getDailyPostCount, incrementDailyPostCount, canPostToday, getRemainingPostsToday } from './utils/postManager';
import { Bookmark } from 'lucide-react';
import AnimatedLogo from './components/AnimatedLogo';

function App() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [isBookmarkTransitioning, setIsBookmarkTransitioning] = useState(false);
  const [dailyPostCount, setDailyPostCount] = useState(0);
  const [remainingPosts, setRemainingPosts] = useState(3);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [lastViewedPostId, setLastViewedPostId] = useState<string | null>(null);
  const [footerMessage, setFooterMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBackground, setShowBackground] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordBuffer, setPasswordBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // ... existing useEffect hooks ...

  // ... existing handlers ...

  const handleToggleAdminPanel = useCallback(() => {
    setShowAdminPanel(prev => !prev);
  }, []);

  // ... rest of existing code until the return statement ...

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-serif">
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-yellow-900/80 text-yellow-200 px-4 py-2 rounded-lg z-50">
          {error}
        </div>
      )}
      
      {/* Admin panel */}
      {isAdmin && showAdminPanel && (
        <div className="fixed top-16 right-4 bg-neutral-800/95 backdrop-blur-xl border border-neutral-600 rounded-lg p-4 max-w-md max-h-96 overflow-y-auto z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-amber-200 font-medium">Admin Panel</h3>
            <button 
              onClick={handleToggleAdminPanel}
              className="text-neutral-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-neutral-400 text-xs mb-2">All Posts ({posts.length})</p>
            {posts.map((post, index) => (
              <div key={post.id} className="bg-neutral-700/50 rounded p-2 text-xs">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-200 truncate">{post.content}</p>
                    <p className="text-neutral-500 text-xs mt-1">
                      {new Date(post.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="ml-2 text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-900/30 hover:bg-red-900/50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Admin indicator - now clickable */}
      {isAdmin && (
        <button
          onClick={handleToggleAdminPanel}
          className="fixed top-4 right-4 bg-red-900/80 text-red-200 px-3 py-1 rounded-lg z-50 text-sm hover:bg-red-900/90 transition-colors"
        >
          {showAdminPanel ? 'HIDE ADMIN' : 'ADMIN MODE'}
        </button>
      )}
      
      {/* Blur overlay - only appears when form is expanded */}
      {isFormExpanded && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 pointer-events-none" />
      )}
      
      {/* Header - reduced height */}
      <div className={`fixed top-0 left-0 right-0 z-20 backdrop-blur-2xl border-b border-neutral-700/20 transition-all duration-300 ${isFormExpanded ? 'blur-sm bg-neutral-900/95' : 'bg-neutral-900/80'}`}>
        <div className="container mx-auto px-6 py-1 md:py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <AnimatedLogo />
              <span className="text-2xl md:text-4xl font-serif font-light text-amber-200 tracking-[0.15em] hover:text-amber-100 transition-all duration-300 cursor-pointer animate-breathe">sleepless.ink</span>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={handleShowBookmarksToggle}
                className={`p-2 rounded-lg transition-all duration-200 relative ${
                  showBookmarksOnly 
                    ? 'bg-neutral-700/60 text-yellow-200' 
                    : 'bg-neutral-800/40 text-neutral-400 hover:text-yellow-200 hover:bg-neutral-700/40'
                }`}
                title={showBookmarksOnly ? 'Show all thoughts' : 'Show bookmarked thoughts'}
              >
                <Bookmark className="w-4 h-4" />
                {bookmarkedCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-200 text-neutral-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold leading-none">
                    {bookmarkedCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content - adjusted top padding */}
      <div className={`container mx-auto px-6 pb-24 max-w-2xl relative z-10 transition-all duration-300 ${isFormExpanded ? 'blur-sm pt-80' : 'pt-64'}`}>
        {/* Posts */}
        <div className={`mb-16 transition-opacity duration-300 ${isBookmarkTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          {!isBookmarkTransitioning && (
            showBookmarksOnly ? (
              <BookmarkManager 
                posts={displayPosts} 
                onBookmarkToggle={handleBookmarkToggle}
              />
            ) : (
              <PostViewer 
                posts={displayPosts} 
                onBookmarkToggle={handleBookmarkToggle}
                showBookmarksOnly={showBookmarksOnly}
                lastViewedPostId={lastViewedPostId}
                onCurrentPostChange={handleCurrentPostChange}
                isAdmin={isAdmin}
                onDeletePost={handleDeletePost}
              />
            )
          )}
        </div>
      </div>
      
      {/* Enhanced Footer with stronger blur */}
      <footer className={`fixed bottom-0 left-0 right-0 z-10 transition-all duration-300 ${isFormExpanded ? 'blur-sm' : ''}`}>
        <div className={`border-t border-neutral-700/20 backdrop-blur-2xl transition-all duration-300 ${isFormExpanded ? 'bg-neutral-900/95' : 'bg-neutral-900/80'}`}>
          <div className="container mx-auto px-6 py-2 text-center">
            <p className="text-neutral-600 text-sm italic">
              {footerMessage}
            </p>
            <p className="text-neutral-700 text-xs">
              {posts.length === 0 ? 'be the first to share a thought' : 
               posts.length === 1 ? '1 person shared their thoughts' :
               `${posts.length} people shared their thoughts`}
            </p>
          </div>
        </div>
      </footer>
      
      {/* Post Form - adjusted position */}
      <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-2xl px-6">
        <PostForm 
          onSubmit={handleNewPost}
          canPost={remainingPosts > 0}
          remainingPosts={remainingPosts}
          onExpandChange={setIsFormExpanded}
        />
      </div>
      
      {/* Enhanced background elements with fade-in transition */}
      <div className={`absolute inset-0 pointer-events-none transition-all duration-1000 ${isFormExpanded ? 'blur-sm' : ''} ${showBackground ? 'opacity-100' : 'opacity-0'}`}>
        {/* Static cozy elements with increased opacity */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-amber-200/8 rounded-full blur-3xl transition-all duration-1000"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-orange-300/6 rounded-full blur-2xl transition-all duration-1000"></div>
        <div className="absolute bottom-40 left-20 w-40 h-40 bg-amber-200/10 rounded-full blur-3xl transition-all duration-1000"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-yellow-200/8 rounded-full blur-2xl transition-all duration-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-200/6 rounded-full blur-3xl transition-all duration-1000"></div>
        
        {/* Additional cozy warmth with more opacity */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-orange-200/12 rounded-full blur-xl transition-all duration-1000"></div>
        <div className="absolute top-3/4 right-1/4 w-20 h-20 bg-amber-300/8 rounded-full blur-xl transition-all duration-1000"></div>
        
        {/* Warm corner glows with increased opacity */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-amber-200/8 to-transparent blur-2xl transition-all duration-1000"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-orange-200/6 to-transparent blur-2xl transition-all duration-1000"></div>
      </div>
    </div>
  );
}

export default App;
