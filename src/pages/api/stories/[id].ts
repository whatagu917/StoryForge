import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateRequest } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Story from '@/models/Story';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // データベースに接続
    await dbConnect();

    // リクエストを認証
    const user = await authenticateRequest(req, res);
    if (!user) {
      return res.status(401).json({ success: false, message: '認証が必要です' });
    }

    const { id } = req.query;

    // ストーリーの存在確認と所有者の確認
    const story = await Story.findOne({ _id: id, userId: user.id });
    if (!story) {
      return res.status(404).json({ success: false, message: 'ストーリーが見つかりません' });
    }

    // フロントエンド用に_idをidとしてマッピング
    const storyForFrontend = {
      ...story.toObject(),
      id: story._id.toString()
    };

    switch (req.method) {
      case 'GET':
        return res.status(200).json({ success: true, data: storyForFrontend });

      case 'PUT':
        const { title, content, chapters } = req.body;
        const updatedStory = await Story.findByIdAndUpdate(
          id,
          { title, content, chapters },
          { new: true }
        );
        
        // フロントエンド用に_idをidとしてマッピング
        const updatedStoryForFrontend = {
          ...updatedStory.toObject(),
          id: updatedStory._id.toString()
        };
        
        return res.status(200).json({ success: true, data: updatedStoryForFrontend });

      case 'DELETE':
        try {
          if (!id || typeof id !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid story ID' });
          }
          
          console.log('Attempting to delete story with ID:', id);
          
          // Check if the ID is a valid MongoDB ObjectId
          if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            console.error('Invalid MongoDB ObjectId format:', id);
            return res.status(400).json({ success: false, message: 'Invalid story ID format' });
          }
          
          const deletedStory = await Story.findOneAndDelete({ _id: id, userId: user.id });
          if (!deletedStory) {
            console.error('Story not found or not owned by user:', id);
            return res.status(404).json({ success: false, message: 'ストーリーが見つかりません' });
          }
          
          console.log('Story successfully deleted:', id);
          return res.status(200).json({ success: true, message: 'ストーリーが削除されました' });
        } catch (error) {
          console.error('Delete story error:', error);
          return res.status(500).json({ 
            success: false, 
            message: 'ストーリーの削除に失敗しました',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
} 