// ===== 用户 =====
export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

// ===== 卡片组 =====
export interface Deck {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  card_count: number;
  due_count: number;
}

export interface DeckCreate {
  name: string;
  description?: string;
  color?: string;
}

// ===== 卡片 =====
export interface ContentBlock {
  type: 'text' | 'code' | 'image' | 'markdown';
  value: string;
  language?: string;
  url?: string;
  caption?: string;
}

export interface Card {
  id: string;
  deck_id: string;
  content_type: string;
  front_content: ContentBlock;
  back_content: ContentBlock;
  tags: string[];
  notes: string;
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  next_review_at: string | null;
  total_reviews: number;
  correct_count: number;
  created_at: string;
}

export interface CardCreate {
  deck_id: string;
  content_type: string;
  front_content: ContentBlock;
  back_content: ContentBlock;
  tags?: string[];
  notes?: string;
}

// ===== 复习 =====
export interface ReviewSubmit {
  card_id: string;
  quality: number;
  time_spent_ms: number;
}

export interface ReviewResult {
  card_id: string;
  next_review_at: string;
  interval_display: string;
  ease_factor: number;
  repetition_count: number;
  message: string;
}

// ===== 统计 =====
export interface StatsOverview {
  total_cards: number;
  due_today: number;
  reviewed_today: number;
  streak_days: number;
  avg_retention: number;
}

// ========== 链接跳转相关类型 ==========

export interface VideoLink {
  id: string
  type: 'video'
  platform: 'bilibili' | 'youtube'
  url: string
  timestamp?: number
  title: string
}

export interface WebLink {
  id: string
  type: 'link'
  url: string
  title: string
}

export interface AppLink {
  id: string
  type: 'app_link'
  scheme: string
  fallback_url: string
  title: string
}

export type LinkItem = VideoLink | WebLink | AppLink