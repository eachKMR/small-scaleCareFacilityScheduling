# L3_UI_統合UI設計

**作成日**: 2025年11月23日  
**カテゴリ**: 第3層 - 統合設計  
**バージョン**: 3.0  
**更新日**: 2025年11月29日

---

## 📖 このドキュメントについて

このドキュメントは、**3つのセクション（通い・泊まり・訪問）を統合したUIの設計**を定義します。

### v3.0での主要な変更

1. **画面構成の根本的な再設計**
   - カレンダーヘッダーを日別サマリーとメインコンテンツの間に配置
   - カレンダーヘッダーが「物差し」として機能
   
2. **カレンダーヘッダーの役割の明確化**
   - 日付・曜日の2行表示
   - 日別サマリーとメインコンテンツの縦軸基準
   - サンドイッチ配置による最適な視認性
   
3. **日別サマリーの修正**
   - 日付行を削除（3行のみ）
   - カレンダーヘッダーに日付表示を委譲
   
4. **ヘッダーの再構成**
   - 月切り替え、入出力、設定、ヘルプを統合
   - ナビゲーションタブは独立した行

5. **縦軸整列の設計要件（マスト）**
   - カレンダーヘッダー、日別サマリー、メインコンテンツの縦軸を完璧に揃える
   - CSS Grid Layoutによる実現

### 対象読者

- UI/UX担当者
- フロントエンド実装担当者
- テスト担当者

### 読了後に理解できること

- v3.0の画面構成（根本的な変更）
- カレンダーヘッダーの物差し機能
- 縦軸整列の設計方法
- サンドイッチ配置の意図
- 各セクションの責任分離

### 設計の前提

- **L2_通い_UI設計.md** の通いセクションUI
- **L2_泊まり_UI設計.md** の泊まりセクションUI
- **L2_訪問_UI設計.md** の訪問セクションUI
- **L1_技術_実装制約.md** のUI/UX規約
- **L0_業務_調整業務の制約.md** のリソース管理
- **L0_業務_居室管理の重要性.md** の夜勤負担度

---

## 1. 全体レイアウト（v3.0）

### 1.1 画面構成

```
┌─────────────────────────────────────────────────┐
│ ヘッダー                                         │
│ ◀ 2025年11月 ▶ [入出力][設定][ヘルプ]          │
├─────────────────────────────────────────────────┤
│ ナビゲーションタブ                               │
│ [全体★] [通い] [泊まり] [訪問]                  │
├─────────────────────────────────────────────────┤
│ 日別サマリー（sticky固定） ▼                    │
│ ┌─────────────────────────────────────────────┐ │
│ │通 12 15 10  8 12 14 15  9 11 13 12 10 ...   │ │
│ │泊  5  9  6  4  7  8  9  5  6  8  7  5 ...   │ │
│ │訪  8 12 10  6  9 11 15  7  8 10  9  7 ...   │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ カレンダーヘッダー（物差し・sticky固定）         │
│ ┌─────────────────────────────────────────────┐ │
│ │ 1  2  3  4  5  6  7  8  9 10 11 12 13 ...   │ │
│ │ 金 土 日 月 火 水 木 金 土 日 月 火 水 ...   │ │
│ └─────────────────────────────────────────────┘ │
│     ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓       │
├─────────────────────────────────────────────────┤
│ メインコンテンツ（スクロール可能）               │
│ ┌─────────────────────────────────────────────┐ │
│ │山田  ○  ○  ○  ○  ○  ○  ○  ○  ○ ...        │ │
│ │田中  ○     ○     ○     ○     ○ ...        │ │
│ │佐藤     ○     ○     ○     ○ ...           │ │
│ └─────────────────────────────────────────────┘ │
│     ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑  ↑       │
│     ← 縦軸が完璧に揃っている（マスト要件）       │
├─────────────────────────────────────────────────┤
│ フッター                                         │
│ 最終保存: 2025-11-29 14:30                      │
└─────────────────────────────────────────────────┘
```

**重要なポイント**:
1. **カレンダーヘッダーがサンドイッチ配置**（日別サマリーとメインコンテンツの間）
2. **日別サマリーは3行のみ**（日付行なし）
3. **縦軸が完璧に揃っている**（カレンダーヘッダーが物差し）
4. **日別サマリーとカレンダーヘッダーの両方がsticky固定**
5. **ヘッダーに月切り替えと入出力・設定・ヘルプが統合**

