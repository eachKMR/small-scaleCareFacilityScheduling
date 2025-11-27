# L3_UI_日別サマリー設計

**作成日**: 2025年11月27日  
**カテゴリ**: 第3層 - 統合設計  
**バージョン**: 1.0

---

## 📖 このドキュメントについて

このドキュメントは、**日別サマリー**の設計を定義します。

### 対象読者

- UI/UX担当者
- フロントエンド実装担当者
- テスト担当者

### 読了後に理解できること

- 日別サマリーの目的と役割
- 各セクション別の表示内容
- HTML/CSS/JavaScript の実装方法
- ホバーポップアップと詳細モードの仕様
- 送迎量の表示方法

### 設計の前提

- **L2_通い_データ構造.md** のKayoiScheduleクラス（pickupType/dropoffType）
- **L2_泊まり_データ構造.md** の介助量管理
- **L2_訪問_データ構造.md** のHoumonScheduleクラス
- **L3_UI_統合UI設計.md** の画面構成

---

## 1. 日別サマリーの目的と役割

### 1.1 概要

**日別サマリー**は、月別予定表の**日付ヘッダー下部**に表示される集計行です。

```
┌─────────────────────────────────────┐
│      1  2  3  4  5  ... 30         │  ← 日付ヘッダー
│      土 日 月 火 水  ... 土         │
├─────────────────────────────────────┤
│通い  12 14 13 15 16 ... 12         │  ← 日別サマリー
│迎え   8 10  9 12 13 ...  8         │
│送り   9 11 10 13 14 ...  9         │
├─────────────────────────────────────┤
│利用者名                              │  ← メイングリッド
│ ...                                 │
└─────────────────────────────────────┘
```

---

### 1.2 業務上の価値

#### 電話対応時
「今月、通いの空きはありますか？」
→ パッと見て数字が少ない日を探せる

#### 調整作業時
「送迎車両が足りるか？」
→ 迎え・送りの人数を一目で確認

#### 新規受入判断
「この日は受け入れられるか？」
→ 定員、送迎状況を即座に判断

---

### 1.3 セクション別に特化

**重要な設計原則**: 各タブで、そのセクションに関連する情報のみ表示

| タブ | 日別サマリー内容 |
|------|---------------|
| **通い** | 通い人数、迎え人数、送り人数 |
| **泊まり** | 泊まり人数、介助量（重度・中度・軽度） |
| **訪問** | 訪問回数のみ |
| **全体** | 3サービスの統合ビュー |

❌ すべてのタブで同じ3行（通い・泊まり・訪問）を表示しない

---

## 2. 通いセクションの日別サマリー

### 2.1 表示内容（3行）

```
通い（デイサービス）                [詳細表示 ▼]
┌─────────────────────────────────────┐
│通い 12  14  13  15  16 ... 12      │ ← 標準の高さ（24px）
├─────────────────────────────────────┤
│迎え  8  10   9  12  13 ...  8      │ ← 細い行（16px）
│送り  9  11  10  13  14 ...  9      │ ← 細い行（16px）
└─────────────────────────────────────┘
```

**3行の意味**:
1. **通い**: 利用者総数（前半・後半の最大値）
2. **迎え**: 職員送迎が必要な人数（朝）
3. **送り**: 職員送迎が必要な人数（夕方）

**縦幅**: 約56px（通い 24px + 迎え 16px + 送り 16px）

---

### 2.2 通常モード（合算表示）

#### 前半・後半は原則1行

**理由**: 95%以上の利用者は全日利用のため

```
通い（デイサービス）                [詳細表示 ▼]
┌─────────────────────────────────────┐
│通い 12  14  13  15  16 ... 12      │
└─────────────────────────────────────┘
```

**表示内容**: 前半と後半の最大値

**例**:
- 前半12人、後半10人 → 「**12**」と表示
- 前半15人、後半16人 → 「**16**」と表示（超過 → 赤色）

---

### 2.3 ホバーポップアップ

#### 動作

**マウスを3日のセルに乗せると**:

```
        3日
┌─────────────┐
│ 通い: 13     │
│ 前半: 13     │
│ 後半: 11     │
│ ─────────── │
│ 迎え: 9      │
│ 送り: 10     │
└─────────────┘
```

#### 用途

