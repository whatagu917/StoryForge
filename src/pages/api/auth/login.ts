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

    const { email, password } = req.body;

    // 入力値の検証
    if (!email || !password) {
      return res.status(400).json({
        message: 'メールアドレスとパスワードは必須です'
      });
    }

    // ユーザーの検索
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }

    // パスワードの検証
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }

    // JWTトークンの生成
    const token = generateToken(user);

    // パスワードを除外してレスポンスを返す
    const { password: _, ...userWithoutPassword } = user.toObject();

    // ユーザー情報にidフィールドを追加
    const userResponse = {
      id: user._id.toString(),
      email: userWithoutPassword.email,
      username: userWithoutPassword.username,
    };

    res.status(200).json({
      message: 'ログインに成功しました',
      user: userResponse,
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      message: error.message || 'ログインに失敗しました'
    });
  }
} 