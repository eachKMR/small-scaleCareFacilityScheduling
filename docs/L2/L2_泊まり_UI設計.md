# L2_泊まり_UI設計

**作成日**: 2025年11月23日  
**カテゴリ**: 第2層 - セクション別  
**バージョン**: 1.0

---

## 📖 このドキュメントについて

このドキュメントは、**泊まりセクションのUI設計**を定義します。

### 対象読者

- 泊まりセクションの実装担当者
- UIデザイナー
- テスト担当者

### 読了後に理解できること

- 居室軸の月別予定表のグリッド構造
- 期間選択の方法（ドラッグ等）
- 記号（入・○・退）と利用者名の表示
- 定員表示と視覚化
- カレンダー操作
- 印刷レイアウト

### 設計の前提

- **L2_泊まり_データ構造.md** のTomariReservationクラスに基づく
- **L1_技術_実装制約.md** のUI/UX規約に準拠

---

## 1. 画面構成

### 1.1 全体レイアウト

```
┌─────────────────────────────────────────┐
│ [泊まりセクション]                       │
├─────────────────────────────────────────┤
│ カレンダーヘッダー                       │
│ [◀] 2025年11月 [▶]  [今月]             │
├─────────────────────────────────────────┤
│ 定員表示                                 │
│ 本日: 7/9人  明日: 9/9人  明後日: 6/9人 │
├─────────────────────────────────────────┤
│ 月別予定表（グリッド）                   │
│                                          │
│          1   2   3   4   5   6   7      │
│         月  火  水  木  金  土  日      │
│ 1号室   入山 ○山 ○山 退山  空   入田 ○田│
│ 2号室   ○内 ○内 ○内 ○内 ○内 ○内 ○内│
│ 3号室   退木  空   空  入花 ○花 ○花 退花│
│ ...                                      │
├─────────────────────────────────────────┤
│ アクション                               │
│ [予約追加] [CSVインポート] [印刷]        │
└─────────────────────────────────────────┘
```

---

### 1.2 HTML構造

```html
<div id="tomari-section" class="section">
  <!-- カレンダーヘッダー -->
  <div class="calendar-header">
    <button id="prev-month" class="nav-button">◀</button>
    <h2 id="current-month">2025年11月</h2>
    <button id="next-month" class="nav-button">▶</button>
    <button id="today-button" class="nav-button">今月</button>
  </div>
  
  <!-- 定員表示 -->
  <div class="capacity-display">
    <div class="capacity-item">
      <span class="label">本日:</span>
      <span id="today-count" class="count">7</span>
      <span class="max">/9人</span>
    </div>
    <div class="capacity-item">
      <span class="label">明日:</span>
      <span id="tomorrow-count" class="count">9</span>
      <span class="max">/9人</span>
    </div>
    <div class="capacity-item">
      <span class="label">明後日:</span>
      <span id="day-after-tomorrow-count" class="count">6</span>
      <span class="max">/9人</span>
    </div>
  </div>
  
  <!-- 月別予定表 -->
  <div class="schedule-grid-container">
    <table id="tomari-grid" class="schedule-grid">
      <thead>
        <tr>
          <th class="room-header">居室</th>
          <th class="date-header" data-date="2025-11-01">
            <div class="date">1</div>
            <div class="day">月</div>
            <div class="count">7/9</div>
          </th>
          <!-- ...他の日付 -->
        </tr>
      </thead>
      <tbody>
        <tr data-room-id="room01">
          <td class="room-cell">1号室</td>
          <td class="schedule-cell" 
              data-room-id="room01" 
              data-date="2025-11-01"
              data-reservation-id="tomari_001">
            <div class="symbol">入</div>
            <div class="user-name">山田</div>
          </td>
          <!-- ...他の日付 -->
        </tr>
        <!-- ...他の居室 -->
      </tbody>
    </table>
  </div>
  
  <!-- アクション -->
  <div class="actions">
    <button id="add-reservation">予約追加</button>
    <button id="import-csv">CSVインポート</button>
    <button id="print">印刷</button>
  </div>
</div>
```

