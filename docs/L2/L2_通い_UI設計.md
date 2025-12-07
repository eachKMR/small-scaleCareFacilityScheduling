# L2_通い_UI設計

**作成日**: 2025年11月23日  
**カテゴリ**: 第2層 - セクション別  
**バージョン**: 3.0  
**更新日**: 2025年11月29日

---

## 📖 このドキュメントについて

このドキュメントは、**通いセクションのUI設計**を定義します。

### v3.0での主要な変更

1. **縦軸整列の設計を追加**
   - CSS変数による統一
   - table-layout: fixedの使用
   - カレンダーヘッダーとの同期

2. **ドキュメントのスリム化**
   - 共通仕様（印刷、レスポンシブ等）を削除
   - セクション固有の内容に特化
   - 933行 → 約400行

### 対象読者

- 通いセクションの実装担当者
- UIデザイナー
- テスト担当者

### 読了後に理解できること

- 月別予定表のグリッド構造
- セルのクリック処理と状態遷移
- 定員表示と視覚化
- **縦軸整列の設計方法**（v3.0）

### 設計の前提

- **L2_通い_データ構造.md** のKayoiScheduleクラスに基づく
- **L3_UI_統合UI設計.md v3.0** のカレンダーヘッダー設計
- **L1_技術_実装制約.md** のUI/UX規約に準拠

---

## 1. 画面構成

### 1.1 全体レイアウト

```
┌─────────────────────────────────────────┐
│ [通いセクション]                         │
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
└─────────────────────────────────────────┘
```

**注意**:
- カレンダーヘッダー（月切り替え等）は**L3_UI_統合UI設計.md**で定義
- ここでは通いセクション固有のUIのみ記載

---

### 1.2 HTML構造

```html
<div id="kayoi-section" class="section">
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
  width: var(--label-column-width); /* 縦軸整列のため */
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
  width: var(--date-cell-width); /* 縦軸整列のため */
  min-width: var(--date-cell-width);
  background-color: #f5f5f5;
  text-align: center;
  padding: 8px;
  border: 1px solid #ddd;
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
  width: var(--date-cell-width); /* 縦軸整列のため */
  min-width: var(--date-cell-width);
  text-align: center;
  padding: 8px;
  border: 1px solid #ddd;
  cursor: pointer;
  transition: background-color 0.2s ease;
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
最もよく使われるのは終日(○)なので、最初に配置

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
    nextSymbol = '○'; // 空欄 → 終日
  } else if (currentSymbol === '○') {
    nextSymbol = '◓'; // 終日 → 前半
  } else if (currentSymbol === '◓') {
    nextSymbol = '◒'; // 前半 → 後半
  } else if (currentSymbol === '◒') {
    nextSymbol = '-'; // 後半 → 空欄
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

### 3.2 ドラッグ操作（Phase 2）

**横方向のドラッグで連続入力**

```
例: 安藤さんの行で、25日から27日までドラッグ
→ 25日、26日、27日すべてに同じ記号（○）を入力
```

**重要**: ドラッグは便利だが、必ず代替手段を提供すること

**代替手段**:
1. セルを個別にクリック
2. Ctrl+C / Ctrl+V（コピー&ペースト）
3. 一括入力機能

**Phase 1では未実装** - Phase 2以降で検討

---

### 3.3 キーボード操作（Phase 2）

| キー | 動作 |
|------|------|
| **矢印キー** | セル間の移動 |
| **Enter** | 選択中のセルをクリック（状態遷移） |
| **Delete** | 選択中のセルを空欄にする |
| **Ctrl+C** | 選択中のセルをコピー |
| **Ctrl+V** | コピーしたセルをペースト |
| **Ctrl+Z** | 直前の操作を元に戻す |

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

## 5. 縦軸整列の設計（v3.0新規追加）

### 5.1 縦軸整列の要件（マスト）

**ユーザーの要求**:
> 「ピッタリ縦軸がそろっていることはマストだ。そうでないと見づらくてしょうがない」

**縦軸整列の対象**:
1. カレンダーヘッダー（日付・曜日）
2. 日別サマリー（通い・泊まり・訪問の数値）
3. メインコンテンツ（通いセクションの予定表）

```
カレンダーヘッダー: │ 1  2  3  4  5  6 ...│
日別サマリー:       │12 15 10  8 12 14 ...│
通い予定表:         │○  ◓  ◒  -  ○  - ...│
                     ↑  ↑  ↑  ↑  ↑  ↑
              縦軸が完璧に揃っている（マスト要件）
