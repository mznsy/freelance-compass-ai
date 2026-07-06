require("dotenv").config();

const express = require("express");
const { globalAgent } = require("http");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(express.json({ limit: "15mb" }));
app.use(express.static(path.join(__dirname)));

const LABELS = {
  category: {
    fashion: "ファッション・服",
    electronics: "家電・ガジェット",
    furniture: "家具・インテリア",
    books: "本・漫画",
    toys: "おもちゃ・ゲーム",
    beauty: "コスメ・美容",
    sports: "スポーツ・アウトドア",
    other: "その他",
  },
  platform: {
    mercari: "メルカリ",
    rakuma: "ラクマ",
    yahoo: "Yahoo!フリマ",
    general: "フリマアプリ",
  },
  condition: {
    new: "新品・未使用",
    "like-new": "未使用に近い",
    good: "目立った傷や汚れなし",
    fair: "やや傷や汚れあり",
    poor: "傷や汚れあり",
  },
  tone: {
    friendly: "親しみやすい",
    polite: "丁寧で上品",
    casual: "カジュアル",
  },
};

const HASHTAGS_BY_CATEGORY = {
  fashion: ["#ファッション", "#おしゃれ", "#コーデ", "#セール", "#プチプラ"],
  electronics: ["#家電", "#ガジェット", "#スマホ", "#中古家電", "#お得"],
  furniture: ["#インテリア", "#家具", "#北欧", "#収納", "#ルーム"],
  books: ["#本", "#漫画", "#読書", "#ブック", "#まとめ売り"],
  toys: ["#ゲーム", "#おもちゃ", "#フィギュア", "#レトロ", "#コレクション"],
  beauty: ["#コスメ", "#美容", "#スキンケア", "#メイク", "#プチプラコスメ"],
  sports: ["#スポーツ", "#アウトドア", "#キャンプ", "#ランニング", "#フィットネス"],
  other: ["#フリマ", "#お得", "#掘り出し物", "#セール", "#中古"],
};

const PLATFORM_TIPS = {
  mercari: "即購入歓迎！コメントなしのご購入も大歓迎です。",
  rakuma: "ラクマポイント還元対象の場合は記載をお忘れなく。",
  yahoo: "Yahoo!かんたん決済対応。値下げ交渉もお気軽にどうぞ。",
  general: "ご質問があればお気軽にコメントください。",
};

function buildDemoResult({ productName, category, platform, condition, tone, features }) {
  const catLabel = LABELS.category[category] || "商品";
  const platformLabel = LABELS.platform[platform] || "フリマアプリ";
  const conditionLabel = LABELS.condition[condition] || "";
  const toneLabel = LABELS.tone[tone] || "";

  const name = productName || `${catLabel}の商品`;

  const titleTemplates = {
    friendly: `【${conditionLabel}】${name} ✨ ${platformLabel}出品`,
    polite: `${name}｜${conditionLabel}｜${platformLabel}にて出品`,
    casual: `${name} 売ります！ ${conditionLabel}`,
  };

  const greeting = {
    friendly: "ご覧いただきありがとうございます！",
    polite: "この度はご覧いただき、誠にありがとうございます。",
    casual: "見てくれてありがとう！",
  };

  const bodyTone = {
    friendly: "とてもおすすめの一品です。気に入っていただけると嬉しいです。",
    polite: "大切に使用してまいりました。次の方にもお役立ていただければ幸いです。",
    casual: "使わなくなったので出品しました。状態は写真の通りです。",
  };

  const description = [
    greeting[tone] || greeting.friendly,
    "",
    `■ 商品名：${name}`,
    `■ カテゴリ：${catLabel}`,
    `■ 状態：${conditionLabel}`,
    features ? `■ 詳細：${features}` : null,
    "",
    bodyTone[tone] || bodyTone.friendly,
    "",
    "■ 発送について",
    "・防水対策をして、丁寧に梱包して発送します",
    "・通常1〜2日以内に発送予定です",
    "",
    PLATFORM_TIPS[platform] || PLATFORM_TIPS.general,
    "",
    "※ 中古品のため、写真に写りきれない小さな使用感がある場合がございます。",
    "※ ご不明点はコメントにてお気軽にお問い合わせください。",
  ]
    .filter(Boolean)
    .join("\n");

  const baseTags = HASHTAGS_BY_CATEGORY[category] || HASHTAGS_BY_CATEGORY.other;
  const extraTags = productName
    ? [`#${productName.replace(/\s+/g, "")}`]
    : [];
  const hashtags = [...new Set([...extraTags, ...baseTags])].slice(0, 8);

  return {
    title: titleTemplates[tone] || titleTemplates.friendly,
    description,
    hashtags,
    mode: "demo",
  };
}

