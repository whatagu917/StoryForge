import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { IUser } from '@/models/User';
import { Types } from 'mongoose';
import getConfig from 'next/config';

const { serverRuntimeConfig } = getConfig();
// 環境変数からJWT_SECRETを取得し、存在しない場合はデフォルト値を設定
const JWT_SECRET = process.env.JWT_SECRET || 'storyforge_jwt_secret_key_2024_secure_9d8f7g6h5j4k3l2m1n';

// 警告を表示するだけで、エラーは投げない
if (!process.env.JWT_SECRET) {
  console.warn('警告: JWT_SECRETが環境変数に設定されていません。デフォルト値を使用します。本番環境では必ず環境変数を設定してください。');
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export interface JwtPayload {
  id: string;
  email: string;
  username: string;
}

export function generateToken(user: IUser): string {
  const payload: JwtPayload = {
    id: (user._id as Types.ObjectId).toString(),
    email: user.email,
    username: user.username,
  };
  return jwt.sign(payload, JWT_SECRET);
}

export function verifyToken(token: string): AuthUser | null {
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
    };
  } catch {
    return null;
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
export function getAuthHeader(): { Authorization: string } | {} {
  if (typeof window === 'undefined') {
    return {};
  }

  const token = localStorage.getItem('token');
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
} 