import React, { useState, useEffect } from 'react';
import { Upload, Wand2, Eye, Trash2, Plus, X, Edit2, Sparkles, Copy, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/router';
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

export default function Styles() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [styles, setStyles] = useState<StyleProfile[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StyleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isNewStyleModalOpen, setIsNewStyleModalOpen] = useState(false);
  const [isEditStyleModalOpen, setIsEditStyleModalOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<StyleProfile | null>(null);
  const [newStyleName, setNewStyleName] = useState('');
  const [newStyleDescription, setNewStyleDescription] = useState('');
  const [newStyleSampleText, setNewStyleSampleText] = useState('');
  const [newStyleStrength, setNewStyleStrength] = useState(0.5);
  const [editStyleName, setEditStyleName] = useState('');
  const [editStyleDescription, setEditStyleDescription] = useState('');
  const [editStyleSampleText, setEditStyleSampleText] = useState('');
  const [editStyleStrength, setEditStyleStrength] = useState(0.5);
  const [isGeneratingStyle, setIsGeneratingStyle] = useState(false);
  const [isImitatingStyle, setIsImitatingStyle] = useState(false);
  const [imitationText, setImitationText] = useState('');
  const [imitationResult, setImitationResult] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(true);

  // Load styles from API
  useEffect(() => {
    const loadStyles = async () => {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/styles', {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load styles');
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
      } finally {
        setIsLoading(false);
      }
    };

    loadStyles();
  }, [isAuthenticated, router]);

  const handleAddStyle = async () => {
    if (!newStyleName || !newStyleDescription || !newStyleSampleText) {
      alert('すべての項目を入力してください');
      return;
    }

    setIsCreating(true);
    try {
      // Generate embedding
      const embedResponse = await fetch('/api/embed', {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newStyleSampleText }),
      });

      if (!embedResponse.ok) {
        throw new Error('Failed to generate embedding');
      }

      const embedData = await embedResponse.json();
      if (!embedData.success || !embedData.embedding) {
        throw new Error('Failed to generate embedding');
      }

      // Create style profile
      const response = await fetch('/api/styles', {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newStyleName,
          description: newStyleDescription,
          settings: {
            sampleText: newStyleSampleText,
            strength: newStyleStrength,
            embedding: embedData.embedding,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create style profile');
      }

      const data = await response.json();
      if (data.success) {
        setStyles(prev => [...prev, data.data]);
        setNewStyleName('');
        setNewStyleDescription('');
        setNewStyleSampleText('');
        setNewStyleStrength(0.5);
        alert('スタイルプロファイルを作成しました');
      } else {
        throw new Error(data.message || 'Failed to create style profile');
      }
    } catch (err) {
      console.error('Failed to create style profile:', err);
      alert('スタイルプロファイルの作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditStyle = (style: StyleProfile) => {
    setEditingStyle(style);
    setEditStyleName(style.name);
    setEditStyleDescription(style.description);
    setEditStyleSampleText(style.settings.sampleText);
    setEditStyleStrength(style.settings.strength);
    setIsEditStyleModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingStyle || !editStyleName.trim() || !editStyleDescription.trim() || !editStyleSampleText.trim()) return;

    setIsGeneratingStyle(true);
    try {
      // Generate new embedding
      const embedResponse = await fetch('/api/embed', {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editStyleSampleText,
        }),
      });

      if (!embedResponse.ok) {
        throw new Error('Failed to generate embedding');
      }

      const { embedding } = await embedResponse.json();

      // Update style profile
      const response = await fetch(`/api/styles/${editingStyle.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editStyleName,
          description: editStyleDescription,
          settings: {
            sampleText: editStyleSampleText,
            strength: editStyleStrength,
            embedding,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update style profile');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setStyles(prev => prev.map(s => s.id === editingStyle.id ? data.data : s));
        if (selectedStyle?.id === editingStyle.id) {
          setSelectedStyle(data.data);
        }
        setIsEditStyleModalOpen(false);
        setEditingStyle(null);
      }
    } catch (error) {
      console.error('Failed to update style profile:', error);
      setError('スタイルプロファイルの更新に失敗しました');
    } finally {
      setIsGeneratingStyle(false);
    }
  };

  const handleDeleteStyle = async (id: string) => {
    if (!window.confirm('このスタイルプロファイルを削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/styles/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete style profile');
      }

      const data = await response.json();
      if (data.success) {
        setStyles(prev => prev.filter(style => style.id !== id));
        alert('スタイルプロファイルを削除しました');
      } else {
        throw new Error(data.message || 'Failed to delete style profile');
      }
    } catch (err) {
      console.error('Failed to delete style profile:', err);
      alert('スタイルプロファイルの削除に失敗しました');
    }
  };

  const handleImitateStyle = async () => {
    if (!selectedStyle || !imitationText.trim()) return;

    setIsImitatingStyle(true);
    try {
      // 文体模倣のためのAPI呼び出し
      const response = await fetch('/api/imitate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          styleId: selectedStyle.id,
          text: imitationText,
          strength: selectedStyle.settings.strength,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to imitate style');
      }

      const { result } = await response.json();
      setImitationResult(result);
    } catch (error) {
      console.error('Failed to imitate style:', error);
      setError('文体模倣に失敗しました');
    } finally {
      setIsImitatingStyle(false);
    }
  };

  const handleCopyResult = () => {
    if (imitationResult) {
      navigator.clipboard.writeText(imitationResult);
    }
  };

  const filteredStyles = styles.filter(style => 
    style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    style.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">スタイルプロファイル</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showCreateForm ? 'フォームを隠す' : '新規作成'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Style Profile</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="styleName" className="block text-sm font-medium text-gray-700 mb-1">
                スタイル名
              </label>
              <input
                type="text"
                id="styleName"
                value={newStyleName}
                onChange={(e) => setNewStyleName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: シンプルで読みやすい文体"
              />
            </div>
            <div>
              <label htmlFor="styleDescription" className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                id="styleDescription"
                value={newStyleDescription}
                onChange={(e) => setNewStyleDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="例: 簡潔で読みやすく、専門用語を避けた文体です。"
              />
            </div>
            <div>
              <label htmlFor="styleSampleText" className="block text-sm font-medium text-gray-700 mb-1">
                サンプルテキスト
              </label>
              <textarea
                id="styleSampleText"
                value={newStyleSampleText}
                onChange={(e) => setNewStyleSampleText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                placeholder="例: この文章は、シンプルで読みやすい文体のサンプルです。複雑な表現を避け、簡潔に要点を伝えることを心がけています。"
              />
            </div>
            <div>
              <label htmlFor="styleStrength" className="block text-sm font-medium text-gray-700 mb-1">
                強度: {Math.round(newStyleStrength * 100)}%
              </label>
              <input
                type="range"
                id="styleStrength"
                min="0"
                max="1"
                step="0.01"
                value={newStyleStrength}
                onChange={(e) => setNewStyleStrength(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAddStyle}
                disabled={isCreating}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isCreating ? '作成中...' : '作成'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {styles.map((style) => (
          <div key={style.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{style.name}</h3>
              <button
                onClick={() => handleDeleteStyle(style.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">{style.description}</p>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">強度</span>
                <span className="text-sm text-gray-500">{Math.round(style.settings.strength * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-600 rounded-full"
                  style={{ width: `${style.settings.strength * 100}%` }}
                />
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">サンプルテキスト</h4>
              <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
                {style.settings.sampleText}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 