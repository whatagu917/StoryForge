import React from 'react';
import { useRouter } from 'next/router';
import { CheckCircle } from 'lucide-react';

export default function Verified() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            メールアドレスが確認されました
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            ご登録ありがとうございます。メールアドレスが正常に確認されました。
          </p>
        </div>
        <div className="mt-8">
          <button
            onClick={() => router.push('/auth/login')}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ログインする
          </button>
        </div>
      </div>
    </div>
  );
} 