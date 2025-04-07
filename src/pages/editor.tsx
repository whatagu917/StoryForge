import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MessageSquare, Wand2, History, Settings, X, Save, Edit2, RotateCcw, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthHeader } from '@/lib/auth';

interface StyleProfile {
  id: string;
  name: string;
  description: string;
  settings: {
    sampleText: string;
    strength: number;
    embedding?: number[];
  };
  createdAt: string;
  updatedAt: string;
}

interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
}

const EMPTY_CHAPTER: Chapter = {
  id: '',
  title: '',
  content: '',
  number: 0
};

interface Story {
  id: string;
  title: string;
  chapters: Chapter[];
}

interface Revision {
  id: string;
  chapterId: string;
  storyId: string;
  type: 'ai' | 'manual';
  timestamp: string;
  content: string;
  previousContent: string;
  chapterTitle: string;
  chapterNumber: number;
}

interface ChapterHistory {
  chapters: Chapter[];
  timestamp: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface NewChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, number: number) => void;
  currentChapterCount: number;
}

function NewChapterModal({ isOpen, onClose, onSave, currentChapterCount }: NewChapterModalProps) {
  const [title, setTitle] = useState('');
  const [number, setNumber] = useState(currentChapterCount + 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(title, number);
    setTitle('');
    setNumber(currentChapterCount + 1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">New Chapter</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="chapterNumber" className="block text-sm font-medium text-gray-700">
                Chapter Number
              </label>
              <input
                type="number"
                id="chapterNumber"
                value={number}
                onChange={(e) => setNumber(parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="1"
                required
              />
            </div>
            <div>
              <label htmlFor="chapterTitle" className="block text-sm font-medium text-gray-700">
                Chapter Title
              </label>
              <input
                type="text"
                id="chapterTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter chapter title"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Create Chapter
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// エラーバウンダリコンポーネント
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Editor Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || '予期せぬエラーが発生しました。'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Editor() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isNewChapterModalOpen, setIsNewChapterModalOpen] = useState(false);
  const [isNewStoryModalOpen, setIsNewStoryModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editNumber, setEditNumber] = useState<number>(0);
  const [editTitle, setEditTitle] = useState<string>('');
  const [lastSavedState, setLastSavedState] = useState<Story | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isEditingStoryTitle, setIsEditingStoryTitle] = useState(false);
  const [editStoryTitle, setEditStoryTitle] = useState('');
  const [isChaptersVisible, setIsChaptersVisible] = useState(true);
  const [lastSavedContent, setLastSavedContent] = useState<string>('');
  const [styles, setStyles] = useState<StyleProfile[]>([]);
  const [selectedStyleProfile, setSelectedStyleProfile] = useState<StyleProfile | null>(null);
  const [isStyleProfileModalOpen, setIsStyleProfileModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [showNewStoryModal, setShowNewStoryModal] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>>([]);

  // ユーザーIDを含むローカルストレージのキーを生成
  const getStorageKey = (baseKey: string) => {
    return user ? `${baseKey}-${user.id}` : baseKey;
  };

  // チャプターIDを修正する関数
  const fixChapterIds = (story: Story): Story => {
    // 有効なMongoDB ObjectIDを生成する関数
    const generateObjectId = () => {
      // 24文字の16進数を生成
      const hexChars = '0123456789abcdef';
      let result = '';
      
      // タイムスタンプ部分（8文字）
      const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
      result += timestamp;
      
      // ランダム部分（16文字）
      for (let i = 0; i < 16; i++) {
        result += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
      }
      
      return result;
    };

    // チャプターIDが有効なObjectID形式かチェックする関数
    const isValidObjectId = (id: string) => {
      return /^[0-9a-fA-F]{24}$/.test(id);
    };

    // 無効なIDを持つチャプターを修正
    const fixedChapters = story.chapters.map(chapter => {
      if (!isValidObjectId(chapter.id)) {
        console.log(`Fixing invalid chapter ID: ${chapter.id}`);
        return { ...chapter, id: generateObjectId() };
      }
      return chapter;
    });

    return { ...story, chapters: fixedChapters };
  };

  // 修正したチャプターIDをサーバーに保存する関数
  const saveFixedChapterIds = async (story: Story) => {
    try {
      // 認証ヘッダーを取得
      const authHeader = getAuthHeader();
      if (!authHeader) {
        console.error('認証ヘッダーが取得できません');
        setError('認証に失敗しました。再度ログインしてください。');
        try {
          window.location.href = '/auth/login';
        } catch (error) {
          console.error('Navigation error:', error);
        }
        return false;
      }

      const response = await fetch(`/api/stories/${story.id}`, {
        method: 'PUT',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(story),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('認証エラー: セッションが期限切れです');
          setError('セッションが期限切れです。再度ログインしてください。');
          try {
            window.location.href = '/auth/login';
          } catch (error) {
            console.error('Navigation error:', error);
          }
          return false;
        }
        throw new Error('チャプターIDの修正に失敗しました');
      }

      const data = await response.json();
      if (data.success) {
        console.log('チャプターIDを修正しました:', story.id);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to save fixed chapter IDs:', err);
      return false;
    }
  };

  // 認証チェック
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        try {
          window.location.href = '/auth/login';
        } catch (error) {
          console.error('Navigation error:', error);
        }
        return;
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [isAuthenticated]);

  // ストーリーの読み込み
  useEffect(() => {
    const loadStories = async () => {
      if (!isAuthenticated || isLoading) {
        return;
      }

      try {
        const authHeader = getAuthHeader();
        if (!authHeader) {
          console.error('認証ヘッダーが取得できません。localStorageにトークンが存在しない可能性があります。');
          setError('認証に失敗しました。再度ログインしてください。');
          try {
            window.location.href = '/auth/login';
          } catch (error) {
            console.error('Navigation error:', error);
          }
          return;
        }

        console.log('Fetching stories with auth header:', authHeader);
        const response = await fetch('/api/stories', {
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error('認証エラー: セッションが期限切れです');
            setError('セッションが期限切れです。再度ログインしてください。');
            try {
              window.location.href = '/auth/login';
            } catch (error) {
              console.error('Navigation error:', error);
            }
            return;
          }
          throw new Error(`ストーリーの取得に失敗しました。ステータス: ${response.status}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          setStories(data);
        } else if (data.success && Array.isArray(data.data)) {
          setStories(data.data);
        } else {
          console.error('Invalid stories data format:', data);
          setStories([]);
        }
      } catch (error) {
        console.error('Error loading stories:', error);
        setError('ストーリーの読み込みに失敗しました');
        setStories([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStories();
  }, [isAuthenticated, isLoading]);

  // スタイルの読み込み
  useEffect(() => {
    const loadStyles = async () => {
      if (!isAuthenticated) {
        return;
      }

      try {
        const authHeader = getAuthHeader();
        if (!authHeader) {
          console.error('認証ヘッダーが取得できません。localStorageにトークンが存在しない可能性があります。');
          setError('認証に失敗しました。再度ログインしてください。');
          window.location.href = '/auth/login';
          return;
        }

        console.log('Fetching styles with auth header:', authHeader);
        const response = await fetch('/api/styles', {
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error('認証エラー: セッションが期限切れです');
            setError('セッションが期限切れです。再度ログインしてください。');
            window.location.href = '/auth/login';
            return;
          }
          throw new Error(`Failed to load styles. Status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setStyles(data.data || []);
        } else {
          throw new Error(data.message || 'Failed to load styles');
        }
      } catch (err) {
        console.error('Failed to load styles:', err);
        setError('スタイルプロファイルの読み込みに失敗しました');
      }
    };

    if (isAuthenticated) {
      loadStyles();
    }
  }, [isAuthenticated]);

  // チャット履歴の読み込み
  useEffect(() => {
    if (isHistoryModalOpen) {
      fetchChatHistory();
    }
  }, [isHistoryModalOpen]);

  // localStorage関連のuseEffect
  useEffect(() => {
    if (stories.length > 0) {
      localStorage.setItem('storyforge-stories', JSON.stringify(stories));
    }
  }, [stories]);

  useEffect(() => {
    if (currentStory) {
      localStorage.setItem('storyforge-current-story', JSON.stringify(currentStory));
    }
  }, [currentStory]);

  useEffect(() => {
    if (currentChapter) {
      localStorage.setItem('storyforge-current-chapter', JSON.stringify(currentChapter));
    }
  }, [currentChapter]);

  useEffect(() => {
    if (lastSavedContent !== null) {
      localStorage.setItem('storyforge-last-content', lastSavedContent);
    }
  }, [lastSavedContent]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const handleCreateStory = async (title: string) => {
    if (!user) return;

    setIsSaving(true);
    try {
      // APIを使用してストーリーを作成
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: '',
          chapters: [],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.details || data.message || 'ストーリーの作成に失敗しました');
      }

      const data = await response.json();
      if (data.success && data.data) {
        const newStory = data.data;
        setStories(prev => [...prev, newStory]);
        setCurrentStory(newStory);
        localStorage.setItem(getStorageKey('storyforge-last-edited-story'), newStory.id);
        setIsNewStoryModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to create story:', err);
      alert(err instanceof Error ? err.message : 'ストーリーの作成に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!user) return;
    if (!storyId) {
      console.error('Cannot delete story: storyId is undefined');
      alert('ストーリーIDが見つかりません。削除できません。');
      return;
    }
    if (!window.confirm('この物語を削除してもよろしいですか？')) return;
    
    setIsSaving(true);
    try {
      console.log('Deleting story with ID:', storyId);
      // APIを使用してストーリーを削除
      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete story error response:', errorData);
        throw new Error(errorData.message || 'ストーリーの削除に失敗しました');
      }

      const data = await response.json();
      console.log('Delete story response:', data);
      
      if (data.success) {
        setStories(prev => prev.filter(story => story.id !== storyId));
        if (currentStory?.id === storyId) {
          const nextStory = stories.find(story => story.id !== storyId);
          setCurrentStory(nextStory || null);
          setLastSavedState(nextStory || null);
          if (nextStory) {
            localStorage.setItem(getStorageKey('storyforge-last-edited-story'), nextStory.id);
          } else {
            localStorage.removeItem(getStorageKey('storyforge-last-edited-story'));
          }
        }
      } else {
        throw new Error(data.message || 'ストーリーの削除に失敗しました');
      }
    } catch (err) {
      console.error('Failed to delete story:', err);
      alert(err instanceof Error ? err.message : 'ストーリーの削除に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateChapter = (title: string, number: number) => {
    if (!currentStory) return;
    
    // Generate a valid MongoDB ObjectID (24 characters hex string)
    const generateObjectId = () => {
      // 24文字の16進数を生成
      const hexChars = '0123456789abcdef';
      let result = '';
      
      // タイムスタンプ部分（8文字）
      const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
      result += timestamp;
      
      // ランダム部分（16文字）
      for (let i = 0; i < 16; i++) {
        result += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
      }
      
      return result;
    };
    
    const newChapter: Chapter = {
      id: generateObjectId(),
      title,
      content: '',
      number,
    };
    const updatedChapters = [...currentStory.chapters, newChapter].sort((a, b) => a.number - b.number);
    const updatedStory = {
      ...currentStory,
      chapters: updatedChapters
    };
    
    setCurrentStory(updatedStory);
    setStories(prev => prev.map(story => 
      story.id === currentStory.id ? updatedStory : story
    ));
    setCurrentChapter(newChapter);
  };

  const saveRevision = (chapter: Chapter, type: 'ai' | 'manual', previousContent: string) => {
    const revision: Revision = {
      id: Date.now().toString(),
      chapterId: chapter.id,
      storyId: currentStory?.id || '',
      type,
      timestamp: new Date().toLocaleString('ja-JP'),
      content: chapter.content,
      previousContent,
      chapterTitle: chapter.title,
      chapterNumber: chapter.number
    };

    const savedRevisions = localStorage.getItem(getStorageKey('storyforge-revisions'));
    const revisions = savedRevisions ? JSON.parse(savedRevisions) : [];
    localStorage.setItem(getStorageKey('storyforge-revisions'), JSON.stringify([revision, ...revisions]));
  };

  const handleUpdateChapter = (chapterId: string, updates: Partial<Chapter>) => {
    if (!currentStory) return;
    
    const updatedStory = {
      ...currentStory,
      chapters: currentStory.chapters.map(chapter =>
        chapter.id === chapterId
          ? { ...chapter, ...updates }
          : chapter
      )
    };
    
    setCurrentStory(updatedStory);
    setStories(prev => prev.map(story => 
      story.id === currentStory.id ? updatedStory : story
    ));

    // Update currentChapter if it's the one being edited
    if (currentChapter && currentChapter.id === chapterId) {
      setCurrentChapter({ ...currentChapter, ...updates });
    }
  };

  const handleSave = async () => {
    if (!currentStory || !currentChapter || !user) return;

    setIsSaving(true);
    try {
      // APIを使用してストーリーを更新
      const response = await fetch(`/api/stories/${currentStory.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentStory,
          chapters: currentStory.chapters.map(chapter => {
            if (chapter.id === currentChapter.id) {
              return {
                ...chapter,
                content: currentChapter.content
              };
            }
            return chapter;
          }),
        }),
      });

      if (!response.ok) {
        throw new Error('ストーリーの保存に失敗しました');
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Save current content to last-content
        setLastSavedContent(currentChapter.content);
        localStorage.setItem(getStorageKey('storyforge-last-content'), currentChapter.content);

        // Update the stories state
        setStories(prev => prev.map(story => 
          story.id === currentStory.id ? data.data : story
        ));

        // Check if chapterId is a valid MongoDB ObjectID (12 bytes hex string)
        const isValidObjectId = (id: string) => {
          return /^[0-9a-fA-F]{24}$/.test(id);
        };

        // Create revision only if chapterId is valid
        if (isValidObjectId(currentChapter.id)) {
          const revisionResponse = await fetch('/api/revisions', {
            method: 'POST',
            headers: {
              ...getAuthHeader(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: currentChapter.content,
              previousContent: lastSavedContent || '',
              chapterId: currentChapter.id,
              storyId: currentStory.id,
              type: 'manual',
              chapterTitle: currentChapter.title,
              chapterNumber: currentChapter.number
            }),
          });

          if (!revisionResponse.ok) {
            console.error('Failed to create revision');
          }
        } else {
          console.error('Invalid chapterId format:', currentChapter.id);
        }

        alert('変更が保存されました');
      }
    } catch (err) {
      console.error('Failed to save:', err);
      alert('変更の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = () => {
    if (!currentChapter || !currentStory || !lastSavedContent) return;
    
    if (window.confirm('Are you sure you want to revert to the last saved state?')) {
      // Update the current chapter content
      const updatedChapter = {
        ...currentChapter,
        content: lastSavedContent
      };
      
      // Update the story with the reverted chapter
      const updatedStory = {
        ...currentStory,
        chapters: currentStory.chapters.map(chapter =>
          chapter.id === currentChapter.id
            ? updatedChapter
            : chapter
        )
      };
      
      // Update states
      setCurrentChapter(updatedChapter);
      setCurrentStory(updatedStory);
      setStories(prev => prev.map(story => 
        story.id === currentStory.id ? updatedStory : story
      ));

      // Save the updated story to localStorage
      localStorage.setItem('storyforge-stories', JSON.stringify(stories.map(story => 
        story.id === currentStory.id ? updatedStory : story
      )));

      // Save revision
      const revision: Revision = {
        id: Date.now().toString(),
        chapterId: currentChapter.id,
        storyId: currentStory.id,
        type: 'manual',
        timestamp: new Date().toLocaleString('ja-JP'),
        content: lastSavedContent,
        previousContent: currentChapter.content,
        chapterTitle: currentChapter.title,
        chapterNumber: currentChapter.number
      };

      const savedRevisions = localStorage.getItem(getStorageKey('storyforge-revisions'));
      const revisions = savedRevisions ? JSON.parse(savedRevisions) : [];
      localStorage.setItem(getStorageKey('storyforge-revisions'), JSON.stringify([revision, ...revisions]));
    }
  };

  const handleStartEdit = (chapter: Chapter) => {
    setEditingChapter(chapter.id);
    setEditNumber(chapter.number);
    setEditTitle(chapter.title);
  };

  const handleSaveEdit = () => {
    if (!editingChapter || !currentStory) return;

    const updatedStory: Story = {
      ...currentStory,
      chapters: currentStory.chapters.map(chapter => {
        if (chapter.id === editingChapter) {
          return {
            ...chapter,
            number: editNumber,
            title: editTitle
          };
        }
        return chapter;
      })
    };

    setCurrentStory(updatedStory);
    setStories(prev => prev.map(story => 
      story.id === currentStory.id ? updatedStory : story
    ));
    setEditingChapter(null);
  };

  const handleCancelEdit = () => {
    setEditingChapter(null);
  };

  const handleStartEditStoryTitle = () => {
    setEditStoryTitle(currentStory?.title || '');
    setIsEditingStoryTitle(true);
  };

  const handleSaveStoryTitle = () => {
    if (!currentStory) return;

    const updatedStory: Story = {
      ...currentStory,
      title: editStoryTitle
    };

    setCurrentStory(updatedStory);
    setStories(prev => prev.map(story => 
      story.id === currentStory.id ? updatedStory : story
    ));
    setIsEditingStoryTitle(false);
  };

  const handleCancelEditStoryTitle = () => {
    setIsEditingStoryTitle(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: inputMessage,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 認証ヘッダーを取得
      const authHeader = getAuthHeader();
      if (!authHeader) {
        console.error('認証ヘッダーが取得できません');
        setError('認証に失敗しました。再度ログインしてください。');
        try {
          window.location.href = '/auth/login';
        } catch (error) {
          console.error('Navigation error:', error);
        }
        return;
      }

      // チャットメッセージを履歴に保存（エラーは無視）
      try {
        await fetch('/api/chat/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader,
          },
          body: JSON.stringify({
            role: 'user',
            content: inputMessage,
          }),
        });
      } catch (error) {
        console.warn('Failed to save chat history:', error);
        // チャット履歴の保存に失敗しても処理を続行
      }

      // メッセージ配列を作成（IDを除外）
      const messageHistory = [...messages, userMessage].map(({ role, content }) => ({
        role,
        content
      }));

      // スタイルプロファイルの情報を含めてリクエストを送信
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          messages: messageHistory,
          styleProfile: selectedStyleProfile ? {
            name: selectedStyleProfile.name,
            description: selectedStyleProfile.description,
            sampleText: selectedStyleProfile.settings.sampleText,
            strength: selectedStyleProfile.settings.strength,
            embedding: selectedStyleProfile.settings.embedding,
            settings: selectedStyleProfile.settings
          } : null
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('認証エラー: セッションが期限切れです');
          setError('セッションが期限切れです。再度ログインしてください。');
          try {
            window.location.href = '/auth/login';
          } catch (error) {
            console.error('Navigation error:', error);
          }
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get AI response');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to get AI response');
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: data.message,
      };

      // AIの応答を履歴に保存（エラーは無視）
      try {
        await fetch('/api/chat/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader,
          },
          body: JSON.stringify({
            role: 'assistant',
            content: data.message,
          }),
        });
      } catch (error) {
        console.warn('Failed to save assistant response to history:', error);
        // チャット履歴の保存に失敗しても処理を続行
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('メッセージの送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: string) => {
    if (!currentChapter || !currentStory) return;

    const currentChapterData = currentStory.chapters.find(c => c.id === currentChapter.id);
    if (!currentChapterData) return;

    const currentContent = currentChapterData.content;
    const updatedContent = `${currentContent}\n\n${suggestion}`;

    // Save revision before applying AI suggestion
    saveRevision(currentChapterData, 'ai', currentContent);
    
    handleUpdateChapter(currentChapter.id, { content: updatedContent });
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (!currentStory || !window.confirm('このチャプターを削除してもよろしいですか？')) return;

    const updatedStory = {
      ...currentStory,
      chapters: currentStory.chapters.filter(chapter => chapter.id !== chapterId)
    };
    
    setCurrentStory(updatedStory);
    setStories(prev => prev.map(story => 
      story.id === currentStory.id ? updatedStory : story
    ));

    if (currentChapter && currentChapter.id === chapterId) {
      const remainingChapters = updatedStory.chapters;
      if (remainingChapters.length > 0) {
        setCurrentChapter(remainingChapters[0]);
      } else {
        setCurrentChapter(EMPTY_CHAPTER);
      }
    }
  };

  // チャット履歴を取得する関数
  const fetchChatHistory = async () => {
    try {
      const response = await fetch('/api/chat/history', {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      const data = await response.json();
      if (data.success) {
        setChatHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  };

  // チャット履歴をクリアする関数
  const clearChatHistory = async () => {
    try {
      const response = await fetch('/api/chat/history', {
        method: 'DELETE',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear chat history');
      }

      setChatHistory([]);
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex gap-4">
      {/* Left sidebar - Structure */}
      <div className="w-64 bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Structure</h2>
        </div>
        <div className="space-y-4">
          {/* Stories List */}
          <div className="space-y-2">
            {stories.map((story) => (
              <div
                key={story.id}
                className={`border-b pb-4 ${
                  currentStory?.id === story.id ? 'border-blue-500' : ''
                }`}
              >
                {isEditingStoryTitle && currentStory?.id === story.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editStoryTitle}
                      onChange={(e) => setEditStoryTitle(e.target.value)}
                      className="w-full px-2 py-1 border rounded text-lg font-bold"
                      placeholder="物語のタイトル"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveStoryTitle}
                        className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        保存
                      </button>
                      <button
                        onClick={handleCancelEditStoryTitle}
                        className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md"
                    onClick={() => {
                      setCurrentStory(story);
                      setIsChaptersVisible(currentStory?.id === story.id);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className={`w-4 h-4 transform transition-transform ${currentStory?.id === story.id && isChaptersVisible ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <h3 className="text-lg font-bold">{story.title}</h3>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Story object:', story);
                          if (story.id) {
                            console.log('Deleting story with ID:', story.id);
                            handleDeleteStory(story.id);
                          } else {
                            console.error('Story ID is missing:', story);
                            alert('ストーリーIDが見つかりません。削除できません。');
                          }
                        }}
                        className="p-1 hover:bg-gray-200 rounded text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Chapters */}
                {currentStory?.id === story.id && (
                  <div className={`space-y-2 transition-all duration-200 ${isChaptersVisible ? 'opacity-100 max-h-[calc(100vh-16rem)] overflow-y-auto' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                    {story.chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        className={`w-full px-3 py-2 rounded-md ${
                          currentChapter && currentChapter.id === chapter.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {editingChapter === chapter.id ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editNumber}
                                onChange={(e) => setEditNumber(Number(e.target.value))}
                                className="w-16 px-2 py-1 border rounded"
                                min="1"
                              />
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="flex-1 px-2 py-1 border rounded"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEdit}
                                className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                保存
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                setCurrentStory(story);
                                setCurrentChapter(chapter);
                                console.log('Selected chapter:', chapter);
                                console.log('Current story:', story);
                              }}
                              className="flex-1 text-left"
                            >
                              Chapter {chapter.number}: {chapter.title}
                            </button>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleStartEdit(chapter)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteChapter(chapter.id)}
                                className="p-1 hover:bg-gray-200 rounded text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <button 
                      onClick={() => setIsNewChapterModalOpen(true)}
                      className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      + New Chapter
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button 
              onClick={() => setIsNewStoryModalOpen(true)}
              className="w-full text-left px-3 py-2 text-green-600 hover:bg-green-50 rounded-md"
            >
              + New Title
            </button>
          </div>
        </div>
      </div>

      {/* Main content - Editor */}
      <div className="flex-1 bg-white rounded-lg shadow-sm p-4 relative">
        {currentChapter && currentStory ? (
          <>
            <div className="mb-4">
              <input
                type="text"
                value={currentChapter.title}
                onChange={(e) => handleUpdateChapter(currentChapter.id, { title: e.target.value })}
                placeholder="Chapter Title"
                className="w-full text-2xl font-bold border-none focus:outline-none"
              />
            </div>
            <div className="prose max-w-none">
              <textarea
                value={currentChapter.content}
                onChange={(e) => handleUpdateChapter(currentChapter.id, { content: e.target.value })}
                className="w-full h-[calc(100vh-16rem)] resize-none border-none focus:outline-none p-4 text-gray-800"
                placeholder="Start writing your story..."
              />
            </div>
            <div className="absolute bottom-[99px] right-4 flex gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRevert}
                  disabled={!lastSavedContent}
                  className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Revert
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            {stories.length === 0 ? '新しい物語を作成してください' : 'チャプターを選択するか、新しいチャプターを作成してください'}
          </div>
        )}
      </div>

      {/* Right sidebar - AI Assistant */}
      <div className="w-80 bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <div className="flex gap-2">
            <button 
              className="p-1 hover:bg-gray-100 rounded" 
              title="AI Rewrite"
              onClick={() => {
                if (!currentStory || !currentChapter) {
                  console.error('No story or chapter selected');
                  return;
                }
                console.log('Current Story:', currentStory);
                console.log('Current Chapter:', currentChapter);
                const currentContent = currentChapter.content || '';
                setInputMessage(`以下の文章を改善してください：\n\n${currentContent}`);
              }}
            >
              <Wand2 className="w-4 h-4" />
            </button>
            <button 
              className="p-1 hover:bg-gray-100 rounded" 
              title="Style Profile"
              onClick={() => setIsStyleProfileModalOpen(true)}
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button 
              className="p-1 hover:bg-gray-100 rounded" 
              title="History"
              onClick={() => setIsHistoryModalOpen(true)}
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {selectedStyleProfile && (
          <div className="mb-4 p-2 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-800">{selectedStyleProfile.name}</p>
                <p className="text-xs text-blue-600">強度: {Math.round(selectedStyleProfile?.settings?.strength ? selectedStyleProfile.settings.strength * 100 : 0)}%</p>
              </div>
              <button
                onClick={() => setSelectedStyleProfile(null)}
                className="p-1 hover:bg-blue-100 rounded"
              >
                <X className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-50 text-blue-800 ml-8'
                  : 'bg-gray-50 text-gray-800 mr-8'
              }`}
            >
              {message.content}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="AIに質問する..."
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className={`p-2 rounded-md ${
                isLoading || !inputMessage.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <NewChapterModal
        isOpen={isNewChapterModalOpen}
        onClose={() => setIsNewChapterModalOpen(false)}
        onSave={handleCreateChapter}
        currentChapterCount={currentStory?.chapters.length || 0}
      />

      {/* New Story Modal */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isNewStoryModalOpen ? '' : 'hidden'}`}>
        <div className="bg-white rounded-lg p-6 w-96">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">New Title</h3>
            <button onClick={() => setIsNewStoryModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const title = formData.get('title') as string;
            handleCreateStory(title);
          }}>
            <div className="space-y-4">
              <div>
                <label htmlFor="storyTitle" className="block text-sm font-medium text-gray-700">
                  Story Title
                </label>
                <input
                  type="text"
                  id="storyTitle"
                  name="title"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter story title"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewStoryModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                  disabled={isSaving}
                >
                  {isSaving ? 'Creating...' : 'Create Title'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Style Profile Modal */}
      {isStyleProfileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[48rem] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-semibold">文体プロファイル</h3>
                <p className="text-sm text-gray-500 mt-1">物語の文体を選択してください</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/styles')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  文体を管理
                </button>
                <button
                  onClick={() => setIsStyleProfileModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {styles.map(style => (
                <div
                  key={style.id}
                  className={`p-6 rounded-xl border transition-all ${
                    selectedStyleProfile?.id === style.id
                      ? 'bg-blue-50 border-blue-200 shadow-md'
                      : 'border-gray-200 hover:border-blue-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-medium mb-2">{style.name}</h4>
                      <p className="text-gray-600">{style.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStyleProfile(style);
                          setIsStyleProfileModalOpen(false);
                        }}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          selectedStyleProfile?.id === style.id
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {selectedStyleProfile?.id === style.id ? '選択中' : '選択'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">文体の強さ</span>
                        <span className="text-sm text-gray-500">
                          {Math.round(style?.settings?.strength ? style.settings.strength * 100 : 0)}%
                        </span>
                      </div>
                      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${style?.settings?.strength ? style.settings.strength * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">サンプルテキスト</h5>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-600">
                        {style?.settings?.sampleText || 'サンプルテキストがありません'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsStyleProfileModalOpen(false)}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[48rem] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-semibold">チャット履歴</h3>
                <p className="text-sm text-gray-500 mt-1">過去の会話を確認できます</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearChatHistory}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  履歴をクリア
                </button>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {chatHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  チャット履歴がありません
                </div>
              ) : (
                chatHistory.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-50 text-blue-800'
                        : 'bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium">
                        {message.role === 'user' ? 'あなた' : 'AI'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// エラーバウンダリでラップしたエクスポート
export default function EditorWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <Editor />
    </ErrorBoundary>
  );
} 