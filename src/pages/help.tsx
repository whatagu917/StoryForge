import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Book, Lightbulb, PenTool, Settings, ArrowLeft } from 'lucide-react';

export default function Help() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // 認証状態がロード中の場合はローディング表示
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // 未認証の場合はログインページにリダイレクト
  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          戻る
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-8">StoryForge ヘルプ</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* アイデア管理セクション */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Lightbulb className="w-6 h-6 text-yellow-500 mr-2" />
            <h2 className="text-xl font-semibold">アイデア管理</h2>
          </div>
          <div className="space-y-4">
            <p>
              StoryForgeでは、物語のアイデアを簡単に管理できます。アイデアページでは以下のことができます：
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>新しいアイデアの作成</li>
              <li>既存のアイデアの編集と削除</li>
              <li>アイデアへのタグ付け</li>
              <li>アイデアの詳細表示</li>
              <li>AIによるアイデア生成</li>
            </ul>
            <p>
              アイデアは物語の基礎となる重要な要素です。複数のアイデアを管理し、それらを組み合わせて物語を構築していきましょう。
            </p>
          </div>
        </div>

        {/* エディタセクション */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <PenTool className="w-6 h-6 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold">エディタ</h2>
          </div>
          <div className="space-y-4">
            <p>
              エディタは物語を書くための主要なツールです。以下の機能があります：
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>チャプターの作成と編集</li>
              <li>AIによる文章生成と編集</li>
              <li>文体プロファイルの適用</li>
              <li>編集履歴の管理</li>
              <li>リアルタイム保存</li>
            </ul>
            <p>
              エディタでは、AIの力を借りて文章を生成したり、既存の文章を改善したりすることができます。また、文体プロファイルを適用することで、一貫した文体を維持することができます。
            </p>
          </div>
        </div>

        {/* 文体プロファイルセクション */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Settings className="w-6 h-6 text-purple-500 mr-2" />
            <h2 className="text-xl font-semibold">文体プロファイル</h2>
          </div>
          <div className="space-y-4">
            <p>
              文体プロファイルは、物語の文体を定義するためのツールです。以下のことができます：
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>新しい文体プロファイルの作成</li>
              <li>サンプルテキストの提供</li>
              <li>文体の強さの調整</li>
              <li>エディタへの文体プロファイルの適用</li>
            </ul>
            <p>
              文体プロファイルを作成するには、希望する文体のサンプルテキストを提供します。AIがそのテキストを分析し、同様の文体で文章を生成できるようになります。
            </p>
          </div>
        </div>

        {/* その他の機能セクション */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Book className="w-6 h-6 text-green-500 mr-2" />
            <h2 className="text-xl font-semibold">その他の機能</h2>
          </div>
          <div className="space-y-4">
            <p>
              StoryForgeには、物語作成をサポートする様々な機能があります：
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>AIによるプロット生成</li>
              <li>キャラクター設定の管理</li>
              <li>設定（世界観）の管理</li>
              <li>編集履歴の追跡</li>
              <li>物語の構造化</li>
            </ul>
            <p>
              これらの機能を活用することで、より効率的に物語を作成することができます。AIの力を借りて、アイデアの展開や文章の改善を行うことができます。
            </p>
          </div>
        </div>
      </div>

      {/* よくある質問セクション */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">よくある質問</h2>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">AIによる文章生成はどのように機能しますか？</h3>
            <p>
              AIによる文章生成は、OpenAIのGPTモデルを使用しています。プロンプトや既存の文章を基に、AIが新しい文章を生成します。文体プロファイルを適用することで、特定の文体に合わせた文章を生成することもできます。
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">文体プロファイルはどのように作成しますか？</h3>
            <p>
              文体プロファイルを作成するには、希望する文体のサンプルテキストを提供します。AIがそのテキストを分析し、同様の文体で文章を生成できるようになります。サンプルテキストは、物語の一部や、参考にしたい作家の文章など、どのようなものでも構いません。
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">編集履歴はどのように管理されますか？</h3>
            <p>
              エディタでの編集は自動的に保存され、編集履歴として記録されます。編集履歴からは、以前のバージョンに戻すことができます。また、AIによる編集と手動編集は区別されて記録されるため、どの編集がAIによるものか、どの編集が手動によるものかを確認することができます。
            </p>
          </div>
        </div>
      </div>

      {/* お問い合わせセクション */}
      <div className="mt-12 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">お問い合わせ</h2>
        <p className="mb-4">
          ご質問やフィードバックがありましたら、以下のメールアドレスまでお問い合わせください。
        </p>
        <p className="font-medium">support@storyforge.example.com</p>
      </div>
    </div>
  );
} 