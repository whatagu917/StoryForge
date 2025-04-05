import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
    return res.status(500).json({
      success: false,
      message: 'OpenAI API key is not configured',
    });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    console.log('Generating embedding for text:', text.substring(0, 50) + '...');

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    if (!response.data || !response.data[0] || !response.data[0].embedding) {
      console.error('Invalid response from OpenAI:', response);
      throw new Error('Invalid response from OpenAI API');
    }

    console.log('Successfully generated embedding');

    return res.status(200).json({
      success: true,
      embedding: response.data[0].embedding,
    });
  } catch (error) {
    console.error('Error generating embedding:', error);
    
    // OpenAIのエラーオブジェクトをより詳細に処理
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
      message: 'Failed to generate embedding',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 