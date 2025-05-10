import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, XCircle } from 'lucide-react';

export default function VerifyPage() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify?token=${token}`);
        if (response.ok) {
          setStatus('success');
          setMessage('メールアドレスの確認が完了しました。');
          // 3秒後にログインページにリダイレクト
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        } else {
          const data = await response.json();
          setStatus('error');
          setMessage(data.message || 'メールアドレスの確認に失敗しました。');
        }
      } catch (error) {
        setStatus('error');
        setMessage('エラーが発生しました。');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          )}
          {status === 'success' && (
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          )}
          {status === 'error' && (
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
          )}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {status === 'loading' && '確認中...'}
            {status === 'success' && '確認完了'}
            {status === 'error' && 'エラー'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
} 