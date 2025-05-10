import { NextApiRequest, NextApiResponse } from 'next';
import { generateGuestToken } from '@/lib/auth';
import { Types } from 'mongoose';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // ゲストユーザー情報を作成
    // MongoDBのObjectId形式のIDを生成
    const guestId = new Types.ObjectId().toString();
    const guestUser = {
      id: guestId,
      email: `guest-${Date.now()}@example.com`,
      name: 'ゲストユーザー',
      isGuest: true, // ゲストユーザーであることを示すフラグ
    };

    // JWTトークンの生成
    const token = generateGuestToken(guestUser);

    // レスポンスを返す
    res.status(200).json({
      message: 'ゲストログインに成功しました',
      user: {
        id: guestUser.id,
        email: guestUser.email,
        name: guestUser.name,
        isGuest: guestUser.isGuest
      },
      token,
    });
  } catch (error: any) {
    console.error('Guest login error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      message: process.env.NODE_ENV === 'development' 
        ? `ゲストログインに失敗しました: ${error.message}`
        : 'ゲストログインに失敗しました'
    });
  }
} 