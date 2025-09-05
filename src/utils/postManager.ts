import { PostData } from '../types/Post';

const DAILY_POST_LIMIT = 5;
const POSTS_STORAGE_KEY = 'sleepless_posts';
const DAILY_COUNT_KEY = 'sleepless_daily_count';
const LAST_POST_DATE_KEY = 'sleepless_last_post_date';
const RECENTLY_SHOWN_KEY = 'sleepless_recently_shown';
const MAX_RECENT_TRACK = 10; // Track last 10 shown posts
const POST_HISTORY_KEY = 'sleepless_post_history';
const MAX_HISTORY_SIZE = 20; // Keep last 20 posts in history

export const getStoredPosts = (): PostData[] => {
  try {
    const stored = localStorage.getItem(POSTS_STORAGE_KEY);
    if (!stored) return [];
    
    const parsedPosts = JSON.parse(stored).map((post: any) => ({
      ...post,
      timestamp: new Date(post.timestamp)
    })).sort((a: PostData, b: PostData) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return parsedPosts;
  } catch {
    return [];
  }
};

export const storePost = (newPost: PostData, currentPosts: PostData[]): PostData[] => {
  const updatedPosts = [newPost, ...currentPosts];
  
  localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updatedPosts));
  return updatedPosts;
};

export const getDailyPostCount = (): number => {
  const today = new Date().toDateString();
  const lastPostDate = localStorage.getItem(LAST_POST_DATE_KEY);
  
  if (lastPostDate !== today) {
    // Reset count for new day
    localStorage.setItem(DAILY_COUNT_KEY, '0');
    localStorage.setItem(LAST_POST_DATE_KEY, today);
    return 0;
  }
  
  return parseInt(localStorage.getItem(DAILY_COUNT_KEY) || '0', 10);
};

export const incrementDailyPostCount = (): void => {
  const currentCount = getDailyPostCount();
  localStorage.setItem(DAILY_COUNT_KEY, (currentCount + 1).toString());
  localStorage.setItem(LAST_POST_DATE_KEY, new Date().toDateString());
};

export const canPostToday = (): boolean => {
  const currentCount = getDailyPostCount();
  return currentCount < DAILY_POST_LIMIT;
};

export const getRemainingPostsToday = (): number => {
  const currentCount = getDailyPostCount();
  const remaining = DAILY_POST_LIMIT - currentCount;
  return Math.max(0, remaining);
};

export const detectLanguage = (text: string): string => {
  // Simplified language detection - always return English for performance
  return 'en';
};

export const moderateContent = (content: string): boolean => {
  // Always allow content - we'll show support instead of blocking
  return true;
};

// New function to detect if content needs support - only critical patterns
export const needsSupport = (content: string): boolean => {
  const lowerContent = content.toLowerCase();
  
  // Check for suicide-related words first (including suicidal, suicide, etc.)
  if (lowerContent.includes('suicide') || lowerContent.includes('suicidal')) {
    return true;
  }
  
  // Check for other key phrases that indicate support is needed
  const supportPhrases = [
    'kill myself', 'end my life', 'want to die', 'self harm', 
    'cut myself', 'hurt myself', 'not worth living', 'better off dead', 
    'end it all', 'take my own life', 'planning to die', 'going to kill myself', 
    'gonna kill myself', "don't want to live", "can't go on", 'done with life', 
    'tired of living', 'wanna kill myself', 'wanna die', 'gonna die'
  ];
  
  return supportPhrases.some(phrase => lowerContent.includes(phrase));
};

