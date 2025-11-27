# L2_通い_UI設計

**作成日**: 2025年11月23日  
**カテゴリ**: 第2層 - セクション別  
**バージョン**: 3.0

---

## 📖 このドキュメントについて

このドキュメントは、**通いセクションのUI設計**を定義します。

### 対象読者

- 通いセクションの実装担当者
- UIデザイナー
- テスト担当者

### 読了後に理解できること

- 月別予定表のグリッド構造
- セルのクリック処理と状態遷移
- 定員表示と視覚化
- カレンダー操作
- 印刷レイアウト

### 設計の前提

- **L2_通い_データ構造.md** のKayoiScheduleクラスに基づく
- **L1_技術_実装制約.md** のUI/UX規約に準拠

---

## 1. 画面構成

### 1.1 全体レイアウト

```
┌─────────────────────────────────────────┐
│ [通いセクション]                         │
├─────────────────────────────────────────┤
│ カレンダーヘッダー                       │
│ [◀] 2025年11月 [▶]  [今月]             │
├─────────────────────────────────────────┤
│ 日別サマリー                             │
│ 通い: 12  14  13  15  16 ... 12         │
│ 迎え:  8  10   9  12  13 ...  8         │
│ 送り:  9  11  10  13  14 ...  9         │
├─────────────────────────────────────────┤
│ 定員表示                                 │
│ 前半: 12/15人  後半: 14/15人            │
├─────────────────────────────────────────┤
│ 月別予定表（グリッド）                   │
│                                          │
│         25  26  27  28  29  30   1      │
│         月  火  水  木  金  土  日      │
│ 安藤    ○  ◓  ◒   -   ○   -   -      │
│ 田中    ◓   -   ○  ◓   -   ○   -      │
│ ...                                      │
├─────────────────────────────────────────┤
│ アクション                               │
│ [CSVインポート] [CSVエクスポート] [印刷] │
└─────────────────────────────────────────┘
```

**注**: 日別サマリーの詳細仕様は **L3_UI_日別サマリー設計.md** を参照してください。


---

### 1.2 HTML構造

```html
<div id="kayoi-section" class="section">
  <!-- カレンダーヘッダー -->
  <div class="calendar-header">
    <button id="prev-month" class="nav-button">◀</button>
    <h2 id="current-month">2025年11月</h2>
    <button id="next-month" class="nav-button">▶</button>
    <button id="today-button" class="nav-button">今月</button>
  </div>
  
  
  <!-- 日別サマリー -->
  <!-- 詳細仕様は L3_UI_日別サマリー設計.md を参照 -->
  <div class="daily-summary kayoi-summary">
    <!-- ここに日別サマリーのHTML -->
  </div>
  <!-- 定員表示 -->
  <div class="capacity-display">
    <div class="capacity-item">
      <span class="label">前半:</span>
      <span id="zenhan-count" class="count">12</span>
      <span class="max">/15人</span>
    </div>
    <div class="capacity-item">
      <span class="label">後半:</span>
      <span id="kohan-count" class="count">14</span>
      <span class="max">/15人</span>
    </div>
  </div>
  
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
              data-date="2025-11-25">
            <span class="symbol">○</span>
          </td>
          <!-- ...他の日付 -->
        </tr>
        <!-- ...他の利用者 -->
      </tbody>
    </table>
  </div>
  
  <!-- アクション -->
  <div class="actions">
    <button id="import-csv">CSVインポート</button>
    <button id="export-csv">CSVエクスポート</button>
    <button id="print">印刷</button>
  </div>
</div>
```

---

## 2. グリッド表示

### 2.1 セルの構造

#### 利用者セル（縦軸）

```html
<td class="user-cell" data-user-id="user001">
  <span class="user-name">安藤</span>
</td>
```

**スタイル**:
```css
.user-cell {
  background-color: #f5f5f5;
  font-weight: bold;
  text-align: left;
  padding: 8px;
  border: 1px solid #ddd;
  cursor: default;
}
```

---

#### 日付ヘッダー（横軸）

```html
<th class="date-header" data-date="2025-11-25">
  <div class="date">25</div>
  <div class="day">月</div>
</th>
```

**スタイル**:
```css
.date-header {
  background-color: #f5f5f5;
  text-align: center;
  padding: 8px;
  border: 1px solid #ddd;
  min-width: 40px;
}

.date-header .date {
  font-size: 16px;
  font-weight: bold;
}

.date-header .day {
  font-size: 12px;
  color: #666;
}

/* 土曜日 */
.date-header.saturday .day {
  color: #0066cc;
}

/* 日曜日 */
.date-header.sunday .day {
  color: #cc0000;
}
```

