# L3_UI_日別サマリー設計

**作成日**: 2025年11月29日  
**カテゴリ**: 第3層 - 統合設計  
**バージョン**: 2.0  
**更新日**: 2025年11月29日

---

## 📖 このドキュメントについて

このドキュメントは、**日別サマリー（3行表示）の詳細設計**を定義します。

### v2.0での主要な変更

1. **日付行の削除（4行 → 3行）**
   - 日付表示の責任をカレンダーヘッダーに委譲
   - 省スペース化
   
2. **カレンダーヘッダーとの連動**
   - カレンダーヘッダーが日付・曜日を担当
   - 日別サマリーは数値のみを表示
   
3. **縦軸整列の要件反映**
   - CSS変数による統一
   - `table-layout: fixed` の使用
   - カレンダーヘッダーとの縦軸同期

### 対象読者

- UI/UX担当者
- フロントエンド実装担当者
- テスト担当者

### 読了後に理解できること

- 日別サマリーの3行構成（v2.0）
- 色分け表示の仕様
- トグル機能の設計
- カレンダーヘッダーとの連動方法
- 縦軸整列の実装方法

### 設計の前提

- **L3_UI_統合UI設計.md v3.0** のカレンダーヘッダー設計
- **L0_業務_居室管理の重要性.md** の夜勤負担度
- **L0_業務_調整業務の制約.md** のリソース管理
- **L1_技術_実装制約.md** のUI/UX規約

---

## 1. 日別サマリーの概要

### 1.1 目的

**月全体のリソース状況を一目で把握する**

```
目的:
1. 3サービスの同時管理
   ├─ 通い・泊まり・訪問の利用状況を1画面で確認
   └─ 空き状況の即答（営業対応）

2. 負担度の可視化
   ├─ 色分けで視覚的に表示（青→黄→赤）
   └─ 調整が必要な日を即座に発見

3. 初心者への支援
   ├─ 数字だけでなく、色で判断できる
   └─ 経験がなくても負担度が分かる
```

---

### 1.2 表示内容（v2.0）

```
v2.0（3行のみ）:
┌───────────────────────────────────────┐
│通 12 15 10  8 12 14 15  9 11 13 ...  │ ← 通い利用者数
│泊  5  9  6  4  7  8  9  5  6  8 ...  │ ← 泊まり利用者数
│訪  8 12 10  6  9 11 15  7  8 10 ...  │ ← 訪問回数
└───────────────────────────────────────┘

日付・曜日はカレンダーヘッダーが担当
```

**v1.0からの変更**:
- ❌ 日付行を削除（1, 2, 3, ... の行）
- ✅ 数値のみを表示（通い・泊まり・訪問）

---

### 1.3 v2.0の設計思想

**責任の分離**

| コンポーネント | 責任 |
|---------------|------|
| **カレンダーヘッダー** | 日付・曜日の表示 |
| **日別サマリー** | 数値の表示・色分け |
| **メインコンテンツ** | 詳細なスケジュール |

**理由**:
- 日付表示の一元化
- 省スペース化（3行で済む）
- 責任が明確（日付はカレンダーヘッダーのみ）

---

### 1.4 タブ別の表示内容（重要）

**日別サマリーはタブによって表示内容が変わります**

```
設計原則: 各タブでは関連する情報のみを表示
```

| タブ | 表示する行 | 行数 | 理由 |
|------|-----------|------|------|
| **全体タブ** | 通い・泊まり・訪問 | 3行 | 3サービスの全体状況を把握 |
| **通いタブ** | 通い・迎え・送り | 3行 | 通いサービスの詳細（送迎情報含む） |
| **泊まりタブ** | 泊まり・重度・中度・軽度 | 4行 | 泊まりサービスの詳細（介助度別） |
| **訪問タブ** | 訪問 | 1行 | 訪問サービスの情報 |

**例（通いタブ）**:
```
┌───────────────────────────────────────┐
│通 12 15 10  8 12 14 15  9 11 13 ...  │ ← 通い利用者数
│迎 10 13  8  7 10 12 13  8  9 11 ...  │ ← 職員送迎が必要な人数（朝）
│送 11 14  9  7 11 13 14  8 10 12 ...  │ ← 職員送迎が必要な人数（夕方）
└───────────────────────────────────────┘
```

