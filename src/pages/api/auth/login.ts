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
    console.log('Attempting database connection...');
    await dbConnect();
    console.log('Database connection successful');

    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // 入力値の検証
    if (!email || !password) {
      console.error('Missing required fields:', { email: !!email, password: !!password });
      return res.status(400).json({
        message: 'メールアドレスとパスワードは必須です'
      });
    }

    // ユーザーの検索
    console.log('Searching for user...');
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        message: 'メールアドレスまたはパスワードが正しくありません'
      });
    }
    console.log('User found:', { id: user._id, email: user.email });

    // パスワードの検証
    console.log('Verifying password...');
    try {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log('Password verification failed for user:', user._id);
        return res.status(401).json({
          message: 'メールアドレスまたはパスワードが正しくありません'
        });
      }
      console.log('Password verification successful');
    } catch (passwordError) {
      console.error('Password comparison error:', passwordError);
      throw passwordError;
    }

    // JWTトークンの生成
    console.log('Generating JWT token...');
    let token;
    try {
      token = generateToken(user);
      console.log('Token generated successfully');
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      throw tokenError;
    }

    // パスワードを除外してレスポンスを返す
    const { password: _, ...userWithoutPassword } = user.toObject();

    // ユーザー情報にidフィールドを追加
    const userResponse = {
      id: user._id.toString(),
      email: userWithoutPassword.email,
      username: userWithoutPassword.username,
    };

    console.log('Login successful for user:', userResponse.id);
    res.status(200).json({
      message: 'ログインに成功しました',
      user: userResponse,
      token,
    });
  } catch (error: any) {
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      message: process.env.NODE_ENV === 'development' 
        ? `ログインに失敗しました: ${error.message}`
        : 'ログインに失敗しました'
    });
  }
} 