import mongoose from 'mongoose';

// スタイルのインターフェース定義
export interface IStyle {
  name: string;
  description: string;
  settings: {
    embedding?: number[] | string;
    sampleText?: string;
    strength?: number;
    [key: string]: any;
  };
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mongooseスキーマの定義
const styleSchema = new mongoose.Schema<IStyle>({
  name: {
    type: String,
    required: [true, 'スタイル名は必須です'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, '説明は必須です'],
    trim: true,
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, '設定は必須です'],
    default: {},
  },
  userId: {
    type: String,
    required: [true, 'ユーザーIDは必須です'],
  }
}, {
  timestamps: true,
});

// インデックスの追加
styleSchema.index({ userId: 1, createdAt: -1 });

// モデルのエクスポート
export default mongoose.models.Style || mongoose.model<IStyle>('Style', styleSchema);