**例（泊まりタブ）**:
```
┌───────────────────────────────────────┐
│泊  5  9  6  4  7  8  9  5  6  8 ...  │ ← 泊まり利用者数
│重  2  3  2  1  2  3  3  2  2  3 ...  │ ← 重度（要介護4-5）
│中  2  4  3  2  3  3  4  2  3  3 ...  │ ← 中度（要介護3）
│軽  1  2  1  1  2  2  2  1  1  2 ...  │ ← 軽度（要介護1-2）
└───────────────────────────────────────┘
```

---

#### ❌ よくある誤解

**誤解1**: 「日別サマリーは全タブ共通で、通い・泊まり・訪問の3行を表示する」

→ **間違い**。タブごとに表示内容が変わります。

**誤解2**: 「5行（通い・迎え・送り・泊まり・訪問）の共通HTMLを作り、タブで表示制御する」

→ **間違い**。各タブ専用のHTMLを作成します。

**誤解3**: 「セクション1.2の例が全タブ共通」

→ **間違い**。セクション1.2は**全体タブでの表示例**です。

---

#### 実装上の注意

```javascript
// ❌ 間違った実装（5行の共通HTML）
const dailySummaryHTML = `
  <tr class="kayoi-row">...</tr>
  <tr class="mukae-row">...</tr>
  <tr class="okuri-row">...</tr>
  <tr class="tomari-row">...</tr>
  <tr class="houmon-row">...</tr>
`;

// タブで表示制御
if (currentTab === 'kayoi') {
  showRows(['kayoi', 'mukae', 'okuri']);
} else if (currentTab === 'integrated') {
  showRows(['kayoi', 'tomari', 'houmon']);
}

// ✅ 正しい実装（タブ専用のHTML）
const integratedSummaryHTML = `
  <tr class="kayoi-row">...</tr>
  <tr class="tomari-row">...</tr>
  <tr class="houmon-row">...</tr>
`;

const kayoiSummaryHTML = `
  <tr class="kayoi-row">...</tr>
  <tr class="mukae-row">...</tr>
  <tr class="okuri-row">...</tr>
`;

// タブで切り替え
if (currentTab === 'integrated') {
  container.innerHTML = integratedSummaryHTML;
} else if (currentTab === 'kayoi') {
  container.innerHTML = kayoiSummaryHTML;
}
```

**理由**:
1. **セクション独立性**: 各セクションは完全に独立
2. **情報過多を防ぐ**: 通いタブで泊まり情報は不要
3. **将来の拡張性**: 通いに「1便/2便」を追加しても他に影響しない

---

#### 設計思想: セクション別に特化

```
各タブは自分に関連する情報のみを表示
├─ 全体タブ: 3サービスの概要（通い・泊まり・訪問）
├─ 通いタブ: 通いの詳細（通い・迎え・送り）
├─ 泊まりタブ: 泊まりの詳細（泊まり・重度・中度・軽度）
└─ 訪問タブ: 訪問の詳細（訪問のみ）
```

**メリット**:
- ユーザーは見たい情報だけを見られる
- 画面がシンプル
- 認知負荷が低い

---

## 2. HTML構造（v2.0）

### 2.1 全体構造

```html
<!-- 日別サマリーコンテナ -->
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
            <td class="cell" data-date="2025-11-02" style="background-color: #ffff00;">
              <span class="count">15</span>
            </td>
            <!-- ...他の日付（月末まで） -->
          </tr>
          
          <!-- 泊まり行 -->
          <tr class="summary-row tomari-row">
            <td class="label">泊まり</td>
            <td class="cell" data-date="2025-11-01" style="background-color: #0099ff;">
              <span class="count">5</span>
            </td>
            <td class="cell" data-date="2025-11-02" style="background-color: #ffff00;">
              <span class="count">9</span>
            </td>
            <!-- ...他の日付（月末まで） -->
          </tr>
          
          <!-- 訪問行 -->
          <tr class="summary-row houmon-row">
            <td class="label">訪問</td>
            <td class="cell" data-date="2025-11-01" style="background-color: #99cc00;">
              <span class="count">8</span>
            </td>
            <td class="cell" data-date="2025-11-02" style="background-color: #ffff00;">
              <span class="count">12</span>
            </td>
            <!-- ...他の日付（月末まで） -->
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
```