---

#### スケジュールセル

```html
<td class="schedule-cell" 
    data-user-id="user001" 
    data-date="2025-11-25">
  <span class="symbol">○</span>
</td>
```

**スタイル**:
```css
.schedule-cell {
  text-align: center;
  padding: 8px;
  border: 1px solid #ddd;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-width: 40px;
  height: 40px;
}

.schedule-cell:hover {
  background-color: rgba(0, 123, 255, 0.1);
}

.schedule-cell .symbol {
  font-size: 18px;
  display: inline-block;
}
```

---

### 2.2 記号の表示

| 記号 | 意味 | HTML |
|------|------|------|
| **○** | 終日 | `<span class="symbol">○</span>` |
| **◓** | 前半のみ | `<span class="symbol">◓</span>` |
| **◒** | 後半のみ | `<span class="symbol">◒</span>` |
| **-** | 利用なし | `<span class="symbol">-</span>` |

**スタイル**:
```css
.symbol {
  font-size: 18px;
  font-weight: normal;
}

/* 空欄の場合のハイフン */
.symbol:empty::after {
  content: '-';
  color: #ccc;
}
```

---

## 3. インタラクション

### 3.1 セルのクリック処理

#### 状態遷移図

```
○最もよく使われるのは終日(○)なので、最初に配置

┌─────┐   クリック   ┌─────┐
│ 空欄 │ ────────→ │ 終日 │
└─────┘             └─────┘
   ↑                    │
   │                    │ クリック
   │                    ↓
   │                ┌─────┐
   │                │ 前半 │
   │                └─────┘
   │                    │
   │                    │ クリック
   │                    ↓
   │                ┌─────┐
   │                │ 後半 │
   │                └─────┘
   │                    │
   │     クリック       │
   └────────────────────┘

記号の対応:
空欄 → ○ → ◓ → ◒ → 空欄

※ 実務では終日(○)が最も頻繁に使われるため、最初に配置
```

---

#### クリックイベントの処理

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
    nextSymbol = '◓'; // 空欄 → 前半
  } else if (currentSymbol === '◓') {
    nextSymbol = '◒'; // 前半 → 後半
  } else if (currentSymbol === '◒') {
    nextSymbol = '○'; // 後半 → 終日
  } else if (currentSymbol === '○') {
    nextSymbol = '-'; // 終日 → 空欄
  }
  
  // 定員チェック
  const section = getSectionFromSymbol(nextSymbol);
  if (section && !checkCapacity(date, section)) {
    showToast('定員に達しています', 'error');
    return;
  }
  
  // データ更新
  updateSchedule(userId, date, nextSymbol);
  
  // 表示更新
  cell.querySelector('.symbol').textContent = nextSymbol;
  
  // 定員表示を更新
  updateCapacityDisplay();
  
  // アニメーション
  cell.classList.add('updated');
  setTimeout(() => cell.classList.remove('updated'), 200);
}
```

**注意**: 定員超過の場合は更新せず、トースト通知を表示

---

#### カーソル形状

```css
.schedule-cell {
  cursor: pointer;
}

.schedule-cell:hover {
  cursor: pointer;
}

.schedule-cell.readonly {
  cursor: default;
}
```

---

### 3.2 ドラッグ操作（オプション）

#### 機能

**横方向のドラッグで連続入力**

```
例: 安藤さんの行で、25日から27日までドラッグ
→ 25日、26日、27日すべてに同じ記号（○）を入力
```

#### 実装の注意

⚠️ **ドラッグは便利だが、必ず代替手段を提供すること**

**代替手段**:
1. セルを個別にクリック
2. Ctrl+C / Ctrl+V（コピー&ペースト）
3. 一括入力機能

**理由**:
- ドラッグ操作が苦手なユーザーがいる
- タッチデバイスでは難しい
- アクセシビリティの観点

---

#### ドラッグイベントの処理順序

```
1. mousedown（開始セル）
   ↓
2. mousemove（移動中）
   - 通過したセルをハイライト
   ↓
3. mouseup（終了セル）
   - ハイライトされたセルすべてに記号を入力
   - 定員チェック
   - データ更新
