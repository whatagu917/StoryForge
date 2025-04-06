import mongoose from 'mongoose';

export interface IIdea {
  title: string;
  content: string;
  userId: string;
  tags?: string[];
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ideaSchema = new mongoose.Schema<IIdea>({
  title: {
    type: String,
    required: [true, 'タイトルは必須です'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, '内容は必須です'],
  },
  userId: {
    type: String,
    required: [true, 'ユーザーIDは必須です'],
  },
  tags: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    default: 'draft',
    enum: ['draft', 'published', 'archived'],
  }
}, {
  timestamps: true,
});

ideaSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Idea || mongoose.model<IIdea>('Idea', ideaSchema);
