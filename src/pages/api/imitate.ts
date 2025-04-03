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
    const { text, styleId, strength, styleProfile } = req.body;

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

    // 文体模倣のためのプロンプトを構築
    const prompt = `以下の文章を、指定された文体で書き直してください。
文体の強度: ${Math.round(strength * 100)}%

文体プロファイル:
名前: ${styleProfile.name}
説明: ${styleProfile.description}
サンプルテキスト: ${styleProfile.sampleText}

書き直す文章:
${text}

書き直しの際は、元の文章の意味を保持しながら、指定された文体の特徴を反映させてください。
強度に応じて、文体の特徴を適切に反映させてください。`;

    // OpenAIのChat APIを使用して文体模倣を実行
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "あなたは文章の文体を模倣する専門家です。指定された文体の特徴を正確に反映させた文章を生成してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // 生成された文章を返す
    res.status(200).json({
      result: response.choices[0].message.content,
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ 
      message: '内部サーバーエラーが発生しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 