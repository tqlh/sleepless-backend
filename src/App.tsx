import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { generateSamplePosts } from './utils/sampleData';
import PostForm from './components/PostForm';
import PostViewer from './components/PostViewer';
import BookmarkManager from './components/BookmarkManager';
import { PostData } from './types/Post';
import { getStoredPosts, storePost, getDailyPostCount, incrementDailyPostCount, canPostToday, getRemainingPostsToday } from './utils/postManager';
import { Bookmark } from 'lucide-react';
import AnimatedLogo from './components/AnimatedLogo';

const loadTestThoughts = (setPosts: React.Dispatch<React.SetStateAction<PostData[]>>, setDailyPostCount: React.Dispatch<React.SetStateAction<number>>) => {
  const testThoughts = [
    "tired but wired",
    "monday again", 
    "why though",
    "big mood",
    "narrator voice: it wasn't fine",
    "touch grass",
    "same energy",
    "今日も疲れた",
    "なんで眠れないんだろう",
    "雨の音が心地いい",
    "一人の時間が好き",
    "made tea and forgot about it. found it cold on the counter 3 hours later",
    "that brief panic when you can't find your phone while holding your phone",
    "why do i always remember embarrassing things from 2019 at 2am",
    "spent 20 minutes choosing a netflix show just to scroll on my phone instead",
    "accidentally said 'you too' when the cashier said 'happy birthday' to someone behind me",
    "grocery shopping while hungry was a financial mistake",
    "the commitment it takes to finish a chapstick without losing it",
    "having 47 tabs open and somehow still opening more",
    "main character energy but side character budget",
    "my therapist is gonna hear about this",
    "why am i like this (rhetorical)",
    "living my best life (citation needed)",
    "sounds fake but okay",
    "everything is content now apparently",
    "we're all just coping mechanisms wearing human suits",
    "what if colors look different to everyone but we all learned the same names",
    "sometimes i think my cat understands me better than most people",
    "wondering if parallel universe me is living my best life"
  ];
  
  const shuffled = testThoughts.sort(() => 0.5 - Math.random());
  
  const testPosts: PostData[] = shuffled.map((content, index) => ({
    id: (Date.now() + index).toString(),
    content,
    language: content.includes('今日') || content.includes('なんで') || content.includes('一人') || 
              content.includes('雨の') || content.includes('深夜') ? 'ja' : 'en',
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    isBookmarked: Math.random() < 0.15
  }));
  
  localStorage.setItem('sleepless_posts', JSON.stringify(testPosts));
  setPosts(testPosts);
  setDailyPostCount(Math.floor(Math.random() * 4));
};

function App() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [isBookmarkTransitioning, setIsBookmarkTransitioning] = useState(false);
  const [dailyPostCount, setDailyPostCount] = useState(0);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [lastViewedPostId, setLastViewedPostId] = useState<string | null>(null);
  const [footerMessage, setFooterMessage] = useState('');

  useEffect(() => {
    const storedPosts = getStoredPosts();
    setPosts(storedPosts);
    
    setDailyPostCount(getDailyPostCount());
    
    // Load test thoughts if no posts exist
    if (storedPosts.length === 0) {
      loadTestThoughts(setPosts, setDailyPostCount);
    }
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

  const handleNewPost = useCallback((content: string, language: string = 'en') => {
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
  }, [posts]);

  const handleBookmarkToggle = useCallback((postId: string) => {
    const updatedPosts = posts.map(post => 
      post.id === postId ? { ...post, isBookmarked: !post.isBookmarked } : post
    );
    setPosts(updatedPosts);
    localStorage.setItem('sleepless_posts', JSON.stringify(updatedPosts));
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

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-serif">
      {/* Blur overlay - only appears when form is expanded */}
      {isFormExpanded && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 pointer-events-none" />
      )}
      
      {/* Header - gets additional blur when form is expanded */}
      <div className={`fixed top-0 left-0 right-0 z-20 backdrop-blur-xl border-b border-neutral-700/20 transition-all duration-300 ${isFormExpanded ? 'blur-sm bg-neutral-900/95' : 'bg-neutral-900/60'}`}>
        <div className="container mx-auto px-6 py-0.5 md:py-1.5">
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
      
      {/* Main content - gets blurred when form is expanded */}
      <div className={`container mx-auto px-6 pb-24 max-w-2xl relative z-10 transition-all duration-300 ${isFormExpanded ? 'blur-sm pt-96' : 'pt-80'}`}>
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
              />
            )
          )}
        </div>
      </div>
      
      {/* Proper Footer */}
      <footer className={`fixed bottom-0 left-0 right-0 z-10 transition-all duration-300 ${isFormExpanded ? 'blur-sm' : ''}`}>
        <div className={`border-t border-neutral-700/20 backdrop-blur-sm transition-all duration-300 ${isFormExpanded ? 'bg-neutral-900/95' : 'bg-neutral-900/60'}`}>
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
      
      {/* Post Form - stays sharp and above everything */}
      <div className="fixed top-48 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-2xl px-6">
        <PostForm 
          onSubmit={handleNewPost}
          canPost={canPostToday()}
          remainingPosts={getRemainingPostsToday()}
          onExpandChange={setIsFormExpanded}
        />
      </div>
      
      {/* Subtle background elements */}
      <div className={`absolute inset-0 pointer-events-none transition-all duration-300 ${isFormExpanded ? 'blur-sm' : ''}`}>
        {/* Static cozy elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-amber-200/2 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-orange-300/1 rounded-full blur-2xl"></div>
        <div className="absolute bottom-40 left-20 w-40 h-40 bg-amber-200/1.5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-yellow-200/1 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-200/1 rounded-full blur-3xl"></div>
        
        {/* Additional cozy warmth */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-orange-200/1.5 rounded-full blur-xl"></div>
        <div className="absolute top-3/4 right-1/4 w-20 h-20 bg-amber-300/1 rounded-full blur-xl"></div>
        
        {/* Warm corner glows */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-amber-200/1 to-transparent blur-2xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-orange-200/0.8 to-transparent blur-2xl"></div>
      </div>
    </div>
  );
}

export default App;