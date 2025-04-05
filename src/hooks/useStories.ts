import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthHeader } from '@/lib/auth';

interface Story {
  _id: string;
  title: string;
  chapters: {
    id: string;
    title: string;
    content: string;
    number: number;
  }[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // ストーリー一覧の取得
  const fetchStories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('認証トークンがありません');
      }

      const res = await fetch('/api/stories', {
        headers: {
          ...getAuthHeader(token),
        },
      });

      if (!res.ok) {
        throw new Error('ストーリーの取得に失敗しました');
      }

      const data = await res.json();
      setStories(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 新しいストーリーの作成
  const createStory = async (title: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('認証トークンがありません');
      }

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(token),
        },
        body: JSON.stringify({
          title,
          chapters: [],
        }),
      });

      if (!res.ok) {
        throw new Error('ストーリーの作成に失敗しました');
      }

      const data = await res.json();
      setStories(prev => [...prev, data.data]);
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // コンポーネントマウント時にストーリー一覧を取得
  useEffect(() => {
    if (user) {
      fetchStories();
    }
  }, [user]);

  return {
    stories,
    loading,
    error,
    createStory,
    refreshStories: fetchStories,
  };
} 