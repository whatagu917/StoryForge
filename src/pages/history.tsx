import React, { useState } from 'react';
import { HistoryIcon, GitCompare, Clock, User, Wand2 } from 'lucide-react';

interface Revision {
  id: string;
  title: string;
  type: 'manual' | 'ai_suggestion' | 'style_apply';
  content: string;
  previousContent: string;
  timestamp: string;
  author: string;
  chapter: string;
}

export default function History() {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getRevisionIcon = (type: Revision['type']) => {
    switch (type) {
      case 'manual':
        return <User className="h-5 w-5" />;
      case 'ai_suggestion':
        return <Wand2 className="h-5 w-5" />;
      case 'style_apply':
        return <GitCompare className="h-5 w-5" />;
      default:
        return <HistoryIcon className="h-5 w-5" />;
    }
  };

  const getRevisionColor = (type: Revision['type']) => {
    switch (type) {
      case 'manual':
        return 'text-blue-600';
      case 'ai_suggestion':
        return 'text-purple-600';
      case 'style_apply':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Revision History</h2>
          {revisions.length === 0 ? (
            <div className="text-center py-12">
              <HistoryIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No revisions</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new story.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {revisions.map((revision) => (
                <div
                  key={revision.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => setSelectedRevision(revision)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`${getRevisionColor(revision.type)}`}>
                      {getRevisionIcon(revision.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{revision.title}</p>
                      <p className="text-sm text-gray-500">
                        {revision.author} • {revision.timestamp}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{revision.chapter}</span>
                    <Clock className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedRevision && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revision Details</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Title</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedRevision.title}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Type</h4>
                <p className="mt-1 text-sm text-gray-900 capitalize">{selectedRevision.type.replace('_', ' ')}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Author</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedRevision.author}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Timestamp</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedRevision.timestamp}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Chapter</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedRevision.chapter}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Changes</h4>
                <div className="mt-1 space-y-2">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedRevision.content}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedRevision.previousContent}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 