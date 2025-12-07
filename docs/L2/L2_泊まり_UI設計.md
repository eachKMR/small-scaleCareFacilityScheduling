# L2_泊まり_UI設計

**作成日**: 2025年11月23日  
**カテゴリ**: 第2層 - セクション別  
**バージョン**: 3.0  
**更新日**: 2025年11月29日

---

## 📖 このドキュメントについて

このドキュメントは、**泊まりセクションのUI設計**を定義します。

### v3.0での主要な変更

1. **縦軸整列の設計を追加**
   - CSS変数による統一
   - table-layout: fixedの使用
   - カレンダーヘッダーとの同期

2. **ドキュメントのスリム化**
   - 共通仕様（印刷、レスポンシブ等）を削除
   - セクション固有の内容に特化
   - 1,050行 → 約400行

### 対象読者

- 泊まりセクションの実装担当者
- UIデザイナー
- テスト担当者

### 読了後に理解できること

- 居室軸の月別予定表のグリッド構造
- 期間選択の方法（ドラッグ、ダイアログ）
- 記号（入・○・退）と利用者名の表示
- 定員表示と視覚化
- **縦軸整列の設計方法**（v3.0）

### 設計の前提

- **L2_泊まり_データ構造.md** のTomariReservationクラスに基づく
- **L3_UI_統合UI設計.md v3.0** のカレンダーヘッダー設計
- **L1_技術_実装制約.md** のUI/UX規約に準拠

---

## 1. 画面構成

### 1.1 全体レイアウト

```
┌─────────────────────────────────────────┐
│ [泊まりセクション]                       │
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
└─────────────────────────────────────────┘
```

**注意**:
- カレンダーヘッダー（月切り替え等）は**L3_UI_統合UI設計.md**で定義
- ここでは泊まりセクション固有のUIのみ記載

---

### 1.2 HTML構造

```html
<div id="tomari-section" class="section">
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
          </th>
          <!-- ...他の日付 -->
        </tr>
      </thead>
      <tbody>
        <tr data-room-id="room01">
          <td class="room-cell">1号室</td>
          <td class="schedule-cell" 
              data-room-id="room01" 
              data-date="2025-11-01">
            <span class="symbol">入</span>
            <span class="user-name">山</span>
          </td>
          <!-- ...他の日付 -->
        </tr>
        <!-- ...他の居室 -->
      </tbody>
    </table>
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
<th class="date-header" data-date="2025-11-01">
  <div class="date">1</div>
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
    data-room-id="room01" 
    data-date="2025-11-01"
    data-reservation-id="res001">
  <span class="symbol">入</span>
  <span class="user-name">山</span>
</td>
```

**スタイル**:
```css
.schedule-cell {
  width: var(--date-cell-width); /* 縦軸整列のため */
  min-width: var(--date-cell-width);
  text-align: center;
  padding: 4px;
  border: 1px solid #ddd;
  cursor: pointer;
  transition: background-color 0.2s ease;
  height: 40px;
  position: relative;
}

.schedule-cell:hover {
  background-color: rgba(0, 123, 255, 0.1);
}

.schedule-cell .symbol {
  font-size: 14px;
  display: block;
  font-weight: bold;
}

.schedule-cell .user-name {
  font-size: 12px;
  display: block;
  color: #333;
}
```

---

### 2.2 記号と利用者名の表示

| 記号 | 意味 | 表示例 | HTML |
|------|------|--------|------|
| **入** | 入所日 | 入山 | `<span class="symbol">入</span><span class="user-name">山</span>` |
| **○** | 滞在中 | ○山 | `<span class="symbol">○</span><span class="user-name">山</span>` |
| **退** | 退所日 | 退山 | `<span class="symbol">退</span><span class="user-name">山</span>` |
| **空** | 空室 | 空 | `<span class="symbol">空</span>` |

**利用者名の省略**:
- 姓の1文字のみ表示（「山田太郎」→「山」）
- 省スペース化
- 視認性向上

**スタイル**:
```css
.symbol {
  font-size: 14px;
  font-weight: bold;
  display: block;
}

.user-name {
  font-size: 12px;
  color: #333;
  display: block;
}

/* 空室 */
.schedule-cell.vacant .symbol {
  color: #999;
}
```

---

### 2.3 期間の視覚化

**連続する予約の背景色**:

```css
/* 同じ予約IDのセルに同じ背景色 */
.schedule-cell[data-reservation-id="res001"] {
  background-color: rgba(33, 150, 243, 0.1);
}

.schedule-cell[data-reservation-id="res002"] {
  background-color: rgba(76, 175, 80, 0.1);
}

/* 入所日・退所日は濃い色 */
.schedule-cell .symbol.check-in,
.schedule-cell .symbol.check-out {
  color: #d32f2f;
  font-weight: bold;
}
```

**理由**:
- 期間が視覚的に分かりやすい
- 異なる利用者の予約を区別できる

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
3. 右クリックメニュー（Phase 2）

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

**方法2: 期間の端をドラッグ（Phase 2）**
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

**方法1: 編集ダイアログから削除**
```
1. セルをクリック → 編集ダイアログ
   ↓
2. [削除] ボタン → 確認ダイアログ
   「山田さんの予約（11/1～11/3）を削除しますか？」
   ↓
3. [削除] → 予約削除
```

**方法2: 右クリックメニュー（Phase 2）**
```
1. 予約ありのセルを右クリック
   ↓
2. コンテキストメニュー表示
   - 「予約を削除」
   ↓
3. 確認ダイアログ → [削除]
```

---

### 3.4 キーボード操作（Phase 2）

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
```

**理由**:
- 本日・明日・明後日の3日分を表示
- 夜勤体制（1人で9人）の負担度を即座に確認
- 緊急の空き状況確認に対応

---

### 4.2 定員状態の色分け

#### ルール

| 状態 | 定員 | 背景色 | 説明 |
|------|------|--------|------|
| **余裕あり** | 0-6人 | 通常（白） | 定員の67%未満 |
| **ギリギリ** | 7-8人 | 黄色 | 定員の67-89% |
| **満員** | 9人 | 赤色 | 定員100% |

#### スタイル

```css
.capacity-item {
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

/* 余裕あり（0-6人） */
.capacity-item.normal {
  background-color: transparent;
}

/* ギリギリ（7-8人） */
.capacity-item.warning {
  background-color: rgba(255, 255, 0, 0.2);
}

/* 満員（9人） */
.capacity-item.full {
  background-color: rgba(255, 0, 0, 0.2);
}
```

---

### 4.3 居室重複チェック

**ルール**: 同じ居室で期間が重複する予約は不可

```javascript
function checkRoomAvailability(roomId, startDate, endDate, excludeReservationId = null) {
  const reservations = masterData.tomariReservations.getRoomReservations(roomId);
  
  for (const res of reservations) {
    // 編集中の予約は除外
    if (res.id === excludeReservationId) continue;
    
    // 期間の重複チェック
    if (startDate < res.checkOutDate && endDate > res.checkInDate) {
      return false; // 重複あり
    }
  }
  
  return true; // 利用可能
}
```

**エラー表示**:
- 重複する場合は赤く点滅
- トースト通知: 「この期間は既に予約されています」

---

## 5. 縦軸整列の設計（v3.0新規追加）

### 5.1 縦軸整列の要件（マスト）

**ユーザーの要求**:
> 「ピッタリ縦軸がそろっていることはマストだ。そうでないと見づらくてしょうがない」

**縦軸整列の対象**:
1. カレンダーヘッダー（日付・曜日）
2. 日別サマリー（通い・泊まり・訪問の数値）
3. メインコンテンツ（泊まりセクションの予定表）

```
カレンダーヘッダー: │ 1  2  3  4  5  6 ...│
日別サマリー:       │12 15 10  8 12 14 ...│
泊まり予定表:       │入山 ○山 ○山 退山 ...│
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

/* 泊まりセクションで使用 */
.schedule-grid .room-header,
.schedule-grid .room-cell {
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
  const roomHeader = document.querySelector('.schedule-grid .room-header');
  const calendarLabel = document.querySelector('.calendar-ruler-table .label-cell');
  const summaryLabel = document.querySelector('.summary-table .label');
  
  console.log('ラベル列の幅:');
  console.log('  泊まり予定表:', roomHeader?.offsetWidth);
  console.log('  カレンダー:', calendarLabel?.offsetWidth);
  console.log('  サマリー:', summaryLabel?.offsetWidth);
  
  // 日付セルの幅を確認
  const scheduleCell = document.querySelector('.schedule-grid .schedule-cell');
  const calendarCell = document.querySelector('.calendar-ruler-table .date-cell');
  const summaryCell = document.querySelector('.summary-table .cell');
  
  console.log('日付セルの幅:');
  console.log('  泊まり予定表:', scheduleCell?.offsetWidth);
  console.log('  カレンダー:', calendarCell?.offsetWidth);
  console.log('  サマリー:', summaryCell?.offsetWidth);
  
  // すべて同じ値であれば縦軸が揃っている
  const labelsMatch = (
    roomHeader?.offsetWidth === calendarLabel?.offsetWidth &&
    roomHeader?.offsetWidth === summaryLabel?.offsetWidth
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

### 6.2 v1.0からの主要な変更

| 項目 | v1.0 | v3.0 |
|------|------|------|
| **縦軸整列** | 記載なし | マスト要件として明記 |
| **CSS変数** | 使用せず | --label-column-width, --date-cell-width |
| **ドキュメント行数** | 1,050行 | 約500行 |
| **カレンダー操作** | 詳細記載 | L3層に委譲 |
| **印刷・レスポンシブ** | 詳細記載 | L1層に委譲（または削除） |

---

### 6.3 重要な設計判断

1. **居室軸の設計にした理由**
   - 泊まりは「誰がどの居室に」という視点
   - 居室の空き状況が最重要
   - 夜勤負担度の可視化

2. **期間選択の代替手段を提供する理由**
   - ドラッグが苦手なユーザーへの配慮
   - アクセシビリティの観点
   - タッチデバイス対応

3. **縦軸整列をマスト要件にした理由**
   - ユーザーの明確な要求
   - カレンダーヘッダーが「物差し」として機能
   - 視認性の向上

---

### 6.4 削除したセクション（v3.0）

以下のセクションは削除しました：

- ❌ セクション5: カレンダー操作 → **L3_UI_統合UI設計.md**で定義
- ❌ セクション6: フィードバック → 実装時に判断
- ❌ セクション7: 印刷レイアウト → L1層または削除
- ❌ セクション8: レスポンシブ対応 → L1層または削除
- ❌ セクション9: アクセシビリティ → L1層または削除

**理由**:
- 共通仕様であり、セクション別に記述する必要がない
- 重複を避ける
- ドキュメントの保守性向上

---

### 6.5 実装の優先順位

**Phase 1（必須）**:
- ✅ グリッド表示
- ✅ 予約の追加（ダイアログ方式）
- ✅ 予約の編集・削除
- ✅ 定員表示と視覚化
- ✅ 縦軸整列

**Phase 2（拡張）**:
- ⏭️ ドラッグ操作（期間選択、期間変更）
- ⏭️ キーボード操作
- ⏭️ 右クリックメニュー

---

## 📚 次に読むべきドキュメント

このドキュメントを読了したら、以下のドキュメントに進んでください。

### 関連ドキュメント

- **L3_UI_統合UI設計.md v3.0** - カレンダーヘッダー、全体レイアウト
- **L3_UI_日別サマリー設計.md v2.0** - 日別サマリーの詳細
- **L2_泊まり_データ構造.md** - TomariReservationクラスの仕様
- **L2_泊まり_ロジック設計.md** - 居室割当、期間重複チェック

---

## 📝 参考資料

- L2_泊まり_データ構造.md（TomariReservationクラス）
- L3_UI_統合UI設計.md v3.0（カレンダーヘッダー）
- L3_UI_日別サマリー設計.md v2.0（縦軸整列）
- L0_業務_居室管理の重要性.md（夜勤負担度）
- L1_技術_実装制約.md（UI/UX規約）
- CHECKLIST_設計レビュー.md（インタラクションの詳細記述）

---

## 📅 更新履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|----------|---------|------|
| 2025-11-23 | 1.0 | 初版作成（1,050行） | Claude |
| 2025-11-29 | 3.0 | 縦軸整列追加、スリム化（約500行） | Claude |

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
- [x] 代替手段が提供されている
- [x] 居室重複チェックが定義されている
- [x] 共通仕様（印刷等）が削除されている
- [x] ドキュメントがスリム化されている

---

**このドキュメントを読了したら、INDEX_ドキュメント構成.md に戻り、次のドキュメントに進んでください。**