---

## 2. グリッド表示

### 2.1 セルの構造

#### 居室セル（縦軸）

```html
<td class="room-cell" data-room-id="room01">
  <span class="room-name">1号室</span>
</td>
```

**スタイル**:
```css
.room-cell {
  background-color: #f5f5f5;
  font-weight: bold;
  text-align: left;
  padding: 8px;
  border: 1px solid #ddd;
  cursor: default;
  min-width: 80px;
}
```

---

#### 日付ヘッダー（横軸）

```html
<th class="date-header" data-date="2025-11-01">
  <div class="date">1</div>
  <div class="day">月</div>
  <div class="count">7/9</div>
</th>
```

**スタイル**:
```css
.date-header {
  background-color: #f5f5f5;
  text-align: center;
  padding: 8px;
  border: 1px solid #ddd;
  min-width: 60px;
}

.date-header .date {
  font-size: 16px;
  font-weight: bold;
}

.date-header .day {
  font-size: 12px;
  color: #666;
}

.date-header .count {
  font-size: 10px;
  color: #999;
  margin-top: 2px;
}

/* 土曜日 */
.date-header.saturday .day {
  color: #0066cc;
}

/* 日曜日 */
.date-header.sunday .day {
  color: #cc0000;
}

/* 定員状態の色分け */
.date-header.normal .count {
  color: #666;
}

.date-header.warning .count {
  color: #ff9800;
  font-weight: bold;
}

.date-header.full .count {
  color: #f44336;
  font-weight: bold;
}
```

---

#### スケジュールセル

```html
<td class="schedule-cell" 
    data-room-id="room01" 
    data-date="2025-11-01"
    data-reservation-id="tomari_001">
  <div class="symbol">入</div>
  <div class="user-name">山田</div>
</td>
```

**スタイル**:
```css
.schedule-cell {
  text-align: center;
  padding: 4px;
  border: 1px solid #ddd;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-width: 60px;
  height: 50px;
  position: relative;
}

.schedule-cell:hover {
  background-color: rgba(0, 123, 255, 0.1);
}

.schedule-cell .symbol {
  font-size: 14px;
  font-weight: bold;
  display: block;
}

.schedule-cell .user-name {
  font-size: 11px;
  color: #666;
  display: block;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 空室 */
.schedule-cell.empty {
  background-color: #fafafa;
}

.schedule-cell.empty .symbol {
  color: #ccc;
}

/* 予約あり */
.schedule-cell.occupied {
  background-color: #e3f2fd;
}

/* 入所日 */
.schedule-cell.check-in {
  border-left: 3px solid #2196f3;
}

/* 退所日 */
.schedule-cell.check-out {
  border-right: 3px solid #2196f3;
}

/* 選択中 */
.schedule-cell.selected {
  background-color: rgba(33, 150, 243, 0.3);
  border: 2px solid #2196f3;
}
```

---

### 2.2 記号と利用者名の表示

| 記号 | 意味 | HTML |
|------|------|------|
| **入** | 入所（startDate） | `<div class="symbol">入</div><div class="user-name">山田</div>` |
| **○** | 宿泊継続中 | `<div class="symbol">○</div><div class="user-name">山田</div>` |
| **退** | 退所（endDate） | `<div class="symbol">退</div><div class="user-name">山田</div>` |
| **空** | 空室 | `<div class="symbol">-</div>` |

**利用者名の表示**:
- 入所～退所まで、すべてのセルに利用者名を表示
- 長い名前は省略表示（`text-overflow: ellipsis`）

---

## 3. インタラクション

### 3.1 予約の追加（期間選択）

#### 方法1: ドラッグで期間選択

**操作**:
```
1. 空室のセルでマウスダウン（開始日）
   ↓
2. マウスを横方向に移動（終了日まで）
   ↓
3. マウスアップ（終了日）
   ↓
4. 利用者選択ダイアログ表示
   ↓
5. 利用者を選択 → 予約追加
```

