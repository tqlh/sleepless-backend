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

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [postsData, dailyData] = await Promise.all([
          apiService.getPosts(),
          apiService.getDailyCount()
        ]);
        
        // Convert timestamp strings to Date objects
        const postsWithDates = postsData.map(post => ({
          ...post,
          timestamp: new Date(post.timestamp)
        }));
        
        setPosts(postsWithDates);
        setDailyPostCount(dailyData.count);
        setRemainingPosts(dailyData.remaining);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to connect to server. Using local data.');
        // Fallback to localStorage if API fails
        try {
          const stored = localStorage.getItem('sleepless_posts');
          if (stored) {
            const parsedPosts = JSON.parse(stored).map((post: any) => ({
              ...post,
              timestamp: new Date(post.timestamp)
            }));
            setPosts(parsedPosts);
          }
          setDailyPostCount(getDailyPostCount());
          setRemainingPosts(getRemainingPostsToday());
        } catch (localError) {
          console.error('Failed to load from localStorage:', localError);
        }
      } finally {
        setIsLoading(false);
        // Delay showing background elements to prevent flash
        setTimeout(() => setShowBackground(true), 100);
      }
    };

    loadData();
  }, []);

  // Update footer message based on post count
  useEffect(() => {
    const messages = [
      "whispers drift through the digital night",
      "thoughts echo in the quiet hours", 
      "midnight musings find their home",
      "sleepless minds gather here",
      "the night shift of consciousness",
      "where insomnia meets expression",
      "anonymous thoughts in the darkness"
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setFooterMessage(randomMessage);
  }, [posts.length]);

  const handleNewPost = useCallback(async (content: string, language: string = 'en') => {
    try {
      const newPost = await apiService.createPost(content, language);
      
      // Convert timestamp to Date object
      const postWithDate = {
        ...newPost,
        timestamp: new Date(newPost.timestamp)
      };
      
      setPosts(prev => [postWithDate, ...prev]);
      
      // Update daily count
      const dailyData = await apiService.getDailyCount();
      setDailyPostCount(dailyData.count);
      setRemainingPosts(dailyData.remaining);
    } catch (err) {
      console.error('Failed to create post:', err);
      // Fallback to local storage
      if (!canPostToday()) {
        alert('You have reached your daily posting limit. Please try again tomorrow.');
        return;
      }

      const newPost: PostData = {
        id: Date.now().toString(),
        content,
        language,
        timestamp: new Date(),
        isBookmarked: false
      };

      const updatedPosts = storePost(newPost, posts);
      setPosts(updatedPosts);
      incrementDailyPostCount();
      setDailyPostCount(getDailyPostCount());
    }
  }, [posts]);

  const handleBookmarkToggle = useCallback(async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      await apiService.toggleBookmark(postId, !post.isBookmarked);
      const updatedPosts = posts.map(p => 
        p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p
      );
      setPosts(updatedPosts);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      // Fallback to local update
      const updatedPosts = posts.map(p => 
        p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p
      );
      setPosts(updatedPosts);
      localStorage.setItem('sleepless_posts', JSON.stringify(updatedPosts));
    }
  }, [posts]);

  const handleCurrentPostChange = useCallback((postId: string) => {
    if (!showBookmarksOnly) {
      setLastViewedPostId(postId);
    }
  }, [showBookmarksOnly]);

  const handleShowBookmarksToggle = useCallback(() => {
    setIsBookmarkTransitioning(true);
    setTimeout(() => {
      setShowBookmarksOnly(!showBookmarksOnly);
      setIsBookmarkTransitioning(false);
    }, 300);
  }, [showBookmarksOnly]);

  const displayPosts = useMemo(() => 
    showBookmarksOnly ? posts.filter(post => post.isBookmarked) : posts,
    [posts, showBookmarksOnly]
  );

  const bookmarkedCount = posts.filter(post => post.isBookmarked).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 font-serif flex items-center justify-center">
        <div className="text-center">
          <AnimatedLogo isLoading={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-serif">
      {error && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-yellow-900/80 text-yellow-200 px-4 py-2 rounded-lg z-50">
          {error}
        </div>
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
                isAdmin={false}
                onDeletePost={undefined}
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
