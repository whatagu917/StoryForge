# StoryForge

StoryForgeは、AIを活用した物語作成・編集プラットフォームです。物語の構造化、文体プロファイルの適用、AIアシスタントによる編集支援など、クリエイティブな執筆プロセスをサポートします。

## 主な機能

### 物語管理
- 複数の物語を管理
- チャプター単位での編集
- 物語の構造化と整理

### 文体プロファイル
- カスタム文体プロファイルの作成と管理
- 文体の強度調整
- サンプルテキストによる文体の定義
- 文体プロファイルの選択と適用

### AIアシスタント
- コンテキストを考慮した編集提案
- 選択した文体に基づく文章生成
- 物語の改善提案
- 質問応答による執筆支援

### 履歴管理
- 編集履歴の記録
- 変更の追跡
- 以前のバージョンへの復元

## 技術スタック

- **フロントエンド**: Next.js, React, TypeScript, Tailwind CSS
- **バックエンド**: Node.js, Express
- **データベース**: MongoDB
- **AI**: OpenAI API (GPT-3.5, GPT-4)
- **認証**: NextAuth.js

## セットアップ

### 前提条件
- Node.js (v14以上)
- npm または yarn
- MongoDB
- OpenAI API キー

### インストール

1. リポジトリをクローン
```bash
git clone https://github.com/yourusername/storyforge.git
cd storyforge
```

2. 依存関係のインストール
```bash
npm install
# または
yarn install
```

3. 環境変数の設定
`.env.local`ファイルを作成し、以下の変数を設定します：
```
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
OPENAI_API_KEY=your_openai_api_key
```

4. 開発サーバーの起動
```bash
npm run dev
# または
yarn dev
```

5. ブラウザで http://localhost:3000 にアクセス

## 使い方

### 物語の作成
1. 「+ New Title」ボタンをクリックして新しい物語を作成
2. タイトルを入力して「Create Title」をクリック
3. 「+ New Chapter」ボタンでチャプターを追加

### 文体プロファイルの管理
1. 「文体を管理」ボタンをクリックして文体管理ページに移動
2. 「新規作成」ボタンで新しい文体プロファイルを作成
3. プロファイル名、説明、サンプルテキスト、強度を設定
4. 「作成」ボタンをクリックして保存

### 文体の適用
1. エディタ画面で「Sparkles」アイコンをクリック
2. 利用可能な文体プロファイルから選択
3. AIアシスタントが選択した文体に基づいて応答

### AIアシスタントの利用
1. エディタ画面の右側のAIアシスタントパネルを使用
2. 質問や指示を入力
3. AIが文脈を考慮して応答
4. 必要に応じて「AI Rewrite」ボタンで文章を改善

### 履歴の確認
1. 「History」アイコンをクリックして履歴パネルを表示
2. 過去の編集履歴を確認
3. 必要に応じて以前のバージョンに戻す

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 貢献

貢献は大歓迎です。バグ報告、機能リクエスト、プルリクエストなど、どのような形の貢献も受け付けています。

1. リポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 連絡先

プロジェクトに関する質問やフィードバックがある場合は、[Issue](https://github.com/yourusername/storyforge/issues)を作成してください。 