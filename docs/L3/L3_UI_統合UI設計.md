# L3_UI_統合UI設計

**作成日**: 2025年11月23日  
**カテゴリ**: 第3層 - 統合設計  
**バージョン**: 2.0

---

## 📖 このドキュメントについて

このドキュメントは、**3つのセクション（通い・泊まり・訪問）を統合したUIの設計**を定義します。

### 対象読者

- UI/UX担当者
- フロントエンド実装担当者
- テスト担当者

### 読了後に理解できること

- アプリ全体のレイアウト構造
- セクション間のナビゲーション
- 共通UIコンポーネント
- タブ切り替えの実装方法
- 月別カレンダーの統合表示
- 印刷レイアウト

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
│ ヘッダー                                         │
│ [プロジェクトB] [設定] [ヘルプ]                  │
├─────────────────────────────────────────────────┤
│ ナビゲーション（タブ）                           │
│ [通い] [泊まり] [訪問] [統合表示]                │
├─────────────────────────────────────────────────┤
│ カレンダーヘッダー                               │
│ [◀] 2025年11月 [▶] [今月]                      │
├─────────────────────────────────────────────────┤
│ 日別サマリー（セクション別に表示）               │
│ 詳細は L3_UI_日別サマリー設計.md を参照         │
├─────────────────────────────────────────────────┤
│ メインコンテンツ                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │                                             │ │
│ │  セクション別コンテンツ                      │ │
│ │  - 通いセクション（グリッド）                │ │
│ │  - 泊まりセクション（グリッド）              │ │
│ │  - 訪問セクション（グリッド）                │ │
│ │  - 統合表示（3セクション同時表示）           │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ フッター                                         │
│ 最終保存: 2025-11-23 10:30                      │
└─────────────────────────────────────────────────┘
```

**日別サマリーについて**:
- 各タブ（通い・泊まり・訪問・全体）で異なる内容を表示
- 通いタブ: 通い人数・迎え人数・送り人数
- 泊まりタブ: 泊まり人数・介助量（重度・中度・軽度）
- 訪問タブ: 訪問回数
- 全体タブ: 3サービスの統合ビュー
- **詳細は L3_UI_日別サマリー設計.md を参照**


---

### 1.2 HTML構造

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>小規模多機能予定調整B</title>
  <link rel="stylesheet" href="css/common.css">
  <link rel="stylesheet" href="css/kayoi.css">
  <link rel="stylesheet" href="css/tomari.css">
  <link rel="stylesheet" href="css/houmon.css">
</head>
<body>
  <div id="app">
    <!-- ヘッダー -->
    <header class="app-header">
      <h1 class="app-title">小規模多機能予定調整B</h1>
      <div class="header-actions">
        <button id="settings-button" class="header-button">
          <span class="icon">⚙️</span>
          設定
        </button>
        <button id="help-button" class="header-button">
          <span class="icon">❓</span>
          ヘルプ
        </button>
      </div>
    </header>

    <!-- ナビゲーション（タブ） -->
    <nav class="section-tabs">
      <button class="tab-button active" data-section="kayoi">
        通い
      </button>
      <button class="tab-button" data-section="tomari">
        泊まり
      </button>
      <button class="tab-button" data-section="houmon">
        訪問
      </button>
      <button class="tab-button" data-section="integrated">
        統合表示
      </button>
    </nav>

    <!-- カレンダーヘッダー（共通） -->
    <div class="calendar-header">
      <button id="prev-month" class="nav-button">◀</button>
      <h2 id="current-month">2025年11月</h2>
      <button id="next-month" class="nav-button">▶</button>
      <button id="today-button" class="nav-button">今月</button>
      <div class="header-right">
        <button id="print-button" class="action-button">
          <span class="icon">🖨️</span>
          印刷
        </button>
        <button id="export-button" class="action-button">
          <span class="icon">💾</span>
          エクスポート
        </button>
      </div>
    </div>

    <!-- 日別サマリー（セクション別） -->
    <!-- 詳細は L3_UI_日別サマリー設計.md を参照 -->
    <!-- 各セクションで異なる内容を表示 -->

    <!-- メインコンテンツ -->
    <main class="main-content">
      <!-- 通いセクション -->
      <section id="kayoi-section" class="section active">
        <div class="section-header">
          <h3>通い（デイサービス）</h3>
          <div class="capacity-summary">
            <span>定員: 前半 <span id="kayoi-morning-count">0</span>/15人、後半 <span id="kayoi-afternoon-count">0</span>/15人</span>
          </div>
        </div>
        <div class="section-content">
          <!-- 通いのグリッド（L2_通い_UI設計.mdで定義） -->
        </div>
      </section>

      <!-- 泊まりセクション -->
      <section id="tomari-section" class="section">
        <div class="section-header">
          <h3>泊まり（ショートステイ）</h3>
          <div class="capacity-summary">
            <span>定員: 9人/日</span>
          </div>
        </div>
        <div class="section-content">
          <!-- 泊まりのグリッド（L2_泊まり_UI設計.mdで定義） -->
        </div>
      </section>

      <!-- 訪問セクション -->
      <section id="houmon-section" class="section">
        <div class="section-header">
          <h3>訪問（訪問介護）</h3>
          <div class="capacity-summary">
            <span>職員リソース管理（Phase 2以降）</span>
          </div>
        </div>
        <div class="section-content">
          <!-- 訪問のグリッド（L2_訪問_UI設計.mdで定義） -->
        </div>
      </section>

      <!-- 統合表示セクション -->
      <section id="integrated-section" class="section">
        <div class="section-header">
          <h3>統合表示（全サービス）</h3>
        </div>
        <div class="section-content">
          <!-- 統合表示（後述） -->
        </div>
      </section>
    </main>

    <!-- フッター -->
    <footer class="app-footer">
      <div class="footer-left">
        <span id="last-saved">最終保存: --</span>
      </div>
      <div class="footer-right">
        <span>Version 1.0 (Phase 1)</span>
      </div>
    </footer>
  </div>

  <!-- モーダル・トースト等の共通コンポーネント -->
  <div id="modal-container"></div>
  <div id="toast-container"></div>

  <!-- JavaScript -->
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

---

## 2. タブナビゲーション

### 2.1 タブの切り替え

#### 動作

**タブをクリック** → 対応するセクションを表示、他のセクションを非表示

```javascript
// タブ切り替え処理
function initializeTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  const sections = document.querySelectorAll('.section');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 現在のアクティブタブ・セクションを非アクティブ化
      document.querySelector('.tab-button.active')?.classList.remove('active');
      document.querySelector('.section.active')?.classList.remove('active');
      
      // クリックされたタブをアクティブ化
      tab.classList.add('active');
      
      // 対応するセクションを表示
      const sectionId = tab.dataset.section;
      const section = document.getElementById(`${sectionId}-section`);
      section.classList.add('active');
      
      // セクション切り替え時のイベント発火
      dispatchSectionChangeEvent(sectionId);
    });
  });
}

