import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getAuthHeader } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface StyleProfile {
  id: string;
  name: string;
  description: string;
  settings: {
    embedding?: number[];
    [key: string]: any;
  };
}

interface SearchResult {
  id: string;
  name: string;
  description: string;
  similarity: number;
  settings: StyleProfile['settings'];
}

// コサイン類似度を計算する関数
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (normA * normB);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const authHeader = getAuthHeader(req);
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const { query, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    // クエリのembeddingを生成
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      encoding_format: "float",
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // データベースから全てのスタイルプロファイルを取得
    const styleProfiles = await prisma.styleProfile.findMany({
      where: {
        userId: authHeader.userId,
      },
    });

    // 各スタイルプロファイルのembeddingとクエリのembeddingを比較
    const results = styleProfiles
      .map((profile: StyleProfile) => {
        const profileEmbedding = profile.settings.embedding;
        if (!profileEmbedding) return null;

        const similarity = cosineSimilarity(queryEmbedding, profileEmbedding);
        return {
          id: profile.id,
          name: profile.name,
          description: profile.description,
          similarity,
          settings: profile.settings,
        };
      })
      .filter((result: SearchResult | null): result is SearchResult => result !== null)
      .sort((a: SearchResult, b: SearchResult) => b.similarity - a.similarity)
      .slice(0, limit);

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 