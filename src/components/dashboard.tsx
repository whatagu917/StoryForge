import React from 'react';
import Link from 'next/link';
import { Plus, Book, BarChart2, Users, Calendar } from 'lucide-react';

interface Work {
  id: number;
  title: string;
  progress: number;
  lastEdited: string;
  wordCount: number;
  chapters: number;
  status: 'draft' | 'in_progress' | 'review' | 'complete';
}

export function Dashboard() {
  // Placeholder data - will be replaced with actual data from Supabase
  const works: Work[] = [
    { 
      id: 1, 
      title: 'My First Novel', 
      progress: 65, 
      lastEdited: '2023-10-25',
      wordCount: 25000,
      chapters: 8,
      status: 'in_progress'
    },
    { 
      id: 2, 
      title: 'Blog Post Draft', 
      progress: 30, 
      lastEdited: '2023-10-24',
      wordCount: 1200,
      chapters: 1,
      status: 'draft'
    },
    { 
      id: 3, 
      title: 'Short Story', 
      progress: 90, 
      lastEdited: '2023-10-23',
      wordCount: 5000,
      chapters: 1,
      status: 'review'
    },
  ];

  const getStatusColor = (status: Work['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'complete': return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Works</h1>
        <Link
          href="/editor/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Work
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <BarChart2 className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold">Total Words</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {works.reduce((sum, work) => sum + work.wordCount, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <Book className="w-5 h-5 text-purple-500 mr-2" />
            <h3 className="text-lg font-semibold">Active Projects</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{works.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold">Last Activity</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {new Date(Math.max(...works.map(w => new Date(w.lastEdited).getTime()))).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Works Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {works.map((work) => (
          <div
            key={work.id}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <Book className="w-5 h-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">{work.title}</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(work.status)}`}>
                {work.status.replace('_', ' ')}
              </span>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Progress</span>
                <span>{work.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${work.progress}%` }}
                />
              </div>

              <div className="flex justify-between text-sm text-gray-500">
                <span>Word Count</span>
                <span>{work.wordCount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm text-gray-500">
                <span>Chapters</span>
                <span>{work.chapters}</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Last edited: {new Date(work.lastEdited).toLocaleDateString()}
              </span>
              <Link
                href={`/editor/${work.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Open →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 