- **電話対応中に素早く確認**
- 「前半と後半、どちらが空いているか？」を即答

#### Phase 2以降の拡張余地

ポップアップに以下の情報を追加する可能性（Phase 2以降で検討）:
- 1便・2便の区別
- 送迎ルート情報
- 送迎時間設定マトリックスとの連携
- 送迎車両の配車状況

**注意**: Phase 1では基本情報のみ。具体的な拡張仕様は業務要件を詰めてから設計。

---

### 2.4 詳細表示モード（前半・後半を展開）

#### トグルボタンで切り替え

```
通い（デイサービス）                [合算表示 ▲]
┌─────────────────────────────────────┐
│通い 12  14  13  15  16 ... 12      │ ← 24px
├─────────────────────────────────────┤
│前半 12  14  13  15  15 ... 12      │ ← 16px
│後半 10  12  11  14  16 ... 10      │ ← 16px
├─────────────────────────────────────┤
│迎え  8  10   9  12  13 ...  8      │ ← 16px
│送り  9  11  10  13  14 ...  9      │ ← 16px
└─────────────────────────────────────┘
```

**用途**:
- 月間の調整作業
- 前半・後半のバランスを見ながら予定を組む
- 定員超過の日を探す

**縦幅**: 約88px

#### 状態の保存

トグルの状態は `localStorage` に保存し、次回も同じモードで表示

```javascript
localStorage.setItem('kayoi-summary-mode', 'detail'); // or 'simple'
```

---

### 2.5 送迎量の表示

#### 背景

**業務上の重要性**:
1. **送迎車両の配車計画**
2. **新規利用者の受入判断**（送迎車が満車の場合）
3. **送迎ルートの最適化**

#### データ構造

`KayoiSchedule` クラスに以下のプロパティを追加（L2_通い_データ構造.md v3.0で定義済み）:

```javascript
{
  pickupType: "staff",  // "staff" | "family"
  dropoffType: "staff"  // "staff" | "family"
}
```

#### 計算ロジック

```javascript
function calculateDailySummary(schedules, date) {
  const dateSchedules = schedules.filter(s => s.date === date);
  
  // 通い人数（前半・後半の最大値）
  const zenhanCount = dateSchedules.filter(
    s => s.section === "前半" || s.section === "終日"
  ).length;
  
  const kohanCount = dateSchedules.filter(
    s => s.section === "後半" || s.section === "終日"
  ).length;
  
  const kayoiCount = Math.max(zenhanCount, kohanCount);
  
  // 送迎人数（職員送迎のみカウント）
  const pickupCount = dateSchedules.filter(
    s => s.pickupType === "staff"
  ).length;
  
  const dropoffCount = dateSchedules.filter(
    s => s.dropoffType === "staff"
  ).length;
  
  return {
    kayoi: kayoiCount,
    zenhan: zenhanCount,
    kohan: kohanCount,
    pickup: pickupCount,
    dropoff: dropoffCount
  };
}
```

---

### 2.6 HTML構造