async function generateWithAI({ images, productName, category, platform, condition, tone, features }) {
  const catLabel = LABELS.category[category];
  const platformLabel = LABELS.platform[platform];
  const conditionLabel = LABELS.condition[condition];
  const toneLabel = LABELS.tone[tone];

  const imageContent = images.slice(0, 3).map((dataUrl) => ({
    type: "image_url",
    image_url: { url: dataUrl, detail: "low" },
  }));

  const prompt = `あなたは日本のフリマアプリ（${platformLabel}）出品のプロです。
添付された商品写真を分析し、売れやすい商品説明を日本語で作成してください。

【入力情報】
- 商品名（ユーザー入力）: ${productName || "（未入力・写真から推測してください）"}
- カテゴリ: ${catLabel}
- 商品の状態: ${conditionLabel}
- 出品先: ${platformLabel}
- 文章のトーン: ${toneLabel}
- 補足情報: ${features || "なし"}

【出力形式】
必ず以下のJSON形式のみで返してください（余計なテキストは不要）:
{
  "title": "40文字以内の魅力的なタイトル",
  "description": "200〜400文字程度の商品説明（改行含む。状態・特徴・発送・購入を促す一文を含める）",
  "hashtags": ["#タグ1", "#タグ2", ... 5〜8個]
}

【ルール】
- 写真から見える色・素材・ブランド・特徴を具体的に書く
- 誇大広告や虚偽の記載はしない
- ${platformLabel}向けに自然な文体にする
- タイトルは検索されやすいキーワードを含める`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }, ...imageContent],
        },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || "AI APIの呼び出しに失敗しました");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AIからの応答が空でした");

  const parsed = JSON.parse(content);
  return {
    title: parsed.title || "商品タイトル",
    description: parsed.description || "",
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
    mode: "ai",
  };
}

app.get("/api/status", (_req, res) => {
  res.json({ aiEnabled: Boolean(OPENAI_API_KEY) });
});

app.post("/api/generate", async (req, res) => {

  try {
    const { images, productName, category, platform, condition, tone, features } =
      req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "写真を1枚以上アップロードしてください" });
    }

    const {

  images,

  productName,

  category,

  platform,

  condition,

  tone,

  features,

} = req.body;

const params = {

  images,

  productName,

  category: category || "other",

  platform: platform || "mercari",

  condition: condition || "good",

  tone: tone || "friendly",

  features,

};
    const params = {

  message,

  level,

  goal,

}
    let result;
    if (OPENAI_API_KEY) {
      result = await generateWithAI(params);
    } else {
      result = buildDemoResult(params);
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "サーバーエラーが発生しました" });
  }
});

app.listen(PORT, () => {
  console.log(`\n🛍️  商品説明メーカー`);
  console.log(`   http://localhost:${PORT}`);
  console.log(
    OPENAI_API_KEY
      ? "   ✅ AIモード有効（OpenAI APIキー設定済み）"
      : "   📝 デモモード（.env に OPENAI_API_KEY を設定するとAIモードになります）"
  );
  console.log("");
});