---

### 2.2 HTML要素の説明

#### トグルヘッダー

```html
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
```

**属性**:
- `aria-label`: 読み上げソフト対応
- `aria-expanded`: 展開状態（true/false）

**アイコン**:
- 展開時: ▼
- 折りたたみ時: ▶

---

#### サマリー内容

```html
<div id="daily-summary-content" class="daily-summary-content" data-visible="true">
  <!-- ...テーブル -->
</div>
```

**属性**:
- `data-visible`: 表示状態（true/false）
- `true`: 表示
- `false`: 非表示

---

#### テーブル構造

```html
<table class="summary-table">
  <tbody>
    <tr class="summary-row kayoi-row">
      <td class="label">通い</td>
      <td class="cell" data-date="2025-11-01">
        <span class="count">12</span>
      </td>
      <!-- ...他の日付 -->
    </tr>
    <!-- 泊まり行、訪問行 -->
  </tbody>
</table>
```

**重要**:
- `<thead>` は使用しない（日付行がないため）
- 3つの `<tr>` のみ（通い・泊まり・訪問）

---

## 3. CSS設計（v2.0）

### 3.1 縦軸整列の設計（マスト要件）

```css
/**
 * 縦軸整列の設計方針
 * 
 * カレンダーヘッダー、日別サマリー、メインコンテンツの
 * 全てのセル幅を統一することで、縦軸を完璧に揃える
 */

/* 共通のセル幅定義（L3_UI_統合UI設計.mdで定義） */
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
 * 詳細はL3_UI_統合UI設計.mdを参照
 * すべての画面で横スクロールなし（マスト要件）
 */

/* 日別サマリーのセル幅 */
.summary-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* 重要: セル幅を均等に */
}

.summary-table .label {
  width: var(--label-column-width);
  background: #f5f5f5;
  border-right: 2px solid #ddd;
  padding: 8px;
  text-align: center;
  font-weight: 600;
}

.summary-table .cell {
  min-width: var(--date-cell-width);
  width: var(--date-cell-width);
  padding: 4px;
  text-align: center;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
}
```

**重要なポイント**:
1. **CSS変数を使用** (`--label-column-width`, `--date-cell-width`)
2. **`table-layout: fixed`** を使用
3. **カレンダーヘッダーと同じ幅**

---

### 3.2 コンテナのスタイル

```css
/* 日別サマリーコンテナ */
.daily-summary-container {
  position: sticky;
  top: 50px; /* ヘッダー（50px）の下 */
  z-index: 100;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* トグルヘッダー */
.daily-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.daily-summary-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.toggle-summary-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 12px;
  color: #666;
  transition: transform 0.2s ease;
}

.toggle-summary-button:hover {
  background: #e0e0e0;
  border-radius: 4px;
}

/* アイコンの回転 */
.toggle-summary-button[aria-expanded="false"] .icon {
  transform: rotate(-90deg);
}
```

---

### 3.3 表示/非表示の切り替え

```css
/* サマリー内容 */
.daily-summary-content {
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.daily-summary-content[data-visible="true"] {
  max-height: 200px; /* 3行分の高さ */
}

.daily-summary-content[data-visible="false"] {
  max-height: 0;
}
```

---

### 3.4 色分け表示

```css
/* 数字のスタイル */
.summary-table .count {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 色分けは動的に設定（style属性） */
/* 例: 
   - 余裕あり: #0099ff（青）
   - 適度: #99cc00（緑）
   - やや混雑: #ffff00（黄）
   - 混雑: #ff9900（オレンジ）
   - 限界: #ff0000（赤）
*/
```

**色分けの基準**（Phase 1）:

