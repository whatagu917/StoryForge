import React, { useState, useEffect } from 'react';
import { Upload, Wand2, Eye, Trash2, Plus, X, Edit2, Sparkles, Copy, ArrowRight } from 'lucide-react';

interface StyleProfile {
  id: string;
  name: string;
  description: string;
  sampleText: string;
  strength: number;
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
}

export default function Styles() {
  const [styles, setStyles] = useState<StyleProfile[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StyleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
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

  // Load styles from localStorage
  useEffect(() => {
    const savedStyles = localStorage.getItem('storyforge-styles');
    if (savedStyles) {
      setStyles(JSON.parse(savedStyles));
    }
  }, []);

  // Save styles to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('storyforge-styles', JSON.stringify(styles));
  }, [styles]);

  const handleAddStyle = async () => {
    if (!newStyleName.trim() || !newStyleDescription.trim() || !newStyleSampleText.trim()) return;

    setIsGeneratingStyle(true);
    try {
      // 文体プロファイルのembeddingを生成
      const response = await fetch('/api/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newStyleSampleText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate embedding');
      }

      const { embedding } = await response.json();

      const newStyle: StyleProfile = {
        id: Date.now().toString(),
        name: newStyleName,
        description: newStyleDescription,
        sampleText: newStyleSampleText,
        strength: newStyleStrength,
        embedding,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setStyles([newStyle, ...styles]);
      setNewStyleName('');
      setNewStyleDescription('');
      setNewStyleSampleText('');
      setNewStyleStrength(0.5);
      setIsNewStyleModalOpen(false);
    } catch (error) {
      console.error('Failed to add style profile:', error);
      setError(error as Error);
    } finally {
      setIsGeneratingStyle(false);
    }
  };

  const handleEditStyle = (style: StyleProfile) => {
    setEditingStyle(style);
    setEditStyleName(style.name);
    setEditStyleDescription(style.description);
    setEditStyleSampleText(style.sampleText);
    setEditStyleStrength(style.strength);
    setIsEditStyleModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingStyle || !editStyleName.trim() || !editStyleDescription.trim() || !editStyleSampleText.trim()) return;

    setIsGeneratingStyle(true);
    try {
      // 文体プロファイルのembeddingを再生成
      const response = await fetch('/api/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editStyleSampleText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate embedding');
      }

      const { embedding } = await response.json();

      const updatedStyle = {
        ...editingStyle,
        name: editStyleName,
        description: editStyleDescription,
        sampleText: editStyleSampleText,
        strength: editStyleStrength,
        embedding,
        updatedAt: new Date().toISOString(),
      };

      setStyles(prev => prev.map(s => s.id === editingStyle.id ? updatedStyle : s));
      if (selectedStyle?.id === editingStyle.id) {
        setSelectedStyle(updatedStyle);
      }
      setIsEditStyleModalOpen(false);
      setEditingStyle(null);
    } catch (error) {
      console.error('Failed to update style profile:', error);
      setError(error as Error);
    } finally {
      setIsGeneratingStyle(false);
    }
  };

  const handleDeleteStyle = (styleId: string) => {
    if (!window.confirm('この文体プロファイルを削除してもよろしいですか？')) return;
    setStyles(prev => prev.filter(style => style.id !== styleId));
    if (selectedStyle?.id === styleId) {
      setSelectedStyle(null);
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
          strength: selectedStyle.strength,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to imitate style');
      }

      const { result } = await response.json();
      setImitationResult(result);
    } catch (error) {
      console.error('Failed to imitate style:', error);
      setError(error as Error);
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

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">文体プロファイル</h2>
            <button
              onClick={() => setIsNewStyleModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              新規作成
            </button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="文体を検索..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {filteredStyles.length === 0 ? (
            <div className="text-center py-12">
              <Wand2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">文体プロファイルがありません</h3>
              <p className="mt-1 text-sm text-gray-500">新しい文体プロファイルを作成してください。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStyles.map((style) => (
                <div
                  key={style.id}
                  className={`flex items-start justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedStyle?.id === style.id
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedStyle(style)}
                >
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{style.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{style.description}</p>
                    <div className="mt-2 flex items-center space-x-4">
                      <div className="flex items-center">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-indigo-600 rounded-full"
                            style={{ width: `${style.strength * 100}%` }}
                          />
                        </div>
                        <span className="ml-2 text-sm text-gray-500">
                          {Math.round(style.strength * 100)}%
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(style.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <button 
                      className="p-1 text-gray-400 hover:text-gray-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditStyle(style);
                      }}
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button 
                      className="p-1 text-gray-400 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStyle(style.id);
                      }}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedStyle && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">文体詳細</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditStyle(selectedStyle)}
                  className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  編集
                </button>
                <button
                  onClick={() => handleDeleteStyle(selectedStyle.id)}
                  className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  削除
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">名前</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedStyle.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">説明</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedStyle.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">強度</h4>
                <div className="mt-1 flex items-center">
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-indigo-600 rounded-full"
                      style={{ width: `${selectedStyle.strength * 100}%` }}
                    />
                  </div>
                  <span className="ml-2 text-sm text-gray-500">
                    {Math.round(selectedStyle.strength * 100)}%
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">サンプルテキスト</h4>
                <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedStyle.sampleText}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">作成日時</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedStyle.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedStyle && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">文体模倣</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="imitation-text" className="block text-sm font-medium text-gray-700">
                  模倣したいテキスト
                </label>
                <textarea
                  id="imitation-text"
                  value={imitationText}
                  onChange={(e) => setImitationText(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="模倣したいテキストを入力してください..."
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleImitateStyle}
                  disabled={!imitationText.trim() || isImitatingStyle}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {isImitatingStyle ? '生成中...' : '文体模倣'}
                </button>
              </div>
              {imitationResult && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-500">模倣結果</h4>
                    <button
                      onClick={handleCopyResult}
                      className="px-2 py-1 text-xs font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      コピー
                    </button>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{imitationResult}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Style Modal */}
      {isNewStyleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[32rem]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">新規文体プロファイル</h3>
              <button
                onClick={() => setIsNewStyleModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="style-name" className="block text-sm font-medium text-gray-700">
                  名前
                </label>
                <input
                  type="text"
                  id="style-name"
                  value={newStyleName}
                  onChange={(e) => setNewStyleName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="文体の名前を入力..."
                />
              </div>
              <div>
                <label htmlFor="style-description" className="block text-sm font-medium text-gray-700">
                  説明
                </label>
                <textarea
                  id="style-description"
                  value={newStyleDescription}
                  onChange={(e) => setNewStyleDescription(e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="文体の説明を入力..."
                />
              </div>
              <div>
                <label htmlFor="style-sample" className="block text-sm font-medium text-gray-700">
                  サンプルテキスト
                </label>
                <textarea
                  id="style-sample"
                  value={newStyleSampleText}
                  onChange={(e) => setNewStyleSampleText(e.target.value)}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="この文体のサンプルテキストを入力..."
                />
              </div>
              <div>
                <label htmlFor="style-strength" className="block text-sm font-medium text-gray-700">
                  強度: {Math.round(newStyleStrength * 100)}%
                </label>
                <input
                  type="range"
                  id="style-strength"
                  min="0"
                  max="1"
                  step="0.05"
                  value={newStyleStrength}
                  onChange={(e) => setNewStyleStrength(parseFloat(e.target.value))}
                  className="mt-1 block w-full"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsNewStyleModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddStyle}
                  disabled={!newStyleName.trim() || !newStyleDescription.trim() || !newStyleSampleText.trim() || isGeneratingStyle}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isGeneratingStyle ? '作成中...' : '作成'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Style Modal */}
      {isEditStyleModalOpen && editingStyle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[32rem]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">文体プロファイルの編集</h3>
              <button
                onClick={() => setIsEditStyleModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-style-name" className="block text-sm font-medium text-gray-700">
                  名前
                </label>
                <input
                  type="text"
                  id="edit-style-name"
                  value={editStyleName}
                  onChange={(e) => setEditStyleName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="edit-style-description" className="block text-sm font-medium text-gray-700">
                  説明
                </label>
                <textarea
                  id="edit-style-description"
                  value={editStyleDescription}
                  onChange={(e) => setEditStyleDescription(e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="edit-style-sample" className="block text-sm font-medium text-gray-700">
                  サンプルテキスト
                </label>
                <textarea
                  id="edit-style-sample"
                  value={editStyleSampleText}
                  onChange={(e) => setEditStyleSampleText(e.target.value)}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="edit-style-strength" className="block text-sm font-medium text-gray-700">
                  強度: {Math.round(editStyleStrength * 100)}%
                </label>
                <input
                  type="range"
                  id="edit-style-strength"
                  min="0"
                  max="1"
                  step="0.05"
                  value={editStyleStrength}
                  onChange={(e) => setEditStyleStrength(parseFloat(e.target.value))}
                  className="mt-1 block w-full"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsEditStyleModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editStyleName.trim() || !editStyleDescription.trim() || !editStyleSampleText.trim() || isGeneratingStyle}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isGeneratingStyle ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 