---

### 1.2 レイアウトの順序

```
上から順に:
1. ヘッダー
   ├─ 月切り替え（◀ 2025年11月 ▶）
   └─ 機能ボタン（入出力、設定、ヘルプ）

2. ナビゲーションタブ
   └─ 全体、通い、泊まり、訪問

3. 日別サマリー（sticky固定）
   ├─ 通い行（数値のみ）
   ├─ 泊まり行（数値のみ）
   └─ 訪問行（数値のみ）

4. カレンダーヘッダー（sticky固定・物差し機能）
   ├─ 日付行（1, 2, 3, ...）
   └─ 曜日行（金, 土, 日, ...）

5. メインコンテンツ（スクロール可能）
   └─ 各セクションのグリッド

6. フッター
   └─ 最終保存時刻等
```

---

## 2. カレンダーヘッダーの詳細設計（v3.0の核心）

### 2.1 カレンダーヘッダーの役割

**カレンダーヘッダーは「物差し」として機能する**

```
役割:
1. 日付・曜日の表示
   ├─ 日付行: 1, 2, 3, ..., 30, 31
   └─ 曜日行: 月, 火, 水, ...

2. 縦軸の基準
   ├─ 日別サマリーの各セルと縦軸を揃える
   └─ メインコンテンツの各セルと縦軸を揃える

3. サンドイッチ配置
   ├─ 日別サマリー（上）の縦軸基準
   ├─ メインコンテンツ（下）の縦軸基準
   └─ 両者を同時に揃える最適な位置
```

---

### 2.2 HTML構造

```html
<!-- カレンダーヘッダー（物差し機能） -->
<div class="calendar-header-ruler">
  <table class="calendar-ruler-table">
    <!-- 日付行 -->
    <tr class="date-row">
      <td class="label-cell"></td> <!-- 左端の空白 -->
      <td class="date-cell" data-date="2025-11-01">1</td>
      <td class="date-cell" data-date="2025-11-02">2</td>
      <td class="date-cell" data-date="2025-11-03">3</td>
      <!-- ...月末まで -->
    </tr>
    
    <!-- 曜日行 -->
    <tr class="weekday-row">
      <td class="label-cell"></td> <!-- 左端の空白 -->
      <td class="weekday-cell saturday">土</td>
      <td class="weekday-cell sunday">日</td>
      <td class="weekday-cell">月</td>
      <!-- ...月末まで -->
    </tr>
  </table>
</div>
```

---

### 2.3 スタイル（縦軸整列のための設計）

```css
/* カレンダーヘッダー（物差し） */
.calendar-header-ruler {
  position: sticky;
  top: 160px; /* 日別サマリーの下 */
  z-index: 90;
  background: white;
  border-bottom: 2px solid #333;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.calendar-ruler-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* 重要: セル幅を均等に */
}

/* 左端のラベル列（日別サマリーのラベルと幅を揃える） */
.calendar-ruler-table .label-cell {
  width: 80px; /* 日別サマリーのラベル列と同じ */
  background: #f5f5f5;
  border-right: 2px solid #ddd;
}

/* 日付セル */
.calendar-ruler-table .date-cell {
  min-width: 40px; /* 日別サマリーのセルと同じ */
  width: 40px;
  padding: 8px 4px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  border-right: 1px solid #e0e0e0;
  background: #fafafa;
}

/* 曜日セル */
.calendar-ruler-table .weekday-cell {
  min-width: 40px; /* 日付セルと同じ */
  width: 40px;
  padding: 4px;
  text-align: center;
  font-size: 12px;
  color: #666;
  border-right: 1px solid #e0e0e0;
  background: white;
}

/* 土曜日 */
.weekday-cell.saturday {
  color: #1976d2;
  background: #e3f2fd;
}

/* 日曜日・祝日 */
.weekday-cell.sunday,
.weekday-cell.holiday {
  color: #d32f2f;
  background: #ffebee;
}

/* 今日の日付を強調 */
.date-cell.today {
  background: #fff9c4;
  border: 2px solid #fbc02d;
  font-weight: 700;
}

.weekday-cell.today {
  background: #fff9c4;
  font-weight: 600;
}
```

---

### 2.4 縦軸整列の保証（マスト要件）