| 色 | 通い | 泊まり | 訪問 | 意味 |
|----|------|--------|------|------|
| 🔵 青 | 0-5人 | 0-3人 | 0-5回 | 余裕あり |
| 🟢 緑 | 6-10人 | 4-6人 | 6-10回 | 適度 |
| 🟡 黄 | 11-13人 | 7-8人 | 11-15回 | やや混雑 |
| 🟠 オレンジ | 14-15人 | 9人 | 16-20回 | 混雑 |
| 🔴 赤 | 16人以上 | 10人以上 | 21回以上 | 限界（定員超過） |

---

### 3.5 ホバーエフェクト

```css
/* セルのホバー */
.summary-table .cell:hover {
  outline: 2px solid #1976d2;
  outline-offset: -1px;
  cursor: pointer;
  z-index: 10;
  position: relative;
}

/* ホバー時に縦軸の列を強調（Phase 2） */
.summary-table .cell.hovered-column {
  background-color: rgba(25, 118, 210, 0.1);
}
```

---

## 4. JavaScript設計

### 4.1 DailySummaryServiceクラス

```javascript
/**
 * 日別サマリーのビジネスロジック
 */
class DailySummaryService {
  constructor() {
    this.currentYear = null;
    this.currentMonth = null;
  }
  
  /**
   * 月の日別サマリーを計算
   * @param {number} year - 年
   * @param {number} month - 月
   * @param {Array} kayoiData - 通いデータ
   * @param {Array} tomariData - 泊まりデータ
   * @param {Array} houmonData - 訪問データ
   * @returns {Object} - 日別サマリーデータ
   */
  calculateMonthlySummary(year, month, kayoiData, tomariData, houmonData) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const summary = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      summary[dateStr] = {
        kayoi: this.countKayoi(dateStr, kayoiData),
        tomari: this.countTomari(dateStr, tomariData),
        houmon: this.countHoumon(dateStr, houmonData)
      };
    }
    
    return summary;
  }
  
  /**
   * 通い利用者数をカウント
   */
  countKayoi(dateStr, kayoiData) {
    return kayoiData.filter(schedule => schedule.date === dateStr).length;
  }
  
  /**
   * 泊まり利用者数をカウント
   */
  countTomari(dateStr, tomariData) {
    return tomariData.filter(schedule => {
      const checkIn = schedule.checkInDate;
      const checkOut = schedule.checkOutDate;
      return dateStr >= checkIn && dateStr < checkOut;
    }).length;
  }
  
  /**
   * 訪問回数をカウント
   */
  countHoumon(dateStr, houmonData) {
    const visits = houmonData.filter(schedule => schedule.date === dateStr);
    return visits.reduce((sum, schedule) => sum + (schedule.count || 1), 0);
  }
  
  /**
   * 色分けを計算
   * @param {string} service - サービス種別（'kayoi'/'tomari'/'houmon'）
   * @param {number} count - 利用者数/回数
   * @returns {string} - 背景色（16進数）
   */
  calculateColor(service, count) {
    const thresholds = {
      kayoi: [
        { max: 5, color: '#0099ff' },   // 青
        { max: 10, color: '#99cc00' },  // 緑
        { max: 13, color: '#ffff00' },  // 黄
        { max: 15, color: '#ff9900' },  // オレンジ
        { max: Infinity, color: '#ff0000' } // 赤
      ],
      tomari: [
        { max: 3, color: '#0099ff' },
        { max: 6, color: '#99cc00' },
        { max: 8, color: '#ffff00' },
        { max: 9, color: '#ff9900' },
        { max: Infinity, color: '#ff0000' }
      ],
      houmon: [
        { max: 5, color: '#0099ff' },
        { max: 10, color: '#99cc00' },
        { max: 15, color: '#ffff00' },
        { max: 20, color: '#ff9900' },
        { max: Infinity, color: '#ff0000' }
      ]
    };
    
    const serviceTh = thresholds[service];
    for (let i = 0; i < serviceTh.length; i++) {
      if (count <= serviceTh[i].max) {
        return serviceTh[i].color;
      }
    }
    
    return '#ffffff'; // デフォルト（白）
  }
}

// グローバルインスタンス
const dailySummaryService = new DailySummaryService();
```

