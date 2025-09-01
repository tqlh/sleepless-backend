import { PostData } from '../types/Post';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://sleepless-backend-production.up.railway.app' // Your Railway backend URL
  : 'http://localhost:3003'; // Development server

// Generate a simple fingerprint for daily limits
const getUserFingerprint = (): string => {
  let fingerprint = localStorage.getItem('sleepless_user_fingerprint');
  if (!fingerprint) {
    // Create a simple fingerprint based on browser characteristics
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('sleepless-user', 10, 10);
    const canvasFingerprint = canvas.toDataURL();
    
    fingerprint = btoa(
      navigator.userAgent.slice(0, 20) + 
      screen.width + 
      screen.height + 
      new Date().getTimezoneOffset() +
      canvasFingerprint.slice(-20)
    ).slice(0, 32);
    
    localStorage.setItem('sleepless_user_fingerprint', fingerprint);
  }
  return fingerprint;
};

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}/api${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getPosts(): Promise<PostData[]> {
    return await this.request('/posts');
  }

  async createPost(content: string, language: string = 'en'): Promise<PostData> {
    const userFingerprint = getUserFingerprint();
    
    return await this.request('/posts', {
      method: 'POST',
      body: JSON.stringify({
        content,
        language,
        userFingerprint,
      }),
    });
  }

  async toggleBookmark(postId: string, isBookmarked: boolean): Promise<void> {
    await this.request(`/posts/${postId}/bookmark`, {
      method: 'PATCH',
      body: JSON.stringify({ isBookmarked }),
    });
  }

  async deletePost(postId: string): Promise<void> {
    await this.request(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async getDailyCount(): Promise<{ count: number; limit: number; remaining: number }> {
    const userFingerprint = getUserFingerprint();
    return await this.request(`/daily-count/${userFingerprint}`);
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return await this.request('/health');
  }
}

export const apiService = new ApiService();

// Helper functions for backward compatibility
export const getStoredPosts = async (): Promise<PostData[]> => {
  try {
    return await apiService.getPosts();
  } catch (error) {
    console.error('Failed to fetch posts from API, falling back to localStorage:', error);
    // Fallback to localStorage if API is unavailable
    const stored = localStorage.getItem('sleepless_posts');
    if (!stored) return [];
    
    return JSON.parse(stored).map((post: any) => ({
      ...post,
      timestamp: new Date(post.timestamp)
    }));
  }
};

export const storePost = async (newPost: PostData, currentPosts: PostData[]): Promise<PostData[]> => {
  try {
    const createdPost = await apiService.createPost(newPost.content, newPost.language);
    // Return updated posts list
    return await apiService.getPosts();
  } catch (error) {
    console.error('Failed to create post via API:', error);
    throw error;
  }
};

export const getDailyPostCount = async (): Promise<number> => {
  try {
    const result = await apiService.getDailyCount();
    return result.count;
  } catch (error) {
    console.error('Failed to get daily count from API:', error);
    // Fallback to localStorage
    const today = new Date().toDateString();
    const lastPostDate = localStorage.getItem('sleepless_last_post_date');
    
    if (lastPostDate !== today) {
      return 0;
    }
    
    return parseInt(localStorage.getItem('sleepless_daily_count') || '0', 10);
  }
};

export const incrementDailyPostCount = async (): Promise<void> => {
  // This is now handled by the API when creating posts
  // Keep for backward compatibility but make it a no-op
};

export const canPostToday = async (): Promise<boolean> => {
  try {
    const result = await apiService.getDailyCount();
    return result.remaining > 0;
  } catch (error) {
    console.error('Failed to check daily limit from API:', error);
    // Fallback to localStorage
    const count = await getDailyPostCount();
    return count < 5;
  }
};

export const getRemainingPostsToday = async (): Promise<number> => {
  try {
    const result = await apiService.getDailyCount();
    return result.remaining;
  } catch (error) {
    console.error('Failed to get remaining posts from API:', error);
    // Fallback to localStorage
    const count = await getDailyPostCount();
    return Math.max(0, 5 - count);
  }
};