```css
/**
 * 縦軸整列の設計方針
 * 
 * 日別サマリー、カレンダーヘッダー、メインコンテンツの
 * 全てのセル幅を統一することで、縦軸を完璧に揃える
 */

/* 共通のセル幅定義 */
:root {
  /* ラベル列は固定 */
  --label-column-width: 80px;
  
  /* 日付セルは画面幅に応じて動的計算（レスポンシブ設計） */
  /* 横スクロール禁止のため、clamp()を使用 */
  --date-cell-width: clamp(
    35px,                                /* 最小幅（これ以下にならない） */
    calc((100vw - 80px - 30px) / 31),   /* 計算値 */
    50px                                 /* 最大幅（これ以上大きくならない） */
  );
}

/**
 * レスポンシブ設計の動作
 * 
 * 画面幅1920px（1920x1080ノートPC）:
 *   (1920 - 80 - 30) / 31 = 58.7px → 50px（最大幅で制限）
 * 
 * 画面幅1440px（Surface Pro 10、200%スケーリング）:
 *   (1440 - 80 - 30) / 31 = 42.9px → 42.9px
 * 
 * 画面幅1280px:
 *   (1280 - 80 - 30) / 31 = 38.7px → 38.7px
 * 
 * 画面幅1024px:
 *   (1024 - 80 - 30) / 31 = 29.5px → 35px（最小幅で制限）
 * 
 * すべての画面で横スクロールなし（マスト要件）
 */

/* 日別サマリーのセル幅 */
.summary-table .label {
  width: var(--label-column-width);
}

.summary-table .cell {
  min-width: var(--date-cell-width);
  width: var(--date-cell-width);
}

/* カレンダーヘッダーのセル幅 */
.calendar-ruler-table .label-cell {
  width: var(--label-column-width);
}

.calendar-ruler-table .date-cell,
.calendar-ruler-table .weekday-cell {
  min-width: var(--date-cell-width);
  width: var(--date-cell-width);
}

/* メインコンテンツのセル幅 */
.main-grid .label-column {
  width: var(--label-column-width);
}

.main-grid .date-column {
  min-width: var(--date-cell-width);
  width: var(--date-cell-width);
}

/**
 * 重要: table-layout: fixed を使用
 * 
 * これにより、セル幅が均等に配分され、
 * 縦軸のズレが発生しない
 */
.summary-table,
.calendar-ruler-table,
.main-grid {
  table-layout: fixed;
}
```

---

### 2.5 月切り替え時の動作

```javascript
class CalendarController {
  constructor() {
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth() + 1;
    this.initializeControls();
  }
  
  initializeControls() {
    // ヘッダーの月切り替えボタン
    document.getElementById('prev-month').addEventListener('click', () => {
      this.changeMonth(-1);
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
      this.changeMonth(1);
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
    
    // ヘッダーの表示を更新
    this.updateHeaderDisplay();
    
    // 各コンポーネントに通知
    this.notifyMonthChanged();
  }
  
  updateHeaderDisplay() {
    const headerMonthElement = document.getElementById('header-current-month');
    headerMonthElement.textContent = `${this.currentYear}年${this.currentMonth}月`;
  }
  
  notifyMonthChanged() {
    const event = new CustomEvent('monthChanged', {
      detail: {
        year: this.currentYear,
        month: this.currentMonth
      }
    });
    document.dispatchEvent(event);
    
    // 各コンポーネントが受信:
    // - 日別サマリー → updateSummary()
    // - カレンダーヘッダー → renderCalendar()
    // - 各セクション → renderMonth()
  }
}
```

---

### 2.6 カレンダーヘッダーの描画処理

