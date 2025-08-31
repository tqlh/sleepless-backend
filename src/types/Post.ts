export interface PostData {
  id: string;
  content: string;
  language: string;
  timestamp: Date;
  isBookmarked: boolean;
  translatedContent?: string;
}