# L2_通い_UI設計

**作成日**: 2025年11月23日  
**カテゴリ**: 第2層 - セクション別  
**バージョン**: 4.0  
**更新日**: 2025年12月19日

---

## 📖 このドキュメントについて

このドキュメントは、**通いセクションのUI設計**を定義します。

### v4.0での主要な変更

1. **定員表示の削除**
   - セクション4「定員表示と視覚化」を完全削除
   - 定員管理は日別サマリーで行う

2. **操作方法の大幅変更**
   - 短押し：通い記号のトグル（○ ⇔ ◓ ⇔ ◒ ⇔ 空欄）
   - 長押し：カレンダー表示（泊まり期間の設定・編集）

3. **カレンダーUIの追加**
   - インライン配置（セルの近く）
   - 新規追加モード/編集モード
   - ボタン状態管理

4. **罫線による泊まり表現**
   - 青罫線：入所・連泊
   - 薄青罫線：退所

### 対象読者

- 通いセクションの実装担当者
- UIデザイナー
- テスト担当者

### 読了後に理解できること

- 月別予定表のグリッド構造
- 短押し/長押しの操作方法
- カレンダーUIの設計
- 罫線による泊まり表現
- **縦軸整列の設計方法**

### 設計の前提

- **L2_通い_データ構造.md v4.0** のUserScheduleDataに基づく
- **L3_UI_統合UI設計.md v3.0** のカレンダーヘッダー設計
- **L1_技術_実装制約.md** のUI/UX規約に準拠

---

## 1. 画面構成

### 1.1 全体レイアウト

```
┌─────────────────────────────────────────┐
│ [通いセクション]                         │
├─────────────────────────────────────────┤
│ 月別予定表（グリッド）                   │
│                                          │
│         25  26  27  28  29  30   1      │
│         月  火  水  木  金  土  日      │
│ 安藤    ○  ○  ○  ○   -   -   -      │
│         ━━ ━━ ━━ ━━                    │
│         青 青 青 薄青                    │
│ 田中    ◓   -   ○  ◓   -   ○   -      │
│ ...                                      │
└─────────────────────────────────────────┘
```

**注意**:
- カレンダーヘッダー（月切り替え等）は**L3_UI_統合UI設計.md**で定義
- 定員表示は削除（日別サマリーで管理）
- ここでは通いセクション固有のUIのみ記載

---

### 1.2 HTML構造

```html
<div id="kayoi-section" class="section">
  <!-- 月別予定表 -->
  <div class="schedule-grid-container">
    <table id="kayoi-grid" class="schedule-grid">
      <thead>
        <tr>
          <th class="user-header">利用者</th>
          <th class="date-header" data-date="2025-11-25">
            <div class="date">25</div>
            <div class="day">月</div>
          </th>
          <!-- ...他の日付 -->
        </tr>
      </thead>
      <tbody>
        <tr data-user-id="user001">
          <td class="user-cell">安藤</td>
          <td class="schedule-cell" 
              data-user-id="user001" 
              data-date="2025-11-25"
              data-border-state="stay">
            <span class="symbol">○</span>
          </td>
          <!-- ...他の日付 -->
        </tr>
        <!-- ...他の利用者 -->
      </tbody>
    </table>
  </div>
</div>

<!-- カレンダーダイアログ（動的に表示） -->
<div id="tomari-calendar" class="calendar-dialog" style="display: none;">
  <!-- カレンダー内容は後述 -->
</div>
```

---

## 2. セル表示

### 2.1 記号（通い情報）

| 記号 | 意味 | 使用頻度 |
|------|------|---------|
| **空欄** | 利用なし | 高 |
| **○** | 通い終日 | 高 |
| **◓** | 通い前半 | 低 |
| **◒** | 通い後半 | 低 |

---

### 2.2 罫線（泊まり情報）

| 罫線 | 色 | 意味 |
|------|----|----|
| **通常** | 灰色・細い | 泊まりなし |
| **青・太い** | `#2196f3`・4px | 入所・連泊 |
| **薄青・太い** | `rgba(33, 150, 243, 0.3)`・4px | 退所 |

**CSS**:
```css
/* 通常の罫線 */
.schedule-cell {
  border-bottom: 1px solid #ddd;
}

/* 入所・連泊（青） */
.schedule-cell[data-border-state="stay"] {
  border-bottom: 4px solid #2196f3;
}

/* 退所（薄青） */
.schedule-cell[data-border-state="checkout"] {
  border-bottom: 4px solid rgba(33, 150, 243, 0.3);
}
```

---

### 2.3 視覚例