```javascript
/**
 * カレンダーヘッダーを管理するクラス
 */
class CalendarHeaderRuler {
  constructor() {
    this.initializeEventListeners();
  }
  
  initializeEventListeners() {
    document.addEventListener('monthChanged', (e) => {
      const { year, month } = e.detail;
      this.renderCalendar(year, month);
    });
  }
  
  /**
   * カレンダーを描画
   * @param {number} year - 年
   * @param {number} month - 月
   */
  renderCalendar(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    
    // 日付行と曜日行を描画
    this.renderDateRow(year, month, daysInMonth);
    this.renderWeekdayRow(year, month, daysInMonth, firstDay);
  }
  
  /**
   * 日付行を描画
   */
  renderDateRow(year, month, daysInMonth) {
    const dateRow = document.querySelector('.date-row');
    
    // 既存のセルをクリア（ラベル列以外）
    const cells = dateRow.querySelectorAll('.date-cell');
    cells.forEach(cell => cell.remove());
    
    // 今日の日付
    const today = new Date();
    const isCurrentMonth = (today.getFullYear() === year && today.getMonth() + 1 === month);
    const todayDate = isCurrentMonth ? today.getDate() : -1;
    
    // 各日付のセルを生成
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const cell = document.createElement('td');
      cell.className = 'date-cell';
      cell.setAttribute('data-date', dateStr);
      cell.textContent = day;
      
      // 今日の日付を強調
      if (day === todayDate) {
        cell.classList.add('today');
      }
      
      dateRow.appendChild(cell);
    }
  }
  
  /**
   * 曜日行を描画
   */
  renderWeekdayRow(year, month, daysInMonth, firstDay) {
    const weekdayRow = document.querySelector('.weekday-row');
    
    // 既存のセルをクリア
    const cells = weekdayRow.querySelectorAll('.weekday-cell');
    cells.forEach(cell => cell.remove());
    
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    
    // 今日の日付
    const today = new Date();
    const isCurrentMonth = (today.getFullYear() === year && today.getMonth() + 1 === month);
    const todayDate = isCurrentMonth ? today.getDate() : -1;
    
    // 各日付の曜日を生成
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month - 1, day).getDay();
      const weekdayName = weekdays[dayOfWeek];
      
      const cell = document.createElement('td');
      cell.className = 'weekday-cell';
      cell.textContent = weekdayName;
      
      // 土曜日
      if (dayOfWeek === 6) {
        cell.classList.add('saturday');
      }
      
      // 日曜日・祝日
      if (dayOfWeek === 0 || this.isHoliday(dateStr)) {
        cell.classList.add('sunday');
        if (this.isHoliday(dateStr)) {
          cell.classList.add('holiday');
        }
      }
      
      // 今日の日付を強調
      if (day === todayDate) {
        cell.classList.add('today');
      }
      
      weekdayRow.appendChild(cell);
    }
  }
  
  /**
   * 祝日判定
   * @param {string} dateStr - 日付文字列（YYYY-MM-DD）
   * @returns {boolean} - 祝日かどうか
   */
  isHoliday(dateStr) {
    // Phase 1: HolidayCalendarから取得
    // Phase 2: API連携
    return masterData.holidayCalendar.isHoliday(dateStr);
  }
}

// グローバルインスタンス
const calendarHeaderRuler = new CalendarHeaderRuler();
```

---

## 3. ヘッダーの詳細設計

### 3.1 ヘッダーの構成

```html
<header class="app-header">
  <div class="header-left">
    <!-- 月切り替え -->
    <button id="prev-month" class="nav-button" aria-label="前月">◀</button>
    <h1 id="header-current-month" class="header-month">2025年11月</h1>
    <button id="next-month" class="nav-button" aria-label="次月">▶</button>
  </div>
  
  <div class="header-right">
    <!-- 機能ボタン -->
    <button id="import-button" class="header-button">
      <span class="icon">📥</span>
      取込
    </button>
    <button id="export-button" class="header-button">
      <span class="icon">💾</span>
      出力
    </button>
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
```

---

### 3.2 ヘッダーのスタイル

```css
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-month {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  min-width: 140px;
  text-align: center;
}

.nav-button {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 8px 16px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.nav-button:hover {
  background: rgba(255,255,255,0.3);
}

.header-right {
  display: flex;
  gap: 8px;
}

.header-button {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background 0.2s;
}

.header-button:hover {
  background: rgba(255,255,255,0.3);
}

.header-button .icon {
  font-size: 16px;
}
```

---

## 4. 日別サマリーの修正（v3.0）

### 4.1 日付行の削除

```
❌ v2.0（4行）:
│   1  2  3  4  5  6  7  8 ...│ ← この行は削除
│通 12 15 10  8 12 14 15  9 ...│
│泊  5  9  6  4  7  8  9  5 ...│
│訪  8 12 10  6  9 11 15  7 ...│

✅ v3.0（3行）:
│通 12 15 10  8 12 14 15  9 ...│
│泊  5  9  6  4  7  8  9  5 ...│
│訪  8 12 10  6  9 11 15  7 ...│

理由: カレンダーヘッダーが日付を担当
```

---

### 4.2 HTML構造（v3.0）

