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
    const { currentContent, message } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "あなたは小説執筆をサポートするAIアシスタントです。ユーザーの質問に答え、文章の改善提案を提供してください。"
        },
        {
          role: "user",
          content: `現在のチャプター内容:\n${currentContent}\n\n質問: ${message}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    res.status(200).json({
      content: response.choices[0].message.content
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 