```
         25  26  27  28
安藤    ○  ○  ○  ○
        ━━ ━━ ━━ ━━
        青 青 青 薄青

説明:
- 25-28日に泊まり
- 25日: 入所（青罫線）+ 通い終日（○）
- 26-27日: 連泊中（青罫線）+ 通い終日（○）
- 28日: 退所（薄青罫線）+ 通い終日（○）
```

---

## 3. インタラクション

### 3.1 短押し：通い記号の切り替え

#### 状態遷移図

```
最もよく使われるのは終日(○)なので、最初に配置

┌─────┐   短押し   ┌─────┐
│ 空欄 │ ────────→ │ 終日 │
└─────┘             └─────┘
   ↑                    │
   │                    │ 短押し
   │                    ↓
   │                ┌─────┐
   │                │ 前半 │
   │                └─────┘
   │                    │
   │                    │ 短押し
   │                    ↓
   │                ┌─────┐
   │                │ 後半 │
   │                └─────┘
   │                    │
   │     短押し         │
   └────────────────────┘

記号の対応:
空欄 → ○ → ◓ → ◒ → 空欄
```

---

#### 短押しイベントの処理

```javascript
function handleCellClick(event) {
  const cell = event.target.closest('.schedule-cell');
  if (!cell) return;
  
  const userId = cell.dataset.userId;
  const date = cell.dataset.date;
  
  // 現在の状態を取得
  const currentSymbol = cell.querySelector('.symbol').textContent;
  
  // 次の状態を決定
  let nextSymbol;
  if (currentSymbol === '-' || currentSymbol === '') {
    nextSymbol = '○'; // 空欄 → 終日
  } else if (currentSymbol === '○') {
    nextSymbol = '◓'; // 終日 → 前半
  } else if (currentSymbol === '◓') {
    nextSymbol = '◒'; // 前半 → 後半
  } else if (currentSymbol === '◒') {
    nextSymbol = '-'; // 後半 → 空欄
  }
  
  // データ更新
  updateKayoi(userId, date, getKayoiType(nextSymbol));
  
  // 表示更新
  cell.querySelector('.symbol').textContent = nextSymbol;
  
  // アニメーション
  cell.classList.add('updated');
  setTimeout(() => cell.classList.remove('updated'), 200);
}

function getKayoiType(symbol) {
  if (symbol === '○') return '終日';
  if (symbol === '◓') return '前半';
  if (symbol === '◒') return '後半';
  return null;  // 空欄
}
```

---

#### カーソル形状

```css
.schedule-cell {
  cursor: pointer;
}

.schedule-cell:hover {
  cursor: pointer;
  background-color: rgba(33, 150, 243, 0.05);
}
```

---

### 3.2 長押し：カレンダー表示

#### 長押し検出

```javascript
let longPressTimer;
const LONG_PRESS_DURATION = 800; // 0.8秒

cell.addEventListener('mousedown', (e) => {
  // タイマー開始
  longPressTimer = setTimeout(() => {
    handleLongPress(e);
  }, LONG_PRESS_DURATION);
});

cell.addEventListener('mouseup', () => {
  // タイマーをクリア（短押し）
  clearTimeout(longPressTimer);
});

cell.addEventListener('mouseleave', () => {
  // マウスが離れたらキャンセル
  clearTimeout(longPressTimer);
});
```

---

#### 長押し時の処理

```javascript
function handleLongPress(event) {
  const cell = event.target.closest('.schedule-cell');
  if (!cell) return;
  
  const userId = cell.dataset.userId;
  const date = cell.dataset.date;
  const userData = getUserData(userId);
  
  // カレンダーを表示
  if (userData.tomariPeriod) {
    // 編集モード
    showCalendarEditMode(cell, userId, date, userData.tomariPeriod);
  } else {
    // 新規追加モード
    showCalendarAddMode(cell, userId, date);
  }
}
```

---

## 4. カレンダーUI設計

### 4.1 配置

**インライン配置（セルの近く）**

```javascript
function positionCalendar(calendar, cell) {
  const cellRect = cell.getBoundingClientRect();
  
  // 基本位置：セルの右下
  let left = cellRect.right + 10;
  let top = cellRect.top;
  
  // 画面端チェック（はみ出す場合は調整）
  const calendarWidth = 260;
  const calendarHeight = 300;
  
  if (left + calendarWidth > window.innerWidth) {
    left = cellRect.left - calendarWidth - 10; // 左側に表示
  }
  
  if (top + calendarHeight > window.innerHeight) {
    top = window.innerHeight - calendarHeight - 10; // 上に調整
  }
  
  calendar.style.left = left + 'px';
  calendar.style.top = top + 'px';
  calendar.style.display = 'block';
}
```

