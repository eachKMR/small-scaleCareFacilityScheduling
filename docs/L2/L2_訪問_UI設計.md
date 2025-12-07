# L2_訪問_UI設計

**作成日**: 2025年11月23日  
**カテゴリ**: 第2層 - セクション別  
**バージョン**: 3.0  
**更新日**: 2025年11月29日

---

## 📖 このドキュメントについて

このドキュメントは、**訪問セクションのUI設計**を定義します。

### v3.0での主要な変更

1. **縦軸整列の設計を追加**
   - CSS変数による統一
   - table-layout: fixedの使用
   - カレンダーヘッダーとの同期

2. **ドキュメントのスリム化**
   - 共通仕様（印刷、レスポンシブ等）を削除
   - セクション固有の内容に特化
   - 1,257行 → 約400行

### 対象読者

- 訪問セクションの実装担当者
- UIデザイナー
- テスト担当者

### 読了後に理解できること

- 利用者軸の月別予定表のグリッド構造
- セルのクリック処理と訪問追加/編集/削除
- 時間帯表示（朝・昼・午後・夕・夜・厳守）
- 回数表示の設計
- **縦軸整列の設計方法**（v3.0）

### 設計の前提

- **L2_訪問_データ構造.md** のHoumonVisitクラスに基づく
- **L3_UI_統合UI設計.md v3.0** のカレンダーヘッダー設計
- **L1_技術_実装制約.md** のUI/UX規約に準拠

---

## 1. 画面構成

### 1.1 全体レイアウト

```
┌─────────────────────────────────────────┐
│ [訪問セクション]                         │
├─────────────────────────────────────────┤
│ 月別予定表（グリッド）                   │
│                                          │
│          1   2   3   4   5   6   7      │
│         月  火  水  木  金  土  日      │
│ 山田    朝   2   朝   -  夕昼  朝   1   │
│         夕       昼      夕              │
│ 田中    朝   朝  昼   昼   -   朝  夕   │
│ 佐藤    3   朝  10:00 夕   朝   2   朝  │
│                                          │
│ ...                                      │
└─────────────────────────────────────────┘
```

**注意**:
- カレンダーヘッダー（月切り替え等）は**L3_UI_統合UI設計.md**で定義
- ここでは訪問セクション固有のUIのみ記載

---

### 1.2 HTML構造

```html
<div id="houmon-section" class="section">
  <!-- 月別予定表 -->
  <div class="schedule-grid-container">
    <table id="houmon-grid" class="schedule-grid">
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
          <td class="schedule-cell" 
              data-user-id="user001" 
              data-date="2025-11-01">
            <div class="visit-items">
              <span class="visit-item" data-visit-id="visit001">朝</span>
              <span class="visit-item" data-visit-id="visit002">夕</span>
            </div>
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
  <span class="user-name">山田</span>
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
    data-user-id="user001" 
    data-date="2025-11-01">
  <div class="visit-items">
    <span class="visit-item" data-visit-id="visit001">朝</span>
    <span class="visit-item" data-visit-id="visit002">夕</span>
  </div>
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
  min-height: 40px;
  vertical-align: top;
}

.schedule-cell:hover {
  background-color: rgba(0, 123, 255, 0.1);
}

.visit-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.visit-item {
  font-size: 11px;
  padding: 2px 4px;
  background-color: #e3f2fd;
  border-radius: 2px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.visit-item:hover {
  background-color: #bbdefb;
}
```

---

### 2.2 時間帯の表示

| 時間帯 | 表示 | 説明 |
|--------|------|------|
| **朝** | 朝 | 6:00-9:00頃 |
| **昼** | 昼 | 11:00-14:00頃 |
| **午後** | 午 | 14:00-17:00頃 |
| **夕** | 夕 | 17:00-20:00頃 |
| **夜** | 夜 | 20:00-22:00頃 |
| **随時** | 随 | 時間帯指定なし |
| **厳守** | 10:00 | 時刻指定（例: 10:00） |

**スタイル**:
```css
/* 時間帯ごとの色分け（オプション） */
.visit-item.morning {
  background-color: #fff9c4; /* 朝: 黄色系 */
}

.visit-item.daytime {
  background-color: #ffe0b2; /* 昼: オレンジ系 */
}

.visit-item.afternoon {
  background-color: #ffccbc; /* 午後: ピンク系 */
}

.visit-item.evening {
  background-color: #c5cae9; /* 夕: 青紫系 */
}

.visit-item.night {
  background-color: #d1c4e9; /* 夜: 紫系 */
}

.visit-item.strict {
  background-color: #ffcdd2; /* 厳守: 赤系 */
  font-weight: bold;
}
```