function dispatchSectionChangeEvent(sectionId) {
  const event = new CustomEvent('sectionChanged', {
    detail: { sectionId }
  });
  document.dispatchEvent(event);
}
```

---

### 2.2 スタイル

```css
/* タブナビゲーション */
.section-tabs {
  display: flex;
  background-color: #f5f5f5;
  border-bottom: 2px solid #ddd;
  padding: 0;
  margin: 0;
}

.tab-button {
  flex: 1;
  padding: 12px 20px;
  background-color: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s ease;
}

.tab-button:hover {
  background-color: rgba(0, 123, 255, 0.05);
  color: #333;
}

.tab-button.active {
  background-color: white;
  border-bottom-color: #007bff;
  color: #007bff;
  font-weight: bold;
}

/* セクション表示制御 */
.section {
  display: none;
}

.section.active {
  display: block;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

### 2.3 キーボードショートカット（Phase 2以降）

| キー | 動作 |
|------|------|
| **Ctrl + 1** | 通いセクションに切り替え |
| **Ctrl + 2** | 泊まりセクションに切り替え |
| **Ctrl + 3** | 訪問セクションに切り替え |
| **Ctrl + 4** | 統合表示に切り替え |

```javascript
// Phase 2以降で実装
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey) {
    switch (e.key) {
      case '1':
        e.preventDefault();
        switchToSection('kayoi');
        break;
      case '2':
        e.preventDefault();
        switchToSection('tomari');
        break;
      case '3':
        e.preventDefault();
        switchToSection('houmon');
        break;
      case '4':
        e.preventDefault();
        switchToSection('integrated');
        break;
    }
  }
});
```

---

## 3. カレンダーヘッダー（共通）

### 3.1 月の切り替え

**すべてのセクションで共通のカレンダーヘッダーを使用**

```javascript
class CalendarController {
  constructor() {
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth() + 1;
    this.initializeControls();
  }
  
  initializeControls() {
    document.getElementById('prev-month').addEventListener('click', () => {
      this.changeMonth(-1);
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
      this.changeMonth(1);
    });
    
    document.getElementById('today-button').addEventListener('click', () => {
      this.goToCurrentMonth();
    });
  }
  
  changeMonth(delta) {
    this.currentMonth += delta;
    
    if (this.currentMonth < 1) {
      this.currentMonth = 12;
      this.currentYear--;
    } else if (this.currentMonth > 12) {
      this.currentMonth = 1;
      this.currentYear++;
    }
    
    this.updateDisplay();
    this.notifySections();
  }
  
  goToCurrentMonth() {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth() + 1;
    
    this.updateDisplay();
    this.notifySections();
  }
  
  updateDisplay() {
    const monthElement = document.getElementById('current-month');
    monthElement.textContent = `${this.currentYear}年${this.currentMonth}月`;
  }
  
  notifySections() {
    // すべてのセクションに通知
    const event = new CustomEvent('monthChanged', {
      detail: {
        year: this.currentYear,
        month: this.currentMonth
      }
    });
    document.dispatchEvent(event);
  }
}

// グローバルインスタンス
const calendarController = new CalendarController();
```

---

### 3.2 各セクションでの受信

```javascript
// 通いセクション
class KayoiSection {
  constructor() {
    // 月変更イベントをリッスン
    document.addEventListener('monthChanged', (e) => {
      const { year, month } = e.detail;
      this.renderMonth(year, month);
    });
  }
  
  renderMonth(year, month) {
    // 指定された年月の通い予定を表示
    console.log(`通いセクション: ${year}年${month}月を表示`);
    // ... グリッドを再描画
  }
}

// 泊まりセクション、訪問セクションも同様
```

---

## 4. 統合表示

### 4.1 概要

**統合表示**では、3つのセクション（通い・泊まり・訪問）の予定を**同時に**表示します。

#### 目的

- 利用者ごとに全サービスを一覧
- サービス間の調整を容易にする
- 全体像を把握する

---

### 4.2 表示形式

#### パターン1: 利用者軸（推奨）

**横軸**: 日付  
**縦軸**: 利用者  
**セル**: 各日の全サービスを表示

```
        1日  2日  3日  4日  5日
山田   通○  通○  泊   泊   泊
       訪朝  訪夕       退
       
田中   通○  通○  通○  通○  通○
       訪昼       訪夕
       
佐藤   泊   泊   泊   通○  通○
       入        退  訪朝
```

---

#### HTML構造

```html
<div class="integrated-view">
  <table class="integrated-grid">
    <thead>
      <tr>
        <th class="user-header">利用者</th>
        <th class="date-header" data-date="2025-11-01">
          <div class="date">1</div>
          <div class="day">月</div>
        </th>
        <!-- ...他の日付 -->
      </tr>
    </thead>
    <tbody>
      <tr data-user-id="user001">
        <td class="user-cell">山田</td>
        <td class="integrated-cell" data-user-id="user001" data-date="2025-11-01">
          <!-- 通い -->
          <div class="service-item kayoi">
            <span class="service-icon">通</span>
            <span class="service-detail">○</span>
          </div>
          <!-- 訪問 -->
          <div class="service-item houmon">
            <span class="service-icon">訪</span>
            <span class="service-detail">朝</span>
          </div>
        </td>
        <!-- ...他の日付 -->
      </tr>
      <!-- ...他の利用者 -->
    </tbody>
  </table>
</div>
```

---

#### スタイル

```css
.integrated-cell {
  min-height: 60px;
  padding: 4px;
  vertical-align: top;
}

.service-item {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 11px;
}

/* 通い */
.service-item.kayoi {
  background-color: #e3f2fd;
  color: #1976d2;
}

.service-item.kayoi .service-icon {
  font-weight: bold;
  margin-right: 4px;
}

/* 泊まり */
.service-item.tomari {
  background-color: #fff3e0;
  color: #f57c00;
}

.service-item.tomari .service-icon {
  font-weight: bold;
  margin-right: 4px;
}

/* 訪問 */
.service-item.houmon {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.service-item.houmon .service-icon {
  font-weight: bold;
  margin-right: 4px;
}
```

---

### 4.3 データの統合

```javascript
class IntegratedView {
  constructor(kayoiSection, tomariSection, houmonSection, masterData) {
    this.kayoiSection = kayoiSection;
    this.tomariSection = tomariSection;
    this.houmonSection = houmonSection;
    this.masterData = masterData;
  }
  
  /**
   * 統合表示のデータを生成
   */
  generateIntegratedData(year, month) {
    const users = this.masterData.getActiveUsers();
    const dates = this.getDateRange(year, month);
    const result = [];
    
    users.forEach(user => {
      const userRow = {
        userId: user.userId,
        userName: user.displayName,
        dates: {}
      };
      
      dates.forEach(date => {
        userRow.dates[date] = {
          kayoi: this.getKayoiData(user.userId, date),
          tomari: this.getTomariData(user.userId, date),
          houmon: this.getHoumonData(user.userId, date)
        };
      });
      
      result.push(userRow);
    });
    
    return result;
  }
  
  getKayoiData(userId, date) {
    const schedules = this.kayoiSection.getSchedulesForUser(userId, date);
    return schedules.map(s => ({
      type: 'kayoi',
      section: s.section,
      symbol: s.symbol
    }));
  }
  
  getTomariData(userId, date) {
    const reservations = this.tomariSection.getReservationsForUser(userId, date);
    return reservations.map(r => ({
      type: 'tomari',
      status: r.getStatusForDate(date) // "入所", "継続", "退所"
    }));
  }
  
  getHoumonData(userId, date) {
    const visits = this.houmonSection.getSchedulesForUser(userId, date);
    return visits.map(v => ({
      type: 'houmon',
      timeMode: v.timeMode,
      display: v.getTimeDisplayString()
    }));
  }
  
  /**
   * 統合表示をレンダリング
   */
  render(year, month) {
    const data = this.generateIntegratedData(year, month);
    const container = document.querySelector('#integrated-section .section-content');
    
    // グリッドを構築
    const html = this.buildGridHTML(data, year, month);
    container.innerHTML = html;
  }
  
  buildGridHTML(data, year, month) {
    // HTML生成処理（省略）
    // ...
  }
}
```

---

## 5. 共通UIコンポーネント

### 5.1 トースト通知

#### 実装

```javascript
class Toast {
  /**
   * トースト表示
   * @param {string} message - メッセージ
   * @param {string} type - 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration - 表示時間（ms）
   */
  static show(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // フェードイン
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // 自動で消す
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }
}

// 使用例
Toast.show('予定を追加しました', 'success');
Toast.show('定員を超えています', 'warning');
Toast.show('エラーが発生しました', 'error');
```

---

#### スタイル

```css
#toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  pointer-events: none;
}

.toast {
  padding: 12px 20px;
  margin-bottom: 10px;
  border-radius: 4px;
  background-color: #333;
  color: white;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0;
  transform: translateX(100px);
  transition: all 0.3s ease;
  pointer-events: auto;
}

.toast.show {
  opacity: 0.95;
  transform: translateX(0);
}

.toast.toast-success {
  background-color: #28a745;
}

.toast.toast-error {
  background-color: #dc3545;
}

.toast.toast-warning {
  background-color: #ffc107;
  color: #333;
}

.toast.toast-info {
  background-color: #17a2b8;
}
```

---

### 5.2 確認ダイアログ

#### 実装

```javascript
class ConfirmDialog {
  /**
   * 確認ダイアログを表示
   * @param {string} message - 確認メッセージ
   * @param {Function} onConfirm - 確認時のコールバック
   * @param {Function} onCancel - キャンセル時のコールバック
   */
  static show(message, onConfirm, onCancel = null) {
    const container = document.getElementById('modal-container');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-dialog confirm-dialog">
        <div class="modal-header">
          <h3>確認</h3>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary cancel-btn">キャンセル</button>
          <button class="btn-primary confirm-btn">OK</button>
        </div>
      </div>
    `;
    
    container.appendChild(modal);
    
    // イベントハンドラ
    modal.querySelector('.confirm-btn').addEventListener('click', () => {
      modal.remove();
      if (onConfirm) onConfirm();
    });
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
      modal.remove();
      if (onCancel) onCancel();
    });
    
    // 背景クリックで閉じる
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        if (onCancel) onCancel();
      }
    });
  }
}

