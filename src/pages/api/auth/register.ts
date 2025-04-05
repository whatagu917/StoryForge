import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { email, password, username } = req.body;

    // 入力値の検証
    if (!email || !password || !username) {
      return res.status(400).json({
        message: 'メールアドレス、パスワード、ユーザー名は必須です'
      });
    }

    // メールアドレスの重複チェック
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'このメールアドレスは既に登録されています'
      });
    }

    // ユーザーの作成
    const user = await User.create({
      email,
      password,
      username,
    });

    // JWTトークンの生成
    const token = generateToken(user);

    // パスワードを除外してレスポンスを返す
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(201).json({
      message: '登録が完了しました',
      user: userWithoutPassword,
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: error.message || 'ユーザー登録に失敗しました'
    });
  }
} 