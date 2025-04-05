import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getAuthHeader } from '@/lib/auth';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not configured in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // 認証チェック
  const authHeader = getAuthHeader(req);
  if (!authHeader || !authHeader.Authorization) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const { messages, styleProfile } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Messages array is required' });
    }

    console.log('Processing chat request with style profile:', styleProfile);
    console.log('Messages:', messages);

    // システムメッセージを作成
    let systemMessage = "あなたは物語の執筆を手伝うAIアシスタントです。";
    
    if (styleProfile?.sampleText) {
      systemMessage += `\n\n以下の文体で応答してください：\n${styleProfile.sampleText}`;
      
      if (styleProfile.embedding) {
        console.log('Style profile has embedding, using it for context');
      }
    }

    // OpenAI APIにリクエストを送信
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMessage },
        ...messages.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        }))
      ],
      temperature: styleProfile?.strength ?? 0.7,
      max_tokens: 1000,
    });

    if (!response.choices[0]?.message?.content) {
      console.error('No response content from OpenAI');
      throw new Error('No response from OpenAI');
    }

    console.log('Successfully generated AI response');

    return res.status(200).json({
      success: true,
      message: response.choices[0].message.content,
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error:', {
        status: error.status,
        message: error.message,
        code: error.code,
        type: error.type,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to get AI response',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 