**視覚的フィードバック**:
```css
/* ドラッグ中のセルをハイライト */
.schedule-cell.dragging {
  background-color: rgba(33, 150, 243, 0.2);
  border: 1px dashed #2196f3;
}
```

---

#### 方法2: クリック＋ダイアログ

**操作**:
```
1. 空室のセルをクリック
   ↓
2. 予約追加ダイアログ表示
   - 利用者選択
   - 入所日（クリックした日付がデフォルト）
   - 退所日
   ↓
3. [追加] ボタン → 予約追加
```

**ダイアログのHTML例**:
```html
<div class="dialog" id="add-reservation-dialog">
  <div class="dialog-content">
    <h3>予約追加</h3>
    
    <label>利用者:</label>
    <select id="user-select">
      <option value="user001">山田太郎</option>
      <option value="user002">田中花子</option>
      <!-- ... -->
    </select>
    
    <label>居室:</label>
    <input type="text" id="room-input" readonly value="1号室">
    
    <label>入所日:</label>
    <input type="date" id="start-date-input" value="2025-11-01">
    
    <label>退所日:</label>
    <input type="date" id="end-date-input" value="2025-11-03">
    
    <div class="dialog-actions">
      <button id="cancel-btn">キャンセル</button>
      <button id="add-btn">追加</button>
    </div>
  </div>
</div>
```

---

#### 代替手段の重要性

⚠️ **ドラッグ操作だけではNG**

**理由**:
- ドラッグが苦手なユーザーがいる
- タッチデバイスでは難しい
- アクセシビリティの観点

**必ず提供すべき代替手段**:
1. クリック＋ダイアログ
2. [予約追加]ボタン → フォーム入力
3. 右クリックメニュー

---

### 3.2 予約の編集

#### 操作

**方法1: セルをクリック**
```
1. 予約ありのセルをクリック
   ↓
2. 予約編集ダイアログ表示
   - 利用者名（表示のみ）
   - 入所日（編集可）
   - 退所日（編集可）
   ↓
3. [更新] ボタン → 予約更新
```

**方法2: 期間の端をドラッグ**
```
1. 入所日のセル（"入"）をドラッグ
   ↓
2. 左右に移動して入所日を変更
   ↓
3. マウスアップ → 予約更新
```

同様に退所日のセル（"退"）もドラッグで変更可能

---

### 3.3 予約の削除

#### 操作

**方法1: セルを右クリック**
```
1. 予約ありのセルを右クリック
   ↓
2. コンテキストメニュー表示
   - 「予約を削除」
   ↓
3. 確認ダイアログ
   「山田さんの予約（11/1～11/3）を削除しますか？」
   ↓
4. [削除] → 予約削除
```

**方法2: 編集ダイアログから削除**
```
1. セルをクリック → 編集ダイアログ
   ↓
2. [削除] ボタン → 確認ダイアログ
   ↓
3. [削除] → 予約削除
```

---

### 3.4 キーボード操作

#### サポートするキー（Phase 2以降）

| キー | 動作 |
|------|------|
| **矢印キー** | セル間の移動 |
| **Enter** | 選択中のセルで予約追加/編集 |
| **Delete** | 選択中の予約を削除 |

**Phase 1では優先度低** - マウス操作を優先

---

## 4. 定員表示と視覚化

### 4.1 定員表示エリア

```html
<div class="capacity-display">
  <div class="capacity-item">
    <span class="label">本日:</span>
    <span id="today-count" class="count">7</span>
    <span class="max">/9人</span>
  </div>
  <!-- 明日、明後日も同様 -->
</div>
```

---

### 4.2 日付ヘッダーの定員表示

**ルール**: 各日付の列上部に「○/9人」を表示

```html
<th class="date-header" data-date="2025-11-01">
  <div class="date">1</div>
  <div class="day">月</div>
  <div class="count">7/9</div>
</th>
```

