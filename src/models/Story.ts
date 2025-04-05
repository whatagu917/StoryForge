import mongoose, { Schema, Document } from 'mongoose';

export interface IChapter {
  id: string;
  number: number;
  title: string;
  content: string;
}

export interface IStory extends Document {
  title: string;
  content: string;
  chapters: IChapter[];
  userId: Schema.Types.ObjectId;
  isPublished: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ChapterSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  number: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    default: '',
  },
}, { _id: false });

const StorySchema = new Schema({
  title: {
    type: String,
    required: [true, 'タイトルは必須です'],
    trim: true,
    maxlength: [100, 'タイトルは100文字以内である必要があります'],
  },
  content: {
    type: String,
    default: '',
  },
  chapters: {
    type: [ChapterSchema],
    default: [],
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ユーザーIDは必須です'],
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

// インデックスの作成
StorySchema.index({ userId: 1, createdAt: -1 });
StorySchema.index({ title: 'text', content: 'text' });

export default mongoose.models.Story || mongoose.model<IStory>('Story', StorySchema); 