---

### 4.2 DailySummaryUIクラス

```javascript
/**
 * 日別サマリーのUI管理
 */
class DailySummaryUI {
  constructor() {
    this.container = document.getElementById('daily-summary-container');
    this.content = document.getElementById('daily-summary-content');
    this.toggleButton = this.container.querySelector('.toggle-summary-button');
    this.summaryTable = this.container.querySelector('.summary-table');
    
    this.initializeEventListeners();
  }
  
  initializeEventListeners() {
    // トグルボタン
    this.toggleButton.addEventListener('click', () => {
      this.toggleVisibility();
    });
    
    // 月切り替えイベント
    document.addEventListener('monthChanged', (e) => {
      const { year, month } = e.detail;
      this.updateSummary(year, month);
    });
  }
  
  /**
   * 表示/非表示を切り替え
   */
  toggleVisibility() {
    const isVisible = this.content.getAttribute('data-visible') === 'true';
    const newState = !isVisible;
    
    this.content.setAttribute('data-visible', newState);
    this.toggleButton.setAttribute('aria-expanded', newState);
    
    // ローカルストレージに保存
    localStorage.setItem('dailySummaryVisible', newState);
  }
  
  /**
   * サマリーを更新
   * @param {number} year - 年
   * @param {number} month - 月
   */
  updateSummary(year, month) {
    // データを取得
    const kayoiData = masterData.kayoiSchedules.getMonthData(year, month);
    const tomariData = masterData.tomariSchedules.getMonthData(year, month);
    const houmonData = masterData.houmonSchedules.getMonthData(year, month);
    
    // サマリーを計算
    const summary = dailySummaryService.calculateMonthlySummary(
      year, month, kayoiData, tomariData, houmonData
    );
    
    // テーブルを描画
    this.renderTable(year, month, summary);
  }
  
  /**
   * テーブルを描画
   */
  renderTable(year, month, summary) {
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // 各行を取得
    const kayoiRow = this.summaryTable.querySelector('.kayoi-row');
    const tomariRow = this.summaryTable.querySelector('.tomari-row');
    const houmonRow = this.summaryTable.querySelector('.houmon-row');
    
    // 既存のセルをクリア（ラベル以外）
    [kayoiRow, tomariRow, houmonRow].forEach(row => {
      const cells = row.querySelectorAll('.cell');
      cells.forEach(cell => cell.remove());
    });
    
    // 各日付のセルを生成
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const daySummary = summary[dateStr];
      
      // 通い行のセル
      const kayoiCell = this.createCell(dateStr, daySummary.kayoi, 'kayoi');
      kayoiRow.appendChild(kayoiCell);
      
      // 泊まり行のセル
      const tomariCell = this.createCell(dateStr, daySummary.tomari, 'tomari');
      tomariRow.appendChild(tomariCell);
      
      // 訪問行のセル
      const houmonCell = this.createCell(dateStr, daySummary.houmon, 'houmon');
      houmonRow.appendChild(houmonCell);
    }
  }
  
  /**
   * セルを作成
   * @param {string} dateStr - 日付文字列
   * @param {number} count - 利用者数/回数
   * @param {string} service - サービス種別
   * @returns {HTMLElement} - セル要素
   */
  createCell(dateStr, count, service) {
    const cell = document.createElement('td');
    cell.className = 'cell';
    cell.setAttribute('data-date', dateStr);
    
    // 色分けを計算
    const bgColor = dailySummaryService.calculateColor(service, count);
    cell.style.backgroundColor = bgColor;
    
    // 数字を表示
    const countSpan = document.createElement('span');
    countSpan.className = 'count';
    countSpan.textContent = count;
    cell.appendChild(countSpan);
    
    // ホバーイベント（Phase 2）
    cell.addEventListener('mouseenter', () => {
      this.highlightColumn(dateStr);
    });
    
    cell.addEventListener('mouseleave', () => {
      this.unhighlightColumn(dateStr);
    });
    
    return cell;
  }
  
  /**
   * 列を強調（Phase 2）
   */
  highlightColumn(dateStr) {
    const cells = this.summaryTable.querySelectorAll(`[data-date="${dateStr}"]`);
    cells.forEach(cell => cell.classList.add('hovered-column'));
  }
  
  /**
   * 列の強調を解除（Phase 2）
   */
  unhighlightColumn(dateStr) {
    const cells = this.summaryTable.querySelectorAll(`[data-date="${dateStr}"]`);
    cells.forEach(cell => cell.classList.remove('hovered-column'));
  }
}

// グローバルインスタンス
const dailySummaryUI = new DailySummaryUI();
```

