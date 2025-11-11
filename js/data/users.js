/**
 * 小規模多機能利用調整システム - デフォルト利用者マスタデータ
 * 初期デモ用の利用者データ
 */

const DEFAULT_USERS = [
  {
    id: "user001",
    name: "青柳 美秋",
    nameKana: "あおやぎ みあき",
    registrationDate: "2025-01-01",
    birthDate: "1935-03-15",
    age: 90,
    gender: "female",
    address: "〒123-4567 東京都○○区○○町1-2-3",
    phone: "03-1234-5678",
    emergencyContact: {
      name: "青柳 太郎",
      relationship: "長男",
      phone: "090-1234-5678"
    },
    careLevel: "要介護2",
    medicalInfo: {
      allergies: [],
      medications: ["血圧薬"],
      diseases: ["高血圧"]
    },
    preferences: {
      favoriteActivities: ["読書", "編み物"],
      dietaryRestrictions: []
    },
    note: "読書がお好きで、毎日新聞を読まれています。",
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  },
  {
    id: "user002",
    name: "安藤 敏子",
    nameKana: "あんどう としこ",
    registrationDate: "2025-01-02",
    birthDate: "1938-07-22",
    age: 87,
    gender: "female",
    address: "〒123-4567 東京都○○区○○町2-3-4",
    phone: "03-2345-6789",
    emergencyContact: {
      name: "安藤 花子",
      relationship: "長女",
      phone: "090-2345-6789"
    },
    careLevel: "要介護1",
    medicalInfo: {
      allergies: ["えび", "かに"],
      medications: ["胃薬"],
      diseases: ["胃炎"]
    },
    preferences: {
      favoriteActivities: ["音楽鑑賞", "歌唱"],
      dietaryRestrictions: ["甲殻類アレルギー"]
    },
    note: "音楽がお好きで、よく歌を歌われます。甲殻類アレルギーにご注意ください。",
    isActive: true,
    createdAt: "2025-01-02T00:00:00.000Z",
    updatedAt: "2025-01-02T00:00:00.000Z"
  },
  {
    id: "user003",
    name: "石井 さち子",
    nameKana: "いしい さちこ",
    registrationDate: "2025-01-03",
    birthDate: "1940-11-05",
    age: 84,
    gender: "female",
    address: "〒123-4567 東京都○○区○○町3-4-5",
    phone: "03-3456-7890",
    emergencyContact: {
      name: "石井 次郎",
      relationship: "次男",
      phone: "090-3456-7890"
    },
    careLevel: "要支援2",
    medicalInfo: {
      allergies: [],
      medications: ["整腸剤"],
      diseases: ["軽度認知症"]
    },
    preferences: {
      favoriteActivities: ["手芸", "テレビ鑑賞"],
      dietaryRestrictions: []
    },
    note: "手芸が得意で、他の利用者様に教えてくださることもあります。",
    isActive: true,
    createdAt: "2025-01-03T00:00:00.000Z",
    updatedAt: "2025-01-03T00:00:00.000Z"
  },
  {
    id: "user004",
    name: "石橋 富士代",
    nameKana: "いしばし ふじよ",
    registrationDate: "2025-01-04",
    birthDate: "1933-12-20",
    age: 91,
    gender: "female",
    address: "〒123-4567 東京都○○区○○町4-5-6",
    phone: "03-4567-8901",
    emergencyContact: {
      name: "石橋 美和",
      relationship: "長女",
      phone: "090-4567-8901"
    },
    careLevel: "要介護3",
    medicalInfo: {
      allergies: [],
      medications: ["血糖降下薬", "インスリン"],
      diseases: ["糖尿病", "白内障"]
    },
    preferences: {
      favoriteActivities: ["散歩", "日光浴"],
      dietaryRestrictions: ["糖尿病食"]
    },
    note: "糖尿病のため食事管理が必要です。天気の良い日は外で過ごすことを好まれます。",
    isActive: true,
    createdAt: "2025-01-04T00:00:00.000Z",
    updatedAt: "2025-01-04T00:00:00.000Z"
  },
  {
    id: "user005",
    name: "伊藤 さだ",
    nameKana: "いとう さだ",
    registrationDate: "2025-01-05",
    birthDate: "1937-05-10",
    age: 88,
    gender: "female",
    address: "〒123-4567 東京都○○区○○町5-6-7",
    phone: "03-5678-9012",
    emergencyContact: {
      name: "伊藤 一郎",
      relationship: "長男",
      phone: "090-5678-9012"
    },
    careLevel: "要介護2",
    medicalInfo: {
      allergies: ["花粉"],
      medications: ["抗アレルギー薬"],
      diseases: ["花粉症", "関節炎"]
    },
    preferences: {
      favoriteActivities: ["料理", "園芸"],
      dietaryRestrictions: []
    },
    note: "料理がお得意で、レシピを教えてくださることがあります。春は花粉症の症状が出やすいです。",
    isActive: true,
    createdAt: "2025-01-05T00:00:00.000Z",
    updatedAt: "2025-01-05T00:00:00.000Z"
  },
  {
    id: "user006",
    name: "田中 太郎",
    nameKana: "たなか たろう",
    registrationDate: "2025-01-06",
    birthDate: "1942-08-30",
    age: 82,
    gender: "male",
    address: "〒123-4567 東京都○○区○○町6-7-8",
    phone: "03-6789-0123",
    emergencyContact: {
      name: "田中 恵子",
      relationship: "妻",
      phone: "090-6789-0123"
    },
    careLevel: "要支援1",
    medicalInfo: {
      allergies: [],
      medications: ["血圧薬"],
      diseases: ["高血圧", "軽度難聴"]
    },
    preferences: {
      favoriteActivities: ["将棋", "テレビ鑑賞"],
      dietaryRestrictions: []
    },
    note: "将棋がお強く、他の利用者様と対局を楽しまれます。少し耳が遠いので大きな声でお話しください。",
    isActive: true,
    createdAt: "2025-01-06T00:00:00.000Z",
    updatedAt: "2025-01-06T00:00:00.000Z"
  },
  {
    id: "user007",
    name: "佐藤 花子",
    nameKana: "さとう はなこ",
    registrationDate: "2025-01-07",
    birthDate: "1936-02-14",
    age: 89,
    gender: "female",
    address: "〒123-4567 東京都○○区○○町7-8-9",
    phone: "03-7890-1234",
    emergencyContact: {
      name: "佐藤 健",
      relationship: "長男",
      phone: "090-7890-1234"
    },
    careLevel: "要介護1",
    medicalInfo: {
      allergies: [],
      medications: ["認知症薬"],
      diseases: ["アルツハイマー型認知症"]
    },
    preferences: {
      favoriteActivities: ["音楽", "ダンス"],
      dietaryRestrictions: []
    },
    note: "音楽に合わせて体を動かすことがお好きです。認知症の進行は軽度です。",
    isActive: true,
    createdAt: "2025-01-07T00:00:00.000Z",
    updatedAt: "2025-01-07T00:00:00.000Z"
  },
  {
    id: "user008",
    name: "山田 一郎",
    nameKana: "やまだ いちろう",
    registrationDate: "2025-01-08",
    birthDate: "1939-06-18",
    age: 85,
    gender: "male",
    address: "〒123-4567 東京都○○区○○町8-9-10",
    phone: "03-8901-2345",
    emergencyContact: {
      name: "山田 美由紀",
      relationship: "長女",
      phone: "090-8901-2345"
    },
    careLevel: "要介護2",
    medicalInfo: {
      allergies: [],
      medications: ["心臓薬"],
      diseases: ["心房細動"]
    },
    preferences: {
      favoriteActivities: ["読書", "囲碁"],
      dietaryRestrictions: []
    },
    note: "読書と囲碁がお好きです。心臓に持病があるため、激しい運動は控えています。",
    isActive: true,
    createdAt: "2025-01-08T00:00:00.000Z",
    updatedAt: "2025-01-08T00:00:00.000Z"
  }
];