---

### 4.2 カレンダーHTML構造

```html
<div id="tomari-calendar" class="calendar-dialog">
  <div class="calendar-header">
    <button class="month-nav prev">◀</button>
    <span class="month-title">2025年 11月</span>
    <button class="month-nav next">▶</button>
  </div>
  
  <div class="calendar-body">
    <table class="calendar-table">
      <thead>
        <tr>
          <th>日</th>
          <th>月</th>
          <th>火</th>
          <th>水</th>
          <th>木</th>
          <th>金</th>
          <th>土</th>
        </tr>
      </thead>
      <tbody>
        <!-- カレンダーの日付セル -->
        <tr>
          <td class="calendar-cell" data-date="2025-11-01">1</td>
          <!-- ... -->
        </tr>
      </tbody>
    </table>
  </div>
  
  <div class="calendar-footer">
    <button id="calendar-clear-btn">クリア</button>
    <button id="calendar-confirm-btn">戻る</button>
  </div>
</div>
```

---

### 4.3 カレンダーのCSS

```css
.calendar-dialog {
  position: fixed;
  width: 260px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: none;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.month-nav {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
}

.month-title {
  font-weight: 600;
  font-size: 14px;
}

.calendar-body {
  padding: 12px;
}

.calendar-table {
  width: 100%;
  border-collapse: collapse;
}

.calendar-table th {
  font-size: 12px;
  font-weight: 600;
  padding: 4px;
  text-align: center;
  color: #666;
}

.calendar-cell {
  width: 32px;
  height: 32px;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  font-size: 13px;
  border-radius: 4px;
  transition: background-color 0.15s;
}

.calendar-cell:hover {
  background-color: #e3f2fd;
}

/* 起点（選択開始日） */
.calendar-cell.origin {
  background-color: #fff176;
  font-weight: 600;
}

/* 入所日（青枠） */
.calendar-cell.checkin {
  border: 2px solid #2196f3;
  background-color: #e3f2fd;
}

/* 退所日（薄青枠） */
.calendar-cell.checkout {
  border: 2px solid rgba(33, 150, 243, 0.5);
  background-color: rgba(227, 242, 253, 0.5);
}

/* 期間内（青塗り） */
.calendar-cell.in-period {
  background-color: #bbdefb;
}

.calendar-footer {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  border-top: 1px solid #ddd;
}

.calendar-footer button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.15s;
}

#calendar-clear-btn {
  background-color: white;
  color: #d32f2f;
}

#calendar-clear-btn:hover {
  background-color: #ffebee;
}

#calendar-confirm-btn {
  background-color: #2196f3;
  color: white;
  border-color: #2196f3;
}

#calendar-confirm-btn:hover {
  background-color: #1976d2;
}
```

---

## 5. カレンダーの動作

### 5.1 新規追加モード

#### 初期状態

```
長押ししたセルの日付が「起点」として黄色表示

┌──────────────────┐
│  2025年 11月  ◀▶ │
├──────────────────┤
│日 月 火 水 木 金 土│
│         1  2  3  4│
│ 5  6  7  8  9 10 11│
│12 13 14 ●15 16 17 18│ ← ●起点（黄色）
│19 20 21 22 23 24 25│
│26 27 28 29 30      │
├──────────────────┤
│[クリア]    [戻る] │
└──────────────────┘
```

---

#### 起点より前の日をクリック

```
起点が退所日（薄青枠）に変わる
クリック日が入所日（青枠）になる
期間が青く塗られる

12をクリック:
┌──────────────────┐
│  2025年 11月  ◀▶ │
├──────────────────┤
│日 月 火 水 木 金 土│
│         1  2  3  4│
│ 5  6  7  8  9 10 11│
│■12 13 14 □15 16 17 18│ ← ■入所 □退所
│19 20 21 22 23 24 25│
│                     │
│ 12〜15が青く塗られる│
├──────────────────┤
│[クリア]    [確定] │ ← ボタン変化
└──────────────────┘
```

---

#### 起点より後の日をクリック

```
起点が入所日（青枠）になる
クリック日が退所日（薄青枠）になる
期間が青く塗られる

18をクリック:
┌──────────────────┐
│  2025年 11月  ◀▶ │
├──────────────────┤
│日 月 火 水 木 金 土│
│         1  2  3  4│
│ 5  6  7  8  9 10 11│
│12 13 14 ■15 16 17 □18│ ← ■入所 □退所
│19 20 21 22 23 24 25│
│                     │
│ 15〜18が青く塗られる│
├──────────────────┤
│[クリア]    [確定] │
└──────────────────┘
```

