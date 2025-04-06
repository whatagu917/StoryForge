import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // style_profilesテーブルにembeddingカラムを追加
    const { error } = await supabase.rpc('add_embedding_column');
    
    if (error) {
      console.error('Migration error:', error);
      return res.status(500).json({ error: 'Failed to add embedding column' });
    }

    return res.status(200).json({ message: 'Migration completed successfully' });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: 'Migration failed' });
  }
} 