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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Style Profiles</h1>
          <button
            onClick={() => setIsNewStyleModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create New Style
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4">
            {styles.length === 0 ? (
              <p className="text-gray-500 text-center">No style profiles available</p>
            ) : (
              <div className="space-y-4">
                {styles.map((style) => (
                  <div
                    key={style.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{style.name}</h3>
                        <p className="text-sm text-gray-500">{style.description}</p>
                        <div className="mt-2">
                          <span className="text-sm text-gray-500">Strength: {style.strength}%</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditStyle(style)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStyle(style.id)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isNewStyleModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingStyle ? 'Edit Style Profile' : 'Create New Style Profile'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={newStyleName}
                    onChange={(e) => setNewStyleName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newStyleDescription}
                    onChange={(e) => setNewStyleDescription(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sample Text</label>
                  <textarea
                    value={newStyleSampleText}
                    onChange={(e) => setNewStyleSampleText(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Strength</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newStyleStrength}
                    onChange={(e) => setNewStyleStrength(parseInt(e.target.value))}
                    className="mt-1 block w-full"
                  />
                  <div className="text-sm text-gray-500 text-right">{newStyleStrength}%</div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setIsNewStyleModalOpen(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStyle}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingStyle ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isEditStyleModalOpen && editingStyle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                Edit Style Profile
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editStyleName}
                    onChange={(e) => setEditStyleName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={editStyleDescription}
                    onChange={(e) => setEditStyleDescription(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sample Text</label>
                  <textarea
                    value={editStyleSampleText}
                    onChange={(e) => setEditStyleSampleText(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Strength</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editStyleStrength}
                    onChange={(e) => setEditStyleStrength(parseInt(e.target.value))}
                    className="mt-1 block w-full"
                  />
                  <div className="text-sm text-gray-500 text-right">{editStyleStrength}%</div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setIsEditStyleModalOpen(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 