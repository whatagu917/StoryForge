import mongoose, { Schema, Document } from 'mongoose';

export interface IRevision extends Document {
  userId: Schema.Types.ObjectId;
  storyId: Schema.Types.ObjectId;
  chapterId: string;
  type: 'ai' | 'manual';
  content: string;
  previousContent: string;
  chapterTitle: string;
  chapterNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const RevisionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ユーザーIDは必須です'],
  },
  storyId: {
    type: Schema.Types.ObjectId,
    ref: 'Story',
    required: [true, 'ストーリーIDは必須です'],
  },
  chapterId: {
    type: String,
    required: [true, 'チャプターIDは必須です'],
  },
  type: {
    type: String,
    enum: ['ai', 'manual'],
    required: [true, 'リビジョンタイプは必須です'],
  },
  content: {
    type: String,
    required: [true, 'コンテンツは必須です'],
  },
  previousContent: {
    type: String,
    required: [true, '以前のコンテンツは必須です'],
  },
  chapterTitle: {
    type: String,
    required: [true, 'チャプタータイトルは必須です'],
  },
  chapterNumber: {
    type: Number,
    required: [true, 'チャプター番号は必須です'],
  },
}, {
  timestamps: true,
});

// インデックスの作成
RevisionSchema.index({ userId: 1 });
RevisionSchema.index({ storyId: 1 });
RevisionSchema.index({ userId: 1, storyId: 1 });

export default mongoose.models.Revision || mongoose.model<IRevision>('Revision', RevisionSchema); 