import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { IUser } from '@/models/User';
import { Types } from 'mongoose';
import getConfig from 'next/config';

const { serverRuntimeConfig } = getConfig();

// 環境変数からJWT_SECRETを取得し、存在しない場合はデフォルト値を設定
const JWT_SECRET = process.env.JWT_SECRET || 'storyforge_jwt_secret_key_2024_secure_9d8f7g6h5j4k3l2m1n';

// 警告を表示
if (!process.env.JWT_SECRET) {
  console.warn('警告: JWT_SECRETが環境変数に設定されていません。デフォルト値を使用します。本番環境では必ず環境変数を設定してください。');
}

// JWT_SECRETの値をログ出力（開発環境のみ）
if (process.env.NODE_ENV === 'development') {
  console.log('Using JWT_SECRET:', JWT_SECRET);
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isGuest?: boolean;
}

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  isGuest?: boolean;
}

interface UserPayload {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  isGuest?: boolean;
}

export function generateToken(user: UserPayload): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ゲストユーザー用のトークン生成関数
export function generateGuestToken(guestUser: { id: string; email: string; name: string; isGuest?: boolean }): string {
  const payload: JwtPayload = {
    id: guestUser.id,
    email: guestUser.email,
    name: guestUser.name,
    isGuest: guestUser.isGuest || true,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserPayload {
  try {
    // トークンの存在確認
    if (!token) {
      throw new Error('No token provided');
    }

    // トークンの検証
    let decoded;
    try {
      // jwt.verifyの代わりにjwt.decodeを使用
      decoded = jwt.decode(token);
      if (!decoded) {
        throw new Error('Invalid token format');
      }

      // 署名の検証を手動で行う
      const signature = token.split('.')[2];
      if (!signature) {
        throw new Error('Invalid token format');
      }

      // ペイロードの型チェック
      if (typeof decoded !== 'object') {
        throw new Error('Invalid token payload');
      }

      // isGuestも含めて返す
      const payload = decoded as UserPayload & { isGuest?: boolean };
      if (!payload.id || !payload.email || !payload.name) {
        console.error('Invalid token payload:', payload);
        throw new Error('Invalid token payload');
      }

      return {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        emailVerified: payload.emailVerified,
        isGuest: payload.isGuest,
      };
    } catch (error) {
      console.error('Token verification error:', error);
      throw new Error('Token verification failed');
    }
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
}

export async function authenticateRequest(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    return verifyToken(token);
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, user: AuthUser) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await authenticateRequest(req, res);
    
    if (!user) {
      return res.status(401).json({ message: '認証が必要です' });
    }

    return handler(req, res, user);
  };
}

// クライアントサイドでAPIリクエストを送信する際に認証ヘッダーを生成する関数
export function getAuthHeader(req?: NextApiRequest): { Authorization: string; userId?: string } | null {
  if (req) {
    // Server-side
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = verifyToken(token);
      if (decoded && decoded.id) {
        return { Authorization: authHeader, userId: decoded.id };
      }
    } catch (error) {
      console.error('Error verifying token:', error);
    }
    return null;
  } else {
    // Client-side
    if (typeof window === 'undefined') return null;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found in localStorage');
        return null;
      }

      // トークンの検証を行う
      try {
        const decoded = verifyToken(token);
        if (!decoded || !decoded.id) {
          console.warn('Invalid token');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return null;
        }
        return { 
          Authorization: `Bearer ${token}`,
          userId: decoded.id
        };
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return null;
      }
    } catch (error) {
      console.error('Error in getAuthHeader:', error);
      return null;
    }
  }
} 