```

---

### 5.2 CSS変数による統一

**共通のセル幅定義**:

```css
/* グローバルCSS変数（L3_UI_統合UI設計.mdで定義） */
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

/* 通いセクションで使用 */
.schedule-grid .user-header,
.schedule-grid .user-cell {
  width: var(--label-column-width);
  min-width: var(--label-column-width);
}

.schedule-grid .date-header,
.schedule-grid .schedule-cell {
  width: var(--date-cell-width);
  min-width: var(--date-cell-width);
  max-width: var(--date-cell-width);
}
```

**重要**:
- すべてのセル幅をCSS変数で統一
- カレンダーヘッダー、日別サマリーと同じ値を使用
- `min-width`, `width`, `max-width` の3つを設定（ズレ防止）

---

### 5.3 table-layout: fixedの使用

```css
.schedule-grid {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* マスト要件 */
}
```

**理由**:
- セル幅を均等に配分
- コンテンツの長さに影響されない
- 縦軸のズレを防ぐ

---

### 5.4 縦軸整列の検証方法

**開発時の確認**:

```javascript
/**
 * 縦軸整列のデバッグ用関数
 */
function debugVerticalAlignment() {
  // ラベル列の幅を確認
  const userHeader = document.querySelector('.schedule-grid .user-header');
  const calendarLabel = document.querySelector('.calendar-ruler-table .label-cell');
  const summaryLabel = document.querySelector('.summary-table .label');
  
  console.log('ラベル列の幅:');
  console.log('  通い予定表:', userHeader?.offsetWidth);
  console.log('  カレンダー:', calendarLabel?.offsetWidth);
  console.log('  サマリー:', summaryLabel?.offsetWidth);
  
  // 日付セルの幅を確認
  const scheduleCell = document.querySelector('.schedule-grid .schedule-cell');
  const calendarCell = document.querySelector('.calendar-ruler-table .date-cell');
  const summaryCell = document.querySelector('.summary-table .cell');
  
  console.log('日付セルの幅:');
  console.log('  通い予定表:', scheduleCell?.offsetWidth);
  console.log('  カレンダー:', calendarCell?.offsetWidth);
  console.log('  サマリー:', summaryCell?.offsetWidth);
  
  // すべて同じ値であれば縦軸が揃っている
  const labelsMatch = (
    userHeader?.offsetWidth === calendarLabel?.offsetWidth &&
    userHeader?.offsetWidth === summaryLabel?.offsetWidth
  );
  
  const cellsMatch = (
    scheduleCell?.offsetWidth === calendarCell?.offsetWidth &&
    scheduleCell?.offsetWidth === summaryCell?.offsetWidth
  );
  
  console.log('縦軸整列チェック:');
  console.log('  ラベル列:', labelsMatch ? '✓ OK' : '✗ NG');
  console.log('  日付セル:', cellsMatch ? '✓ OK' : '✗ NG');
  
  return labelsMatch && cellsMatch;
}

// 開発環境で実行
if (process.env.NODE_ENV === 'development') {
  window.debugVerticalAlignment = debugVerticalAlignment;
}
```

**実行方法**:
1. ブラウザのコンソールで `debugVerticalAlignment()` を実行
2. すべてのセル幅が一致しているか確認
3. ズレがある場合は、CSS変数の値を確認

---

### 5.5 スクロール時の縦軸保持

```css
/* カレンダーヘッダーと日別サマリーをsticky固定 */
.calendar-header-ruler {
  position: sticky;
  top: 160px; /* 日別サマリーの下 */
  z-index: 90;
}

.daily-summary-container {
  position: sticky;
  top: 50px; /* ヘッダーの下 */
  z-index: 100;
}

/* 通い予定表は縦スクロールのみ */
.schedule-grid-container {
  overflow-x: hidden; /* 横スクロール禁止（マスト要件） */
  overflow-y: auto;   /* 縦スクロールのみ */
}
```

**重要**:
- カレンダーヘッダーと日別サマリーは固定
- 予定表は縦スクロールのみ（横スクロール禁止）
- スクロール時も縦軸が維持される
- レスポンシブ設計により、すべての画面幅で31日分が収まる

---

## 6. まとめ

### 6.1 v3.0で定義したこと

```
✅ v3.0で定義したこと
├─ 縦軸整列の設計（マスト要件）
│   ├─ CSS変数による統一
│   ├─ table-layout: fixedの使用
│   └─ 縦軸整列の検証方法
├─ ドキュメントのスリム化
│   ├─ 共通仕様を削除
│   └─ セクション固有の内容に特化
└─ 実装の優先順位を明確化
    ├─ Phase 1: 基本機能
    └─ Phase 2: 拡張機能