```html
<div class="daily-summary kayoi-summary">
  <!-- ヘッダー -->
  <div class="summary-header">
    <h4>通い（デイサービス）</h4>
    <button id="toggle-detail" class="toggle-button">
      <span class="label">詳細表示</span>
      <span class="icon">▼</span>
    </button>
  </div>
  
  <!-- 通常モード（初期表示） -->
  <div class="summary-rows simple-mode">
    <div class="summary-row main-row">
      <span class="label">通い</span>
      <span class="count-cell hover-trigger" 
            data-date="2025-11-01"
            data-kayoi="12"
            data-zenhan="12"
            data-kohan="10"
            data-pickup="8"
            data-dropoff="9">12</span>
      <span class="count-cell hover-trigger" 
            data-date="2025-11-02"
            data-kayoi="14"
            data-zenhan="14"
            data-kohan="12"
            data-pickup="10"
            data-dropoff="11">14</span>
      <!-- ... 他の日（30日分） -->
    </div>
    <div class="summary-row sub-row">
      <span class="label">迎え</span>
      <span class="count-cell">8</span>
      <span class="count-cell">10</span>
      <!-- ... 他の日 -->
    </div>
    <div class="summary-row sub-row">
      <span class="label">送り</span>
      <span class="count-cell">9</span>
      <span class="count-cell">11</span>
      <!-- ... 他の日 -->
    </div>
  </div>
  
  <!-- 詳細モード（初期非表示） -->
  <div class="summary-rows detail-mode" style="display: none;">
    <div class="summary-row main-row">
      <span class="label">通い</span>
      <!-- ... -->
    </div>
    <div class="summary-row sub-row">
      <span class="label">前半</span>
      <!-- ... -->
    </div>
    <div class="summary-row sub-row">
      <span class="label">後半</span>
      <!-- ... -->
    </div>
    <div class="summary-row sub-row">
      <span class="label">迎え</span>
      <!-- ... -->
    </div>
    <div class="summary-row sub-row">
      <span class="label">送り</span>
      <!-- ... -->
    </div>
  </div>
  
  <!-- ホバーポップアップ（共通） -->
  <div class="hover-popup" style="display: none;">
    <div class="popup-row"><strong>通い:</strong> <span id="popup-kayoi">-</span></div>
    <div class="popup-row">前半: <span id="popup-zenhan">-</span></div>
    <div class="popup-row">後半: <span id="popup-kohan">-</span></div>
    <div class="popup-divider"></div>
    <div class="popup-row">迎え: <span id="popup-pickup">-</span></div>
    <div class="popup-row">送り: <span id="popup-dropoff">-</span></div>
  </div>
</div>
```

---

### 2.7 CSS設計

```css
/* ヘッダー */
.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.summary-header h4 {
  margin: 0;
  font-size: 14px;
}

.toggle-button {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.toggle-button:hover {
  background: #f0f0f0;
}

/* 行の高さ */
.summary-row {
  display: flex;
  border-bottom: 1px solid #eee;
}

.summary-row.main-row {
  height: 24px;
  font-weight: bold;
  background-color: #fafafa;
}

.summary-row.sub-row {
  height: 16px;
  font-size: 11px;
  color: #666;
}

/* ラベル */
.summary-row .label {
  width: 60px;
  padding: 4px 8px;
  text-align: left;
  background-color: #f5f5f5;
  border-right: 1px solid #ddd;
}

/* カウントセル */
.count-cell {
  flex: 1;
  text-align: center;
  padding: 4px;
  border-right: 1px solid #eee;
  position: relative;
}

.count-cell.hover-trigger {
  cursor: pointer;
}

.count-cell.hover-trigger:hover {
  background-color: rgba(0, 123, 255, 0.05);
}

/* ホバーポップアップ */
.hover-popup {
  position: absolute;
  background: white;
  border: 1px solid #ddd;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1000;
  min-width: 120px;
}

.popup-row {
  margin: 2px 0;
  display: flex;
  justify-content: space-between;
}

.popup-divider {
  border-top: 1px solid #eee;
  margin: 4px 0;
}

/* 定員超過の色分け */
.count-cell.over-capacity {
  background-color: #ffebee;
  color: #c62828;
  font-weight: bold;
}

.count-cell.at-capacity {
  background-color: #fff9c4;
  color: #f57c00;
}

/* モードの切り替え */
.summary-rows.simple-mode {
  display: block;
}

.summary-rows.detail-mode {
  display: none;
}

/* 詳細モードがアクティブの時 */
.kayoi-summary.detail-active .simple-mode {
  display: none;
}

.kayoi-summary.detail-active .detail-mode {
  display: block;
}
```

---

### 2.8 JavaScript処理

#### トグルボタン

```javascript
// トグルボタンの初期化
const toggleButton = document.getElementById('toggle-detail');
const kayoiSummary = document.querySelector('.kayoi-summary');

// localStorageから前回の状態を復元
const isDetailMode = localStorage.getItem('kayoi-summary-mode') === 'detail';
if (isDetailMode) {
  kayoiSummary.classList.add('detail-active');
  toggleButton.querySelector('.label').textContent = '合算表示';
  toggleButton.querySelector('.icon').textContent = '▲';
}

// クリックでモード切り替え
toggleButton.addEventListener('click', () => {
  const isDetail = kayoiSummary.classList.toggle('detail-active');
  
  // ボタンのラベルとアイコンを更新
  if (isDetail) {
    toggleButton.querySelector('.label').textContent = '合算表示';
    toggleButton.querySelector('.icon').textContent = '▲';
    localStorage.setItem('kayoi-summary-mode', 'detail');
  } else {
    toggleButton.querySelector('.label').textContent = '詳細表示';
    toggleButton.querySelector('.icon').textContent = '▼';
    localStorage.setItem('kayoi-summary-mode', 'simple');
  }
});
```

