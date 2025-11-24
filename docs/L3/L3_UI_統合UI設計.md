# L3_UI_統合UI設計

**作成日**: 2025年11月23日  
**カテゴリ**: 第3層 - 統合設計  
**バージョン**: 2.1

---

## 📖 このドキュメントについて

このドキュメントは、**3つのセクション（通い・泊まり・訪問）を統合したUIの設計**を定義します。

### 対象読者

- UI/UX担当者
- フロントエンド実装担当者
- テスト担当者

### 読了後に理解できること

- アプリ全体のレイアウト構造
- 日別サマリーの配置と役割
- カレンダー見出しのsticky固定
- 垂直対応の実装方法
- タブによるジャンプ機能
- 画面幅に収まる設計
- 3セクションの縦並び配置

### 設計の前提

- **L2_通い_UI設計.md** の通いセクションUI
- **L2_泊まり_UI設計.md** の泊まりセクションUI
- **L2_訪問_UI設計.md** の訪問セクションUI
- **L1_技術_実装制約.md** のUI/UX規約

---

## 1. 全体レイアウト

### 1.1 画面構成

```
┌─────────────────────────────────────────────────┐
│ 統合ヘッダー（60px）                             │
│ 小規模多機能予定調整B  [◀] 2025年11月 [▶] [今月] │
│                    [🖨️印刷] [💾CSV] [⚙️] [❓]    │
├─────────────────────────────────────────────────┤
│ タブナビゲーション（40px）                       │
│ [全体] [通い] [泊まり] [訪問]  ← コンパクト     │
├═════════════════════════════════════════════════┤
│ ┌─日別サマリー（全セクション情報集約）────┐ │ ← スクロールで消える
│ │        1日  2日  3日  4日  5日 ... 30日│ │
│ │ 通い   13   15   12   14   13  ...  11 │ │ ← max(前半,後半)
│ │ 泊まり  8    7    9    8    7  ...   9 │ │
│ │ 訪問   12   15   10   11   13  ...  14 │ │
│ │ 介助量 ●●○ ●●● ●○○ ●●○ ...│ │
│ └──────────────────────────────────────┘ │
├═════════════════════════════════════════════════┤
│ ┌─カレンダー見出し（sticky固定）────────┐ │ ← 常に表示
│ │        1日  2日  3日  4日  5日 ... 30日│ │
│ │        月  火  水  木  金           │ │
│ └──────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ ↓ 以下、縦スクロール                           │
├─────────────────────────────────────────────────┤
│ ┌─通いセクション────────────────────┐ │
│ │ 安藤    ○   ◓   -   ○   ◓  ...  - │ │
│ │ 田中    ◓   ○   ◒   -   ○  ...  ◓ │ │
│ │ 佐藤    -   ○   ○   ◓   -  ...  ○ │ │
│ │ ...     ↓縦スクロール                │ │
│ └──────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ ┌─泊まりセクション──────────────────┐ │
│ │ 居室1   ■■■ ■■■ -   ■■■ ... │ │
│ │ 居室2   ■■■ -   ■■■ ■■■ ... │ │
│ │ 居室3   -   ■■■ ■■■ -   ... │ │
│ │ ...     ↓縦スクロール                │ │
│ └──────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ ┌─訪問セクション────────────────────┐ │
│ │ 朝       3    2    4    3    5  ...   4│ │
│ │ 昼       5    6    3    5    4  ...   6│ │
│ │ 夕       2    3    2    4    3  ...   3│ │
│ │ ...     ↓縦スクロール                │ │
│ └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**省スペース設計**:
- 統合ヘッダー: 60px（ヘッダー+カレンダー操作を統合）
- コンパクトタブ: 40px（各タブ50-80px幅）
- 合計100px → 従来の120-140pxから削減

---

### 1.2 重要な設計原則

#### 原則1: 垂直対応（列の統一）

**すべての日付列が垂直に揃っている**

```
日別サマリーの「1日」列
    ↓
カレンダー見出しの「1日」列
    ↓
通いセクションの「1日」列
    ↓
