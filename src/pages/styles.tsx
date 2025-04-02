import React, { useState } from 'react';
import { Upload, Wand2, Eye, Trash2, Plus } from 'lucide-react';

interface StyleProfile {
  id: string;
  name: string;
  description: string;
  sampleText: string;
  strength: number;
  createdAt: string;
}

export default function Styles() {
  const [styles, setStyles] = useState<StyleProfile[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StyleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const handleUpload = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement style upload
      const newStyle: StyleProfile = {
        id: Date.now().toString(),
        name: 'New Style',
        description: 'A new writing style profile...',
        sampleText: 'Sample text in this style...',
        strength: 0.5,
        createdAt: new Date().toISOString(),
      };
      setStyles([newStyle, ...styles]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to upload style'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Writing Styles</h2>
            <button
              onClick={handleUpload}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Plus className="h-5 w-5 mr-2" />
              Upload Style
            </button>
          </div>

          {styles.length === 0 ? (
            <div className="text-center py-12">
              <Wand2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No styles yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by uploading a writing style.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {styles.map((style) => (
                <div
                  key={style.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
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
                    <button className="p-1 text-gray-400 hover:text-gray-500">
                      <Eye className="h-5 w-5" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-500">
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Style Details</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Name</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedStyle.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedStyle.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Strength</h4>
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
                <h4 className="text-sm font-medium text-gray-500">Sample Text</h4>
                <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-900">{selectedStyle.sampleText}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedStyle.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 