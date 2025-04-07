import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleNavigation = useCallback(async (path: string) => {
    if (isRedirecting) return;
    setIsRedirecting(true);

    try {
      // 現在のパスと同じ場合は何もしない
      if (router.pathname === path) {
        setIsRedirecting(false);
        return;
      }

      // 直接window.locationを使用
      window.location.href = path;
    } catch (error) {
      console.error('Navigation error:', error);
      setIsRedirecting(false);
    }
  }, [isRedirecting, router.pathname]);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      if (loading || !mounted) return;

      const currentPath = router.pathname;
      const authRequiredPages = ['/ideas', '/styles', '/editor'];
      const publicPages = ['/auth/login', '/auth/register'];

      if (!isAuthenticated && authRequiredPages.includes(currentPath)) {
        await handleNavigation('/auth/login');
      } else if (isAuthenticated && publicPages.includes(currentPath)) {
        await handleNavigation('/ideas');
      } else if (mounted) {
        setIsRedirecting(false);
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, loading, handleNavigation]);

  if (loading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
} 