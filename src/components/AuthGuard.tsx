import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const publicPaths = ['/auth/login', '/auth/register'];

export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user && requireAuth && !publicPaths.includes(router.pathname)) {
        // 未認証ユーザーを認証が必要なページからログインページにリダイレクト
        router.push('/auth/login');
      } else if (user && publicPaths.includes(router.pathname)) {
        // 認証済みユーザーをログインページからホームページにリダイレクト
        router.push('/');
      }
    }
  }, [user, loading, router, requireAuth]);

  // ローディング中は何も表示しない
  if (loading) {
    return null;
  }

  // 認証が必要なページで未認証の場合は何も表示しない
  if (!user && requireAuth && !publicPaths.includes(router.pathname)) {
    return null;
  }

  // 認証済みユーザーが認証ページにアクセスした場合は何も表示しない
  if (user && publicPaths.includes(router.pathname)) {
    return null;
  }

  return <>{children}</>;
} 