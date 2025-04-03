import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    // OpenAIのEmbeddings APIを使用してテキストの埋め込みベクトルを生成
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    // 埋め込みベクトルを返す
    res.status(200).json({
      embedding: response.data[0].embedding,
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 