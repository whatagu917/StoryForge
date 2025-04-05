import React, { useState, useEffect } from 'react';
import { HistoryIcon, GitCompare, Clock, User, Wand2, RotateCcw, ArrowLeft, Copy, Edit, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthHeader } from '@/lib/auth';

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
  const { user, isAuthenticated } = useAuth();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [compareMode, setCompareMode] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [selectedRevisions, setSelectedRevisions] = useState<string[]>([]);

  // Load revisions from API
  useEffect(() => {
    const loadRevisions = async () => {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/revisions', {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load revisions');
        }

        const data = await response.json();
        if (data.success && data.data) {
          setRevisions(data.data);
        }
        setIsLoading(false);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    };

    loadRevisions();
  }, [isAuthenticated, router]);

  const handleRestore = async (revision: Revision) => {
    if (!window.confirm('Are you sure you want to restore this version?')) return;

    try {
      const response = await fetch(`/api/revisions/${revision.id}/restore`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to restore revision');
      }

      alert('Restoration completed');
    } catch (err) {
      console.error('Failed to restore:', err);
      alert('Failed to restore');
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('Content copied to clipboard');
  };

  const handleEdit = (revision: Revision) => {
    router.push(`/editor?story=${revision.storyId}&chapter=${revision.chapterId}`);
  };

  const handleDeleteRevisions = async () => {
    if (selectedRevisions.length === 0) return;
    if (!window.confirm('Are you sure you want to delete the selected revisions?')) return;

    try {
      const response = await fetch('/api/revisions/batch', {
        method: 'DELETE',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ revisionIds: selectedRevisions }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete revisions');
      }

      const updatedRevisions = revisions.filter(revision => !selectedRevisions.includes(revision.id));
      setRevisions(updatedRevisions);
      setSelectedRevisions([]);
    } catch (err) {
      console.error('Failed to delete revisions:', err);
      alert('Failed to delete revisions');
    }
  };

  const handleDeleteAllRevisions = async () => {
    if (revisions.length === 0) return;
    if (!window.confirm('Are you sure you want to delete all revisions?')) return;

    try {
      const response = await fetch('/api/revisions', {
        method: 'DELETE',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete all revisions');
      }

      setRevisions([]);
      setSelectedRevisions([]);
    } catch (err) {
      console.error('Failed to delete all revisions:', err);
      alert('Failed to delete all revisions');
    }
  };

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
        <div className="text-red-500">Error: {error.message}</div>
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
              {selectedRevision ? `Chapter ${selectedRevision.chapterNumber}: ${selectedRevision.chapterTitle}` : 'History'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteAllRevisions}
              disabled={revisions.length === 0}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Delete All
            </button>
            <button
              onClick={handleDeleteRevisions}
              disabled={selectedRevisions.length === 0}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setCompareMode(mode => mode === 'side-by-side' ? 'unified' : 'side-by-side')}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
            >
              {compareMode === 'side-by-side' ? 'Unified View' : 'Side by Side'}
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
                  ? `${selectedRevision.timestamp} - ${selectedRevision.type === 'ai' ? 'AI Suggestion' : 'Manual Edit'}`
                  : 'Select History'}
              </span>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute w-full mt-2 bg-white shadow-lg rounded-lg z-10 max-h-64 overflow-y-auto">
              {revisions.map((revision) => (
                <div
                  key={revision.id}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedRevisions.includes(revision.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRevisions([...selectedRevisions, revision.id]);
                      } else {
                        setSelectedRevisions(selectedRevisions.filter(id => id !== revision.id));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <button
                    onClick={() => {
                      setSelectedRevision(revision);
                      setIsDropdownOpen(false);
                    }}
                    className="flex-1 text-left"
                  >
                    {revision.type === 'ai' ? (
                      <Wand2 className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Edit className="w-5 h-5 text-blue-600" />
                    )}
                    <div>
                      <div className="font-medium">
                        {revision.type === 'ai' ? 'AI Suggestion' : 'Manual Edit'}
                      </div>
                      <div className="text-sm text-gray-500">{revision.timestamp}</div>
                    </div>
                  </button>
                </div>
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
                  <h3 className="text-sm font-medium text-gray-500">Before</h3>
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
                  <h3 className="text-sm font-medium text-gray-500">After</h3>
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
                Restore this version
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 