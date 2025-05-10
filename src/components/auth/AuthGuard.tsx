import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowGuest?: boolean;
}

export default function AuthGuard({
  children,
  requireAuth = true,
  allowGuest = false,
}: AuthGuardProps) {
  const { user, isGuest, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user && !isGuest) {
        router.push('/auth/login');
      } else if (!requireAuth && (user || isGuest)) {
        router.push('/');
      }
    }
  }, [user, isGuest, loading, requireAuth, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (requireAuth && !user && !isGuest) {
    return null;
  }

  if (!requireAuth && (user || isGuest)) {
    return null;
  }

  return <>{children}</>;
} 