#### ホバーポップアップ

```javascript
// ホバーポップアップの初期化
const hoverTriggers = document.querySelectorAll('.hover-trigger');
const hoverPopup = document.querySelector('.hover-popup');

hoverTriggers.forEach(cell => {
  cell.addEventListener('mouseenter', (e) => {
    // data属性から値を取得
    const kayoi = cell.dataset.kayoi;
    const zenhan = cell.dataset.zenhan;
    const kohan = cell.dataset.kohan;
    const pickup = cell.dataset.pickup;
    const dropoff = cell.dataset.dropoff;
    
    // ポップアップに値を設定
    document.getElementById('popup-kayoi').textContent = kayoi;
    document.getElementById('popup-zenhan').textContent = zenhan;
    document.getElementById('popup-kohan').textContent = kohan;
    document.getElementById('popup-pickup').textContent = pickup;
    document.getElementById('popup-dropoff').textContent = dropoff;
    
    // ポップアップの位置を計算
    const rect = cell.getBoundingClientRect();
    hoverPopup.style.left = `${rect.left}px`;
    hoverPopup.style.top = `${rect.bottom + 5}px`;
    
    // 表示
    hoverPopup.style.display = 'block';
  });
  
  cell.addEventListener('mouseleave', () => {
    hoverPopup.style.display = 'none';
  });
});
```

---

## 3. 泊まりセクションの日別サマリー

### 3.1 表示内容（4行）

```
泊まり（ショートステイ）
┌─────────────────────────────────────┐
│人数  7   8   9   7   6  ...  8     │ ← 24px
├─────────────────────────────────────┤
│重度  2   3   4   2   1  ...  3     │ ← 16px
│中度  3   3   3   3   3  ...  3     │ ← 16px
│軽度  2   2   2   2   2  ...  2     │ ← 16px
└─────────────────────────────────────┘
```

**4行の意味**:
1. **人数**: 泊まり人数（定員9人）
2. **重度**: 介助量が重度の人数
3. **中度**: 介助量が中度の人数
4. **軽度**: 介助量が軽度の人数

**業務上の価値**:
- **夜勤体制の判断**: 重度が多い日は夜勤の負担が大きい
- **職員配置の調整**: 介助量に応じて職員を配置
- **新規受入の判断**: 「重度が多い日は新規受入を控える」などの判断材料

**縦幅**: 約72px

---

### 3.2 HTML構造

```html
<div class="daily-summary tomari-summary">
  <div class="summary-header">
    <h4>泊まり（ショートステイ）</h4>
  </div>
  
  <div class="summary-rows">
    <div class="summary-row main-row">
      <span class="label">人数</span>
      <span class="count-cell">7</span>
      <span class="count-cell">8</span>
      <!-- ... 他の日 -->
    </div>
    <div class="summary-row sub-row">
      <span class="label">重度</span>
      <span class="count-cell">2</span>
      <span class="count-cell">3</span>
      <!-- ... 他の日 -->
    </div>
    <div class="summary-row sub-row">
      <span class="label">中度</span>
      <span class="count-cell">3</span>
      <span class="count-cell">3</span>
      <!-- ... 他の日 -->
    </div>
    <div class="summary-row sub-row">
      <span class="label">軽度</span>
      <span class="count-cell">2</span>
      <span class="count-cell">2</span>
      <!-- ... 他の日 -->
    </div>
  </div>
</div>
```

---

### 3.3 データ取得方法

#### 介助量の定義

介助量（軽度・中度・重度）は **User マスタ**で管理（L1_データ_共通データ構造.md で定義予定）

```javascript
class User {
  constructor(data) {
    // ...
    this.careLevel = data.careLevel; // "軽度" | "中度" | "重度"
  }
}
```

#### 計算ロジック

