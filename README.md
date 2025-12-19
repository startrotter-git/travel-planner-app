# お二人の旅行プランナー

40〜50代のご夫婦向けの旅行プランニングWebアプリケーション

## 機能

- 夫婦それぞれの好みに基づいたカスタマイズされた旅行プラン
- 3つのテーマ別プラン提案（歴史・美食・自然）
- 詳細な時刻付きスケジュール生成
- Google Maps APIを使用した実際のレストラン・ホテル候補表示
- 具体的な列車名・便名の表示

## 技術スタック

- React 18
- Vite
- Tailwind CSS
- Lucide React (アイコン)
- Claude API (AI)
- Google Maps API (場所検索)

## デプロイ方法

### Vercelでのデプロイ

1. GitHubにリポジトリをプッシュ
2. [Vercel](https://vercel.com)にサインアップ
3. 「Import Project」からリポジトリを選択
4. デプロイ

## ローカルでの実行

```bash
npm install
npm run dev
```

http://localhost:5173 でアクセス

## バックエンドAPI

このアプリは別途デプロイされたGoogle Maps APIプロキシサーバーを使用します。

API URL: https://travel-planner-api-ird5.onrender.com