---

### 4.3 定員状態の色分け

#### ルール

| 状態 | 宿泊者数 | 色 | クラス |
|------|---------|-----|--------|
| **余裕あり** | 0-6人 | 通常（灰色） | `.normal` |
| **ギリギリ** | 7-8人 | 橙色 | `.warning` |
| **満員** | 9人 | 赤色 | `.full` |
| **超過** | 10人以上 | 濃い赤 | `.over` |

#### スタイル

```css
/* 日付ヘッダーの定員カウント */
.date-header .count {
  font-size: 10px;
  margin-top: 2px;
}

.date-header.normal .count {
  color: #666;
}

.date-header.warning .count {
  color: #ff9800;
  font-weight: bold;
}

.date-header.full .count {
  color: #f44336;
  font-weight: bold;
}

.date-header.over .count {
  color: #d32f2f;
  font-weight: bold;
  background-color: rgba(244, 67, 54, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
}
```

---

### 4.4 列全体の色分け（定員超過時）

**ルール**: 定員80%以上の日は、列全体に薄く色を付ける

```css
/* 定員80%以上（7-8人） */
.date-column.warning {
  background-color: rgba(255, 152, 0, 0.05);
}

/* 満員（9人） */
.date-column.full {
  background-color: rgba(244, 67, 54, 0.1);
}

/* 超過（10人以上） */
.date-column.over {
  background-color: rgba(211, 47, 47, 0.15);
}
```

**実装方法**:
```javascript
function updateColumnColor(date, count) {
  const cells = document.querySelectorAll(`[data-date="${date}"]`);
  
  // クラスをリセット
  cells.forEach(cell => {
    cell.classList.remove('normal', 'warning', 'full', 'over');
  });
  
  // 新しいクラスを追加
  let className;
  if (count >= 10) {
    className = 'over';
  } else if (count === 9) {
    className = 'full';
  } else if (count >= 7) {
    className = 'warning';
  } else {
    className = 'normal';
  }
  
  cells.forEach(cell => {
    cell.classList.add(className);
  });
}
```

---

### 4.5 定員超過時の挙動

**重要**: 定員超過でも予約追加・保存は可能（弾力運用）

```javascript
function addReservation(userId, roomId, startDate, endDate) {
  // バリデーション
  const validation = validate(userId, roomId, startDate, endDate);
  if (!validation.valid) {
    showError(validation.errors);
    return;
  }
  
  // 定員チェック（警告のみ、ブロックしない）
  const capacity = checkCapacity(startDate, endDate);
  if (!capacity.ok) {
    // ⚠️ 警告を表示するが、処理は続行
    showWarning(capacity.message);
  }
  
  // 予約追加（定員超過でも追加）
  const reservation = new TomariReservation({ userId, roomId, startDate, endDate });
  reservations.push(reservation);
  
  // UI更新
  render();
  save();
}
```

**視覚的フィードバック**:
- 定員超過の日は、列全体が濃い赤になる
- トースト通知は表示しない（色分けで十分）

---

## 5. カレンダー操作

### 5.1 月の切り替え

#### ボタン

```html
<button id="prev-month" class="nav-button">◀</button>
<h2 id="current-month">2025年11月</h2>
<button id="next-month" class="nav-button">▶</button>
<button id="today-button" class="nav-button">今月</button>
```

#### イベント処理

```javascript
document.getElementById('prev-month').addEventListener('click', () => {
  currentMonth = addMonths(currentMonth, -1);
  renderCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
  currentMonth = addMonths(currentMonth, 1);
  renderCalendar();
});

document.getElementById('today-button').addEventListener('click', () => {
  currentMonth = new Date();
  renderCalendar();
});
```

---

### 5.2 月の表示範囲

**ルール**: 当月の1日から末日まで表示

```
例: 2025年11月を選択
→ 2025年11月1日 ～ 2025年11月30日 を表示
```

**理由**: 請求の単位が1日～末日だから

---