```javascript
function calculateTomariSummary(reservations, masterData, date) {
  // その日に泊まっている利用者を抽出
  const dateReservations = reservations.filter(r => {
    const checkIn = new Date(r.checkInDate);
    const checkOut = new Date(r.checkOutDate);
    const target = new Date(date);
    return target >= checkIn && target <= checkOut;
  });
  
  let keiCount = 0;
  let chuCount = 0;
  let juCount = 0;
  
  dateReservations.forEach(reservation => {
    const user = masterData.getUserById(reservation.userId);
    if (!user) return;
    
    switch (user.careLevel) {
      case "軽度":
        keiCount++;
        break;
      case "中度":
        chuCount++;
        break;
      case "重度":
        juCount++;
        break;
    }
  });
  
  return {
    total: dateReservations.length,
    kei: keiCount,
    chu: chuCount,
    ju: juCount
  };
}
```

---

### 3.4 色分けルール

```css
/* 泊まり人数の色分け */
.tomari-summary .count-cell.over-capacity {
  /* 定員超過（10人以上） */
  background-color: #ffebee;
  color: #c62828;
  font-weight: bold;
}

.tomari-summary .count-cell.at-capacity {
  /* 定員ちょうど（9人） */
  background-color: #fff9c4;
  color: #f57c00;
}

.tomari-summary .count-cell.near-capacity {
  /* 定員近い（8人） */
  background-color: #fff9c4;
  color: #f57c00;
  opacity: 0.7;
}

/* 介助量の色分け（重度が多い日） */
.tomari-summary .sub-row.ju-many {
  /* 重度が5人以上 */
  background-color: #ffe0e0;
}
```

---

## 4. 訪問セクションの日別サマリー

### 4.1 表示内容（1行）

```
訪問（訪問介護）
┌─────────────────────────────────────┐
│回数 25  23  24  26  22 ... 24      │ ← 24px
└─────────────────────────────────────┘
```

**1行の意味**:
1. **回数**: 訪問回数（定員なし）

**Phase 2以降の拡張**:
- 職員別の訪問回数を追加
- 職員の稼働状況を可視化

**縦幅**: 約24px

---

### 4.2 HTML構造

```html
<div class="daily-summary houmon-summary">
  <div class="summary-header">
    <h4>訪問（訪問介護）</h4>
  </div>
  
  <div class="summary-rows">
    <div class="summary-row main-row">
      <span class="label">回数</span>
      <span class="count-cell">25</span>
      <span class="count-cell">23</span>
      <!-- ... 他の日 -->
    </div>
  </div>
</div>
```

---

### 4.3 計算ロジック

```javascript
function calculateHoumonSummary(schedules, date) {
  // その日の訪問予定をカウント
  const count = schedules.filter(s => s.date === date).length;
  
  return {
    count: count
  };
}
```

---

### 4.4 Phase 2以降の拡張

#### 職員別の訪問回数

```
訪問（訪問介護）
┌─────────────────────────────────────┐
│回数 25  23  24  26  22 ... 24      │
├─────────────────────────────────────┤
│佐藤  8   7   8   9   7 ...  8      │ ← 職員別
│鈴木  9   8   8   9   8 ...  9      │
│田中  8   8   8   8   7 ...  7      │
└─────────────────────────────────────┘
```

**業務上の価値**:
- 職員の稼働状況を可視化
- 特定の職員に負荷が集中していないか確認
- 新規訪問を誰に割り当てるか判断

---

## 5. 全体タブの日別サマリー

### 5.1 表示内容（3サービス統合）

```
全体
┌─────────────────────────────────────┐
│      1   2   3   4   5  ... 30     │
│通い  12  14  13  15  14 ... 12     │
│泊まり 7   8   9   7   6 ...  8     │
│訪問  25  23  24  26  22 ... 24     │
└─────────────────────────────────────┘
```

**3行の意味**:
- 3サービスの人数を一覧
- 月全体の稼働状況を俯瞰

**縦幅**: 約72px（3行 × 24px）

---

### 5.2 HTML構造

```html
<div class="daily-summary integrated-summary">
  <div class="summary-header">
    <h4>全体</h4>
  </div>
  
  <div class="summary-rows">
    <div class="summary-row main-row">
      <span class="label">通い</span>
      <span class="count-cell">12</span>
      <span class="count-cell">14</span>
      <!-- ... 他の日 -->
    </div>
    <div class="summary-row main-row">
      <span class="label">泊まり</span>
      <span class="count-cell">7</span>
      <span class="count-cell">8</span>
      <!-- ... 他の日 -->
    </div>
    <div class="summary-row main-row">
      <span class="label">訪問</span>
      <span class="count-cell">25</span>
      <span class="count-cell">23</span>
      <!-- ... 他の日 -->
    </div>
  </div>
</div>
```

