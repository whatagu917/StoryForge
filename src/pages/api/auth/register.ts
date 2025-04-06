import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // メソッドの確認
  console.log('Request method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // データベース接続
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected successfully');

    const { email, password, username } = req.body;
    console.log('Received registration data:', { email, username });

    // 入力値の検証
    if (!email || !password || !username) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'メールアドレス、パスワード、ユーザー名は必須です'
      });
    }

    // メールアドレスの重複チェック
    console.log('Checking for existing user...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'このメールアドレスは既に登録されています'
      });
    }

    // ユーザーの作成
    console.log('Creating new user...');
    const user = await User.create({
      email,
      password,
      username,
    });
    console.log('User created successfully:', user._id);

    // JWTトークンの生成
    const token = generateToken(user);

    // パスワードを除外してレスポンスを返す
    const { password: _, ...userWithoutPassword } = user.toObject();
    const userResponse = {
      id: user._id.toString(),
      email: userWithoutPassword.email,
      username: userWithoutPassword.username,
    };

    console.log('Registration successful');
    return res.status(201).json({
      success: true,
      message: '登録が完了しました',
      user: userResponse,
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'ユーザー登録に失敗しました'
    });
  }
} 