---

### 5.2 編集モード

#### 初期状態

```
既存の泊まり期間が表示される
入所日: 青枠
退所日: 薄青枠
期間: 青塗り

┌──────────────────┐
│  2025年 11月  ◀▶ │
├──────────────────┤
│日 月 火 水 木 金 土│
│         1  2  3  4│
│ 5  6  7  8  9 10 11│
│■12 13 14 15 16 17 □18│ ← ■入所 □退所
│19 20 21 22 23 24 25│
│                     │
│ 12〜18が青く塗られる│
├──────────────────┤
│[クリア]    [戻る] │
└──────────────────┘
```

---

#### 日付をクリックして変更

```javascript
function handleCalendarCellClick(event, mode, state) {
  const cell = event.target;
  const clickedDate = cell.dataset.date;
  
  if (mode === 'add') {
    // 新規追加モード
    if (clickedDate < state.origin) {
      // 起点より前 → 起点が退所日
      state.checkInDate = clickedDate;
      state.checkOutDate = state.origin;
    } else if (clickedDate > state.origin) {
      // 起点より後 → 起点が入所日
      state.checkInDate = state.origin;
      state.checkOutDate = clickedDate;
    }
    
    // ボタンを「確定」に変更
    updateButtons(state);
    
  } else if (mode === 'edit') {
    // 編集モード
    // どちらかの枠に近い方を変更
    const distToCheckIn = Math.abs(
      dateDiff(clickedDate, state.checkInDate)
    );
    const distToCheckOut = Math.abs(
      dateDiff(clickedDate, state.checkOutDate)
    );
    
    if (distToCheckIn < distToCheckOut) {
      state.checkInDate = clickedDate;
    } else {
      state.checkOutDate = clickedDate;
    }
    
    // ボタンを更新
    updateButtons(state);
  }
  
  // カレンダー再描画
  renderCalendar(state);
}
```

---

### 5.3 ボタン状態管理

#### ボタンラベルの判定

```javascript
function updateButtons(state) {
  const clearBtn = document.getElementById('calendar-clear-btn');
  const confirmBtn = document.getElementById('calendar-confirm-btn');
  
  // 左ボタン（クリア/元に戻す）
  if (state.isCleared) {
    clearBtn.textContent = '元に戻す';
  } else {
    clearBtn.textContent = 'クリア';
  }
  
  // 右ボタン（確定/戻る）
  const hasChanges = 
    state.isCleared ||
    state.checkInDate !== state.originalCheckInDate ||
    state.checkOutDate !== state.originalCheckOutDate;
  
  if (hasChanges) {
    confirmBtn.textContent = '確定';
  } else {
    confirmBtn.textContent = '戻る';
  }
}
```

---

#### クリアボタンの処理

```javascript
clearBtn.addEventListener('click', () => {
  if (state.isCleared) {
    // 元に戻す
    state.checkInDate = state.originalCheckInDate;
    state.checkOutDate = state.originalCheckOutDate;
    state.isCleared = false;
  } else {
    // クリア
    state.isCleared = true;
    // 期間を薄く表示
    markPeriodAsDeleting(state);
  }
  
  updateButtons(state);
  renderCalendar(state);
});
```

---

#### 確定/戻るボタンの処理

```javascript
confirmBtn.addEventListener('click', () => {
  if (confirmBtn.textContent === '確定') {
    // 変更を確定
    if (state.isCleared) {
      // 泊まり期間削除
      clearTomariPeriod(state.userId);
    } else {
      // 泊まり期間更新
      setTomariPeriod(
        state.userId,
        state.checkInDate,
        state.checkOutDate
      );
    }
    
    // カレンダーを閉じる
    hideCalendar();
    
    // グリッドを再描画
    refreshGrid();
    
  } else {
    // 戻る（キャンセル）
    hideCalendar();
  }
});
```

---

## 6. 縦軸整列の設計

### 6.1 縦軸整列の要件（マスト）

**ユーザーの要求**:
> 「ピッタリ縦軸がそろっていることはマストだ。そうでないと見づらくてしょうがない」

**縦軸整列の対象**:
1. カレンダーヘッダー（日付・曜日）
2. 日別サマリー（通い・泊まり・訪問の数値）
3. 通いグリッド（この列）

---

### 6.2 CSS変数による統一