## 6. フィードバック

### 6.1 トースト通知

#### 表示タイミング（最小限）

| イベント | メッセージ | タイプ |
|---------|----------|--------|
| 予約追加成功 | 「予約を追加しました」 | info |
| 予約削除成功 | 「予約を削除しました」 | info |
| バリデーションエラー | 「退所日は入所日より後である必要があります」 | error |
| CSVインポート成功 | 「○件の予約をインポートしました」 | success |

**注意**: 定員超過の警告はトースト表示しない（色分けで十分）

---

### 6.2 セルのアニメーション

**予約追加・更新時の視覚的フィードバック**:

```css
.schedule-cell.updated {
  animation: pulse 0.3s ease;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

---

### 6.3 期間選択中のフィードバック

**ドラッグ中の表示**:

```css
.schedule-cell.selecting {
  background-color: rgba(33, 150, 243, 0.2);
  border: 1px dashed #2196f3;
}
```

**JavaScript**:
```javascript
let isDragging = false;
let startCell = null;
let currentCells = [];

grid.addEventListener('mousedown', (e) => {
  const cell = e.target.closest('.schedule-cell');
  if (!cell || !cell.classList.contains('empty')) return;
  
  isDragging = true;
  startCell = cell;
  cell.classList.add('selecting');
  currentCells = [cell];
});

grid.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  
  const cell = e.target.closest('.schedule-cell');
  if (!cell || cell === startCell) return;
  
  // 同じ居室の横方向のセルのみ選択
  if (cell.dataset.roomId !== startCell.dataset.roomId) return;
  
  // 既存の選択をクリア
  currentCells.forEach(c => c.classList.remove('selecting'));
  
  // 開始セルから現在のセルまでを選択
  currentCells = getCellsInRange(startCell, cell);
  currentCells.forEach(c => c.classList.add('selecting'));
});

grid.addEventListener('mouseup', (e) => {
  if (!isDragging) return;
  
  isDragging = false;
  
  // 選択解除
  currentCells.forEach(c => c.classList.remove('selecting'));
  
  // 利用者選択ダイアログを表示
  showUserSelectDialog(startCell, currentCells);
});
```

---

## 7. 印刷レイアウト

### 7.1 印刷用スタイル

```css
@media print {
  /* ヘッダー・フッターを非表示 */
  .calendar-header,
  .actions {
    display: none;
  }
  
  /* 定員表示を印刷 */
  .capacity-display {
    display: block;
    margin-bottom: 10px;
  }
  
  /* グリッドを最適化 */
  .schedule-grid {
    width: 100%;
    font-size: 9pt;
  }
  
  .schedule-cell {
    padding: 2px;
  }
  
  /* 改ページを防ぐ */
  .schedule-grid tr {
    page-break-inside: avoid;
  }
  
  /* 色分けを白黒印刷でも見やすく */
  .date-header.warning .count {
    border: 1px solid #999;
  }
  
  .date-header.full .count {
    border: 2px solid #000;
  }
}
```

---

### 7.2 印刷範囲

**1ページに収める内容**:
- 定員表示
- 月別予定表（横30～31日分 × 縦9居室）

**A4横向き**を推奨

---

## 8. レスポンシブ対応

### 8.1 画面サイズ別の対応

#### デスクトップ（1366px以上）

```css
.schedule-grid {
  font-size: 12px;
}

.schedule-cell {
  min-width: 60px;
  height: 50px;
}
```

---

#### タブレット（768px-1365px）

```css
@media (max-width: 1365px) {
  .schedule-grid {
    font-size: 11px;
  }
  
  .schedule-cell {
    min-width: 50px;
    height: 45px;
  }
}
```

---

#### スマートフォン（767px以下）

```css
@media (max-width: 767px) {
  /* 横スクロールを許可 */
  .schedule-grid-container {
    overflow-x: auto;
  }
  
  .schedule-grid {
    font-size: 10px;
    min-width: 800px;
  }
  
  .schedule-cell {
    min-width: 45px;
    height: 40px;
  }
}
```

**Phase 1ではデスクトップを優先** - スマホ対応は Phase 2以降

---

## 9. アクセシビリティ

### 9.1 キーボードナビゲーション

**Tabキー**でセル間を移動できるようにする:

```html
<td class="schedule-cell" 
    tabindex="0"
    data-room-id="room01" 
    data-date="2025-11-01">
  <div class="symbol">入</div>
  <div class="user-name">山田</div>
