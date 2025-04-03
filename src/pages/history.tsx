import React, { useState, useEffect } from 'react';
import { HistoryIcon, GitCompare, Clock, User, Wand2, RotateCcw, ArrowLeft, Copy, Edit, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/router';

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

export default function History() {
  const router = useRouter();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [compareMode, setCompareMode] = useState<'side-by-side' | 'unified'>('side-by-side');

  // Load revisions from localStorage
  useEffect(() => {
    try {
      const savedRevisions = localStorage.getItem('storyforge-revisions');
      if (savedRevisions) {
        setRevisions(JSON.parse(savedRevisions));
      }
      setIsLoading(false);
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  const handleRestore = (revision: Revision) => {
    if (!window.confirm('この版に復元してもよろしいですか？')) return;

    try {
      // Load current stories
      const savedStories = localStorage.getItem('storyforge-stories');
      if (!savedStories) return;

      const stories = JSON.parse(savedStories);
      const updatedStories = stories.map((story: any) => {
        if (story.id === revision.storyId) {
          return {
            ...story,
            chapters: story.chapters.map((chapter: any) => {
              if (chapter.id === revision.chapterId) {
                return {
                  ...chapter,
                  content: revision.content
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
      alert('復元が完了しました');
    } catch (err) {
      console.error('復元に失敗しました:', err);
      alert('復元に失敗しました');
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('コンテンツをクリップボードにコピーしました');
  };

  const handleEdit = (revision: Revision) => {
    router.push(`/editor?story=${revision.storyId}&chapter=${revision.chapterId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">エラーが発生しました: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-2rem)] p-4 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">
              {selectedRevision ? `Chapter ${selectedRevision.chapterNumber}: ${selectedRevision.chapterTitle}` : '履歴'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompareMode(mode => mode === 'side-by-side' ? 'unified' : 'side-by-side')}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
            >
              {compareMode === 'side-by-side' ? '上下表示' : '左右表示'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Revision Dropdown */}
        <div className="relative mb-4">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-white shadow rounded-lg p-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span>
                {selectedRevision
                  ? `${selectedRevision.timestamp} - ${selectedRevision.type === 'ai' ? 'AI提案' : '手動編集'}`
                  : '履歴を選択'}
              </span>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute w-full mt-2 bg-white shadow-lg rounded-lg z-10 max-h-64 overflow-y-auto">
              {revisions.map((revision) => (
                <button
                  key={revision.id}
                  onClick={() => {
                    setSelectedRevision(revision);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 text-left"
                >
                  {revision.type === 'ai' ? (
                    <Wand2 className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Edit className="w-5 h-5 text-blue-600" />
                  )}
                  <div>
                    <div className="font-medium">
                      {revision.type === 'ai' ? 'AI提案' : '手動編集'}
                    </div>
                    <div className="text-sm text-gray-500">{revision.timestamp}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comparison View */}
        {selectedRevision && (
          <div className="flex-1 bg-white shadow rounded-lg p-4 overflow-hidden">
            <div className={`h-full flex ${compareMode === 'side-by-side' ? 'flex-row' : 'flex-col'} gap-4`}>
              {/* Previous Version */}
              <div className={`${compareMode === 'side-by-side' ? 'w-1/2' : 'h-1/2'} space-y-2`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500">変更前</h3>
                  <button
                    onClick={() => handleCopyContent(selectedRevision.previousContent)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="h-[calc(100%-2rem)] bg-gray-50 rounded-lg p-4 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {selectedRevision.previousContent}
                  </pre>
                </div>
              </div>

              {/* Current Version */}
              <div className={`${compareMode === 'side-by-side' ? 'w-1/2' : 'h-1/2'} space-y-2`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-500">変更後</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyContent(selectedRevision.content)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(selectedRevision)}
                      className="p-1 hover:bg-gray-100 rounded text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="h-[calc(100%-2rem)] bg-gray-50 rounded-lg p-4 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {selectedRevision.content}
                  </pre>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => handleRestore(selectedRevision)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <RotateCcw className="w-4 h-4" />
                このバージョンに復元
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 