// Get a supportive message based on the content with multiple variations - more neutral/universal
export const getSupportMessage = (content: string): string => {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('kill myself') || lowerContent.includes('suicide') || lowerContent.includes('end my life')) {
    const messages = [
      "If you're having thoughts of ending your life, please consider reaching out to someone who can help.",
      "These feelings are serious and deserve attention. Consider talking to a professional or crisis line.",
      "You don't have to face these thoughts alone. Help is available and people want to support you.",
      "This is a sign you need support. Please reach out to someone who can help you through this.",
      "These thoughts are treatable. Consider reaching out for professional help."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  if (lowerContent.includes('self harm') || lowerContent.includes('cut myself') || lowerContent.includes('hurt myself')) {
    const messages = [
      "If you're considering self-harm, please reach out for support. You deserve care and help.",
      "These urges are treatable. Consider talking to someone who can help you find healthier ways to cope.",
      "You don't have to face this alone. Professional help can provide better coping strategies.",
      "This is a sign you need support. Please reach out to someone who can help.",
      "There are people who want to help you find healthier ways to deal with pain."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  if (lowerContent.includes('not worth living') || lowerContent.includes('better off dead') || lowerContent.includes('end it all')) {
    const messages = [
      "If you're feeling this way, please consider reaching out for support. You matter.",
      "These feelings are serious and deserve attention. Help is available.",
      "You don't have to feel this way forever. Consider talking to someone who can help.",
      "This is a sign you need support. Please reach out to someone who cares.",
      "You deserve to feel better. Consider reaching out for professional help."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  if (lowerContent.includes('planning to die') || lowerContent.includes('going to kill myself') || lowerContent.includes('gonna kill myself')) {
    const messages = [
      "If you're making plans to end your life, please reach out immediately. Help is available.",
      "This is a crisis that requires immediate attention. Please call a crisis line or seek help.",
      "You don't have to act on these thoughts. Help is available right now.",
      "This is serious and you deserve immediate support. Please reach out for help.",
      "Your life matters. Please reach out for help before acting on these thoughts."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  if (lowerContent.includes("don't want to live") || lowerContent.includes("can't go on") || lowerContent.includes("done with life")) {
    const messages = [
      "If you're feeling this way, please consider reaching out for support. You don't have to be alone.",
      "These feelings are treatable. Consider talking to someone who can help.",
      "You deserve to feel better. Help is available and people want to support you.",
      "This is a sign you need support. Please reach out to someone who can help.",
      "You don't have to feel this way forever. Consider reaching out for professional help."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  // Default supportive message for any other critical patterns
  const defaultMessages = [
    "If you're struggling, please consider reaching out for support. You don't have to be alone.",
    "These feelings deserve attention. Consider talking to someone who can help.",
    "You deserve support. Please reach out to someone who can help you through this.",
    "This is a sign you need help. Please consider reaching out for support.",
    "You don't have to face this alone. Help is available and people care."
  ];
  
  return defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
};

// Better shuffle function using Fisher-Yates algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getRecentlyShownPosts = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENTLY_SHOWN_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addToRecentlyShown = (postId: string): void => {
  const recent = getRecentlyShownPosts();
  const updated = [postId, ...recent].slice(0, MAX_RECENT_TRACK);
  localStorage.setItem(RECENTLY_SHOWN_KEY, JSON.stringify(updated));
};

export const getRandomPostsExcludingRecent = (posts: PostData[], count: number): PostData[] => {
  const recentlyShown = getRecentlyShownPosts();
  const availablePosts = posts.filter(post => !recentlyShown.includes(post.id));
  
  // If we don't have enough posts, reset the recent list
  if (availablePosts.length < count) {
    localStorage.removeItem(RECENTLY_SHOWN_KEY);
    return getWeightedRandomPosts(posts, count);
  }
  
  return getWeightedRandomPosts(availablePosts, count);
};

// Simple random selection with duplicate prevention
export const getWeightedRandomPosts = (posts: PostData[], count: number): PostData[] => {
  const shuffled = [...posts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Post history functions for back navigation
export const getPostHistory = (): string[] => {
  try {
    const stored = localStorage.getItem(POST_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addToPostHistory = (postId: string): void => {
  const history = getPostHistory();
  // Remove if already exists (to avoid duplicates)
  const filtered = history.filter(id => id !== postId);
  // Add to front and limit size
  const updated = [postId, ...filtered].slice(0, MAX_HISTORY_SIZE);
  localStorage.setItem(POST_HISTORY_KEY, JSON.stringify(updated));
};

export const getPreviousPost = (posts: PostData[]): PostData | null => {
  const history = getPostHistory();
  if (history.length < 2) return null; // Need at least 2 posts in history
  
  const previousPostId = history[1]; // Second item is the previous post
  return posts.find(post => post.id === previousPostId) || null;
};

export const removeFromPostHistory = (): void => {
  const history = getPostHistory();
  if (history.length > 0) {
    const updated = history.slice(1); // Remove first item
    localStorage.setItem(POST_HISTORY_KEY, JSON.stringify(updated));
  }
};