泊まりセクションの「1日」列
    ↓
訪問セクションの「1日」列
```

→ **1日の状況が一目で分かる**

---

#### 原則2: 画面幅に収まる

- **横スクロールなし**
- 日付列（30-31列）が画面幅に収まるように動的計算
- 最小幅40px、最大幅60pxで調整

---

#### 原則3: カレンダー見出しの固定表示

- **position: sticky**
- スクロールしても常に見える
- 日別サマリーは上にスクロールアウトするが、見出しは残る

---

#### 原則4: セクション独立性

- 通い・泊まり・訪問は独立したコンポーネント
- 各セクションは個別に開発・テスト可能
- 共通インターフェースで統合

---

## 2. HTML構造

### 2.1 全体構造

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>小規模多機能予定調整B</title>
  <link rel="stylesheet" href="css/common.css">
  <link rel="stylesheet" href="css/integration.css">
  <link rel="stylesheet" href="css/kayoi.css">
  <link rel="stylesheet" href="css/tomari.css">
  <link rel="stylesheet" href="css/houmon.css">
</head>
<body>
  <div id="app">
    <!-- 統合ヘッダー（カレンダー操作含む） -->
    <header class="unified-header">
      <div class="header-left">
        <h1 class="app-title">小規模多機能予定調整B</h1>
        <div class="calendar-controls">
          <button id="prev-month" class="nav-button">◀</button>
          <h2 id="current-month">2025年11月</h2>
          <button id="next-month" class="nav-button">▶</button>
          <button id="today-button" class="nav-button">今月</button>
        </div>
      </div>
      <div class="header-right">
        <button id="print-button" class="header-button">🖨️ 印刷</button>
        <button id="export-button" class="header-button">💾 CSV</button>
        <button id="settings-button" class="header-button">⚙️</button>
        <button id="help-button" class="header-button">❓</button>
      </div>
    </header>

    <!-- タブナビゲーション（コンパクト） -->
    <nav class="section-tabs compact">
      <button class="tab-button active" data-target="summary">全体</button>
      <button class="tab-button" data-target="kayoi-section">通い</button>
      <button class="tab-button" data-target="tomari-section">泊まり</button>
      <button class="tab-button" data-target="houmon-section">訪問</button>
    </nav>

    <!-- メインコンテンツ -->
    <main class="main-content">
      <!-- 日別サマリー -->
      <section id="summary" class="daily-summary">
        <table class="summary-table">
          <tbody>
            <tr class="summary-row">
              <td class="summary-label">通い</td>
              <!-- 日付ごとのセル（30-31個） -->
              <!-- max(前半, 後半)の値を表示 -->
              <td class="summary-cell" data-date="2025-11-01" data-morning="12" data-afternoon="13">13</td>
              <td class="summary-cell" data-date="2025-11-02" data-morning="14" data-afternoon="15">15</td>
              <!-- ... -->
            </tr>
            <tr class="summary-row">
              <td class="summary-label">泊まり</td>
              <td class="summary-cell" data-date="2025-11-01">8</td>
              <td class="summary-cell" data-date="2025-11-02">7</td>
              <!-- ... -->
            </tr>
            <tr class="summary-row">
              <td class="summary-label">訪問</td>
              <td class="summary-cell" data-date="2025-11-01">12</td>
              <td class="summary-cell" data-date="2025-11-02">15</td>
              <!-- ... -->
            </tr>
            <tr class="summary-row care-level-row">
              <td class="summary-label">介助量</td>
              <td class="summary-cell" data-date="2025-11-01">
                <span class="care-icon heavy">●</span>
                <span class="care-icon heavy">●</span>
                <span class="care-icon light">○</span>
              </td>
              <td class="summary-cell" data-date="2025-11-02">
                <span class="care-icon heavy">●</span>
                <span class="care-icon heavy">●</span>
                <span class="care-icon heavy">●</span>
              </td>
              <!-- ... -->
            </tr>
          </tbody>
        </table>
      </section>

      <!-- カレンダー見出し（sticky固定） -->
      <div class="calendar-header-sticky">
        <table class="header-table">
          <thead>
            <tr>
              <th class="date-label-cell"></th>
              <!-- 日付ごとのヘッダー（30-31個） -->
              <th class="date-header" data-date="2025-11-01">
                <div class="date">1</div>
                <div class="day monday">月</div>
              </th>
              <th class="date-header" data-date="2025-11-02">
                <div class="date">2</div>
                <div class="day tuesday">火</div>
              </th>
              <!-- ... -->
            </tr>
          </thead>
        </table>
      </div>

      <!-- 通いセクション -->
      <section id="kayoi-section" class="section kayoi-section">
        <h3 class="section-title">通い（デイサービス）</h3>
        <div class="section-content">
          <!-- L2_通い_UI設計.mdで定義されたグリッド -->
          <table class="schedule-grid">
            <tbody>
              <tr data-user-id="user001">
                <td class="user-cell">安藤</td>
                <td class="schedule-cell" data-date="2025-11-01">○</td>
                <td class="schedule-cell" data-date="2025-11-02">◓</td>
                <!-- ... -->
              </tr>
              <!-- ... -->
            </tbody>
          </table>
        </div>
      </section>

      <!-- 泊まりセクション -->
      <section id="tomari-section" class="section tomari-section">
        <h3 class="section-title">泊まり（ショートステイ）</h3>
        <div class="section-content">
          <!-- L2_泊まり_UI設計.mdで定義されたグリッド -->
          <table class="schedule-grid">
            <tbody>
              <tr data-room-id="room001">
                <td class="room-cell">居室1</td>
                <td class="stay-cell" data-date="2025-11-01">■■■</td>
                <td class="stay-cell" data-date="2025-11-02">■■■</td>
                <!-- ... -->
              </tr>
              <!-- ... -->
            </tbody>
          </table>
        </div>
      </section>

      <!-- 訪問セクション -->
      <section id="houmon-section" class="section houmon-section">
        <h3 class="section-title">訪問（訪問介護）</h3>
        <div class="section-content">
          <!-- L2_訪問_UI設計.mdで定義されたグリッド -->
          <table class="schedule-grid">
            <tbody>
              <tr data-timeslot="morning">
                <td class="timeslot-cell">朝</td>
                <td class="visit-cell" data-date="2025-11-01">3</td>
                <td class="visit-cell" data-date="2025-11-02">2</td>
                <!-- ... -->
              </tr>
              <!-- ... -->
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>

  <!-- トースト・モーダル -->
  <div id="toast-container"></div>
  <div id="modal-container"></div>

  <!-- JavaScript -->
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

---

## 3. CSS設計

### 3.0 統合ヘッダーとコンパクトタブ

```css
/* ========================================
   統合ヘッダー（60px）
   ======================================== */

