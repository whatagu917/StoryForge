# StoryForge

## 概要
StoryForgeは、作家やクリエイターのためのストーリー作成支援ツールです。AIを活用して、ストーリーの構築、キャラクター開発、プロット作成を効率的に行うことができます。直感的なインターフェースと高度な分析機能により、創作活動をより充実させることができます。

## 特徴
- 🤖 AIによるストーリー分析と提案
- 📝 リアルタイムエディタによる快適な執筆環境
- 👥 キャラクターの性格分析と関係性の可視化
- 📊 プロットの構造化とタイムライン管理
- 🌍 世界観設定の体系的な管理
- 🔄 バージョン管理による変更履歴の追跡
- 📱 レスポンシブデザインによるマルチデバイス対応

## 使い方
1. アカウント作成とログイン
   - メールアドレスまたはGoogleアカウントで登録
   - プロフィール設定

2. 新規プロジェクト作成
   ```bash
   # プロジェクト作成画面で以下を設定
   - プロジェクト名
   - ジャンル
   - ターゲット読者
   - 予定文字数
   ```

3. ストーリー作成
   - エディタで本文を執筆
   - AIアシスタントによる提案を活用
   - 自動保存機能

4. キャラクター管理
   - キャラクターシートの作成
   - 性格分析と関係性の設定
   - キャラクター間の相関図の生成

## インストール方法
1. 必要な環境
   - Node.js v18.0.0以上
   - MongoDB v5.0以上
   - npm v8.0.0以上

2. リポジトリのクローン
   ```bash
   git clone https://github.com/yourusername/StoryForge.git
   cd StoryForge
   ```

3. 依存パッケージのインストール
   ```bash
   npm install
   ```

4. 環境変数の設定
   ```bash
   cp .env.example .env
   # .envファイルを編集して必要な環境変数を設定
   ```

5. データベースのセットアップ
   ```bash
   npm run db:setup
   ```

6. アプリケーションの起動
   ```bash
   npm run dev
   ```

## API一覧
### 認証関連
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト

### プロジェクト関連
- `GET /api/projects` - プロジェクト一覧取得
- `POST /api/projects` - 新規プロジェクト作成
- `GET /api/projects/:id` - プロジェクト詳細取得
- `PUT /api/projects/:id` - プロジェクト更新
- `DELETE /api/projects/:id` - プロジェクト削除

### ストーリー関連
- `GET /api/stories/:id` - ストーリー取得
- `POST /api/stories` - ストーリー作成
- `PUT /api/stories/:id` - ストーリー更新
- `DELETE /api/stories/:id` - ストーリー削除

### キャラクター関連
- `GET /api/characters` - キャラクター一覧取得
- `POST /api/characters` - キャラクター作成
- `PUT /api/characters/:id` - キャラクター更新
- `DELETE /api/characters/:id` - キャラクター削除

## 技術スタック
### フロントエンド
- React.js v18.2.0
- Next.js v13.4.0
- TypeScript v4.9.0
- Tailwind CSS v3.3.0
- Redux Toolkit v1.9.0

### バックエンド
- Node.js v18.0.0
- Express.js v4.18.0
- MongoDB v5.0
- Mongoose v7.0.0
- JWT認証

### 開発ツール
- ESLint
- Prettier
- Jest
- GitHub Actions

## 開発者向けメモ
### ローカル開発環境のセットアップ
1. 開発用ブランチの作成
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. 開発サーバーの起動
   ```bash
   npm run dev
   ```

3. テストの実行
   ```bash
   npm run test
   ```

### コーディング規約
- ESLintとPrettierの設定に従ってください
- コミットメッセージは[Conventional Commits](https://www.conventionalcommits.org/)に従ってください
- 新機能の追加時はテストを書いてください

### デプロイメント
- メインブランチへのマージは自動的にステージング環境にデプロイされます
- 本番環境へのデプロイは手動で行います

## ライセンス
MIT License

Copyright (c) 2024 StoryForge

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. 