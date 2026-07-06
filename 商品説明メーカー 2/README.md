# 商品説明メーカー

写真をアップロードするだけで、フリマアプリ（メルカリ・ラクマ・Yahoo!フリマなど）にそのまま使える商品説明を作成できるWebアプリです。

## 機能

- 📷 写真のドラッグ＆ドロップアップロード（最大5枚）
- ✍️ タイトル・商品説明・ハッシュタグを自動生成
- 🛒 出品先（メルカリ / ラクマ / Yahoo!フリマ）に合わせた文章
- 📋 ワンクリックでコピー
- ✨ OpenAI API キー設定時はAIが写真を分析

## 必要なもの

- [Node.js](https://nodejs.org/) 18以上

## 使い方

### 1. 依存パッケージをインストール

```bash
npm install
```

### 2. サーバーを起動

```bash
npm start
```

ブラウザで **http://localhost:3000** を開いてください。

### 3. （任意）AIモードを有効にする

より精度の高い商品説明を作りたい場合:

1. [OpenAI](https://platform.openai.com/api-keys) でAPIキーを取得
2. `.env.example` を `.env` にコピー
3. `.env` にAPIキーを設定

```bash
cp .env.example .env
# .env を編集して OPENAI_API_KEY=sk-... を設定
npm start
```

APIキーが未設定でも、テンプレートベースのデモモードで動作します。

## ファイル構成

```
product-description-generator/
├── index.html      # メイン画面
├── css/style.css   # デザイン
├── js/app.js       # フロントエンドの処理
├── server.js       # サーバー（API + 静的ファイル配信）
├── package.json
└── .env.example    # 環境変数のサンプル
```

## プライバシー

- アップロードした写真は商品説明の生成にのみ使用され、サーバーに保存されません
- AIモード使用時のみ、OpenAI API に画像が送信されます
