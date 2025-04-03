import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MessageSquare, Wand2, History, Settings, X, Save, Edit2, RotateCcw, Sparkles } from 'lucide-react';

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
  const [currentChapter, setCurrentChapter] = useState<Chapter>(EMPTY_CHAPTER);
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
  const [styles, setStyles] = useState<StyleProfile[]>([]);
  const [selectedStyleProfile, setSelectedStyleProfile] = useState<StyleProfile | null>(null);
  const [isStyleProfileModalOpen, setIsStyleProfileModalOpen] = useState(false);

  // Load stories from localStorage when the component mounts
  useEffect(() => {
    const savedStories = localStorage.getItem('storyforge-stories');
    if (savedStories) {
      try {
        const parsedStories = JSON.parse(savedStories);
        setStories(parsedStories);

        // Set current story and chapter from localStorage
        const savedCurrentStory = localStorage.getItem('storyforge-current-story');
        const savedCurrentChapter = localStorage.getItem('storyforge-current-chapter');
        
        if (savedCurrentStory) {
          const story = parsedStories.find((s: Story) => s.id === JSON.parse(savedCurrentStory).id);
          if (story) {
            setCurrentStory(story);
            setLastSavedState(story);
            
            if (savedCurrentChapter) {
              const chapter = story.chapters.find((c: Chapter) => c.id === JSON.parse(savedCurrentChapter).id);
              if (chapter) {
                // データの整合性を確保
                const validChapter: Chapter = {
                  id: chapter.id || '',
                  title: chapter.title || '',
                  content: chapter.content || '',
                  number: typeof chapter.number === 'number' ? chapter.number : 0
                };
                setCurrentChapter(validChapter);
                setLastSavedContent(validChapter.content);
              } else {
                // チャプターが見つからない場合はEMPTY_CHAPTERを使用
                setCurrentChapter(EMPTY_CHAPTER);
                setLastSavedContent('');
              }
            } else if (story.chapters.length > 0) {
              const firstChapter = story.chapters[0];
              const validChapter: Chapter = {
                id: firstChapter.id || '',
                title: firstChapter.title || '',
                content: firstChapter.content || '',
                number: typeof firstChapter.number === 'number' ? firstChapter.number : 0
              };
              setCurrentChapter(validChapter);
              setLastSavedContent(validChapter.content);
            } else {
              // チャプターが存在しない場合はEMPTY_CHAPTERを使用
              setCurrentChapter(EMPTY_CHAPTER);
              setLastSavedContent('');
            }
          } else {
            // ストーリーが見つからない場合は初期状態にリセット
            setCurrentStory(null);
            setCurrentChapter(EMPTY_CHAPTER);
            setLastSavedContent('');
          }
        } else if (parsedStories.length > 0) {
          const firstStory = parsedStories[0];
          setCurrentStory(firstStory);
          setLastSavedState(firstStory);
          
          if (firstStory.chapters.length > 0) {
            const firstChapter = firstStory.chapters[0];
            const validChapter: Chapter = {
              id: firstChapter.id || '',
              title: firstChapter.title || '',
              content: firstChapter.content || '',
              number: typeof firstChapter.number === 'number' ? firstChapter.number : 0
            };
            setCurrentChapter(validChapter);
            setLastSavedContent(validChapter.content);
          } else {
            // チャプターが存在しない場合はEMPTY_CHAPTERを使用
            setCurrentChapter(EMPTY_CHAPTER);
            setLastSavedContent('');
          }
        } else {
          // ストーリーが存在しない場合は初期状態にリセット
          setCurrentStory(null);
          setCurrentChapter(EMPTY_CHAPTER);
          setLastSavedContent('');
        }
      } catch (error) {
        console.error('Error parsing stories:', error);
        // エラー時は初期状態にリセット
        setCurrentStory(null);
        setCurrentChapter(EMPTY_CHAPTER);
        setLastSavedContent('');
      }
    }
  }, []);

  // Load styles from localStorage
  useEffect(() => {
    const savedStyles = localStorage.getItem('storyforge-styles');
    if (savedStyles) {
      setStyles(JSON.parse(savedStyles));
    }
  }, []);

  // Save stories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('storyforge-stories', JSON.stringify(stories));
  }, [stories]);

  // Save current story to localStorage whenever it changes
  useEffect(() => {
    if (currentStory) {
      localStorage.setItem('storyforge-current-story', JSON.stringify(currentStory));
    }
  }, [currentStory]);

  // Save current chapter to localStorage whenever it changes
  useEffect(() => {
    if (currentChapter) {
      localStorage.setItem('storyforge-current-chapter', JSON.stringify(currentChapter));
    }
  }, [currentChapter]);

  // Save last saved content to localStorage whenever it changes
  useEffect(() => {
    if (lastSavedContent !== null) {
      localStorage.setItem('storyforge-last-content', lastSavedContent);
    }
  }, [lastSavedContent]);

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
      const nextStory = stories.find(story => story.id !== storyId);
      setCurrentStory(nextStory || null);
      setLastSavedState(nextStory || null);
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

    const savedRevisions = localStorage.getItem('storyforge-revisions');
    const revisions = savedRevisions ? JSON.parse(savedRevisions) : [];
    localStorage.setItem('storyforge-revisions', JSON.stringify([revision, ...revisions]));
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

  const handleSave = () => {
    if (!currentStory || !currentChapter) return;

    setIsSaving(true);
    try {
      // Save current content to last-content
      setLastSavedContent(currentChapter.content);
      localStorage.setItem('storyforge-last-content', currentChapter.content);

      // Update the chapter content in the story
      const updatedStories = stories.map(story => {
        if (story.id === currentStory.id) {
          return {
            ...story,
            chapters: story.chapters.map(chapter => {
              if (chapter.id === currentChapter.id) {
                return {
                  ...chapter,
                  content: currentChapter.content
                };
              }
              return chapter;
            })
          };
        }
        return story;
      });

      // Save updated stories
      localStorage.setItem('storyforge-stories', JSON.stringify(updatedStories));
      setStories(updatedStories);

      // Save revision
      const revision: Revision = {
        id: Date.now().toString(),
        chapterId: currentChapter.id,
        storyId: currentStory.id,
        type: 'manual',
        timestamp: new Date().toLocaleString('ja-JP'),
        content: currentChapter.content,
        previousContent: lastSavedContent || '',
        chapterTitle: currentChapter.title,
        chapterNumber: currentChapter.number
      };

      const savedRevisions = localStorage.getItem('storyforge-revisions');
      const revisions = savedRevisions ? JSON.parse(savedRevisions) : [];
      localStorage.setItem('storyforge-revisions', JSON.stringify([revision, ...revisions]));

      alert('Changes saved successfully');
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save changes');
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

      const savedRevisions = localStorage.getItem('storyforge-revisions');
      const revisions = savedRevisions ? JSON.parse(savedRevisions) : [];
      localStorage.setItem('storyforge-revisions', JSON.stringify([revision, ...revisions]));
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
      const currentContent = currentStory?.chapters.find(c => c.id === currentChapter.id)?.content || '';
      
      // 文体プロファイルが選択されている場合、文体模倣APIを使用
      if (selectedStyleProfile) {
        const response = await fetch('/api/imitate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: inputMessage,
            styleId: selectedStyleProfile.id,
            strength: selectedStyleProfile.strength,
            styleProfile: selectedStyleProfile,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'API request failed');
        }

        const { result } = await response.json();
        const assistantMessage: Message = {
          role: 'assistant',
          content: result,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // 通常のチャットAPIを使用
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
          const errorData = await response.json();
          throw new Error(errorData.message || 'API request failed');
        }

        const data = await response.json();
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.content,
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('AIとの通信に失敗しました:', error);
      alert('AIとの通信に失敗しました。');
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
                          handleStartEditStoryTitle();
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStory(story.id);
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
                              onClick={() => setCurrentChapter(chapter)}
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
        {currentChapter.id !== EMPTY_CHAPTER.id && currentStory ? (
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
                if (!currentChapter) return;
                const currentContent = currentStory?.chapters.find(c => c.id === currentChapter.id)?.content || '';
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
            <button className="p-1 hover:bg-gray-100 rounded" title="History">
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {selectedStyleProfile && (
          <div className="mb-4 p-2 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-800">{selectedStyleProfile.name}</p>
                <p className="text-xs text-blue-600">強度: {Math.round(selectedStyleProfile.strength * 100)}%</p>
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
          {messages.map((message, index) => (
            <div
              key={index}
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

      {/* Style Profile Modal */}
      {isStyleProfileModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[32rem]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">文体プロファイル</h3>
              <button
                onClick={() => setIsStyleProfileModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {styles.map(style => (
                <div
                  key={style.id}
                  className={`p-4 rounded-lg cursor-pointer ${
                    selectedStyleProfile?.id === style.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedStyleProfile(style);
                    setIsStyleProfileModalOpen(false);
                  }}
                >
                  <h4 className="font-medium">{style.name}</h4>
                  <p className="text-sm text-gray-500">{style.description}</p>
                  <div className="mt-2 flex items-center">
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-blue-600 rounded-full"
                        style={{ width: `${style.strength * 100}%` }}
                      />
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      {Math.round(style.strength * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 