import LoginForm from '../../components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md w-full mx-auto">
        <LoginForm />
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            アカウントをお持ちでない方は
            <Link href="/auth/register" className="text-indigo-600 hover:text-indigo-500">
              こちら
            </Link>
            から登録してください。
          </p>
        </div>
      </div>
    </div>
  );
} 