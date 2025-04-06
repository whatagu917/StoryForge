import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      const currentPath = router.pathname;
      
      // 認証が必要なページのリスト
      const authRequiredPages = ['/ideas', '/styles', '/editor'];
      
      // 認証が不要なページのリスト
      const publicPages = ['/auth/login', '/auth/register'];
      
      if (!isAuthenticated && authRequiredPages.includes(currentPath)) {
        // 認証が必要なページに未認証でアクセスした場合
        router.push('/auth/login');
      } else if (isAuthenticated && publicPages.includes(currentPath)) {
        // 認証済みユーザーが認証ページにアクセスした場合
        router.push('/ideas');
      }
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
} 