// サービス利用パターンの例（デモ用）
const DEFAULT_SERVICE_PATTERNS = {
  // 週3回通い
  "user001": {
    pattern: "週3回通い",
    preferredDays: [1, 3, 5], // 月水金
    stayFrequency: "月1回程度"
  },
  // 週2回通い + 月2回泊まり
  "user002": {
    pattern: "週2回通い",
    preferredDays: [2, 4], // 火木
    stayFrequency: "月2回程度"
  },
  // 週4回通い
  "user003": {
    pattern: "週4回通い",
    preferredDays: [1, 2, 4, 5], // 月火木金
    stayFrequency: "なし"
  },
  // 週1回通い + 週1回泊まり
  "user004": {
    pattern: "週2回利用",
    preferredDays: [3, 6], // 水土
    stayFrequency: "週1回程度"
  },
  // 週5回通い
  "user005": {
    pattern: "週5回通い",
    preferredDays: [1, 2, 3, 4, 5], // 平日
    stayFrequency: "なし"
  },
  // 週2回通い
  "user006": {
    pattern: "週2回通い",
    preferredDays: [1, 4], // 月木
    stayFrequency: "なし"
  },
  // 週3回通い + 月1回泊まり
  "user007": {
    pattern: "週3回通い",
    preferredDays: [2, 3, 5], // 火水金
    stayFrequency: "月1回程度"
  },
  // 週1回通い
  "user008": {
    pattern: "週1回通い",
    preferredDays: [3], // 水
    stayFrequency: "なし"
  }
};

// 利用者のケア記録テンプレート（デモ用）
const DEFAULT_CARE_RECORDS = {
  dailyActivities: [
    "食事介助",
    "入浴介助", 
    "排泄介助",
    "服薬管理",
    "健康チェック",
    "リハビリ",
    "レクリエーション",
    "見守り"
  ],
  vitalSigns: [
    "体温",
    "血圧",
    "脈拍",
    "血糖値",
    "酸素飽和度"
  ],
  behaviorObservations: [
    "食欲",
    "睡眠",
    "活動性",
    "コミュニケーション",
    "情緒の安定性"
  ]
};

// グローバルに登録
window.DEFAULT_USERS = DEFAULT_USERS;
window.DEFAULT_SERVICE_PATTERNS = DEFAULT_SERVICE_PATTERNS;
window.DEFAULT_CARE_RECORDS = DEFAULT_CARE_RECORDS;