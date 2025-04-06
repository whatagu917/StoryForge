import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
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
    sampleText?: string;
    strength?: number;
    [key: string]: any;
  };
}

interface RelatedStyle {
  profile: StyleProfile;
  similarity: number;
}

// チャット履歴を保存するためのグローバル変数
let chatHistory: ChatCompletionMessageParam[] = [];

// コサイン類似度を計算する関数
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (normA * normB);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { text, styleId, strength, styleProfile, clearHistory } = req.body;

    // パラメータのバリデーション
    if (!text) {
      return res.status(400).json({ message: 'テキストが指定されていません' });
    }
    if (!styleId) {
      return res.status(400).json({ message: '文体IDが指定されていません' });
    }
    if (typeof strength !== 'number' || strength < 0 || strength > 1) {
      return res.status(400).json({ message: '強度は0から1の間の数値である必要があります' });
    }
    if (!styleProfile) {
      return res.status(400).json({ message: '文体プロファイルのデータが指定されていません' });
    }

    // チャット履歴をクリアするオプション
    if (clearHistory) {
      chatHistory = [];
    }

    // 入力テキストのembeddingを生成
    const textEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    const textEmbedding = textEmbeddingResponse.data[0].embedding;

    // データベースから全てのスタイルプロファイルを取得
    const allStyleProfiles = await prisma.styleProfile.findMany({
      where: {
        userId: req.body.userId, // ユーザーIDをリクエストから取得
      },
    });

    // 類似度に基づいて関連するスタイルプロファイルを取得
    const relatedStyles = allStyleProfiles
      .map((profile: StyleProfile) => {
        const profileEmbedding = profile.settings.embedding;
        if (!profileEmbedding) return null;

        const similarity = cosineSimilarity(textEmbedding, profileEmbedding);
        return {
          profile,
          similarity,
        };
      })
      .filter((result: RelatedStyle | null): result is RelatedStyle => result !== null)
      .sort((a: RelatedStyle, b: RelatedStyle) => b.similarity - a.similarity)
      .slice(0, 3); // 上位3つの関連スタイルを取得

    // 文体模倣のためのプロンプトを構築
    const prompt = `以下の手順で文体模倣を行ってください：

1. まず、サンプルテキストの文体の特徴を分析してください：
   - 語彙の選択（硬い/柔らかい、専門的/一般的など）
   - 文の構造（長い/短い、複雑/シンプルなど）
   - 表現の特徴（比喩の使用、感情表現など）
   - 文体の全体的な印象

2. 次に、入力テキストの意味や内容を保持しながら、分析した文体の特徴を適用してください。
   サンプルテキストをそのまま使用せず、抽出した文体の特徴のみを適用することが重要です。

スタイル名: ${styleProfile.name}
説明: ${styleProfile.description}

サンプルテキスト（文体の特徴を分析するための参考）:
${styleProfile.sampleText}

${relatedStyles.length > 0 ? `関連するスタイルの参考情報：
${relatedStyles.map((style: RelatedStyle) => `
- ${style.profile.name}:
  ${style.profile.description}
  類似度: ${Math.round(style.similarity * 100)}%
`).join('\n')}` : ''}

入力テキスト（このテキストの意味を保持しながら、上記で分析した文体の特徴を適用）:
${text}

文体の強度: ${Math.round(strength * 100)}%

注意事項：
- サンプルテキストをそのまま使用せず、その文体の特徴のみを抽出して適用してください
- 入力テキストの意味や内容は必ず保持してください
- 文体の強度に応じて、特徴の適用度を調整してください
- 出力は必ず入力テキストを文体模倣したものだけにしてください。サンプルテキストや分析結果は含めないでください`;

    // メッセージを構築
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `あなたは文章の文体を模倣する専門家です。
以下のルールを厳密に守ってください：

1. サンプルテキストをそのまま使用してはいけません。
2. サンプルテキストの文体の特徴を分析し、その特徴のみを抽出して入力テキストに適用してください。
3. 分析結果やサンプルテキストを出力に含めてはいけません。
4. 出力は必ず文体模倣された入力テキストのみにしてください。
5. 入力テキストの意味や内容は必ず保持してください。

これらのルールに違反した場合、文体模倣は失敗とみなされます。`
      },
      ...chatHistory,
      {
        role: "user",
        content: prompt
      }
    ];

    // OpenAIのChat APIを使用して文体模倣を実行
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: 0.5,
      max_tokens: 1000,
    });

    // チャット履歴を更新
    chatHistory.push(
      { role: "user", content: prompt },
      { role: "assistant", content: response.choices[0].message.content || "" }
    );

    // チャット履歴が長くなりすぎないように制限
    if (chatHistory.length > 10) {
      chatHistory = chatHistory.slice(-10);
    }

    // 生成された文章を返す
    res.status(200).json({
      result: response.choices[0].message.content,
      relatedStyles: relatedStyles.map((style: RelatedStyle) => ({
        name: style.profile.name,
        similarity: style.similarity,
      })),
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ 
      message: '内部サーバーエラーが発生しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 