---

### 2.3 回数表示

**回数が多い場合**:
```html
<!-- 3回以上の訪問 → 数字で表示 -->
<td class="schedule-cell">
  <div class="visit-count">3</div>
</td>
```

**スタイル**:
```css
.visit-count {
  font-size: 18px;
  font-weight: bold;
  color: #1976d2;
}
```

**表示ルール**:
- 1回: 時間帯表示（「朝」等）
- 2回: 時間帯表示（「朝」「夕」を縦に並べる）
- 3回以上: 回数表示（「3」）

---

## 3. インタラクション

### 3.1 セルのクリック処理

#### 状態遷移図

```
[待機状態]
    │
    ↓ セルをクリック
    │
    ├─→ [訪問なし] → 追加モーダル表示 → [入力中]
    │                                      │
    │                                      ├→ 保存 → [待機状態]
    │                                      └→ キャンセル → [待機状態]
    │
    └─→ [訪問あり] → 一覧モーダル表示 → [選択中]
                                         │
                                         ├→ 訪問項目クリック → 編集モーダル → [編集中]
                                         │                                    │
                                         │                                    ├→ 更新 → [待機状態]
                                         │                                    ├→ 削除 → 確認 → [待機状態]
                                         │                                    └→ キャンセル → [選択中]
                                         │
                                         ├→ 追加ボタン → 追加モーダル → [入力中]
                                         └→ 閉じる → [待機状態]
```

---

#### 動作

**訪問なしのセル**をクリック → 訪問追加モーダルを表示

**訪問ありのセル**をクリック → 訪問一覧モーダルを表示

```javascript
function handleCellClick(event) {
  const cell = event.target.closest('.schedule-cell');
  if (!cell) return;
  
  const userId = cell.dataset.userId;
  const date = cell.dataset.date;
  
  // そのセルの訪問予定を取得
  const visits = getVisitsForCell(userId, date);
  
  if (visits.length === 0) {
    // 訪問なし → 追加モーダルを開く
    openAddVisitModal(userId, date);
  } else {
    // 訪問あり → 一覧モーダルを開く
    openVisitListModal(userId, date, visits);
  }
}

// イベント委譲で登録
document.getElementById('houmon-grid').addEventListener('click', handleCellClick);
```

---

### 3.2 訪問項目のクリック処理

#### 動作

**訪問項目**（`朝`、`10:00` など）をクリック → 編集モーダルを表示

#### イベント伝播の制御

```javascript
function handleVisitItemClick(event) {
  if (!event.target.classList.contains('visit-item')) return;
  
  // セルのクリックイベントを伝播させない
  // （一覧モーダルが開かないようにする）
  event.stopPropagation();
  
  const visitId = event.target.dataset.visitId;
  const visit = getVisitById(visitId);
  
  openEditVisitModal(visit);
}

// イベント委譲で登録
document.getElementById('houmon-grid').addEventListener('click', handleVisitItemClick);
```

---

### 3.3 訪問追加モーダル

#### HTML構造（簡略版）

