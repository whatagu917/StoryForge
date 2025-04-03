import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MessageSquare, Wand2, History, Settings, X, Save, Edit2, RotateCcw } from 'lucide-react';

interface Chapter {
  id: string;
  number: number;
  title: string;
  content: string;
}

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

export default function Editor() {
  const router = useRouter();
  const { id } = router.query;
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [currentChapter, setCurrentChapter] = useState<string | null>(null);
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
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingStoryTitle, setIsEditingStoryTitle] = useState(false);
  const [editStoryTitle, setEditStoryTitle] = useState('');
  const [isChaptersVisible, setIsChaptersVisible] = useState(true);
  const [lastSavedContent, setLastSavedContent] = useState<string>('');

  // Load stories from localStorage when the component mounts
  useEffect(() => {
    const savedStories = localStorage.getItem('storyforge-stories');
    if (savedStories) {
      const parsedStories = JSON.parse(savedStories);
      setStories(parsedStories);
      if (parsedStories.length > 0) {
        setCurrentStory(parsedStories[0]);
        setLastSavedState(parsedStories[0]);
      }
    }
    
    const savedCurrentChapter = localStorage.getItem('storyforge-current-chapter');
    if (savedCurrentChapter) {
      setCurrentChapter(savedCurrentChapter);
    }
  }, []);

  // Save stories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('storyforge-stories', JSON.stringify(stories));
  }, [stories]);

  // Save current chapter to localStorage whenever it changes
  useEffect(() => {
    if (currentChapter) {
      localStorage.setItem('storyforge-current-chapter', currentChapter);
    }
  }, [currentChapter]);

  const handleCreateStory = (title: string) => {
    const newStory: Story = {
      id: Date.now().toString(),
      title,
      chapters: []
    };
    setStories(prev => [...prev, newStory]);
    setCurrentStory(newStory);
  };

  const handleDeleteStory = (storyId: string) => {
    if (!window.confirm('この物語を削除してもよろしいですか？')) return;
    
    setStories(prev => prev.filter(story => story.id !== storyId));
    if (currentStory?.id === storyId) {
      if (stories.length > 1) {
        const nextStory = stories.find(story => story.id !== storyId);
        setCurrentStory(nextStory || null);
        setLastSavedState(nextStory || null);
      } else {
        setCurrentStory(null);
        setLastSavedState(null);
      }
    }
  };

  const handleCreateChapter = (title: string, number: number) => {
    if (!currentStory) return;
    
    const newChapter: Chapter = {
      id: Date.now().toString(),
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
    setCurrentChapter(newChapter.id);
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

    const savedRevisions = localStorage.getItem('storyforge-revisions');
    const revisions = savedRevisions ? JSON.parse(savedRevisions) : [];
    localStorage.setItem('storyforge-revisions', JSON.stringify([revision, ...revisions]));
  };

  const handleUpdateChapter = (chapterId: string, updates: Partial<Chapter>) => {
    if (!currentStory) return;
    
    const currentChapterData = currentStory.chapters.find(chapter => chapter.id === chapterId);
    if (!currentChapterData) return;

    // Save revision if content is being updated
    if ('content' in updates && updates.content !== currentChapterData.content) {
      saveRevision(currentChapterData, 'manual', currentChapterData.content);
    }
    
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
  };

  const handleSave = async () => {
    if (!currentChapter || !currentStory) return;
    
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const currentChapterData = currentStory.chapters.find(c => c.id === currentChapter);
      if (currentChapterData) {
        const currentContent = currentChapterData.content;
        setLastSavedContent(currentContent);
        setLastSavedState(currentStory);
        // Save revision when manually saving
        saveRevision(currentChapterData, 'manual', currentContent);
      }
      alert('変更を保存しました');
    } catch (error) {
      console.error('保存に失敗しました:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = () => {
    if (!currentChapter || !currentStory) return;
    
    if (window.confirm('保存前の状態に戻します。よろしいですか？')) {
      const updatedStory = {
        ...currentStory,
        chapters: currentStory.chapters.map(chapter =>
          chapter.id === currentChapter
            ? { ...chapter, content: lastSavedContent }
            : chapter
        )
      };
      setCurrentStory(updatedStory);
      setStories(prev => prev.map(story => 
        story.id === currentStory.id ? updatedStory : story
      ));
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
    if (!inputMessage.trim() || !currentChapter) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const currentContent = currentStory?.chapters.find(c => c.id === currentChapter)?.content || '';
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentContent,
          message: inputMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content || '申し訳ありません。回答を生成できませんでした。',
      };

      setMessages(prev => [...prev, assistantMessage]);
      setAiSuggestions(prev => [...prev, assistantMessage.content]);
    } catch (error) {
      console.error('AIとの通信に失敗しました:', error);
      alert('AIとの通信に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: string) => {
    if (!currentChapter || !currentStory) return;

    const currentChapterData = currentStory.chapters.find(c => c.id === currentChapter);
    if (!currentChapterData) return;

    const currentContent = currentChapterData.content;
    const updatedContent = `${currentContent}\n\n${suggestion}`;

    // Save revision before applying AI suggestion
    saveRevision(currentChapterData, 'ai', currentContent);
    
    handleUpdateChapter(currentChapter, { content: updatedContent });
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

    if (currentChapter === chapterId) {
      const remainingChapters = updatedStory.chapters;
      if (remainingChapters.length > 0) {
        setCurrentChapter(remainingChapters[0].id);
      } else {
        setCurrentChapter(null);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex gap-4">
      {/* Left sidebar - Structure */}
      <div className="w-64 bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Structure</h2>
          <button className="p-1 hover:bg-gray-100 rounded">
            <Settings className="w-4 h-4" />
          </button>
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
                          handleStartEditStoryTitle();
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {stories.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStory(story.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
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
                          currentChapter === chapter.id
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
                              onClick={() => setCurrentChapter(chapter.id)}
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
              + New Story
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
                value={currentStory.chapters.find(c => c.id === currentChapter)?.title || ''}
                onChange={(e) => handleUpdateChapter(currentChapter, { title: e.target.value })}
                placeholder="Chapter Title"
                className="w-full text-2xl font-bold border-none focus:outline-none"
              />
            </div>
            <div className="prose max-w-none">
              <textarea
                value={currentStory.chapters.find(c => c.id === currentChapter)?.content || ''}
                onChange={(e) => handleUpdateChapter(currentChapter, { content: e.target.value })}
                className="w-full h-[calc(100vh-32rem)] resize-none border-none focus:outline-none"
                placeholder="Start writing your story..."
              />
            </div>
            <div className="absolute bottom-[99px] right-4 flex gap-2">
              <button
                onClick={handleRevert}
                disabled={!lastSavedContent}
                className={`px-6 rounded-md flex items-center gap-2 ${
                  !lastSavedContent
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gray-600 hover:bg-gray-700'
                } text-white shadow-md h-[42px]`}
                title="保存前の状態に戻す"
              >
                <RotateCcw className="w-4 h-4" />
                元に戻す
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-6 rounded-md flex items-center gap-2 ${
                  isSaving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white shadow-md h-[42px]`}
              >
                <Save className="w-4 h-4" />
                {isSaving ? '保存中...' : '保存'}
              </button>
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
                if (!currentChapter) return;
                const currentContent = currentStory?.chapters.find(c => c.id === currentChapter)?.content || '';
                setInputMessage(`以下の文章を改善してください：\n\n${currentContent}`);
              }}
            >
              <Wand2 className="w-4 h-4" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded" title="History">
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* AI Chat Interface */}
        <div className="h-[calc(100vh-12rem)] flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-4 p-3 rounded-lg ${
                  message.role === 'user' ? 'bg-gray-100' : 'bg-blue-50'
                }`}
              >
                <p className="text-sm text-gray-700">{message.content}</p>
                {message.role === 'assistant' && (
                  <button 
                    onClick={() => handleApplySuggestion(message.content)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    提案を適用
                  </button>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="text-center text-gray-500">
                考え中...
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
            <h3 className="text-lg font-semibold">New Story</h3>
            <button onClick={() => setIsNewStoryModalOpen(false)} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const title = formData.get('title') as string;
            handleCreateStory(title);
            setIsNewStoryModalOpen(false);
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
                >
                  Create Story
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 