---

## 5. カレンダーヘッダーとの連動

### 5.1 縦軸整列の保証

```css
/**
 * カレンダーヘッダーと日別サマリーの縦軸を揃える
 */

/* 共通のセル幅（CSS変数） */
:root {
  --label-column-width: 80px;
  --date-cell-width: 40px;
}

/* 日別サマリー */
.summary-table .label {
  width: var(--label-column-width);
}

.summary-table .cell {
  min-width: var(--date-cell-width);
  width: var(--date-cell-width);
}

/* カレンダーヘッダー */
.calendar-ruler-table .label-cell {
  width: var(--label-column-width);
}

.calendar-ruler-table .date-cell,
.calendar-ruler-table .weekday-cell {
  min-width: var(--date-cell-width);
  width: var(--date-cell-width);
}

/* 両方ともtable-layout: fixedを使用 */
.summary-table,
.calendar-ruler-table {
  table-layout: fixed;
}
```

---

### 5.2 月切り替え時の同期

```javascript
/**
 * 月切り替え時の動作
 */

// CalendarControllerが月切り替えイベントを発火
document.dispatchEvent(new CustomEvent('monthChanged', {
  detail: { year: 2025, month: 11 }
}));

// DailySummaryUIが受信して更新
document.addEventListener('monthChanged', (e) => {
  const { year, month } = e.detail;
  dailySummaryUI.updateSummary(year, month);
});

// CalendarHeaderRulerも受信して更新
document.addEventListener('monthChanged', (e) => {
  const { year, month } = e.detail;
  calendarHeaderRuler.renderCalendar(year, month);
});
```

**重要**:
- 日別サマリーとカレンダーヘッダーは同じイベントで更新
- 常に同期が保たれる

---

## 6. トグル機能の詳細設計

### 6.1 初期状態

```javascript
/**
 * ページロード時の処理
 */
window.addEventListener('DOMContentLoaded', () => {
  // ローカルストレージから状態を復元
  const savedState = localStorage.getItem('dailySummaryVisible');
  const isVisible = savedState === null ? true : (savedState === 'true');
  
  const content = document.getElementById('daily-summary-content');
  const toggleButton = document.querySelector('.toggle-summary-button');
  
  content.setAttribute('data-visible', isVisible);
  toggleButton.setAttribute('aria-expanded', isVisible);
});
```

**デフォルト**: 表示（`data-visible="true"`）

---

### 6.2 アニメーション

```css
/* トグルアニメーション */
.daily-summary-content {
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.daily-summary-content[data-visible="true"] {
  max-height: 200px; /* 3行分 */
}

.daily-summary-content[data-visible="false"] {
  max-height: 0;
}

/* アイコンの回転 */
.toggle-summary-button .icon {
  transition: transform 0.2s ease;
}

.toggle-summary-button[aria-expanded="false"] .icon {
  transform: rotate(-90deg);
}
```

---

## 7. Phase 2での拡張

### 7.1 高度な色分け

```javascript
/**
 * Phase 2: 送迎量・介助量を考慮した色分け
 */
class DailySummaryServicePhase2 extends DailySummaryService {
  /**
   * 通いの色分け（送迎量考慮）
   */
  calculateKayoiColor(dateStr, kayoiData) {
    const schedules = kayoiData.filter(s => s.date === dateStr);
    const count = schedules.length;
    
    // 送迎利用者数をカウント
    const pickupCount = schedules.filter(s => s.pickup === 'staff').length;
    
    // 基本の色を取得
    let color = this.calculateColor('kayoi', count);
    
    // 送迎が多い場合は色を濃くする
    if (pickupCount > count * 0.7) {
      color = this.darkenColor(color, 20);
    }
    
    return color;
  }
  
  /**
   * 色を濃くする
   */
  darkenColor(hex, percent) {
    // 省略（実装時に詳細化）
  }
}
```