```html
<div id="visit-modal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3 id="modal-title">訪問追加</h3>
      <button class="close-button">&times;</button>
    </div>
    
    <div class="modal-body">
      <form id="visit-form">
        <!-- 利用者（読み取り専用） -->
        <div class="form-group">
          <label>利用者</label>
          <input type="text" id="user-name" readonly>
          <input type="hidden" id="user-id">
        </div>
        
        <!-- 日付（読み取り専用） -->
        <div class="form-group">
          <label>日付</label>
          <input type="date" id="visit-date" readonly>
        </div>
        
        <!-- 時間帯 -->
        <div class="form-group">
          <label>時間帯 <span class="required">*</span></label>
          <select id="time-mode" required>
            <option value="morning">朝 (6:00-9:00頃)</option>
            <option value="daytime">昼 (11:00-14:00頃)</option>
            <option value="afternoon">午後 (14:00-17:00頃)</option>
            <option value="evening">夕 (17:00-20:00頃)</option>
            <option value="night">夜 (20:00-22:00頃)</option>
            <option value="anytime">随時</option>
            <option value="strict">厳守（時刻指定）</option>
          </select>
        </div>
        
        <!-- 厳守の場合の時刻入力（初期状態は非表示） -->
        <div id="strict-time-fields" class="form-group" style="display: none;">
          <label>開始時刻 <span class="required">*</span></label>
          <input type="time" id="start-time">
          
          <label>終了時刻 <span class="required">*</span></label>
          <input type="time" id="end-time">
        </div>
        
        <!-- 所要時間 -->
        <div class="form-group">
          <label>所要時間（分） <span class="required">*</span></label>
          <input type="number" id="duration" value="30" min="5" max="120" step="5" required>
        </div>
        
        <!-- 担当職員（任意） -->
        <div class="form-group">
          <label>担当職員</label>
          <select id="staff-id">
            <option value="">未割り当て</option>
            <option value="staff001">佐藤</option>
            <option value="staff002">鈴木</option>
            <!-- ...他の職員 -->
          </select>
        </div>
        
        <!-- メモ -->
        <div class="form-group">
          <label>メモ</label>
          <textarea id="note" rows="3"></textarea>
        </div>
      </form>
    </div>
    
    <div class="modal-footer">
      <button id="cancel-button" class="btn-secondary">キャンセル</button>
      <button id="save-button" class="btn-primary">保存</button>
    </div>
  </div>
</div>
```

---

### 3.4 訪問一覧モーダル

**複数の訪問がある場合に表示**:

```html
<div id="visit-list-modal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3>訪問一覧（山田さん - 11/1）</h3>
      <button class="close-button">&times;</button>
    </div>
    
    <div class="modal-body">
      <ul class="visit-list">
        <li class="visit-list-item" data-visit-id="visit001">
          <span class="time">朝 (6:00-9:00頃)</span>
          <span class="duration">30分</span>
          <span class="staff">佐藤</span>
        </li>
        <li class="visit-list-item" data-visit-id="visit002">
          <span class="time">夕 (17:00-20:00頃)</span>
          <span class="duration">45分</span>
          <span class="staff">鈴木</span>
        </li>
      </ul>
    </div>
    
    <div class="modal-footer">
      <button id="add-visit-button" class="btn-primary">訪問を追加</button>
      <button id="close-button" class="btn-secondary">閉じる</button>
    </div>
  </div>
</div>
```

---

### 3.5 訪問の編集・削除

**編集モーダル**:
- 追加モーダルと同じ構造
- 既存データがフォームに入力されている
- [削除]ボタンが追加される

```html
<div class="modal-footer">
  <button id="delete-button" class="btn-danger">削除</button>
  <button id="cancel-button" class="btn-secondary">キャンセル</button>
  <button id="update-button" class="btn-primary">更新</button>
</div>
```

**削除の確認**:
```javascript
function handleDeleteClick() {
  const visit = getCurrentVisit();
  
  if (confirm(`${visit.userName}さんの訪問（${visit.timeModeLabel}）を削除しますか？`)) {
    deleteVisit(visit.id);
    closeModal();
    refreshGrid();
  }
}
```

---

## 4. 縦軸整列の設計（v3.0新規追加）

### 4.1 縦軸整列の要件（マスト）

**ユーザーの要求**:
> 「ピッタリ縦軸がそろっていることはマストだ。そうでないと見づらくてしょうがない」

**縦軸整列の対象**:
1. カレンダーヘッダー（日付・曜日）
2. 日別サマリー（通い・泊まり・訪問の数値）
3. メインコンテンツ（訪問セクションの予定表）

```
カレンダーヘッダー: │ 1  2  3  4  5  6 ...│
日別サマリー:       │12 15 10  8 12 14 ...│
訪問予定表:         │朝  2  朝  -  夕昼 ...│
                     ↑  ↑  ↑  ↑  ↑  ↑
              縦軸が完璧に揃っている（マスト要件）
```

---

### 4.2 CSS変数による統一

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

/* 訪問セクションで使用 */
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

### 4.3 table-layout: fixedの使用

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