// 使用例
ConfirmDialog.show(
  '本当に削除しますか？',
  () => {
    // 削除処理
    deleteSchedule(scheduleId);
  }
);
```

---

### 5.3 ローディング表示

#### 実装

```javascript
class Loading {
  static show(message = '読み込み中...') {
    const container = document.getElementById('modal-container');
    
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="loading-dialog">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
    
    container.appendChild(overlay);
  }
  
  static hide() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
}

// 使用例
Loading.show('データを読み込んでいます...');
setTimeout(() => {
  Loading.hide();
}, 2000);
```

---

#### スタイル

```css
.loading-dialog {
  background-color: white;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

---

## 6. 印刷レイアウト

### 6.1 印刷対応

**すべてのセクションで統一された印刷スタイル**

```css
@media print {
  /* ヘッダー・フッター・ナビゲーションを非表示 */
  .app-header,
  .section-tabs,
  .app-footer,
  .calendar-header .header-right {
    display: none !important;
  }
  
  /* カレンダーヘッダーは印刷 */
  .calendar-header {
    display: flex !important;
    justify-content: center;
    margin-bottom: 10px;
  }
  
  .calendar-header button {
    display: none;
  }
  
  .calendar-header #current-month {
    font-size: 18pt;
    margin: 0;
  }
  
  /* セクションは全て表示 */
  .section {
    display: block !important;
    page-break-after: always;
  }
  
  .section:last-child {
    page-break-after: auto;
  }
  
  /* グリッドの最適化 */
  .schedule-grid {
    font-size: 9pt;
    width: 100%;
  }
  
  .schedule-cell {
    padding: 2px;
    font-size: 8pt;
  }
  
  /* 改ページを防ぐ */
  .schedule-grid tr {
    page-break-inside: avoid;
  }
  
  /* 色分けを白黒印刷でも見やすく */
  .schedule-cell {
    border: 1px solid #333 !important;
  }
  
  /* 背景色を薄く */
  .service-item {
    background-color: transparent !important;
    border: 1px solid #999 !important;
  }
}
```

---

### 6.2 印刷プレビュー

```javascript
document.getElementById('print-button').addEventListener('click', () => {
  // 印刷前の準備
  prepareForPrint();
  
  // 印刷ダイアログを開く
  window.print();
  
  // 印刷後の後処理
  restoreAfterPrint();
});

function prepareForPrint() {
  // すべてのセクションを一時的に表示
  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('print-visible');
  });
}

function restoreAfterPrint() {
  // 元の表示状態に戻す
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('print-visible');
  });
}
```

---

## 7. レスポンシブ対応

### 7.1 ブレークポイント

```css
/* デスクトップ（1366px以上） */
@media (min-width: 1366px) {
  .main-content {
    padding: 20px;
  }
  
  .schedule-grid {
    font-size: 14px;
  }
}

/* タブレット（768px - 1365px） */
@media (max-width: 1365px) {
  .app-header {
    padding: 10px;
  }
  
  .section-tabs {
    flex-wrap: wrap;
  }
  
  .tab-button {
    font-size: 14px;
    padding: 10px 15px;
  }
  
  .schedule-grid {
    font-size: 12px;
  }
}

/* スマートフォン（767px以下） */
@media (max-width: 767px) {
  .app-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    margin-top: 10px;
  }
  
  .section-tabs {
    flex-direction: column;
  }
  
  .tab-button {
    width: 100%;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }
  
  .calendar-header {
    flex-direction: column;
  }
  
  .header-right {
    margin-top: 10px;
  }
  
  /* グリッドは横スクロール */
  .section-content {
    overflow-x: auto;
  }
  
  .schedule-grid {
    min-width: 800px;
  }
}
```

**Phase 1ではデスクトップ優先** - スマホ対応は Phase 2以降

---

## 8. アクセシビリティ

### 8.1 キーボードナビゲーション

```javascript
// タブキーでフォーカス移動
document.addEventListener('keydown', (e) => {
  // Tabキーでタブ間を移動
  if (e.key === 'Tab') {
    // デフォルトのフォーカス移動
  }
  
  // Enterキーでタブ切り替え
  if (e.key === 'Enter' && e.target.classList.contains('tab-button')) {
    e.target.click();
  }
});
```

---

### 8.2 ARIA属性

```html
<!-- タブナビゲーション -->
<nav class="section-tabs" role="tablist">
  <button class="tab-button active" 
          role="tab"
          aria-selected="true"
          aria-controls="kayoi-section"
          data-section="kayoi">
    通い
  </button>
  <button class="tab-button" 
          role="tab"
          aria-selected="false"
          aria-controls="tomari-section"
          data-section="tomari">
    泊まり
  </button>
  <!-- ... -->
</nav>

<!-- セクション -->
<section id="kayoi-section" 
         class="section active" 
         role="tabpanel"
         aria-labelledby="kayoi-tab">
  <!-- ... -->
</section>
```

**Phase 1では優先度低** - Phase 2以降で完全対応

---

## 9. データ自動保存

### 9.1 自動保存の実装

```javascript
class AutoSave {
  constructor(interval = 30000) { // 30秒ごと
    this.interval = interval;
    this.isDirty = false;
    this.timer = null;
    this.initializeListeners();
    this.startAutoSave();
  }
  
  initializeListeners() {
    // データ変更イベントをリッスン
    document.addEventListener('kayoi:scheduleAdded', () => {
      this.markDirty();
    });
    
    document.addEventListener('kayoi:scheduleUpdated', () => {
      this.markDirty();
    });
    
    document.addEventListener('kayoi:scheduleDeleted', () => {
      this.markDirty();
    });
    
    // 泊まり・訪問も同様
  }
  
  markDirty() {
    this.isDirty = true;
  }
  
  startAutoSave() {
    this.timer = setInterval(() => {
      if (this.isDirty) {
        this.save();
      }
    }, this.interval);
  }
  
  async save() {
    try {
      // すべてのセクションのデータを保存
      await Promise.all([
        kayoiSection.save(),
        tomariSection.save(),
        houmonSection.save()
      ]);
      
      this.isDirty = false;
      this.updateLastSavedTime();
      
      console.log('自動保存完了');
    } catch (error) {
      console.error('自動保存エラー:', error);
      Toast.show('保存に失敗しました', 'error');
    }
  }
  
  updateLastSavedTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    document.getElementById('last-saved').textContent = 
      `最終保存: ${timeStr}`;
  }
  
  stopAutoSave() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}

// グローバルインスタンス
const autoSave = new AutoSave(30000); // 30秒ごと
```

---

## 10. エクスポート機能

### 10.1 CSV/Excelエクスポート

```javascript
class DataExporter {
  /**
   * すべてのデータをJSON形式でエクスポート
   */
  static exportJSON() {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      users: masterData.users.map(u => u.toJSON()),
      staff: masterData.staff.map(s => s.toJSON()),
      rooms: masterData.rooms.map(r => r.toJSON()),
      kayoiSchedules: kayoiSection.schedules.map(s => s.toJSON()),
      tomariReservations: tomariSection.reservations.map(r => r.toJSON()),
      houmonSchedules: houmonSection.schedules.map(s => s.toJSON())
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-b-data_${this.getDateString()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }
  
  /**
   * CSVエクスポート（Phase 2以降）
   */
  static exportCSV(sectionName) {
    // CSV形式に変換してダウンロード
    // ...
  }
  
  static getDateString() {
    const now = new Date();
    return now.toISOString().split('T')[0].replace(/-/g, '');
  }
}

// エクスポートボタン
document.getElementById('export-button').addEventListener('click', () => {
  DataExporter.exportJSON();
  Toast.show('データをエクスポートしました', 'success');
});
```

---

## 11. まとめ

### 11.1 このドキュメントで定義したこと

```
✅ 定義したこと
├─ 全体レイアウト（ヘッダー、タブ、メイン、フッター）
├─ タブナビゲーション（切り替え、スタイル、キーボード）
├─ カレンダーヘッダー（共通コントローラー）
├─ 統合表示（3セクション同時表示）
├─ 共通UIコンポーネント（トースト、ダイアログ、ローディング）
├─ 印刷レイアウト（統一スタイル）
├─ レスポンシブ対応（ブレークポイント）
├─ アクセシビリティ（ARIA属性、キーボード）
├─ データ自動保存（30秒ごと）
└─ エクスポート機能（JSON）
```

---

### 11.2 重要なポイント

1. **タブ切り替え**: セクション独立性を保ちながらUI統合
2. **共通カレンダー**: すべてのセクションで月を同期
3. **統合表示**: 利用者ごとに全サービスを一覧
4. **イベント駆動**: セクション間の疎結合を維持
5. **自動保存**: データ損失を防ぐ

---

### 11.3 Phase 1で実装すること

```
✅ Phase 1
├─ タブナビゲーション
├─ カレンダーヘッダー（共通）
├─ トースト通知
├─ 確認ダイアログ
├─ 印刷レイアウト
└─ 自動保存

⏭️ Phase 2以降
├─ 統合表示（利用者軸）
├─ キーボードショートカット
├─ 完全なアクセシビリティ対応
├─ スマートフォン対応
└─ CSVエクスポート
```

---

### 11.4 次のステップ

統合UI設計が完成しました。

**次に作成すべきドキュメント**:
- 実装フェーズ（Phase 1の具体的な実装）
- テスト仕様書

**実装の順序**:
1. 共通部分（MasterDataManager, Toast, Dialog等）
2. カレンダーヘッダー
3. タブナビゲーション
4. 各セクションの統合

---

## 8. 設定画面（利用者マスタ管理）

### 8.1 概要

**Phase 2で実装**する設定画面の仕様です。Phase 1では算定基礎CSV取り込みを優先し、手動での利用者登録はPhase 2以降とします。

---

### 8.2 利用者マスタ管理画面

#### 画面レイアウト

```
┌─────────────────────────────────────────────────────┐
│ 設定                                                 │
├─────────────────────────────────────────────────────┤
│ [利用者マスタ] [職員マスタ] [居室マスタ]            │
├─────────────────────────────────────────────────────┤
│ 利用者マスタ管理                                     │
│                                                     │
│ [+ 新規登録] [CSV取り込み] [エクスポート]           │
│                                                     │
│ 🔍 検索: [____________] 表示: [すべて▼] 並び: [登録順▼]│
│                                                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ user001 山田太郎 (やまだたろう) 要介2         │ │
│ │ 登録日: 2025-11-23                            │ │
│ │                                               │ │
│ │ 📅 週間利用パターン                           │ │
│ │ ┌───┬───┬───┬───┬───┬───┬───┐ │ │
│ │ │月 │火 │水 │木 │金 │土 │日 │ │ │
│ │ ├───┼───┼───┼───┼───┼───┼───┤ │ │
│ │ │通 ○│   │通 ○│   │通 ○│   │   │ 通い │
│ │ │   │訪 1│   │訪 1│   │訪 1│訪 1│ 訪問 │
│ │ │   │   │   │   │泊 ●│泊 ●│泊 ●│ 泊まり│
│ │ └───┴───┴───┴───┴───┴───┴───┘ │ │
│ │                                               │ │
│ │ 📄 備考: 送迎必須、車椅子利用                 │ │
│ │                                               │ │
│ │ [編集] [削除] [📆 月間予定に展開]             │ │
│ ├───────────────────────────────────────┤ │
│ │ user002 佐藤花子 (さとうはなこ) 要介1        │ │
│ │ ...                                           │ │
│ └─────────────────────────────────────────┘ │
│                                                     │
│ 登録数: 10/29人                                     │
└─────────────────────────────────────────────────────┘
```

---

### 8.3 CSV取り込みフロー

#### 取り込みプレビュー画面

```
┌─────────────────────────────────────────────────────┐
│ 算定基礎CSV取り込みプレビュー                        │
├─────────────────────────────────────────────────────┤
│ 📄 読み込みファイル: santei_2025_11.csv (5件)       │
│                                                     │
│ ⚠️ 以下の利用者を取り込みますか？                   │
│                                                     │
│ ┌─┬────┬──────┬──────┬───────────────┐ │
│ │✓│氏名  │介護度│重複  │週間パターン      │ │
│ ├─┼────┼──────┼──────┼───────────────┤ │
│ │☑│山田太郎│要介2 │      │月水金:通い 火木:訪問│ │
│ │☑│佐藤花子│要介1 │      │火木土:通い       │ │
│ │☐│田中一郎│要介3 │🔴重複│金土日:泊まり     │ │
│ │☐│鈴木次郎│要介2 │🔴重複│月水:通い 火木:訪問│ │
│ │☑│高橋美咲│要介1 │      │月火水木金:通い   │ │
│ └─┴────┴──────┴──────┴───────────────┘ │
│                                                     │
│ ℹ️ 氏名が既存の利用者と重複しています。             │
│ 重複する利用者は初期状態で選択解除されています。    │
│                                                     │
│ [✓すべて選択] [✓重複以外を選択] [すべて解除]       │
│                                                     │
│ [キャンセル]           [取り込み (3名選択中)]        │
└─────────────────────────────────────────────────────┘
```

---

### 8.4 週間パターン表示コンポーネント

#### HTML構造

```html
<div class="weekly-pattern">
  <div class="pattern-header">
    <span>月</span>
    <span>火</span>
    <span>水</span>
    <span>木</span>
    <span>金</span>
    <span>土</span>
    <span>日</span>
  </div>
  
  <!-- 通い行 -->
  <div class="pattern-row day-row">
    <span class="day-cell active">○</span>
    <span class="day-cell"></span>
    <span class="day-cell active">○</span>
    <span class="day-cell"></span>
    <span class="day-cell active">○</span>
    <span class="day-cell"></span>
    <span class="day-cell"></span>
    <label class="row-label">通い</label>
  </div>
  
  <!-- 訪問行 -->
  <div class="pattern-row visit-row">
    <span class="visit-cell"></span>
    <span class="visit-cell active">1</span>
    <span class="visit-cell"></span>
    <span class="visit-cell active">1</span>
    <span class="visit-cell"></span>
    <span class="visit-cell active">1</span>
    <span class="visit-cell active">1</span>
    <label class="row-label">訪問</label>
  </div>
  
  <!-- 泊まり行 -->
  <div class="pattern-row stay-row">
    <span class="stay-cell"></span>
    <span class="stay-cell"></span>
    <span class="stay-cell"></span>
    <span class="stay-cell"></span>
    <span class="stay-cell active">●</span>
    <span class="stay-cell active">●</span>
    <span class="stay-cell active">●</span>
    <label class="row-label">泊まり</label>
  </div>
</div>
```

---

#### CSS

```css
.weekly-pattern {
  display: grid;
  grid-template-columns: repeat(7, 1fr) auto;
  gap: 2px;
  max-width: 500px;
  margin: 12px 0;
}

.pattern-header {
  display: contents;
}

.pattern-header span {
  text-align: center;
  font-weight: bold;
  font-size: 0.9em;
  padding: 4px;
  background-color: #f5f5f5;
}

.pattern-row {
  display: contents;
}

.day-cell,
.visit-cell,
.stay-cell {
  text-align: center;
  padding: 8px;
  border: 1px solid #ddd;
  background-color: #fff;
}

.day-cell.active {
  background-color: var(--color-kayoi-light);
  color: var(--color-kayoi);
  font-weight: bold;
}

.visit-cell.active {
  background-color: var(--color-houmon-light);
  color: var(--color-houmon);
  font-weight: bold;
}

.stay-cell.active {
  background-color: var(--color-tomari-light);
  color: var(--color-tomari);
  font-weight: bold;
}

.row-label {
  padding: 8px 12px;
  font-size: 0.9em;
  color: #666;
  text-align: right;
}
```

---

### 8.5 月間予定展開ボタン

#### 動作仕様

```javascript
/**
 * 月間予定展開ボタンのクリックハンドラ
 */
document.getElementById('expand-to-monthly-btn').addEventListener('click', async () => {
  const user = getCurrentUser();
  const yearMonth = getCurrentYearMonth();
  
  if (!user.weeklyPattern) {
    Toast.show('週間パターンが設定されていません', 'warning');
    return;
  }
  
  // 確認ダイアログ
  const confirmed = await showConfirmDialog(
    `${yearMonth}の月間予定に展開しますか？`,
    '既存の予定は備考を保持したまま上書きされます。'
  );
  
  if (!confirmed) return;
  
  try {
    Loading.show('展開中...');
    
    // 週間パターンを月間予定に展開
    await WeeklyPatternExpander.expandToMonthly(user, yearMonth);
    
    Loading.hide();
    Toast.show('月間予定に展開しました', 'success');
    
    // カレンダー画面に移動
    navigateTo('kayoi');
    
  } catch (error) {
    Loading.hide();
    Toast.show('展開に失敗しました: ' + error.message, 'error');
  }
});
```

---

### 8.6 重複チェックロジック

```javascript
/**
 * 氏名ベースで重複をチェック
 */
class DuplicateChecker {
  /**
   * 重複チェック
   */
  static checkDuplicates(newUsers, existingUsers) {
    const duplicates = [];
    
    for (const newUser of newUsers) {
      const isDup = existingUsers.some(
        existing => existing.name === newUser.name
      );
      
      if (isDup) {
        duplicates.push(newUser.name);
      }
    }
    
    return duplicates;
  }
  
  /**
   * プレビュー表示用にマーク
   */
  static markDuplicates(previewList, duplicateNames) {
    return previewList.map(item => ({
      ...item,
      isDuplicate: duplicateNames.includes(item.name),
      checked: !duplicateNames.includes(item.name)  // 重複は初期チェック解除
    }));
  }
}
```

---

### 8.7 実装優先度

| 機能 | Phase | 優先度 |
|------|-------|--------|
| CSV取り込みプレビュー | Phase 1 | ⭐⭐⭐ 高 |
| 重複チェック（氏名ベース） | Phase 1 | ⭐⭐⭐ 高 |
| 利用者マスタ一覧表示 | Phase 1 | ⭐⭐⭐ 高 |
| 週間パターン表示 | Phase 1 | ⭐⭐⭐ 高 |
| 月間予定展開ボタン | Phase 1 | ⭐⭐⭐ 高 |
| 利用者手動登録 | Phase 2 | ⭐⭐ 中 |
| 利用者編集・削除 | Phase 2 | ⭐⭐ 中 |
| フリガナ自動変換 | Phase 2 | ⭐ 低 |

---

## 9. まとめ

---

## 📚 次に読むべきドキュメント

このドキュメントを読了したら、以下のドキュメントに進んでください。

### 関連ドキュメント

- **L2_通い_UI設計.md** - 通いセクションの詳細UI
- **L2_泊まり_UI設計.md** - 泊まりセクションの詳細UI
- **L2_訪問_UI設計.md** - 訪問セクションの詳細UI
- **L1_技術_技術仕様.md** - 技術スタック、アーキテクチャ

---

## 📝 参考資料

- L1_技術_実装制約.md（UI/UX規約、アニメーション規約）
- L1_技術_技術仕様.md（ディレクトリ構造、モジュール設計）

---

## 📅 更新履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|----------|---------|------|
| 2025-11-23 | 1.0 | 初版作成 | Claude |
| 2025-11-27 | 2.0 | 日別サマリーを画面構成に追加 | Claude |

---

**最終更新**: 2025年11月27日  
**次回更新予定**: Phase 1実装中のフィードバック反映時

---

## ⚠️ 設計チェックリスト

このドキュメントの品質チェック：

- [x] すべてのインタラクションが具体的に記述されている
- [x] タブ切り替えの動作が明確
- [x] 共通コンポーネントの実装方法が具体的
- [x] 印刷レイアウトが定義されている
- [x] レスポンシブ対応が考慮されている
- [x] アクセシビリティが考慮されている
- [x] セクション独立性が保たれている
- [x] イベント駆動の設計が明確

---

**このドキュメントを読了したら、INDEX_ドキュメント構成.md に戻り、実装フェーズに進んでください。**