---

### 7.2 ホバーポップアップ

```javascript
/**
 * Phase 2: ホバー時にポップアップ表示
 */
class DailySummaryUIPhase2 extends DailySummaryUI {
  createCell(dateStr, count, service) {
    const cell = super.createCell(dateStr, count, service);
    
    // ポップアップを追加
    cell.addEventListener('mouseenter', (e) => {
      this.showPopup(e.target, dateStr, service);
    });
    
    cell.addEventListener('mouseleave', () => {
      this.hidePopup();
    });
    
    return cell;
  }
  
  /**
   * ポップアップを表示
   */
  showPopup(target, dateStr, service) {
    // 詳細情報を取得
    const details = this.getDetails(dateStr, service);
    
    // ポップアップを作成
    const popup = document.createElement('div');
    popup.className = 'summary-popup';
    popup.innerHTML = `
      <div class="popup-header">${dateStr}</div>
      <div class="popup-body">
        ${details}
      </div>
    `;
    
    // 位置を調整
    const rect = target.getBoundingClientRect();
    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.bottom + 5}px`;
    
    document.body.appendChild(popup);
    this.currentPopup = popup;
  }
  
  /**
   * ポップアップを非表示
   */
  hidePopup() {
    if (this.currentPopup) {
      this.currentPopup.remove();
      this.currentPopup = null;
    }
  }
  
  /**
   * 詳細情報を取得
   */
  getDetails(dateStr, service) {
    // 省略（実装時に詳細化）
  }
}
```

---

## 8. テスト仕様

### 8.1 機能テスト

```
✅ 必須テスト項目

1. 表示テスト
   - [ ] 3行（通い・泊まり・訪問）が表示される
   - [ ] 日付行が表示されない
   - [ ] カレンダーヘッダーと縦軸が揃っている

2. 色分けテスト
   - [ ] 通い: 0-5人で青、6-10人で緑、...
   - [ ] 泊まり: 0-3人で青、4-6人で緑、...
   - [ ] 訪問: 0-5回で青、6-10回で緑、...

3. トグルテスト
   - [ ] ▼ボタンでサマリーが折りたたまれる
   - [ ] ▶ボタンでサマリーが展開される
   - [ ] 状態がローカルストレージに保存される

4. 月切り替えテスト
   - [ ] 月切り替え時にサマリーが更新される
   - [ ] カレンダーヘッダーと同期する

5. 縦軸整列テスト
   - [ ] 日別サマリーのセル幅 = カレンダーヘッダーのセル幅
   - [ ] ラベル列の幅 = カレンダーヘッダーのラベル幅
   - [ ] スクロール時にズレない
```

---

### 8.2 パフォーマンステスト

```
✅ パフォーマンステスト項目

1. 描画速度
   - [ ] 月切り替え後、100ms以内にサマリーが更新される
   - [ ] 31日分のセル生成が50ms以内に完了する

2. メモリ使用量
   - [ ] DOM要素数が適切（3行 × 31日 = 93セル以下）
   - [ ] イベントリスナーが適切に解放される
```

---

## 9. 実装チェックリスト

### 9.1 Phase 1（必須）

```
✅ HTML
- [ ] 日別サマリーコンテナが存在する
- [ ] トグルヘッダーが存在する
- [ ] 3行のテーブル構造が存在する
- [ ] 日付行が存在しない（削除済み）

✅ CSS
- [ ] CSS変数（--label-column-width, --date-cell-width）が定義されている
- [ ] table-layout: fixedが設定されている
- [ ] カレンダーヘッダーと同じ幅が設定されている
- [ ] sticky固定が動作する

