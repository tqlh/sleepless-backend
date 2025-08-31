import { PostData } from '../types/Post';

const API_BASE_URL = 'https://sleepless-backend-production.up.railway.app';

// Generate a simple fingerprint for daily limits
const getUserFingerprint = (): string => {
  let fingerprint = localStorage.getItem('sleepless_user_fingerprint');
  if (!fingerprint) {
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
    const url = `${API_BASE_URL}/api${endpoint}?t=${Date.now()}`;
    
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

  async getDailyCount(): Promise<{ count: number; limit: number; remaining: number }> {
    const userFingerprint = getUserFingerprint();
    return await this.request(`/daily-count/${userFingerprint}`);
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return await this.request('/health');
  }
}

export const apiService = new ApiService();