.unified-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  background-color: #2c3e50;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 30px;
}

.app-title {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
  white-space: nowrap;
}

.calendar-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.calendar-controls #current-month {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  min-width: 120px;
  text-align: center;
}

.nav-button {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.nav-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-button {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.header-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* ========================================
   コンパクトタブ（40px）
   ======================================== */

.section-tabs.compact {
  display: flex;
  background-color: #ecf0f1;
  border-bottom: 2px solid #bdc3c7;
  padding: 0;
  margin: 0;
  height: 40px;
  position: sticky;
  top: 60px; /* 統合ヘッダーの下 */
  z-index: 999;
}

.section-tabs.compact .tab-button {
  flex: 0 0 auto; /* コンパクト：幅を自動調整 */
  min-width: 50px;
  max-width: 80px;
  padding: 8px 16px;
  background-color: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.section-tabs.compact .tab-button:hover {
  background-color: rgba(52, 152, 219, 0.1);
  color: #2c3e50;
}

.section-tabs.compact .tab-button.active {
  background-color: white;
  border-bottom-color: #3498db;
  color: #3498db;
  font-weight: bold;
}
```

---

### 3.1 垂直対応の実装

**重要**: すべてのテーブルで列幅を統一する

```css
/* ========================================
   列幅の統一設定（垂直対応の要）
   ======================================== */

:root {
  /* 日付列の幅を動的計算 */
  --date-column-width: calc((100vw - 150px) / 31); /* 画面幅から左端ラベル列を引いて31分割 */
  --date-column-min-width: 40px;
  --date-column-max-width: 60px;
  
  /* 実際の列幅（最小・最大の範囲内） */
  --column-width: clamp(
    var(--date-column-min-width),
    var(--date-column-width),
    var(--date-column-max-width)
  );
  
  /* 左端ラベル列の幅 */
  --label-column-width: 120px;
}

/* すべてのテーブルで共通の列幅を適用 */
.summary-table td:first-child,
.header-table th:first-child,
.schedule-grid td:first-child {
  width: var(--label-column-width);
  min-width: var(--label-column-width);
  max-width: var(--label-column-width);
}

.summary-table td:not(:first-child),
.header-table th:not(:first-child),
.schedule-grid td:not(:first-child) {
  width: var(--column-width);
  min-width: var(--column-width);
  max-width: var(--column-width);
}

/* テーブル共通設定 */
.summary-table,
.header-table,
.schedule-grid {
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
  table-layout: fixed; /* 重要: 列幅を固定 */
}
```

---

### 3.2 カレンダー見出しのsticky固定

```css
/* カレンダー見出しのsticky固定 */
.calendar-header-sticky {
  position: sticky;
  top: 100px; /* 統合ヘッダー60px + コンパクトタブ40px */
  z-index: 98; /* タブより下 */
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-table {
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
}

.date-header {
  background-color: #f5f5f5;
  text-align: center;
  padding: 8px 4px;
  border: 1px solid #ddd;
  vertical-align: middle;
}

.date-header .date {
  font-size: 16px;
  font-weight: bold;
  display: block;
}

.date-header .day {
  font-size: 12px;
  color: #666;
  display: block;
  margin-top: 2px;
}

/* 土曜日 */
.date-header .day.saturday {
  color: #0066cc;
}

/* 日曜日 */
.date-header .day.sunday {
  color: #cc0000;
}
```

---

### 3.3 日別サマリーのスタイル

```css
/* 日別サマリー */
.daily-summary {
  margin: 20px 0;
}

.summary-table {
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
}

.summary-row {
  border-bottom: 1px solid #e0e0e0;
}

.summary-label {
  background-color: #f5f5f5;
  font-weight: bold;
  text-align: right;
  padding: 8px 12px;
  border: 1px solid #ddd;
  width: var(--label-column-width);
}

.summary-cell {
  text-align: center;
  padding: 8px 4px;
  border: 1px solid #ddd;
  font-size: 14px;
  width: var(--column-width);
}

/* 定員状況の色分け */
.summary-cell.normal {
  background-color: transparent;
}

.summary-cell.warning {
  background-color: rgba(255, 255, 0, 0.2);
}

.summary-cell.full {
  background-color: rgba(255, 0, 0, 0.2);
  font-weight: bold;
}

/* 介助量アイコン */
.care-icon {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin: 0 1px;
  font-size: 10px;
}

.care-icon.heavy {
  background-color: #d32f2f;
  color: white;
}

.care-icon.medium {
  background-color: #ffa726;
  color: white;
}

.care-icon.light {
  background-color: #66bb6a;
  color: white;
}
```

---

### 3.4 セクションのスタイル

```css
/* セクション共通 */
.section {
  margin: 40px 0;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #007bff;
}

.section-content {
  overflow-x: visible; /* 横スクロールなし */
  overflow-y: visible; /* 縦スクロールなし（ページ全体でスクロール） */
}

/* 通いセクション */
.kayoi-section {
  border-left: 4px solid var(--color-kayoi, #4caf50);
}

/* 泊まりセクション */
.tomari-section {
  border-left: 4px solid var(--color-tomari, #ff9800);
}

/* 訪問セクション */
.houmon-section {
  border-left: 4px solid var(--color-houmon, #2196f3);
}
```

---

## 4. タブによるジャンプ機能

### 4.1 仕様

**タブをクリック** → 該当セクションにスムーススクロール

```
[全体表示] → 日別サマリーの位置にスクロール
[通いへ]   → 通いセクションの位置にスクロール
[泊まりへ] → 泊まりセクションの位置にスクロール
[訪問へ]   → 訪問セクションの位置にスクロール
```

---

### 4.2 JavaScript実装

```javascript
/**
 * タブによるジャンプ機能の初期化
 */
function initializeTabJump() {
  const tabs = document.querySelectorAll('.tab-button');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // すべてのタブのactiveクラスを削除
      tabs.forEach(t => t.classList.remove('active'));
      
      // クリックされたタブをアクティブ化
      tab.classList.add('active');
      
      // ターゲット要素を取得
      const targetId = tab.dataset.target;
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        // スムーススクロール
        const headerHeight = 100; // 統合ヘッダー60px + コンパクトタブ40px
        const stickyHeight = 60;   // sticky見出しの高さ
        const offsetTop = targetElement.offsetTop - headerHeight - stickyHeight;
        
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  initializeTabJump();
});
```

---

## 5. 画面幅に収まる設計

### 5.1 動的列幅の計算

```javascript
/**
 * 画面幅に応じて列幅を動的計算
 */
function calculateColumnWidth() {
  const screenWidth = window.innerWidth;
  const labelColumnWidth = 120;
  const scrollbarWidth = 20;
  const margin = 40;
  
  // 日付列の数（月によって28-31日）
  const currentMonth = new Date(2025, 10, 1); // 2025年11月
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  
  // 利用可能な幅
  const availableWidth = screenWidth - labelColumnWidth - scrollbarWidth - margin;
  
  // 1列あたりの幅
  let columnWidth = availableWidth / daysInMonth;
  
  // 最小・最大の範囲内に収める
  columnWidth = Math.max(40, Math.min(60, columnWidth));
  
  // CSS変数に設定
  document.documentElement.style.setProperty('--column-width', `${columnWidth}px`);
}

// 初期化とリサイズ時の再計算
window.addEventListener('DOMContentLoaded', calculateColumnWidth);
window.addEventListener('resize', calculateColumnWidth);
```

---

### 5.2 レスポンシブ対応

```css
/* デスクトップ（1366px以上） */
@media (min-width: 1366px) {
  :root {
    --label-column-width: 120px;
    --date-column-min-width: 40px;
    --date-column-max-width: 60px;
  }
}

/* タブレット（768px-1365px） */
@media (min-width: 768px) and (max-width: 1365px) {
  :root {
    --label-column-width: 100px;
    --date-column-min-width: 35px;
    --date-column-max-width: 50px;
  }
  
  .date-header .date {
    font-size: 14px;
  }
  
  .date-header .day {
    font-size: 11px;
  }
}

/* スマートフォン（767px以下） */
@media (max-width: 767px) {
  /* Phase 2以降で対応 */
  /* 横スクロールを許可 */
  .main-content {
    overflow-x: auto;
  }
  
  :root {
    --label-column-width: 80px;
    --date-column-min-width: 30px;
    --date-column-max-width: 40px;
  }
}
```

---

## 6. 日別サマリーのロジック

### 6.1 データ集計

```javascript
/**
 * 日別サマリーのデータを生成
 */
class DailySummaryGenerator {
  /**
   * 各セクションのデータから日別サマリーを生成
   */
  static generate(kayoiData, tomariData, houmonData, yearMonth) {
    const daysInMonth = this.getDaysInMonth(yearMonth);
    const summary = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;
      
      const kayoiMorning = this.countKayoi(kayoiData, dateStr, 'morning');
      const kayoiAfternoon = this.countKayoi(kayoiData, dateStr, 'afternoon');
      
      summary[dateStr] = {
        kayoiMorning: kayoiMorning,
        kayoiAfternoon: kayoiAfternoon,
        kayoiMax: Math.max(kayoiMorning, kayoiAfternoon), // 表示用：大きい方
        tomari: this.countTomari(tomariData, dateStr),
        houmon: this.countHoumon(houmonData, dateStr),
        careLevel: this.calculateCareLevel(tomariData, dateStr)
      };
    }
    
    return summary;
  }
  
  /**
   * 通いの人数をカウント
   */
  static countKayoi(kayoiData, date, section) {
    return kayoiData.filter(schedule => {
      return schedule.date === date && (
        schedule.section === section || schedule.section === 'allDay'
      );
    }).length;
  }
  
  /**
   * 泊まりの人数をカウント
   */
  static countTomari(tomariData, date) {
    return tomariData.filter(stay => {
      const startDate = stay.startDate;
      const endDate = stay.endDate;
      return date >= startDate && date <= endDate;
    }).length;
  }
  
  /**
   * 訪問の回数をカウント
   */
  static countHoumon(houmonData, date) {
    return houmonData.filter(visit => visit.date === date)
      .reduce((sum, visit) => sum + visit.count, 0);
  }
  
  /**
   * 介助量を計算
   */
  static calculateCareLevel(tomariData, date) {
    const staysOnDate = tomariData.filter(stay => {
      return date >= stay.startDate && date <= stay.endDate;
    });
    
    const careLevels = {
      heavy: 0,
      medium: 0,
      light: 0
    };
    
    staysOnDate.forEach(stay => {
      const level = stay.user.careLevel;
      if (level >= 4) {
        careLevels.heavy++;
      } else if (level >= 2) {
        careLevels.medium++;
      } else {
        careLevels.light++;
      }
    });
    
    return careLevels;
  }
  
  /**
   * 月の日数を取得
   */
  static getDaysInMonth(yearMonth) {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }
}
```

---

### 6.2 UIへの反映

```javascript
/**
 * 日別サマリーをUIに反映
 */
class DailySummaryRenderer {
  /**
   * サマリーを描画
   */
  static render(summary) {
    const tableBody = document.querySelector('.summary-table tbody');
    
    // 既存の内容をクリア
    tableBody.innerHTML = '';
    
    // 通いの行（max値を表示、data属性に前半・後半を保持）
    const kayoiRow = this.createKayoiRow(summary);
    tableBody.appendChild(kayoiRow);
    
    // 泊まりの行
    const tomariRow = this.createRow('泊まり', summary, 'tomari', 9);
    tableBody.appendChild(tomariRow);
    
    // 訪問の行
    const houmonRow = this.createRow('訪問', summary, 'houmon', null);
    tableBody.appendChild(houmonRow);
    
    // 介助量の行
    const careLevelRow = this.createCareLevelRow(summary);
    tableBody.appendChild(careLevelRow);
  }
  
  /**
   * 通いの行を作成（max値表示、data属性に詳細保持）
   */
  static createKayoiRow(summary) {
    const tr = document.createElement('tr');
    tr.className = 'summary-row';
    
    // ラベルセル
    const labelCell = document.createElement('td');
    labelCell.className = 'summary-label';
    labelCell.textContent = '通い';
    tr.appendChild(labelCell);
    
    // 日付ごとのセル
    Object.entries(summary).forEach(([date, data]) => {
      const cell = document.createElement('td');
      cell.className = 'summary-cell';
      cell.dataset.date = date;
      cell.dataset.morning = data.kayoiMorning;   // data属性に保持
      cell.dataset.afternoon = data.kayoiAfternoon; // data属性に保持
      cell.textContent = data.kayoiMax; // max値を表示
      
      // 定員状況の色分け（max値で判定）
      const ratio = data.kayoiMax / 15;
      if (ratio >= 1) {
        cell.classList.add('full');
      } else if (ratio >= 0.8) {
        cell.classList.add('warning');
      } else {
        cell.classList.add('normal');
      }
      
      tr.appendChild(cell);
    });
    
    return tr;
  }
  
  /**
   * 行を作成
   */
  static createRow(label, summary, key, capacity) {
    const tr = document.createElement('tr');
    tr.className = 'summary-row';
    
    // ラベルセル
    const labelCell = document.createElement('td');
    labelCell.className = 'summary-label';
    labelCell.textContent = label;
    tr.appendChild(labelCell);
    
    // 日付ごとのセル
    Object.entries(summary).forEach(([date, data]) => {
      const cell = document.createElement('td');
      cell.className = 'summary-cell';
      cell.dataset.date = date;
      cell.textContent = data[key];
      
      // 定員状況の色分け
      if (capacity) {
        const ratio = data[key] / capacity;
        if (ratio >= 1) {
          cell.classList.add('full');
        } else if (ratio >= 0.8) {
          cell.classList.add('warning');
        } else {
          cell.classList.add('normal');
        }
      }
      
      tr.appendChild(cell);
    });
    
    return tr;
  }
  
  /**
   * 介助量の行を作成
   */
  static createCareLevelRow(summary) {
    const tr = document.createElement('tr');
    tr.className = 'summary-row care-level-row';
    
    // ラベルセル
    const labelCell = document.createElement('td');
    labelCell.className = 'summary-label';
    labelCell.textContent = '介助量';
    tr.appendChild(labelCell);
    
    // 日付ごとのセル
    Object.entries(summary).forEach(([date, data]) => {
      const cell = document.createElement('td');
      cell.className = 'summary-cell';
      cell.dataset.date = date;
      
      const careLevel = data.careLevel;
      
      // 重度
      for (let i = 0; i < careLevel.heavy; i++) {
        const icon = document.createElement('span');
        icon.className = 'care-icon heavy';
        icon.textContent = '●';
        cell.appendChild(icon);
      }
      
      // 中度
      for (let i = 0; i < careLevel.medium; i++) {
        const icon = document.createElement('span');
        icon.className = 'care-icon medium';
        icon.textContent = '●';
        cell.appendChild(icon);
      }
      
      // 軽度
      for (let i = 0; i < careLevel.light; i++) {
        const icon = document.createElement('span');
        icon.className = 'care-icon light';
        icon.textContent = '○';
        cell.appendChild(icon);
      }
      
      tr.appendChild(cell);
    });
    
    return tr;
  }
}
```

---

## 7. 印刷レイアウト

### 7.1 印刷用CSS

```css
@media print {
  /* ヘッダー・タブ・フッターを非表示 */
  .app-header,
  .section-tabs,
  .calendar-controls,
  .app-footer {
    display: none;
  }
  
  /* 日別サマリーを印刷 */
  .daily-summary {
    page-break-inside: avoid;
    margin-bottom: 20px;
  }
  
  /* カレンダー見出しのsticky解除 */
  .calendar-header-sticky {
    position: static;
  }
  
  /* セクションを印刷 */
  .section {
    page-break-inside: avoid;
    margin: 20px 0;
    border: 2px solid #333;
  }
  
  /* 改ページを適切に */
  .section-title {
    page-break-after: avoid;
  }
  
  .section-content {
    page-break-before: avoid;
  }
  
  /* 文字サイズを調整 */
  body {
    font-size: 10pt;
  }
  
  .summary-cell,
  .schedule-cell {
    padding: 4px;
    font-size: 9pt;
  }
}
```

---

### 7.2 印刷範囲

**1ページ目**: 日別サマリー + カレンダー見出し
**2ページ目**: 通いセクション
**3ページ目**: 泊まりセクション
**4ページ目**: 訪問セクション

**推奨**: A4横向き

---

## 8. 実装の優先順位

### Phase 1（最優先）

```
✅ 必須実装
├─ HTML構造（日別サマリー、カレンダー見出し、3セクション）
├─ CSS（垂直対応、sticky固定、画面幅に収まる）
├─ タブジャンプ機能
├─ 日別サマリーのデータ集計
└─ 印刷レイアウト
```

### Phase 2以降

```
⏭️ 後回し
├─ スマートフォン対応（横スクロール許可）
├─ キーボードショートカット
├─ アクセシビリティ向上
└─ パフォーマンス最適化（仮想スクロール）
```

---

## 9. テスト仕様

### 9.1 垂直対応のテスト

**テストケース1**: 列幅の統一

```
1. ブラウザで表示
2. 日別サマリーの1日の列の左端位置を測定
3. カレンダー見出しの1日の列の左端位置を測定
4. 通いセクションの1日の列の左端位置を測定
5. 泊まりセクションの1日の列の左端位置を測定
6. 訪問セクションの1日の列の左端位置を測定

期待値: すべて同じ位置（垂直に揃っている）
```

---

### 9.2 sticky固定のテスト

**テストケース2**: スクロール時の見出し固定

```
1. ページを下にスクロール
2. 日別サマリーが画面外に消える
3. カレンダー見出しが画面上部に固定表示される

期待値: 見出しが常に表示され、日付が分かる
```

---

### 9.3 画面幅のテスト

**テストケース3**: 横スクロールなし

```
1. ブラウザ幅を1366pxに設定
2. 31日間の月を表示
3. 横スクロールバーが表示されないことを確認

期待値: すべての日付列が画面内に収まる
```

---

### 9.4 タブジャンプのテスト

**テストケース4**: スムーススクロール

```
1. [通いへ]タブをクリック
2. 通いセクションにスムーススクロール

期待値: 
- スクロールアニメーション（0.3秒）
- 通いセクションが画面内に表示
- カレンダー見出しは固定表示のまま
```

---

## 10. まとめ

### 10.1 このドキュメントで定義したこと

```
✅ 定義したこと
├─ 全体レイアウト（日別サマリー + 見出し + 3セクション）
├─ 垂直対応の実装方法（列幅の統一）
├─ カレンダー見出しのsticky固定
├─ タブによるジャンプ機能
├─ 画面幅に収まる設計（動的列幅計算）
├─ 日別サマリーのロジック（集計・描画）
├─ 印刷レイアウト
└─ テスト仕様
```

---

### 10.2 重要なポイント

1. **垂直対応が最重要** → すべての日付列が揃う
2. **sticky固定** → 常にカレンダー見出しが見える
3. **画面幅に収まる** → 横スクロールなし
4. **セクション独立性** → 各セクションは独立開発可能
5. **タブジャンプ** → 3セクション間を素早く移動

---

### 10.3 次のステップ

このドキュメントが確定したら、**L2の各セクション設計書を修正**します：

**修正が必要なドキュメント**:
1. **L2_通い_UI設計.md** - sticky固定、一人1行強調、NGパターン追加
2. **L2_泊まり_UI設計.md** - 介助量表示、sticky固定
3. **L2_訪問_UI設計.md** - sticky固定

---

## 📚 次に読むべきドキュメント

### 関連ドキュメント

- **L2_通い_UI設計.md** - 通いセクションの詳細UI
- **L2_泊まり_UI設計.md** - 泊まりセクションの詳細UI
- **L2_訪問_UI設計.md** - 訪問セクションの詳細UI
- **L1_技術_技術仕様.md** - 技術スタック、アーキテクチャ

---

## 📝 参考資料

- L1_技術_実装制約.md（UI/UX規約、アニメーション規約）
- L0_業務_調整業務の制約.md（業務的な制約の理解）

---

## 📅 更新履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|----------|---------|------|
| 2025-11-23 | 2.0 | 日別サマリー、sticky固定、垂直対応を追加 | Claude |
| 2025-11-23 | 2.1 | 統合ヘッダー、コンパクトタブ、通い1行表示 | Claude |

---

**最終更新**: 2025年11月23日  
**次回更新予定**: Phase 1実装中のフィードバック反映時

---

## ⚠️ 設計チェックリスト

このドキュメントの品質チェック：

- [x] 日別サマリーの配置と役割が明確
- [x] カレンダー見出しのsticky固定が実装可能
- [x] 垂直対応（列幅統一）の実装方法が具体的
- [x] 画面幅に収まる設計が実現可能
- [x] タブジャンプ機能が明確
- [x] セクション独立性が保たれている
- [x] テスト仕様が定義されている
- [x] 印刷レイアウトが考慮されている

---

**このドキュメントを読了したら、L2の各セクション設計書の修正に進んでください。**