```

**重要**: 定員超過の日は自動的にスキップ

---

### 3.3 キーボード操作

#### サポートするキー

| キー | 動作 |
|------|------|
| **矢印キー** | セル間の移動 |
| **Enter** | 選択中のセルをクリック（状態遷移） |
| **Delete** | 選択中のセルを空欄にする |
| **Ctrl+C** | 選択中のセルをコピー |
| **Ctrl+V** | コピーしたセルをペースト |
| **Ctrl+Z** | 直前の操作を元に戻す |

**注意**: キーボード操作は実装が複雑なため、Phase 1では優先度低

---

### 3.4 右クリックメニュー（オプション）

```
┌─────────────┐
│ コピー      │
│ ペースト    │
│ 削除        │
│ ───────────│
│ この週をコピー│
│ この列をコピー│
└─────────────┘
```

**Phase 1では未実装** - Phase 2以降で検討

---

## 4. 定員表示と視覚化

### 4.1 定員表示エリア

```html
<div class="capacity-display">
  <div class="capacity-item zenhan">
    <span class="label">前半:</span>
    <span id="zenhan-count" class="count">12</span>
    <span class="max">/15人</span>
  </div>
  <div class="capacity-item kohan">
    <span class="label">後半:</span>
    <span id="kohan-count" class="count">14</span>
    <span class="max">/15人</span>
  </div>
