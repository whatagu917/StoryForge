import React, { useEffect, useState, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BookOpen, 
  Lightbulb, 
  Palette, 
  User,
  LogOut
} from 'lucide-react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const currentPath = router.pathname;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (router.isReady) {
      setIsLoading(false);
    }
  }, [router.isReady]);

  const isActive = (path: string) => router.pathname === path;

  const navigation = [
    { name: 'Editor', href: '/editor', icon: BookOpen },
    { name: 'History', href: '/history', icon: BookOpen },
    { name: 'Ideas', href: '/ideas', icon: Lightbulb },
    { name: 'Styles', href: '/styles', icon: Palette },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h2>
          <div className="bg-red-50 rounded p-4 mb-4">
            <p className="font-mono text-sm text-red-800 whitespace-pre-wrap">
              {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
} 