```html
<!-- 日別サマリー（3行のみ） -->
<div id="daily-summary-container" class="daily-summary-container">
  <!-- トグルヘッダー -->
  <div class="daily-summary-header">
    <h3>日別サマリー</h3>
    <button 
      class="toggle-summary-button" 
      aria-label="日別サマリーを折りたたむ"
      aria-expanded="true"
    >
      <span class="icon">▼</span>
    </button>
  </div>
  
  <!-- サマリー内容 -->
  <div id="daily-summary-content" class="daily-summary-content" data-visible="true">
    <div class="daily-summary integrated-summary active" data-section="integrated">
      <table class="summary-table">
        <tbody>
          <!-- 通い行 -->
          <tr class="summary-row kayoi-row">
            <td class="label">通い</td>
            <td class="cell" data-date="2025-11-01" style="background-color: #99cc00;">
              <span class="count">12</span>
            </td>
            <!-- ...他の日付 -->
          </tr>
          
          <!-- 泊まり行 -->
          <tr class="summary-row tomari-row">
            <td class="label">泊まり</td>
            <td class="cell" data-date="2025-11-01" style="background-color: #0099ff;">
              <span class="count">5</span>
            </td>
            <!-- ...他の日付 -->
          </tr>
          
          <!-- 訪問行 -->
          <tr class="summary-row houmon-row">
            <td class="label">訪問</td>
            <td class="cell" data-date="2025-11-01" style="background-color: #99cc00;">
              <span class="count">8</span>
            </td>
            <!-- ...他の日付 -->
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
```

---

### 4.3 スタイル（縦軸整列対応）

```css
/* 日別サマリーコンテナ */
.daily-summary-container {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  border-bottom: 2px solid #ddd;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* サマリーテーブル */
.summary-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* 重要: 縦軸整列のため */
  font-size: 13px;
}

/* ラベル列（カレンダーヘッダーと幅を揃える） */
.summary-row .label {
  width: var(--label-column-width); /* 80px */
  padding: 8px 12px;
  font-weight: 600;
  background: #fafafa;
  border-right: 1px solid #e0e0e0;
  text-align: left;
  position: sticky;
  left: 0;
  z-index: 10;
}

/* 日付セル（カレンダーヘッダーと幅を揃える） */
.summary-row .cell {
  min-width: var(--date-cell-width); /* 40px */
  width: var(--date-cell-width);
  padding: 8px;
  text-align: center;
  border-right: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.summary-row .cell:hover {
  outline: 2px solid #1976d2;
  outline-offset: -2px;
  z-index: 5;
}

/* 数字 */
.summary-row .cell .count {
  font-weight: 600;
  font-size: 14px;
}
```

---

## 5. 全体タブの設計（v3.0）

### 5.1 3グリッド横並び表示

```html
<section id="integrated-section" class="section active">
  <div class="integrated-view">
    <!-- 通いグリッド（簡略版） -->
    <div class="section-grid kayoi-grid-mini">
      <div class="grid-header">
        <h4>通い</h4>
        <span class="capacity">定員: 15人/日</span>
      </div>
      <table class="mini-grid">
        <!-- 簡略化されたグリッド -->
        <!-- 縦軸はカレンダーヘッダーと揃える -->
      </table>
    </div>
    
    <!-- 泊まりグリッド（簡略版） -->
    <div class="section-grid tomari-grid-mini">
      <div class="grid-header">
        <h4>泊まり</h4>
        <span class="capacity">定員: 9人/日</span>
      </div>
      <table class="mini-grid">
        <!-- 簡略化されたグリッド -->
      </table>
    </div>
    
    <!-- 訪問グリッド（簡略版） -->
    <div class="section-grid houmon-grid-mini">
      <div class="grid-header">
        <h4>訪問</h4>
        <span class="capacity">回数制限なし</span>
      </div>
      <table class="mini-grid">
        <!-- 簡略化されたグリッド -->
      </table>
    </div>
  </div>
</section>
```

---

### 5.2 縦軸整列（全体タブでも保証）

```css
/* 全体タブのグリッド */
.integrated-view {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  padding: 16px;
}

.mini-grid {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* 重要 */
  font-size: 12px;
}

/* ラベル列 */
.mini-grid .label-column {
  width: var(--label-column-width); /* 80px */
}

/* 日付列 */
.mini-grid .date-column {
  min-width: var(--date-cell-width); /* 40px */
  width: var(--date-cell-width);
}

/**
 * 全体タブでは3つのグリッドが横並びだが、
 * 各グリッドの縦軸はカレンダーヘッダーと揃っている
 */
```