</div>
```

---

### 4.2 定員状態の色分け

#### ルール

| 状態 | 定員 | 背景色 | 説明 |
|------|------|--------|------|
| **余裕あり** | 0-12人 | 通常（白） | 定員の80%未満 |
| **ギリギリ** | 13-14人 | 黄色 | 定員の80-93% |
| **満員** | 15人 | 赤色 | 定員100% |

#### スタイル

```css
.capacity-item {
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

/* 余裕あり（0-12人） */
.capacity-item.normal {
  background-color: transparent;
}

/* ギリギリ（13-14人） */
.capacity-item.warning {
  background-color: rgba(255, 255, 0, 0.2);
}

/* 満員（15人） */
.capacity-item.full {
  background-color: rgba(255, 0, 0, 0.2);
}
```

---

### 4.3 セルの色分け（定員超過時）

**ルール**: セルをクリックした際、定員超過なら赤く点滅

```css
.schedule-cell.over-capacity {
  background-color: rgba(255, 0, 0, 0.1);
  animation: blink 0.5s ease 2;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**JavaScript**:
```javascript
function handleCellClick(event) {
  // ... 定員チェック
  if (!checkCapacity(date, section)) {
    cell.classList.add('over-capacity');
    setTimeout(() => cell.classList.remove('over-capacity'), 1000);
    showToast('定員に達しています', 'error');
    return;
  }
  // ...
}
```

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

**ルール**: 当月の25日から翌月の24日まで表示

```
例: 2025年11月を選択
→ 2025年11月25日 ～ 2025年12月24日 を表示
```

**理由**:
- L0_業務_介護ソフトとの関係.md に基づく
- 月末～月初の調整作業に対応

---

## 6. フィードバック

### 6.1 トースト通知

#### 表示タイミング

| イベント | メッセージ | タイプ |
|---------|----------|--------|
| 予定追加成功 | 「予定を追加しました」 | info |
| 予定削除成功 | 「予定を削除しました」 | info |
| 定員超過 | 「定員に達しています」 | error |
| CSVインポート成功 | 「○件の予定をインポートしました」 | success |

#### スタイル

```css
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 4px;
  background-color: #333;
  color: white;
  opacity: 0.9;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.toast.success {
  background-color: #28a745;
}

.toast.error {
  background-color: #dc3545;
}

.toast.info {
  background-color: #17a2b8;
}

.toast.fade-out {
  animation: fadeOut 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 0.9; transform: translateY(0); }
}

@keyframes fadeOut {
  from { opacity: 0.9; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-10px); }
}
```

---

### 6.2 セルのアニメーション

**更新時の視覚的フィードバック**:

```css
.schedule-cell.updated {
  animation: pulse 0.2s ease;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
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
    font-size: 10pt;
  }
  
  .schedule-cell {
    padding: 4px;
  }
  
  /* 改ページを防ぐ */
  .schedule-grid tr {
    page-break-inside: avoid;
  }
}
```

---

### 7.2 印刷範囲

**1ページに収める内容**:
- 定員表示
- 月別予定表（横31日分 × 縦約20人）

**A4横向き**を推奨

---

## 8. レスポンシブ対応

### 8.1 画面サイズ別の対応

#### デスクトップ（1366px以上）

```css
.schedule-grid {
  font-size: 14px;
}

.schedule-cell {
  min-width: 40px;
  height: 40px;
}
```

---

#### タブレット（768px-1365px）

```css
@media (max-width: 1365px) {
  .schedule-grid {
    font-size: 12px;
  }
  
  .schedule-cell {
    min-width: 35px;
    height: 35px;
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
    min-width: 600px;
  }
  
  .schedule-cell {
    min-width: 30px;
    height: 30px;
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
    data-user-id="user001" 
    data-date="2025-11-25">
  <span class="symbol">○</span>
</td>
```

---

### 9.2 スクリーンリーダー対応

```html
<td class="schedule-cell" 
    tabindex="0"
    role="button"
    aria-label="安藤さん、11月25日、終日利用"
    data-user-id="user001" 
    data-date="2025-11-25">
  <span class="symbol">○</span>
</td>
```

**Phase 1では優先度低** - Phase 2以降で対応

---

## 10. パフォーマンス最適化

### 10.1 仮想スクロール

**問題**: 利用者が100人を超えると、グリッドが重くなる

**対策**: 仮想スクロール（Visible areaだけレンダリング）

**Phase 1では未実装** - 利用者29人まで対応

---

### 10.2 イベントデリゲーション

```javascript
// ❌ 各セルに個別にイベントリスナー
cells.forEach(cell => {
  cell.addEventListener('click', handleCellClick);
});

// ✅ 親要素で一括管理
document.getElementById('kayoi-grid').addEventListener('click', (e) => {
  const cell = e.target.closest('.schedule-cell');
  if (cell) {
    handleCellClick(e);
  }
});
```

---

## 11. まとめ

### 11.1 このドキュメントで定義したこと

```
✅ 定義したこと
├─ 画面構成（HTML構造）
├─ グリッド表示（セル構造、記号表示）
├─ インタラクション（クリック、ドラッグ、キーボード）
├─ 定員表示と視覚化（色分け）
├─ カレンダー操作（月切り替え）
├─ フィードバック（トースト、アニメーション）
├─ 印刷レイアウト
└─ レスポンシブ対応
```

---

### 11.2 重要なポイント

1. **記号の遷移**: 空欄 → ◓ → ◒ → ○ → 空欄
2. **定員チェック**: クリック時に必ず実行
3. **視覚的フィードバック**: 色分け、アニメーション（0.2秒）
4. **代替手段**: ドラッグ操作は便利だが、クリックでも操作可能
5. **印刷対応**: A4横向きで月別予定表を印刷可能

---

### 11.3 Phase 1で実装すること

```
✅ Phase 1
├─ セルのクリック処理（○◓◒の遷移）
├─ 定員表示と色分け
├─ 月の切り替え
├─ トースト通知
└─ 印刷レイアウト

⏭️ Phase 2以降
├─ ドラッグ操作
├─ キーボード操作
├─ 右クリックメニュー
├─ スマートフォン対応
└─ アクセシビリティ向上
```

---

### 11.4 次のステップ

UI設計が確定したので、次は**ロジック設計**に進みます：

**L2_通い_ロジック.md**で定義すること：
1. 定員チェックのアルゴリズム
2. バリデーションの実装
3. データ操作の詳細
4. イベント処理の順序

---

## 📚 次に読むべきドキュメント

このドキュメントを読了したら、以下のドキュメントに進んでください。

### 次のドキュメント

**L2_通い_ロジック.md**
- 定員チェックのアルゴリズム
- バリデーションの詳細
- データ操作の実装
- イベント処理の順序

---

## 📝 参考資料

- L2_通い_データ構造.md（KayoiScheduleクラス）
- L1_技術_実装制約.md（UI/UX規約）
- CHECKLIST_設計レビュー.md（インタラクションの詳細記述）

---

## 📅 更新履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|----------|---------|------|
| 2025-11-23 | 1.0 | 初版作成 | Claude |
| 2025-11-27 | 3.0 | 日別サマリーへの参照追加、送迎タイプUI追加予定 | Claude |

---

**最終更新**: 2025年11月27日  
**次回更新予定**: Phase 1実装中のフィードバック反映時

---

## ⚠️ 設計チェックリスト

このドキュメントの品質チェック：

- [x] すべてのインタラクションが具体的に記述されている
- [x] カーソルの形状が定義されている
- [x] ホバー時の挙動が定義されている
- [x] 編集不可の要素の挙動が明確
- [x] 複雑な操作には代替手段がある
- [x] 状態遷移図が作成されている

---

**このドキュメントを読了したら、INDEX_ドキュメント構成.md に戻り、次のドキュメントに進んでください。**