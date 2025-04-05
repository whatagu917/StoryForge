import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/dbConnect';
import Story from '../../../models/Story';
import { authenticateRequest } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  await dbConnect();

  // トークンの検証
  const user = await authenticateRequest(req, res);
  if (!user) {
    return res.status(401).json({ success: false, message: '認証が必要です' });
  }

  switch (method) {
    case 'GET':
      try {
        // ユーザーのストーリーのみを取得
        const stories = await Story.find({ userId: user.id });
        
        // フロントエンド用に_idをidとしてマッピング
        const storiesForFrontend = stories.map(story => {
          const storyObj = story.toObject();
          return {
            ...storyObj,
            id: storyObj._id.toString()
          };
        });
        
        res.status(200).json({ success: true, data: storiesForFrontend });
      } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    case 'POST':
      try {
        // リクエストボディの検証
        const { title } = req.body;
        if (!title) {
          return res.status(400).json({ 
            success: false, 
            message: 'タイトルは必須です',
            details: 'ストーリーのタイトルを入力してください'
          });
        }

        // ユーザーIDを含めてストーリーを作成
        const story = await Story.create({
          ...req.body,
          userId: user.id,
        });
        
        // フロントエンド用に_idをidとしてマッピング
        const storyObj = story.toObject();
        const storyForFrontend = {
          ...storyObj,
          id: storyObj._id.toString()
        };
        
        res.status(201).json({ success: true, data: storyForFrontend });
      } catch (error: any) {
        console.error('Story creation error:', error);
        // Mongooseのバリデーションエラーの詳細を返す
        if (error.name === 'ValidationError') {
          const validationErrors = Object.values(error.errors).map((err: any) => ({
            field: err.path,
            message: err.message
          }));
          return res.status(400).json({ 
            success: false, 
            message: 'バリデーションエラー',
            details: validationErrors
          });
        }
        res.status(400).json({ 
          success: false, 
          message: error.message,
          details: 'ストーリーの作成に失敗しました'
        });
      }
      break;

    default:
      res.status(400).json({ success: false, message: 'Method not allowed' });
      break;
  }
} 