✅ JavaScript
- [ ] DailySummaryServiceクラスが実装されている
- [ ] DailySummaryUIクラスが実装されている
- [ ] 色分けロジックが動作する
- [ ] トグル機能が動作する
- [ ] 月切り替えイベントを受信する

✅ 縦軸整列
- [ ] 日別サマリーとカレンダーヘッダーの縦軸が揃っている
- [ ] ラベル列の幅が一致している
- [ ] 日付セルの幅が一致している
- [ ] スクロール時にズレない
```

---

### 9.2 Phase 2（拡張）

```
⏭️ Phase 2で実装

- [ ] 送迎量を考慮した色分け
- [ ] 介助量を考慮した色分け
- [ ] ホバーポップアップ
- [ ] クリックでその日にジャンプ
- [ ] 縦軸の列を強調
```

---

## 10. まとめ

### 10.1 v2.0で定義したこと

```
✅ v2.0で定義したこと
├─ 日付行の削除（4行 → 3行）
├─ カレンダーヘッダーとの連動
├─ 縦軸整列の設計（マスト要件）
├─ CSS変数による統一
├─ 色分け表示の仕様
├─ トグル機能の詳細
└─ Phase 1とPhase 2の範囲
```

---

### 10.2 v1.0からの主要な変更

| 項目 | v1.0 | v2.0 |
|------|------|------|
| **行数** | 4行（日付行含む） | 3行（日付行削除） |
| **日付表示** | 日別サマリーが担当 | カレンダーヘッダーが担当 |
| **縦軸整列** | 記載なし | マスト要件として明記 |
| **CSS変数** | 使用せず | --label-column-width, --date-cell-width |
| **責任分離** | 曖昧 | 明確（日付はカレンダーヘッダー） |

---

### 10.3 重要な設計判断

1. **日付行を削除した理由**
   - カレンダーヘッダーが日付を担当
   - 責任の分離（日付表示の一元化）
   - 省スペース化

2. **縦軸整列をマスト要件にした理由**
   - ユーザーの明確な要求
   - カレンダーヘッダーが「物差し」として機能
   - 視認性の向上

3. **CSS変数を使用した理由**
   - セル幅の統一
   - 保守性の向上
   - 縦軸整列の保証

---

## 📚 次に読むべきドキュメント

このドキュメントを読了したら、以下のドキュメントに進んでください。

### 関連ドキュメント

- **L3_UI_統合UI設計.md v3.0** - カレンダーヘッダーのサンドイッチ配置
- **L2_通い_UI設計.md** - 通いセクションの詳細UI（縦軸整列対応）
- **L2_泊まり_UI設計.md** - 泊まりセクションの詳細UI（縦軸整列対応）
- **L2_訪問_UI設計.md** - 訪問セクションの詳細UI（縦軸整列対応）

---

## 📝 参考資料

- L0_業務_居室管理の重要性.md（夜勤負担度の可視化）
- L0_業務_調整業務の制約.md（3サービスの同時管理）
- L1_概要_プロジェクト概要.md（制約パズル、即フィードバック）
- CHECKLIST_設計レビュー.md（設計品質の5原則）

---

## 📅 更新履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|----------|---------|------|
| 2025-11-29 | 1.0 | 初版作成（4行構成） | Claude |
| 2025-11-29 | 2.0 | 日付行削除、カレンダーヘッダー連動、縦軸整列設計 | Claude |

---

**最終更新**: 2025年11月29日  
**次回更新予定**: Phase 1実装中のフィードバック反映時

---

## ⚠️ 設計チェックリスト

このドキュメントの品質チェック（v2.0）：

- [x] 日付行の削除が反映されている
- [x] カレンダーヘッダーとの連動が設計されている
- [x] 縦軸整列の設計が具体的
- [x] CSS変数の使用が明記されている
- [x] 色分け表示の仕様が詳細
- [x] トグル機能が完全に設計されている
- [x] JavaScript クラスが設計されている
- [x] Phase 1とPhase 2の範囲が明確

---

**このドキュメントを読了したら、L3_UI_統合UI設計.md v3.0に戻り、全体像を確認してください。**