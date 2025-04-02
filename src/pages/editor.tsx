import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { MessageSquare, Wand2, History, Settings } from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  content: string;
}

export default function Editor() {
  const router = useRouter();
  const { id } = router.query;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

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
        <div className="space-y-2">
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => setCurrentChapter(chapter.id)}
              className={`w-full text-left px-3 py-2 rounded-md ${
                currentChapter === chapter.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              {chapter.title}
            </button>
          ))}
          <button className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md">
            + New Chapter
          </button>
        </div>
      </div>

      {/* Main content - Editor */}
      <div className="flex-1 bg-white rounded-lg shadow-sm p-4">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Title"
            className="w-full text-2xl font-bold border-none focus:outline-none"
          />
        </div>
        <div className="prose max-w-none">
          <textarea
            className="w-full h-[calc(100vh-12rem)] resize-none border-none focus:outline-none"
            placeholder="Start writing your story..."
          />
        </div>
      </div>

      {/* Right sidebar - AI Assistant */}
      <div className="w-80 bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <div className="flex gap-2">
            <button className="p-1 hover:bg-gray-100 rounded" title="AI Rewrite">
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
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">{suggestion}</p>
                <button className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                  Apply Suggestion
                </button>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask AI for help..."
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 