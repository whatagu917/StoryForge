import mongoose from 'mongoose';

const styleSchema = new mongoose.Schema({
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
  },
  userId: {
    type: String,
    required: [true, 'ユーザーIDは必須です'],
  },
}, {
  timestamps: true,
});

// モデルが既に存在する場合はそれを返し、存在しない場合は新しく作成
const Style = mongoose.models.Style || mongoose.model('Style', styleSchema);

export default Style; 