---

## 6. 色分けルール（全セクション共通）

### 6.1 定員状況による色分け

#### 通いセクション

```css
/* 定員超過（16人以上） */
.kayoi-summary .over-capacity {
  background-color: #ffebee;
  color: #c62828;
  font-weight: bold;
}

/* 定員ちょうど（15人） */
.kayoi-summary .at-capacity {
  background-color: #fff9c4;
  color: #f57c00;
}

/* 定員近い（14人） */
.kayoi-summary .near-capacity {
  background-color: #fffde7;
  color: #f57c00;
  opacity: 0.7;
}
```

#### 泊まりセクション

```css
/* 定員超過（10人以上） */
.tomari-summary .over-capacity {
  background-color: #ffebee;
  color: #c62828;
  font-weight: bold;
}

/* 定員ちょうど（9人） */
.tomari-summary .at-capacity {
  background-color: #fff9c4;
  color: #f57c00;
}
```

#### 訪問セクション

訪問は定員がないため、回数による色分けは行わない（Phase 1）

---

### 6.2 曜日による色分け

```css
/* 土曜日 */
.count-cell[data-day="土"] {
  background-color: rgba(33, 150, 243, 0.1);
}

/* 日曜日・祝日 */
.count-cell[data-day="日"],
.count-cell[data-holiday="true"] {
  background-color: rgba(244, 67, 54, 0.1);
}
```

---

## 7. 業務シナリオ

### シナリオ1: 電話で空き状況を即答

```
電話: 「今月、通いの空きはありますか?」

↓

【操作】通いタブを開く（合算表示）

↓

【確認】パッと見て、数字が少ない日を探す
→ 3日が13人（比較的少ない）

↓

【操作】3日のセルにマウスホバー

↓

【表示】ポップアップ:
┌─────────────┐
│ 通い: 13     │
│ 前半: 13     │
│ 後半: 11     │
│ ─────────── │
│ 迎え: 9      │
│ 送り: 10     │
└─────────────┘

↓

【回答】「3日の後半なら空いています。送迎も可能です。」
```

**所要時間**: 約10秒

---

### シナリオ2: 新規利用者の予定を組む

```
相談: 「週2回、通いを利用したい」

↓

【操作】[詳細表示]ボタンをクリック

↓

【表示】前半・後半の2行表示

┌─────────────────────────────────────┐
│通い 12  14  13  15  16 ... 12      │
├─────────────────────────────────────┤
│前半 12  14  13  15  15 ... 12      │
│後半 10  12  11  14  16 ... 10      │
└─────────────────────────────────────┘

↓

【確認】前半が空いている曜日を探す
→ 月曜（12人）、水曜（13人）が比較的空いている

↓

【提案】「月曜と水曜の午前はいかがですか？」
```

---

### シナリオ3: 送迎車両の配車計画

```
13日の送迎計画を立てる

↓

【確認】13日の日別サマリー:
通い: 15人
迎え: 12人 ← 3人は家族送迎
送り: 13人 ← 2人は家族送迎

↓

【計算】送迎車両（定員8人）の必要台数:
迎え: 12人 ÷ 8 = 2台必要
送り: 13人 ÷ 8 = 2台必要

↓

【判断】送迎職員を2名配置
```

---

### シナリオ4: 送迎満車の場合の受入判断

```
電話: 「来週の月曜、通いを利用したい。送迎お願いできますか？」

↓

【確認】月曜の日別サマリー:
通い: 14/15人 ← あと1人入れる
迎え: 15人 ← 送迎車が満車（16人乗り）

↓

【判断】通いは空いているが、送迎が満車

↓

【回答】「通いは空いていますが、送迎が満車です。
        ご家族の送迎は可能でしょうか？」

↓

【提案】家族送迎なら受入可能
```

---

## 8. 実装の優先順位

### Phase 1（最優先）

