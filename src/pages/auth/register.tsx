import RegisterForm from '../../components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md w-full mx-auto">
        <RegisterForm />
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            すでにアカウントをお持ちの方は
            <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-500">
              こちら
            </Link>
            からログインしてください。
          </p>
        </div>
      </div>
    </div>
  );
} 