```css
:root {
  /* 縦軸整列のための共通変数 */
  --label-column-width: 80px;  /* 利用者名列 */
  --date-cell-width: 40px;     /* 日付セル */
}

/* 通いグリッド */
#kayoi-grid {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* 重要: 幅を固定 */
}

#kayoi-grid .user-header {
  width: var(--label-column-width);
}

#kayoi-grid .date-header,
#kayoi-grid .schedule-cell {
  min-width: var(--date-cell-width);
  width: var(--date-cell-width);
}
```

---

### 6.3 カレンダーヘッダーとの同期

**L3_UI_統合UI設計.md**で定義されたカレンダーヘッダーと同じCSS変数を使用：

```css
/* カレンダーヘッダー（L3で定義） */
.calendar-header .date-cell {
  min-width: var(--date-cell-width);
  width: var(--date-cell-width);
}

/* 通いグリッド（このドキュメント） */
#kayoi-grid .schedule-cell {
  min-width: var(--date-cell-width);
  width: var(--date-cell-width);
}

→ 両方が同じ幅になる
```

---

## 7. アニメーション

### 7.1 セル更新時のフェード

```css
.schedule-cell.updated {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    background-color: rgba(33, 150, 243, 0.3);
  }
  to {
    background-color: transparent;
  }
}
```

---

### 7.2 カレンダー表示時のフェード

```css
.calendar-dialog {
  animation: slideIn 0.15s ease;
}

@keyframes slideIn {
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

## 8. まとめ

### 8.1 v4.0の主な変更点

| 項目 | v3.0 | v4.0 |
|------|------|------|
| 定員表示 | あり | **削除** |
| 短押し | ○→◓→◒→空欄 | 同じ |
| 長押し | なし | **カレンダー表示** |
| 泊まり表現 | なし | **罫線（青/薄青）** |
| 操作の複雑さ | 低 | 中（カレンダー追加） |

---

### 8.2 設計の意図

1. **定員表示の削除**
   - 日別サマリーで十分
   - 画面をシンプルに

2. **長押しでカレンダー**
   - 泊まりの量を通いタブで調整
   - 目で見て期間を設定できる

3. **罫線で泊まり表現**
   - 記号とバッティングしない
   - 視覚的に分かりやすい

---

### 8.3 実装の優先順位

**Phase 1（必須）**:
- ✅ グリッド表示
- ✅ 短押し処理
- ✅ 罫線表示
- ✅ 長押し＋カレンダー
- ✅ 縦軸整列

**Phase 2（拡張）**:
- ⏭️ ドラッグ操作
- ⏭️ キーボード操作
- ⏭️ 右クリックメニュー

---

## 📚 次に読むべきドキュメント

このドキュメントを読了したら、以下のドキュメントに進んでください。

### 関連ドキュメント

- **L2_通い_ロジック設計.md v3.0** - 長押し処理、カレンダーロジック
- **L3_UI_統合UI設計.md v3.0** - カレンダーヘッダー、全体レイアウト
- **U3_UI_日別サマリー.md v2.0** - 日別サマリーの詳細
- **L2_通い_データ構造.md v4.0** - UserScheduleDataの仕様

---

## 📝 参考資料

- L2_通い_データ構造.md v4.0（データ構造）
- L3_UI_統合UI設計.md v3.0（カレンダーヘッダー）
- U3_UI_日別サマリー.md v2.0（縦軸整列）
- L1_技術_実装制約.md（UI/UX規約）
- CHECKLIST_設計レビュー.md（インタラクションの詳細記述）

---

## 📅 更新履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|----------|---------|------|
| 2025-11-23 | 1.0 | 初版作成 | Claude |
| 2025-11-23 | 2.0 | 詳細設計追加（933行） | Claude |
| 2025-11-29 | 3.0 | 縦軸整列追加、スリム化（約400行） | Claude |
| 2025-12-19 | 4.0 | 長押しカレンダー、罫線表現、定員表示削除 | Claude |

---

**最終更新**: 2025年12月19日  
**次回更新予定**: Phase 1実装中のフィードバック反映時

---

## ⚠️ 設計チェックリスト

このドキュメントの品質チェック（v4.0）：

- [x] セクション固有の内容に特化している
- [x] 縦軸整列の設計が詳細に記述されている
- [x] CSS変数の使用が明記されている
- [x] すべてのインタラクションが具体的に記述されている
- [x] カーソルの形状が定義されている
- [x] 状態遷移図が作成されている
- [x] 長押し処理が詳細に記述されている
- [x] カレンダーUIが完全に設計されている
- [x] ボタン状態管理が明確

---

**このドキュメントを読了したら、INDEX_ドキュメント構成.md に戻り、次のドキュメントに進んでください。**