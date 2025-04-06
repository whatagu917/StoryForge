// src/lib/fetchWithAuth.ts
import { getAuthHeader } from './auth';

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const authHeader = getAuthHeader();
  if (!authHeader) {
    throw new Error('認証が必要です');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': authHeader.Authorization,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '不明なエラー' }));
    throw new Error(error.message || 'APIリクエストに失敗しました');
  }

  return response.json();
}