### 4.4 縦軸整列の検証方法

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
  console.log('  訪問予定表:', userHeader?.offsetWidth);
  console.log('  カレンダー:', calendarLabel?.offsetWidth);
  console.log('  サマリー:', summaryLabel?.offsetWidth);
  
  // 日付セルの幅を確認
  const scheduleCell = document.querySelector('.schedule-grid .schedule-cell');
  const calendarCell = document.querySelector('.calendar-ruler-table .date-cell');
  const summaryCell = document.querySelector('.summary-table .cell');
  
  console.log('日付セルの幅:');
  console.log('  訪問予定表:', scheduleCell?.offsetWidth);
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

---

## 5. まとめ

### 5.1 v3.0で定義したこと

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

### 5.2 v1.0からの主要な変更

| 項目 | v1.0 | v3.0 |
|------|------|------|
| **縦軸整列** | 記載なし | マスト要件として明記 |
| **CSS変数** | 使用せず | --label-column-width, --date-cell-width |
| **ドキュメント行数** | 1,257行 | 約500行 |
| **カレンダー操作** | 詳細記載 | L3層に委譲 |
| **印刷・レスポンシブ** | 詳細記載 | L1層に委譲（または削除） |

---

### 5.3 重要な設計判断

1. **時間帯表示の設計にした理由**
   - 訪問は「いつ訪問するか」が最重要
   - 時間帯ごとの表示で一目で把握
   - 厳守（時刻指定）も柔軟に対応

2. **回数表示（3回以上は数字）にした理由**
   - 複数の訪問を視覚的に表現
   - 省スペース化
   - クリックで詳細確認

3. **モーダル方式にした理由**
   - 訪問情報が多い（時間帯、所要時間、担当職員等）
   - グリッド内では表示しきれない
   - 編集・削除も同じUIで統一

4. **縦軸整列をマスト要件にした理由**
   - ユーザーの明確な要求
   - カレンダーヘッダーが「物差し」として機能
   - 視認性の向上

---

### 5.4 削除したセクション（v3.0）

以下のセクションは削除しました：

- ❌ セクション4: カレンダー操作 → **L3_UI_統合UI設計.md**で定義
- ❌ セクション5: フィードバック → 実装時に判断
- ❌ セクション6: 印刷レイアウト → L1層または削除
- ❌ セクション7: レスポンシブ対応 → L1層または削除
- ❌ セクション8: アクセシビリティ → L1層または削除

**理由**:
- 共通仕様であり、セクション別に記述する必要がない
- 重複を避ける
- ドキュメントの保守性向上

---

### 5.5 実装の優先順位

**Phase 1（必須）**:
- ✅ グリッド表示
- ✅ セルのクリック処理
- ✅ 訪問追加モーダル
- ✅ 訪問編集・削除モーダル
- ✅ 時間帯表示
- ✅ 縦軸整列

**Phase 2（拡張）**:
- ⏭️ 訪問一覧モーダル（複数訪問時）
- ⏭️ ドラッグ＆ドロップ（訪問の移動）
- ⏭️ キーボード操作
- ⏭️ 時間帯ごとの色分け

---

## 📚 次に読むべきドキュメント

このドキュメントを読了したら、以下のドキュメントに進んでください。

### 関連ドキュメント

- **L3_UI_統合UI設計.md v3.0** - カレンダーヘッダー、全体レイアウト
- **L3_UI_日別サマリー設計.md v2.0** - 日別サマリーの詳細
- **L2_訪問_データ構造.md** - HoumonVisitクラスの仕様
- **L2_訪問_ロジック設計.md** - 回数カウント、時間帯判定

---

## 📝 参考資料

- L2_訪問_データ構造.md（HoumonVisitクラス）
- L3_UI_統合UI設計.md v3.0（カレンダーヘッダー）
- L3_UI_日別サマリー設計.md v2.0（縦軸整列）
- L1_技術_実装制約.md（UI/UX規約）
- CHECKLIST_設計レビュー.md（インタラクションの詳細記述）

---

## 📅 更新履歴

| 日付 | バージョン | 変更内容 | 担当 |
|------|----------|---------|------|
| 2025-11-23 | 1.0 | 初版作成（1,257行） | Claude |
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
- [x] モーダルの設計が詳細
- [x] 時間帯表示のルールが明確
- [x] 共通仕様（印刷等）が削除されている
- [x] ドキュメントがスリム化されている

---

**このドキュメントを読了したら、INDEX_ドキュメント構成.md に戻り、次のドキュメントに進んでください。**