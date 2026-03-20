import api from './client';
import type {
  User, Deck, DeckCreate, Card, CardCreate,
  ReviewSubmit, ReviewResult, StatsOverview,
} from '../types';

// ===== 认证 =====
export const authAPI = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post<User>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ access_token: string }>('/auth/login', data),
};

// ===== 卡片组 =====
export const deckAPI = {
  list: () =>
    api.get<Deck[]>('/decks/'),

  create: (data: DeckCreate) =>
    api.post<Deck>('/decks/', data),

  delete: (id: string) =>
    api.delete(`/decks/${id}`),
};

// ===== 卡片 =====
export const cardAPI = {
  listByDeck: (deckId: string) =>
    api.get<Card[]>(`/cards/deck/${deckId}`),

  create: (data: CardCreate) =>
    api.post<Card>('/cards/', data),

  delete: (id: string) =>
    api.delete(`/cards/${id}`),
};

// ===== 复习 =====
export const reviewAPI = {
  getDueCards: (deckId?: string) =>
    api.get<Card[]>('/review/due', { params: deckId ? { deck_id: deckId } : {} }),

  submit: (data: ReviewSubmit) =>
    api.post<ReviewResult>('/review/submit', data),
};

// ===== 统计 =====
export const statsAPI = {
  overview: () =>
    api.get<StatsOverview>('/stats/overview'),
};

// ===== 文件上传（新增）=====
export const uploadAPI = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{
      url: string;
      filename: string;
      content_type: string;
      size: number;
    }>('/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ===== 通知设置（新增）=====
export const settingsAPI = {
  getNotification: () =>
    api.get<{
      notify_enabled: boolean;
      notify_times: string[];
      custom_intervals: number[] | null;
    }>('/settings/notification'),

  updateNotification: (data: {
    notify_enabled: boolean;
    notify_times: string[];
    custom_intervals?: number[] | null;
  }) =>
    api.put('/settings/notification', data),
};