</td>
```

---

### 9.2 スクリーンリーダー対応

```html
<td class="schedule-cell" 
    tabindex="0"
    role="button"
    aria-label="1号室、11月1日、山田さん入所"
    data-room-id="room01" 
    data-date="2025-11-01">
  <div class="symbol">入</div>
  <div class="user-name">山田</div>
</td>
```

**Phase 1では優先度低** - Phase 2以降で対応

---

## 10. まとめ

### 10.1 このドキュメントで定義したこと

```
✅ 定義したこと
├─ 画面構成（HTML構造）
├─ グリッド表示（居室軸、記号＋利用者名）
├─ インタラクション（期間選択、編集、削除）
├─ 定員表示と視覚化（色分け、列全体の色付け）
├─ カレンダー操作（月切り替え、1日～末日表示）
├─ フィードバック（トースト最小限、アニメーション）
├─ 印刷レイアウト
└─ レスポンシブ対応
```

---

### 10.2 重要なポイント

1. **居室軸のグリッド**: 横軸=日付、縦軸=居室
2. **記号と利用者名**: 入・○・退 + 利用者名を併記
3. **期間選択**: ドラッグ + 代替手段（クリック＋ダイアログ）
4. **定員超過でも保存可能**: 弾力運用、色分けで視覚化
5. **月表示範囲**: 1日～末日（固定）

---

### 10.3 Phase 1で実装すること

```
✅ Phase 1
├─ 居室軸グリッド表示
├─ 期間選択（ドラッグ + ダイアログ）
├─ 記号（入・○・退）＋利用者名表示
├─ 定員表示と色分け
├─ 月の切り替え
└─ 印刷レイアウト

⏭️ Phase 2以降
├─ キーボード操作
├─ スマートフォン対応
└─ アクセシビリティ向上
```

---

### 10.4 次のステップ

UI設計が確定したので、次は**ロジック設計**に進みます：

**L2_泊まり_ロジック.md**で定義すること：
1. 定員チェックのアルゴリズム
2. 期間重複チェック
3. データ操作の詳細
4. イベント処理の順序
5. キャッシュ管理

---

## 📚 次に読むべきドキュメント

このドキュメントを読了したら、以下のドキュメントに進んでください。

### 次のドキュメント

**L2_泊まり_ロジック.md**
- 定員チェックのアルゴリズム
- 期間重複チェック
- バリデーションの詳細
- データ操作の実装
- キャッシュの管理方法

---

## 📝 参考資料

- L2_泊まり_データ構造.md（TomariReservationクラス）
- L1_技術_実装制約.md（UI/UX規約）
- L2_通い_UI設計.md（通いセクションとの対比）

---

## 📅 更新履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|----------|---------|------|
| 2025-11-23 | 1.0 | 初版作成 | Claude |

---

**最終更新**: 2025年11月23日  
**次回更新予定**: Phase 1実装中のフィードバック反映時

---

## ⚠️ 設計チェックリスト

このドキュメントの品質チェック：

- [x] すべてのインタラクションが具体的に記述されている
- [x] カーソルの形状が定義されている
- [x] ホバー時の挙動が定義されている
- [x] 編集不可の要素の挙動が明確
- [x] 複雑な操作には代替手段がある（ドラッグ＋ダイアログ）
- [x] 状態遷移が明確（期間選択の流れ）

---

**このドキュメントを読了したら、INDEX_ドキュメント構成.md に戻り、次のドキュメントに進んでください。**