---

## 6. Phase 1とPhase 2の実装範囲

### 6.1 Phase 1（v3.0）

```
✅ Phase 1で実装
├─ ヘッダーの再設計
│   ├─ 月切り替え
│   └─ 入出力・設定・ヘルプボタン
├─ ナビゲーションタブ
├─ 日別サマリー（3行・色分け・トグル）
├─ カレンダーヘッダー（物差し機能）
│   ├─ 日付・曜日の2行表示
│   ├─ サンドイッチ配置
│   ├─ sticky固定
│   └─ 縦軸整列の保証
├─ 全体タブ（3グリッド・縦軸整列）
├─ セクション別タブ（詳細版）
├─ タブ切り替え
├─ トースト通知
├─ 確認ダイアログ
├─ 印刷レイアウト
└─ 自動保存
```

---

### 6.2 Phase 2での拡張

```
⏭️ Phase 2で拡張
├─ 日別サマリーの高度な色分け
├─ カレンダーヘッダーのクリック機能
│   └─ 日付をクリックで該当日にフォーカス
├─ 祝日のAPI連携
├─ ツールチップで詳細情報表示
├─ キーボードショートカット
└─ スマートフォン対応
```

---

## 7. 縦軸整列の実装ガイドライン（マスト要件）

### 7.1 設計原則

```
原則:
1. すべてのテーブルで table-layout: fixed を使用
2. CSS変数で共通のセル幅を定義
3. ラベル列の幅を統一（80px）
4. 日付セルの幅を統一（40px）
5. すべてのテーブルで同じ幅を使用
```

---

### 7.2 実装チェックリスト

```
✅ 実装前のチェック
├─ CSS変数 --label-column-width が定義されているか
├─ CSS変数 --date-cell-width が定義されているか
├─ すべてのテーブルが table-layout: fixed か
├─ すべてのラベル列が var(--label-column-width) か
└─ すべての日付セルが var(--date-cell-width) か

✅ 実装後のチェック
├─ 日別サマリーの縦軸がカレンダーヘッダーと揃っているか
├─ メインコンテンツの縦軸がカレンダーヘッダーと揃っているか
├─ 全体タブの3グリッドの縦軸がカレンダーヘッダーと揃っているか
├─ スクロール時にズレが発生しないか
└─ ブラウザのズーム（拡大・縮小）でもズレないか
```

---

### 7.3 デバッグ方法

```javascript
/**
 * 縦軸整列のデバッグ用関数
 */
function debugVerticalAlignment() {
  const summaryLabels = document.querySelectorAll('.summary-table .label');
  const calendarLabels = document.querySelectorAll('.calendar-ruler-table .label-cell');
  const gridLabels = document.querySelectorAll('.main-grid .label-column');
  
  console.log('ラベル列の幅:');
  console.log('  サマリー:', summaryLabels[0]?.offsetWidth);
  console.log('  カレンダー:', calendarLabels[0]?.offsetWidth);
  console.log('  グリッド:', gridLabels[0]?.offsetWidth);
  
  const summaryCells = document.querySelectorAll('.summary-table .cell');
  const calendarCells = document.querySelectorAll('.calendar-ruler-table .date-cell');
  const gridCells = document.querySelectorAll('.main-grid .date-column');
  
  console.log('日付セルの幅:');
  console.log('  サマリー:', summaryCells[0]?.offsetWidth);
  console.log('  カレンダー:', calendarCells[0]?.offsetWidth);
  console.log('  グリッド:', gridCells[0]?.offsetWidth);
  
  // すべて同じ値であれば縦軸が揃っている
}

// 開発時に実行
if (process.env.NODE_ENV === 'development') {
  window.debugVerticalAlignment = debugVerticalAlignment;
}
```

---

## 8. まとめ

### 8.1 v3.0で定義したこと

```
✅ v3.0で定義したこと
├─ 画面構成の根本的な再設計
│   ├─ ヘッダーの再構成
│   ├─ カレンダーヘッダーのサンドイッチ配置
│   └─ 日別サマリーの修正（3行のみ）
├─ カレンダーヘッダーの物差し機能
│   ├─ 日付・曜日の2行表示
│   ├─ 縦軸の基準として機能
│   └─ サンドイッチ配置の理由
├─ 縦軸整列の設計（マスト要件）
│   ├─ CSS変数での統一
│   ├─ table-layout: fixed の使用
│   └─ 実装チェックリスト
├─ 各セクションの責任分離
│   ├─ 日別サマリー: 数値のみ
│   └─ カレンダーヘッダー: 日付・曜日
└─ Phase 1とPhase 2の実装範囲
```

