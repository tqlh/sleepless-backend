import { PostData } from '../types/Post';

const MAX_POSTS = 500;
const DAILY_POST_LIMIT = 5;
const POSTS_STORAGE_KEY = 'sleepless_posts';
const DAILY_COUNT_KEY = 'sleepless_daily_count';
const LAST_POST_DATE_KEY = 'sleepless_last_post_date';

const cleanOldPosts = (posts: PostData[]): PostData[] => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return posts.filter(post => post.timestamp > oneWeekAgo);
};

export const getStoredPosts = (): PostData[] => {
  try {
    const stored = localStorage.getItem(POSTS_STORAGE_KEY);
    if (!stored) return [];
    
    const parsedPosts = JSON.parse(stored).map((post: any) => ({
      ...post,
      timestamp: new Date(post.timestamp)
    })).sort((a: PostData, b: PostData) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Clean old posts and update storage
    const cleanedPosts = cleanOldPosts(parsedPosts);
    if (cleanedPosts.length !== parsedPosts.length) {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(cleanedPosts));
    }
    
    return cleanedPosts;
  } catch {
    return [];
  }
};

export const storePost = (newPost: PostData, currentPosts: PostData[]): PostData[] => {
  // Clean old posts first
  const cleanedPosts = cleanOldPosts(currentPosts);
  
  const updatedPosts = [newPost, ...cleanedPosts];
  
  // Maintain rolling buffer of MAX_POSTS
  const trimmedPosts = updatedPosts.slice(0, MAX_POSTS);
  
  localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(trimmedPosts));
  return trimmedPosts;
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
  // Basic content moderation - block obvious spam and harmful content
  const lowerContent = content.toLowerCase();
  
  // Block empty or very short content
  if (content.trim().length < 3) {
    return false;
  }
  
  // Block self-harm and suicide content
  const selfHarmPatterns = [
    /\b(kill myself|end my life|want to die|suicide|self harm|cut myself|hurt myself|gonna die|wanna die)\b/i,
    /\b(not worth living|better off dead|end it all|take my own life|going to die|planning to die)\b/i,
    /\b(i'll die|i will die|time to die|ready to die|done with life|can't go on)\b/i,
  ];
  
  for (const pattern of selfHarmPatterns) {
    if (pattern.test(content)) {
      return false;
    }
  }
  
  // Block violence and threats
  const violencePatterns = [
    /\b(shoot|kill|murder|bomb|attack|stab|hurt|harm).*(school|people|everyone|them|you|kids|children)\b/i,
    /\b(school shooter|mass shooting|going to kill|plan to kill|gonna kill|will kill)\b/i,
    /\b(bring a gun|get a gun|use a gun|with a gun).*(school|work|public)\b/i,
    /\b(shoot up|blow up|attack).*(school|workplace|building|place)\b/i,
    /\b(they deserve to die|everyone should die|kill them all|murder spree)\b/i,
  ];
  
  for (const pattern of violencePatterns) {
    if (pattern.test(content)) {
      return false;
    }
  }
  
  // Block slurs and hate speech - KEEPING THIS
  const slurs = [
    'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded', 'tranny', 'chink', 
    'gook', 'spic', 'wetback', 'kike', 'dyke', 'homo', 'queer'
  ];
  
  for (const slur of slurs) {
    if (lowerContent.includes(slur)) {
      return false;
    }
  }
  
  // REMOVED PROFANITY FILTERING - users can now post with swear words
  // const profanityWords = ['fuck', 'shit', 'damn', 'ass', 'bitch', 'cunt', 'piss'];
  // const profanityCount = profanityWords.reduce((count, word) => {
  //   const matches = (lowerContent.match(new RegExp(word, 'g')) || []).length;
  //   return count + matches;
  // }, 0);
  // 
  // if (profanityCount > 3) {
  //   return false;
  // }
  
  // Block spam patterns
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters (11+ times)
    /^[A-Z\s!]{20,}$/, // All caps with excessive length
    /(buy now|click here|free money|make money fast)/i,
  ];
  
  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      return false;
    }
  }
  
  return true;
};
