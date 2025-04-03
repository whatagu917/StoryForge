import React, { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, Tag, Plus, Search, Filter, Wand2, ArrowRight, X, Edit2 } from 'lucide-react';
import { useRouter } from 'next/router';

interface Idea {
  id: string;
  title: string;
  description: string;
  tags: string[];
  aiGenerated: boolean;
  createdAt: string;
  plotSummary?: string;
  structureOutline?: string;
  characters?: {
    name: string;
    description: string;
    role: string;
  }[];
  settings?: {
    location: string;
    timePeriod: string;
    description: string;
  }[];
  styleProfiles?: StyleProfile[];
}

interface StyleProfile {
  id: string;
  name: string;
  content: string;
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
}

interface Story {
  id: string;
  title: string;
  chapters: {
    id: string;
    number: number;
    title: string;
    content: string;
  }[];
}

export default function Ideas() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isNewIdeaModalOpen, setIsNewIdeaModalOpen] = useState(false);
  const [isEditIdeaModalOpen, setIsEditIdeaModalOpen] = useState(false);
  const [isStyleProfileModalOpen, setIsStyleProfileModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaDescription, setNewIdeaDescription] = useState('');
  const [newIdeaTags, setNewIdeaTags] = useState<string[]>([]);
  const [editIdeaTitle, setEditIdeaTitle] = useState('');
  const [editIdeaDescription, setEditIdeaDescription] = useState('');
  const [editIdeaTags, setEditIdeaTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [editTagInput, setEditTagInput] = useState('');
  const [stories, setStories] = useState<Story[]>([]);
  const [isGeneratingPlot, setIsGeneratingPlot] = useState(false);
  const [styleProfileName, setStyleProfileName] = useState('');
  const [styleProfileContent, setStyleProfileContent] = useState('');
  const [isGeneratingStyle, setIsGeneratingStyle] = useState(false);

  // Load ideas and stories from localStorage
  useEffect(() => {
    const savedIdeas = localStorage.getItem('storyforge-ideas');
    if (savedIdeas) {
      setIdeas(JSON.parse(savedIdeas));
    }

    const savedStories = localStorage.getItem('storyforge-stories');
    if (savedStories) {
      setStories(JSON.parse(savedStories));
    }
  }, []);

  // Save ideas to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('storyforge-ideas', JSON.stringify(ideas));
  }, [ideas]);

  const handleAddIdea = () => {
    if (!newIdeaTitle.trim() || !newIdeaDescription.trim()) return;

    const newIdea: Idea = {
      id: Date.now().toString(),
      title: newIdeaTitle,
      description: newIdeaDescription,
      tags: newIdeaTags,
      aiGenerated: false,
      createdAt: new Date().toISOString(),
    };

    setIdeas([newIdea, ...ideas]);
    setNewIdeaTitle('');
    setNewIdeaDescription('');
    setNewIdeaTags([]);
    setIsNewIdeaModalOpen(false);
  };

  const handleGeneratePlot = async (idea: Idea) => {
    setIsGeneratingPlot(true);
    try {
      // プロットサマリーの生成
      const summaryResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `以下のアイデアに基づいて、物語のプロットサマリーを生成してください：\n\nタイトル：${idea.title}\n説明：${idea.description}\nタグ：${idea.tags.join(', ')}\n\n出力形式：\n1. 物語の概要\n2. 主要な展開\n3. 結末`,
        }),
      });

      if (!summaryResponse.ok) {
        throw new Error('API request failed');
      }

      const summaryData = await summaryResponse.json();

      // 構造アウトラインの生成
      const structureResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `以下のアイデアに基づいて、物語の構造アウトラインを生成してください：\n\nタイトル：${idea.title}\n説明：${idea.description}\nタグ：${idea.tags.join(', ')}\n\n出力形式：\n1. 導入部\n2. 展開部\n3. クライマックス\n4. 結末部`,
        }),
      });

      if (!structureResponse.ok) {
        throw new Error('API request failed');
      }

      const structureData = await structureResponse.json();

      // キャラクター設定の生成
      const charactersResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `以下のアイデアに基づいて、主要なキャラクター設定を生成してください：\n\nタイトル：${idea.title}\n説明：${idea.description}\nタグ：${idea.tags.join(', ')}\n\n出力形式：JSON\n{\n  "characters": [\n    {\n      "name": "キャラクター名",\n      "description": "キャラクターの説明",\n      "role": "役割"\n    }\n  ]\n}`,
        }),
      });

      if (!charactersResponse.ok) {
        throw new Error('API request failed');
      }

      const charactersData = await charactersResponse.json();

      // 設定の生成
      const settingsResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `以下のアイデアに基づいて、物語の設定を生成してください：\n\nタイトル：${idea.title}\n説明：${idea.description}\nタグ：${idea.tags.join(', ')}\n\n出力形式：JSON\n{\n  "settings": [\n    {\n      "location": "場所",\n      "timePeriod": "時代",\n      "description": "設定の説明"\n    }\n  ]\n}`,
        }),
      });

      if (!settingsResponse.ok) {
        throw new Error('API request failed');
      }

      const settingsData = await settingsResponse.json();

      const updatedIdea = {
        ...idea,
        plotSummary: summaryData.content,
        structureOutline: structureData.content,
        characters: charactersData.characters || [],
        settings: settingsData.settings || [],
      };

      setIdeas(prev => prev.map(i => i.id === idea.id ? updatedIdea : i));
      setSelectedIdea(updatedIdea);
    } catch (error) {
      console.error('プロット生成に失敗しました:', error);
      alert('プロット生成に失敗しました');
    } finally {
      setIsGeneratingPlot(false);
    }
  };

  const handleApplyIdea = (idea: Idea) => {
    if (stories.length === 0) {
      alert('先に物語を作成してください');
      return;
    }

    const storyId = prompt('適用する物語のIDを入力してください：');
    if (!storyId) return;

    const story = stories.find(s => s.id === storyId);
    if (!story) {
      alert('物語が見つかりません');
      return;
    }

    const chapterId = prompt('適用するチャプターのIDを入力してください：');
    if (!chapterId) return;

    const chapter = story.chapters.find(c => c.id === chapterId);
    if (!chapter) {
      alert('チャプターが見つかりません');
      return;
    }

    const updatedContent = `${chapter.content}\n\n【アイデア適用】\n${idea.title}\n${idea.description}\n${idea.plotSummary || ''}`;
    
    const updatedStories = stories.map(s => {
      if (s.id === storyId) {
        return {
          ...s,
          chapters: s.chapters.map(c => 
            c.id === chapterId ? { ...c, content: updatedContent } : c
          ),
        };
      }
      return s;
    });

    localStorage.setItem('storyforge-stories', JSON.stringify(updatedStories));
    alert('アイデアを適用しました');
  };

  const handleDeleteIdea = (ideaId: string) => {
    if (!window.confirm('このアイデアを削除してもよろしいですか？')) return;
    setIdeas(prev => prev.filter(idea => idea.id !== ideaId));
    if (selectedIdea?.id === ideaId) {
      setSelectedIdea(null);
    }
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !newIdeaTags.includes(newTagInput.trim())) {
      setNewIdeaTags([...newIdeaTags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewIdeaTags(prev => prev.filter(t => t !== tag));
  };

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // タグが選択されている場合は削除
      handleRemoveSelectedTag(tag);
    } else {
      // タグが選択されていない場合は追加
      setSelectedTags(prev => {
        const newTags = [...prev, tag];
        // タグが選択された場合、関連するアイデアを表示
        const relatedIdeas = ideas.filter(idea => 
          idea.tags.some(t => newTags.includes(t))
        );
        if (relatedIdeas.length > 0) {
          setSelectedIdea(relatedIdeas[0]);
        }
        return newTags;
      });
    }
  };

  const handleRemoveSelectedTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
    // タグが削除された場合、関連するアイデアを更新
    const relatedIdeas = ideas.filter(idea => 
      idea.tags.some(t => selectedTags.filter(st => st !== tag).includes(t))
    );
    if (relatedIdeas.length > 0) {
      setSelectedIdea(relatedIdeas[0]);
    } else {
      setSelectedIdea(null);
    }
  };

  const handleEditIdea = (idea: Idea) => {
    setEditingIdea(idea);
    setEditIdeaTitle(idea.title);
    setEditIdeaDescription(idea.description);
    setEditIdeaTags([...idea.tags]);
    setIsEditIdeaModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingIdea || !editIdeaTitle.trim() || !editIdeaDescription.trim()) return;

    const updatedIdea = {
      ...editingIdea,
      title: editIdeaTitle,
      description: editIdeaDescription,
      tags: editIdeaTags,
    };

    setIdeas(prev => prev.map(i => i.id === editingIdea.id ? updatedIdea : i));
    if (selectedIdea?.id === editingIdea.id) {
      setSelectedIdea(updatedIdea);
    }
    setIsEditIdeaModalOpen(false);
    setEditingIdea(null);
  };

  const handleAddEditTag = () => {
    if (editTagInput.trim() && !editIdeaTags.includes(editTagInput.trim())) {
      setEditIdeaTags([...editIdeaTags, editTagInput.trim()]);
      setEditTagInput('');
    }
  };

  const handleRemoveEditTag = (tag: string) => {
    setEditIdeaTags(prev => prev.filter(t => t !== tag));
  };

  const handleAddStyleProfile = async () => {
    if (!selectedIdea || !styleProfileName.trim() || !styleProfileContent.trim()) return;

    setIsGeneratingStyle(true);
    try {
      // 文体プロファイルのembeddingを生成
      const response = await fetch('/api/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: styleProfileContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate embedding');
      }

      const { embedding } = await response.json();

      const newStyleProfile: StyleProfile = {
        id: Date.now().toString(),
        name: styleProfileName,
        content: styleProfileContent,
        embedding,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedIdea = {
        ...selectedIdea,
        styleProfiles: [...(selectedIdea.styleProfiles || []), newStyleProfile],
      };

      setIdeas(prev => prev.map(i => i.id === selectedIdea.id ? updatedIdea : i));
      setSelectedIdea(updatedIdea);
      setStyleProfileName('');
      setStyleProfileContent('');
      setIsStyleProfileModalOpen(false);
    } catch (error) {
      console.error('Failed to add style profile:', error);
      setError(error as Error);
    } finally {
      setIsGeneratingStyle(false);
    }
  };

  const handleDeleteStyleProfile = (profileId: string) => {
    if (!selectedIdea) return;

    const updatedIdea = {
      ...selectedIdea,
      styleProfiles: selectedIdea.styleProfiles?.filter(p => p.id !== profileId) || [],
    };

    setIdeas(prev => prev.map(i => i.id === selectedIdea.id ? updatedIdea : i));
    setSelectedIdea(updatedIdea);
  };

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.every(tag => idea.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(ideas.flatMap(idea => idea.tags)));

  return (
    <div className="h-[calc(100vh-2rem)] p-4 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Story Ideas</h1>
          <button
            onClick={() => setIsNewIdeaModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Idea
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        {/* Ideas List */}
        <div className="w-1/3 bg-white shadow rounded-lg p-4 overflow-y-auto">
          {/* Search and Filter */}
          <div className="mb-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ideas..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Ideas List */}
          <div className="space-y-4">
            {filteredIdeas.map((idea) => (
              <div
                key={idea.id}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedIdea?.id === idea.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedIdea(idea)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{idea.title}</h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{idea.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {idea.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteIdea(idea.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Idea Details */}
        <div className="flex-1 bg-white shadow rounded-lg p-4 overflow-y-auto">
          {selectedIdea ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedIdea.title}</h2>
                  <p className="mt-2 text-gray-600">{selectedIdea.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedIdea.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditIdea(selectedIdea)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    編集
                  </button>
                  <button
                    onClick={() => setIsStyleProfileModalOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    文体追加
                  </button>
                  <button
                    onClick={() => handleGeneratePlot(selectedIdea)}
                    disabled={isGeneratingPlot}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Wand2 className="w-4 h-4" />
                    {isGeneratingPlot ? '生成中...' : 'プロット生成'}
                  </button>
                  <button
                    onClick={() => handleApplyIdea(selectedIdea)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    このアイデアを使う
                  </button>
                </div>
              </div>

              {selectedIdea.styleProfiles && selectedIdea.styleProfiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">文体プロファイル</h3>
                  <div className="space-y-4">
                    {selectedIdea.styleProfiles.map((profile) => (
                      <div key={profile.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{profile.name}</h4>
                            <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{profile.content}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteStyleProfile(profile.id)}
                            className="p-1 hover:bg-gray-200 rounded text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedIdea.plotSummary && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">プロットサマリー</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {selectedIdea.plotSummary}
                    </pre>
                  </div>
                </div>
              )}

              {selectedIdea.structureOutline && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">構造アウトライン</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {selectedIdea.structureOutline}
                    </pre>
                  </div>
                </div>
              )}

              {selectedIdea.characters && selectedIdea.characters.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">キャラクター設定</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedIdea.characters.map((character, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900">{character.name}</h4>
                        <p className="mt-1 text-sm text-gray-600">{character.description}</p>
                        <p className="mt-1 text-sm text-indigo-600">役割: {character.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedIdea.settings && selectedIdea.settings.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">設定</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedIdea.settings.map((setting, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900">{setting.location}</h4>
                        <p className="mt-1 text-sm text-gray-600">{setting.description}</p>
                        <p className="mt-1 text-sm text-indigo-600">時代: {setting.timePeriod}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              アイデアを選択してください
            </div>
          )}
        </div>
      </div>

      {/* New Idea Modal */}
      {isNewIdeaModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[32rem]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">New Idea</h3>
              <button
                onClick={() => setIsNewIdeaModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={newIdeaTitle}
                  onChange={(e) => setNewIdeaTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter idea title"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newIdeaDescription}
                  onChange={(e) => setNewIdeaDescription(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Describe your idea..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newIdeaTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-indigo-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Add a tag..."
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsNewIdeaModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddIdea}
                  disabled={!newIdeaTitle.trim() || !newIdeaDescription.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Idea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Idea Modal */}
      {isEditIdeaModalOpen && editingIdea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[32rem]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Idea</h3>
              <button
                onClick={() => setIsEditIdeaModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="edit-title"
                  value={editIdeaTitle}
                  onChange={(e) => setEditIdeaTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={editIdeaDescription}
                  onChange={(e) => setEditIdeaDescription(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editIdeaTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveEditTag(tag)}
                        className="ml-1 hover:text-indigo-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddEditTag()}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Add a tag..."
                  />
                  <button
                    onClick={handleAddEditTag}
                    className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsEditIdeaModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editIdeaTitle.trim() || !editIdeaDescription.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Style Profile Modal */}
      {isStyleProfileModalOpen && selectedIdea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[32rem]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Style Profile</h3>
              <button
                onClick={() => setIsStyleProfileModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="style-name" className="block text-sm font-medium text-gray-700">
                  Profile Name
                </label>
                <input
                  type="text"
                  id="style-name"
                  value={styleProfileName}
                  onChange={(e) => setStyleProfileName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter profile name..."
                />
              </div>
              <div>
                <label htmlFor="style-content" className="block text-sm font-medium text-gray-700">
                  Content
                </label>
                <textarea
                  id="style-content"
                  value={styleProfileContent}
                  onChange={(e) => setStyleProfileContent(e.target.value)}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter style content..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsStyleProfileModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStyleProfile}
                  disabled={!styleProfileName.trim() || !styleProfileContent.trim() || isGeneratingStyle}
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50"
                >
                  {isGeneratingStyle ? 'Adding...' : 'Add Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 