---

### 8.2 v2.0からの主要な変更

| 項目 | v2.0 | v3.0 |
|------|------|------|
| **ヘッダー** | カレンダーヘッダー（月切り替え＋印刷等） | 月切り替え、入出力、設定、ヘルプを統合 |
| **カレンダーヘッダーの位置** | 日別サマリーの上 | 日別サマリーとメインコンテンツの間（サンドイッチ） |
| **カレンダーヘッダーの役割** | 月切り替えのみ | 物差し機能（縦軸の基準） |
| **日別サマリーの行数** | 4行（日付行含む） | 3行（日付行削除） |
| **縦軸整列** | 記載なし | マスト要件として明記 |
| **責任分離** | 曖昧 | 明確（日付はカレンダーヘッダー） |

---

### 8.3 重要な設計判断

1. **カレンダーヘッダーのサンドイッチ配置**
   - 理由: 日別サマリーとメインコンテンツの両方の縦軸基準として機能
   
2. **物差し機能の明確化**
   - 理由: 縦軸整列はマスト要件
   
3. **日別サマリーの3行化**
   - 理由: 日付表示の責任をカレンダーヘッダーに委譲
   
4. **CSS変数による統一**
   - 理由: 縦軸整列を保証する最も確実な方法

---

### 8.4 次のステップ

v3.0の設計が完成しました。

**次に作成すべきドキュメント**:
- 実装指示書（Phase 1の具体的な実装）
- 縦軸整列のテスト仕様書
- カレンダーヘッダーの単体テスト仕様

**実装の順序**:
1. CSS変数の定義（共通セル幅）
2. カレンダーヘッダー（CalendarHeaderRuler）
3. 日別サマリーの修正（3行化）
4. ヘッダーの再構成
5. 縦軸整列の検証
6. 全体タブ（IntegratedView）
7. セクション別タブ

---

## 📚 次に読むべきドキュメント

このドキュメントを読了したら、以下のドキュメントに進んでください。

### 関連ドキュメント

- **L3_UI_日別サマリー設計.md** - 日別サマリーの詳細仕様（v3.0対応必要）
- **L2_通い_UI設計.md** - 通いセクションの詳細UI（縦軸整列対応）
- **L2_泊まり_UI設計.md** - 泊まりセクションの詳細UI（縦軸整列対応）
- **L2_訪問_UI設計.md** - 訪問セクションの詳細UI（縦軸整列対応）
- **L1_技術_実装制約.md** - UI/UX規約

---

## 📝 参考資料

- L0_業務_調整業務の制約.md（3サービスの同時管理）
- L0_業務_居室管理の重要性.md（夜勤負担度の可視化）
- L1_概要_プロジェクト概要.md（制約パズル、即フィードバック）
- CHECKLIST_設計レビュー.md（設計品質の5原則）

---

## 📅 更新履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|----------|---------|------|
| 2025-11-23 | 1.0 | 初版作成 | Claude |
| 2025-11-29 | 2.0 | デフォルト全体タブ、日別サマリー統合、色分け表示を追加 | Claude |
| 2025-11-29 | 3.0 | カレンダーヘッダーのサンドイッチ配置、物差し機能、縦軸整列設計を追加 | Claude |

---

**最終更新**: 2025年11月29日  
**次回更新予定**: Phase 1実装中のフィードバック反映時

---

## ⚠️ 設計チェックリスト

このドキュメントの品質チェック（v3.0）：

- [x] 画面構成の順序が明確
- [x] カレンダーヘッダーの物差し機能が詳細に定義
- [x] サンドイッチ配置の理由が説明されている
- [x] 縦軸整列の設計が具体的
- [x] CSS変数による統一方法が明確
- [x] 日別サマリーの3行化が反映されている
- [x] ヘッダーの再構成が完了している
- [x] 実装チェックリストが提供されている
- [x] デバッグ方法が記載されている
- [x] Phase 1とPhase 2の範囲が明確

---

**このドキュメントを読了したら、INDEX_ドキュメント構成.md に戻り、次のドキュメントに進んでください。**