1. **日別サマリーの基本実装**
   - 通いセクション: 通い行のみ（合算表示）
   - 泊まりセクション: 人数行のみ
   - 訪問セクション: 回数行のみ

2. **ホバーポップアップ**
   - 通いセクションのみ実装
   - 前半・後半・迎え・送りを表示

3. **詳細表示モード**
   - トグルボタンの実装
   - 前半・後半の2行表示

---

### Phase 1.5（追加機能）

4. **送迎量の追加**
   - 迎え・送り行の追加
   - データ構造の拡張（pickupType, dropoffType）
   - 送迎タイプの入力UI

5. **泊まりの介助量**
   - 重度・中度・軽度の3行追加
   - 介助量の計算ロジック

---

### Phase 2以降

6. **訪問の職員別表示**
   - 職員別の訪問回数
   - 職員稼働状況の可視化

7. **全体タブの統合ビュー**
   - 3サービスの統合表示
   - 利用者軸での表示

---

## 9. テスト仕様

### 9.1 単体テスト

#### 通いセクション

```javascript
// 前半・後半の最大値計算
test('通い人数は前半と後半の最大値', () => {
  const schedules = [
    { userId: 'u1', date: '2025-11-25', section: '前半' },
    { userId: 'u2', date: '2025-11-25', section: '前半' },
    { userId: 'u3', date: '2025-11-25', section: '後半' },
    { userId: 'u4', date: '2025-11-25', section: '終日' }
  ];
  
  const summary = calculateDailySummary(schedules, '2025-11-25');
  
  expect(summary.zenhan).toBe(3); // 前半 + 終日
  expect(summary.kohan).toBe(2);  // 後半 + 終日
  expect(summary.kayoi).toBe(3);  // max(3, 2)
});

// 送迎人数の計算
test('送迎人数は職員送迎のみカウント', () => {
  const schedules = [
    { userId: 'u1', date: '2025-11-25', section: '終日', 
      pickupType: 'staff', dropoffType: 'staff' },
    { userId: 'u2', date: '2025-11-25', section: '終日', 
      pickupType: 'family', dropoffType: 'staff' }
  ];
  
  const summary = calculateDailySummary(schedules, '2025-11-25');
  
  expect(summary.pickup).toBe(1);  // u1のみ
  expect(summary.dropoff).toBe(2); // u1, u2
});
```

#### 泊まりセクション

```javascript
// 介助量の集計
test('介助量を正しくカウント', () => {
  const reservations = [
    { userId: 'u1', checkInDate: '2025-11-25', checkOutDate: '2025-11-27' },
    { userId: 'u2', checkInDate: '2025-11-24', checkOutDate: '2025-11-26' }
  ];
  
  const users = [
    { userId: 'u1', name: '山田', careLevel: '重度' },
    { userId: 'u2', name: '田中', careLevel: '中度' }
  ];
  
  const masterData = { getUserById: (id) => users.find(u => u.userId === id) };
  const summary = calculateTomariSummary(reservations, masterData, '2025-11-25');
  
  expect(summary.total).toBe(2);
  expect(summary.ju).toBe(1);  // 重度: 山田
  expect(summary.chu).toBe(1); // 中度: 田中
  expect(summary.kei).toBe(0);
});
```

---

### 9.2 統合テスト

#### ホバーポップアップ

```javascript
test('ホバー時にポップアップが表示される', () => {
  const cell = document.querySelector('.count-cell[data-date="2025-11-25"]');
  const popup = document.querySelector('.hover-popup');
  
  // マウスホバー
  cell.dispatchEvent(new MouseEvent('mouseenter'));
  
  // ポップアップが表示される
  expect(popup.style.display).toBe('block');
  
  // 値が正しく表示される
  expect(document.getElementById('popup-kayoi').textContent).toBe('13');
  expect(document.getElementById('popup-zenhan').textContent).toBe('13');
  expect(document.getElementById('popup-kohan').textContent).toBe('11');
  
  // マウスを離す
  cell.dispatchEvent(new MouseEvent('mouseleave'));
  
  // ポップアップが非表示になる
  expect(popup.style.display).toBe('none');
});
```

#### トグルボタン

