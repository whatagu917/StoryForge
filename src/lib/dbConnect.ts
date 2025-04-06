import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

interface Connection {
  isConnected?: number;
}

const connection: Connection = {};

async function dbConnect(): Promise<void> {
  if (connection.isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI as string, {
      // 接続のタイムアウトを設定（5秒）
      connectTimeoutMS: 5000,
      // ソケットのタイムアウトを設定（10秒）
      socketTimeoutMS: 10000,
      // 接続プールサイズを設定
      maxPoolSize: 10,
      // 最小プールサイズ
      minPoolSize: 5,
      // サーバー選択のタイムアウト
      serverSelectionTimeoutMS: 5000,
      // 自動再接続を有効化
      autoCreate: true,
      // 接続が切れた時に自動的に再接続
      autoIndex: true,
      // ハートビートの頻度（ミリ秒）
      heartbeatFrequencyMS: 10000
    });

    connection.isConnected = db.connections[0].readyState;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default dbConnect; 