```

---

### 6.2 v2.0からの主要な変更

| 項目 | v2.0 | v3.0 |
|------|------|------|
| **縦軸整列** | 記載なし | マスト要件として明記 |
| **CSS変数** | 使用せず | --label-column-width, --date-cell-width |
| **ドキュメント行数** | 933行 | 約400行 |
| **カレンダー操作** | 詳細記載 | L3層に委譲 |
| **印刷・レスポンシブ** | 詳細記載 | L1層に委譲（または削除） |

---

### 6.3 重要な設計判断

1. **縦軸整列をマスト要件にした理由**
   - ユーザーの明確な要求
   - カレンダーヘッダーが「物差し」として機能
   - 視認性の向上

2. **CSS変数を使用した理由**
   - セル幅の統一
   - 保守性の向上
   - 縦軸整列の保証

3. **ドキュメントをスリム化した理由**
   - Less is Moreの原則
   - セクション固有の内容に特化
   - 重複排除

---

### 6.4 削除したセクション（v3.0）

以下のセクションは削除しました：

- ❌ セクション5: カレンダー操作 → **L3_UI_統合UI設計.md**で定義
- ❌ セクション6: フィードバック → 実装時に判断
- ❌ セクション7: 印刷レイアウト → L1層または削除
- ❌ セクション8: レスポンシブ対応 → L1層または削除
- ❌ セクション9: アクセシビリティ → L1層または削除
- ❌ セクション10: パフォーマンス最適化 → L1層または削除

**理由**:
- 共通仕様であり、セクション別に記述する必要がない
- 重複を避ける
- ドキュメントの保守性向上

---

### 6.5 実装の優先順位

**Phase 1（必須）**:
- ✅ グリッド表示
- ✅ セルのクリック処理
- ✅ 定員表示と視覚化
- ✅ 縦軸整列

**Phase 2（拡張）**:
- ⏭️ ドラッグ操作
- ⏭️ キーボード操作
- ⏭️ 右クリックメニュー

---

## 📚 次に読むべきドキュメント

このドキュメントを読了したら、以下のドキュメントに進んでください。

### 関連ドキュメント

- **L3_UI_統合UI設計.md v3.0** - カレンダーヘッダー、全体レイアウト
- **L3_UI_日別サマリー設計.md v2.0** - 日別サマリーの詳細
- **L2_通い_データ構造.md** - KayoiScheduleクラスの仕様
- **L2_通い_ロジック設計.md** - 定員チェック、バリデーション

---

## 📝 参考資料

- L2_通い_データ構造.md（KayoiScheduleクラス）
- L3_UI_統合UI設計.md v3.0（カレンダーヘッダー）
- L3_UI_日別サマリー設計.md v2.0（縦軸整列）
- L1_技術_実装制約.md（UI/UX規約）
- CHECKLIST_設計レビュー.md（インタラクションの詳細記述）

---

## 📅 更新履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|----------|---------|------|
| 2025-11-23 | 1.0 | 初版作成 | Claude |
| 2025-11-23 | 2.0 | 詳細設計追加（933行） | Claude |
| 2025-11-29 | 3.0 | 縦軸整列追加、スリム化（約400行） | Claude |

---

**最終更新**: 2025年11月29日  
**次回更新予定**: Phase 1実装中のフィードバック反映時

---

## ⚠️ 設計チェックリスト

このドキュメントの品質チェック（v3.0）：

- [x] セクション固有の内容に特化している
- [x] 縦軸整列の設計が詳細に記述されている
- [x] CSS変数の使用が明記されている
- [x] すべてのインタラクションが具体的に記述されている
- [x] カーソルの形状が定義されている
- [x] 状態遷移図が作成されている
- [x] 共通仕様（印刷等）が削除されている
- [x] ドキュメントがスリム化されている

---

**このドキュメントを読了したら、INDEX_ドキュメント構成.md に戻り、次のドキュメントに進んでください。**