```javascript
test('トグルボタンで詳細モードに切り替わる', () => {
  const toggleButton = document.getElementById('toggle-detail');
  const kayoiSummary = document.querySelector('.kayoi-summary');
  
  // 初期状態: 通常モード
  expect(kayoiSummary.classList.contains('detail-active')).toBe(false);
  expect(toggleButton.querySelector('.label').textContent).toBe('詳細表示');
  
  // クリック
  toggleButton.click();
  
  // 詳細モードに切り替わる
  expect(kayoiSummary.classList.contains('detail-active')).toBe(true);
  expect(toggleButton.querySelector('.label').textContent).toBe('合算表示');
  
  // localStorageに保存される
  expect(localStorage.getItem('kayoi-summary-mode')).toBe('detail');
});
```

---

## 10. まとめ

### 10.1 このドキュメントで定義したこと

```
✅ 定義したこと
├─ 日別サマリーの目的と役割
├─ 各セクション別の表示内容（通い・泊まり・訪問・全体）
├─ HTML構造
├─ CSS設計
├─ JavaScript処理（トグル、ホバー）
├─ データ取得ロジック
├─ 色分けルール
├─ 業務シナリオ
├─ 実装の優先順位
└─ テスト仕様
```

---

### 10.2 重要なポイント

1. **セクション別に特化**: 各タブで関連情報のみ表示
2. **前半・後半は原則合算**: 95%が全日利用のため
3. **送迎量の重要性**: 配車計画、新規受入判断
4. **ホバーで素早く確認**: 電話対応時に即座に回答
5. **詳細モードで調整作業**: 前半・後半のバランスを見ながら予定組み
6. **泊まりの介助量**: 夜勤体制の判断材料
7. **縦幅の制約**: 画面全体の1/6程度に抑える

---

### 10.3 Phase 1で実装すること

```
✅ Phase 1
├─ 通いセクション: 通い・迎え・送りの3行
├─ ホバーポップアップ（通いのみ）
├─ 詳細表示モード（前半・後半展開）
├─ 泊まりセクション: 人数・介助量の4行
└─ 訪問セクション: 回数の1行

⏭️ Phase 2以降
├─ 全体タブの統合ビュー
├─ 訪問の職員別表示
├─ 送迎の1便・2便区別
└─ リアルタイム更新
```

---

### 10.4 次のステップ

日別サマリー設計が完成しました。

**次に更新すべきドキュメント**:
1. **L2_通い_UI設計.md** - 日別サマリーへの参照追加
2. **L3_UI_統合UI設計.md** - 画面構成に日別サマリー追加

**実装順序**:
1. 通いセクションの日別サマリー（基本）
2. ホバーポップアップ
3. 詳細表示モード
4. 泊まりセクションの日別サマリー
5. 訪問セクションの日別サマリー

---

## 📚 次に読むべきドキュメント

このドキュメントを読了したら、以下のドキュメントに進んでください。

### 関連ドキュメント

- **L2_通い_データ構造.md** - pickupType/dropoffTypeの定義
- **L2_通い_UI設計.md** - 通いセクションのUI全体
- **L3_UI_統合UI設計.md** - 画面全体の構成

---

## 📝 参考資料

- L2_通い_データ構造.md（KayoiScheduleクラス、pickupType/dropoffType）
- L2_泊まり_データ構造.md（TomariReservationクラス）
- L2_訪問_データ構造.md（HoumonScheduleクラス）
- L1_データ_共通データ構造.md（Userマスタ、介助量）
- L3_UI_統合UI設計.md（タブナビゲーション、画面構成）

---

## 📅 更新履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|----------|---------|------|
| 2025-11-27 | 1.0 | 初版作成 | Claude |

---

**最終更新**: 2025年11月27日  
**次回更新予定**: Phase 1実装中のフィードバック反映時

---

## ⚠️ 設計チェックリスト

このドキュメントの品質チェック：

- [x] すべてのセクションの表示内容が明確
- [x] HTML/CSS/JavaScriptのコード例がある
- [x] データ取得ロジックが具体的
- [x] ホバーとトグルの動作が詳細に記述
- [x] 色分けルールが定義されている
- [x] 業務シナリオが含まれている
- [x] Phase 1/2の区別が明確
- [x] テスト仕様が具体的

---

**このドキュメントを読了したら、INDEX_ドキュメント構成.md に戻り、次のドキュメントに進んでください。**