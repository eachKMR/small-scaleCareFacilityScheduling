# L2_訪問_UI設計

**作成日**: 2025年11月23日  
**カテゴリ**: 第2層 - セクション別  
**バージョン**: 1.0

---

## 📖 このドキュメントについて

このドキュメントは、**訪問セクションのUI設計**を定義します。

### 対象読者

- 訪問セクションの実装担当者
- UIデザイナー
- テスト担当者

### 読了後に理解できること

- 月別予定表のグリッド構造
- セルの表示形式（複数訪問の扱い）
- 訪問追加・編集のインタラクション
- 時間帯の選択UI
- 視覚化と色分け

### 設計の前提

- **L2_訪問_データ構造.md** の HoumonSchedule クラスに基づく
- **L1_技術_実装制約.md** の UI/UX規約に準拠

---

## 1. 画面構成

### 1.1 全体レイアウト

```
┌─────────────────────────────────────────┐
│ [訪問セクション]                         │
├─────────────────────────────────────────┤
│ カレンダーヘッダー                       │
│ [◀] 2025年11月 [▶]  [今月]             │
├─────────────────────────────────────────┤
│ 職員稼働状況サマリー（Phase 2以降）      │
├─────────────────────────────────────────┤
│ 月別予定表（グリッド）                   │
│                                          │
│         25   26   27   28   29   30   1 │
│         月   火   水   木   金   土  日 │
│ 安藤   朝・夕  昼   -    朝   10:00  -  - │
│ 田中   10:00  朝   夕    -     昼   -  朝 │
│ ...                                      │
├─────────────────────────────────────────┤
│ アクション                               │
│ [訪問追加] [CSVインポート] [印刷]        │
└─────────────────────────────────────────┘
```

---

### 1.2 HTML構造

```html
<div id="houmon-section" class="section">
  <!-- カレンダーヘッダー -->
  <div class="calendar-header">
    <button id="prev-month" class="nav-button">◀</button>
    <h2 id="current-month">2025年11月</h2>
    <button id="next-month" class="nav-button">▶</button>
    <button id="today-button" class="nav-button">今月</button>
  </div>
  
  <!-- 職員稼働状況（Phase 2以降） -->
  <div class="staff-workload-summary" style="display: none;">
    <!-- Phase 2で実装 -->
  </div>
  
  <!-- 月別予定表 -->
  <div class="schedule-grid-container">
    <table id="houmon-grid" class="schedule-grid">
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
            <div class="visit-list">
              <span class="visit-item morning">朝</span>
              <span class="visit-item evening">夕</span>
            </div>
          </td>
          <!-- ...他の日付 -->
        </tr>
        <!-- ...他の利用者 -->
      </tbody>
    </table>
  </div>
  
  <!-- アクション -->
  <div class="actions">
    <button id="add-visit">訪問追加</button>
    <button id="import-csv">CSVインポート</button>
    <button id="print">印刷</button>
  </div>
  
  <!-- 訪問追加・編集モーダル -->
  <div id="visit-modal" class="modal" style="display: none;">
    <!-- 後述 -->
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
  min-width: 80px;
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

**1日複数回訪問の表示**:

```html
<td class="schedule-cell" 
    data-user-id="user001" 
    data-date="2025-11-25">
  <div class="visit-list">
    <span class="visit-item morning" data-visit-id="houmon_001">朝</span>
    <span class="visit-item strict" data-visit-id="houmon_002">10:00</span>
    <span class="visit-item evening" data-visit-id="houmon_003">夕</span>
  </div>
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
  min-height: 40px;
  vertical-align: middle;
}

.schedule-cell:hover {
  background-color: rgba(0, 123, 255, 0.1);
}

.visit-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
  align-items: center;
}

.visit-item {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.visit-item:hover {
  opacity: 0.8;
}
```

---

### 2.2 時間帯別の色分け

| 時間帯 | クラス名 | 背景色 | 表示例 |
|-------|---------|--------|-------|
| **厳守** | `strict` | `#ff6b6b` 赤 | `10:00` |
| **朝** | `morning` | `#ffd93d` 黄 | `朝` |
| **昼** | `daytime` | `#6bcf7f` 緑 | `昼` |
| **午後** | `afternoon` | `#95e1d3` 水色 | `午後` |
| **夕** | `evening` | `#a8dadc` 青 | `夕` |
| **夜** | `night` | `#457b9d` 紺 | `夜` |
| **随時** | `anytime` | `#adb5bd` 灰 | `随時` |

**スタイル**:
```css
.visit-item.strict {
  background-color: #ff6b6b;
  color: white;
  font-weight: bold;
}

.visit-item.morning {
  background-color: #ffd93d;
  color: #333;
}

.visit-item.daytime {
  background-color: #6bcf7f;
  color: white;
}

.visit-item.afternoon {
  background-color: #95e1d3;
  color: #333;
}

.visit-item.evening {
  background-color: #a8dadc;
  color: #333;
}

.visit-item.night {
  background-color: #457b9d;
  color: white;
}

.visit-item.anytime {
  background-color: #adb5bd;
  color: white;
}
```

---

### 2.3 訪問なしの表示

```html
<td class="schedule-cell empty" 
    data-user-id="user001" 
    data-date="2025-11-27">
  <div class="visit-list">
    <span class="empty-indicator">-</span>
  </div>
</td>
```

**スタイル**:
```css
.empty-indicator {
  color: #ccc;
  font-size: 16px;
}
```

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

**使用箇所と理由**:

| 箇所 | メソッド | 理由 |
|------|---------|------|
| **訪問項目クリック** | `stopPropagation()` | セルのクリックイベントを伝播させない（一覧モーダルが開かないようにする） |
| **モーダル内ボタン** | `preventDefault()` | フォームのsubmitを防ぐ（独自の保存処理を実行） |
| **モーダル外クリック** | なし | モーダルを閉じる処理のみ |

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

#### HTML構造

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
        
        <!-- 時間指定モード -->
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

#### スタイル

```css
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #ddd;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
}

.close-button:hover {
  color: #000;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: bold;
  font-size: 14px;
}

.required {
  color: #dc3545;
}

.form-group input[type="text"],
.form-group input[type="date"],
.form-group input[type="time"],
.form-group input[type="number"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input[readonly] {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #ddd;
}

.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}
```

---

#### JavaScript処理

```javascript
// 時間指定モードの切り替え
document.getElementById('time-mode').addEventListener('change', (event) => {
  const strictFields = document.getElementById('strict-time-fields');
  
  if (event.target.value === 'strict') {
    strictFields.style.display = 'block';
    document.getElementById('start-time').required = true;
    document.getElementById('end-time').required = true;
  } else {
    strictFields.style.display = 'none';
    document.getElementById('start-time').required = false;
    document.getElementById('end-time').required = false;
  }
});

// 訪問追加モーダルを開く
function openAddVisitModal(userId, date) {
  const user = getUserById(userId);
  
  // フォームをリセット
  document.getElementById('visit-form').reset();
  
  // 利用者と日付を設定
  document.getElementById('user-name').value = user.name;
  document.getElementById('user-id').value = userId;
  document.getElementById('visit-date').value = date;
  
  // モーダルタイトル
  document.getElementById('modal-title').textContent = '訪問追加';
  
  // モーダルを表示
  document.getElementById('visit-modal').style.display = 'flex';
}

// 訪問編集モーダルを開く
function openEditVisitModal(visit) {
  const user = getUserById(visit.userId);
  
  // フォームに既存データを設定
  document.getElementById('user-name').value = user.name;
  document.getElementById('user-id').value = visit.userId;
  document.getElementById('visit-date').value = visit.date;
  document.getElementById('time-mode').value = visit.timeMode;
  document.getElementById('duration').value = visit.duration;
  document.getElementById('staff-id').value = visit.staffId || '';
  document.getElementById('note').value = visit.note || '';
  
  // 厳守の場合は時刻も設定
  if (visit.timeMode === 'strict') {
    document.getElementById('start-time').value = visit.startTime;
    document.getElementById('end-time').value = visit.endTime;
    document.getElementById('strict-time-fields').style.display = 'block';
  }
  
  // モーダルタイトル
  document.getElementById('modal-title').textContent = '訪問編集';
  
  // 削除ボタンを追加
  const footer = document.querySelector('.modal-footer');
  const deleteButton = document.createElement('button');
  deleteButton.textContent = '削除';
  deleteButton.className = 'btn-danger';
  deleteButton.style.marginRight = 'auto';
  deleteButton.addEventListener('click', () => deleteVisit(visit.id));
  footer.insertBefore(deleteButton, footer.firstChild);
  
  // モーダルを表示
  document.getElementById('visit-modal').style.display = 'flex';
}

// モーダルを閉じる
function closeModal() {
  document.getElementById('visit-modal').style.display = 'none';
  document.getElementById('visit-form').reset();
  
  // 削除ボタンがあれば削除
  const deleteButton = document.querySelector('.btn-danger');
  if (deleteButton) deleteButton.remove();
}

// 保存ボタン
document.getElementById('save-button').addEventListener('click', () => {
  const form = document.getElementById('visit-form');
  
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const data = {
    userId: document.getElementById('user-id').value,
    date: document.getElementById('visit-date').value,
    timeMode: document.getElementById('time-mode').value,
    startTime: document.getElementById('start-time').value || null,
    endTime: document.getElementById('end-time').value || null,
    duration: parseInt(document.getElementById('duration').value, 10),
    staffId: document.getElementById('staff-id').value || null,
    note: document.getElementById('note').value || ''
  };
  
  // データを保存
  saveVisit(data);
  
  // モーダルを閉じる
  closeModal();
  
  // グリッドを再描画
  renderGrid();
});

// キャンセルボタン
document.getElementById('cancel-button').addEventListener('click', closeModal);

// 閉じるボタン
document.querySelector('.close-button').addEventListener('click', closeModal);

// モーダル外クリックで閉じる
document.getElementById('visit-modal').addEventListener('click', (event) => {
  if (event.target.id === 'visit-modal') {
    closeModal();
  }
});
```

---

### 3.4 訪問一覧モーダル（複数訪問がある場合）

#### HTML構造

```html
<div id="visit-list-modal" class="modal" style="display: none;">
  <div class="modal-content">
    <div class="modal-header">
      <h3>訪問一覧</h3>
      <button class="close-button">&times;</button>
    </div>
    
    <div class="modal-body">
      <p><strong>利用者:</strong> <span id="list-user-name"></span></p>
      <p><strong>日付:</strong> <span id="list-date"></span></p>
      
      <ul id="visit-items" class="visit-items-list">
        <!-- 動的に生成 -->
      </ul>
      
      <button id="add-another-visit" class="btn-secondary">さらに訪問を追加</button>
    </div>
    
    <div class="modal-footer">
      <button id="close-list-button" class="btn-secondary">閉じる</button>
    </div>
  </div>
</div>
```

**動的に生成される訪問項目**:
```html
<li class="visit-item-detail">
  <span class="time-badge morning">朝</span>
  <span class="duration">30分</span>
  <span class="staff">担当: 佐藤</span>
  <button class="edit-visit-btn" data-visit-id="houmon_001">編集</button>
</li>
```

---

## 4. カレンダー操作

### 4.1 月の切り替え

#### ボタン

```html
<button id="prev-month" class="nav-button">◀</button>
<h2 id="current-month">2025年11月</h2>
<button id="next-month" class="nav-button">▶</button>
<button id="today-button" class="nav-button">今月</button>
```

#### イベント処理

```javascript
let currentYear = 2025;
let currentMonth = 11;

document.getElementById('prev-month').addEventListener('click', () => {
  currentMonth--;
  if (currentMonth < 1) {
    currentMonth = 12;
    currentYear--;
  }
  renderCalendar(currentYear, currentMonth);
});

document.getElementById('next-month').addEventListener('click', () => {
  currentMonth++;
  if (currentMonth > 12) {
    currentMonth = 1;
    currentYear++;
  }
  renderCalendar(currentYear, currentMonth);
});

document.getElementById('today-button').addEventListener('click', () => {
  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth() + 1;
  renderCalendar(currentYear, currentMonth);
});
```

---

### 4.2 月の表示範囲

**ルール**: 当月1日～末日まで表示

```
例: 2025年11月を選択
→ 2025年11月1日 ～ 2025年11月30日 を表示
```

---

## 5. フィードバック

### 5.1 トースト通知

#### 表示タイミング

| イベント | メッセージ | タイプ |
|---------|----------|--------|
| 訪問追加成功 | 「訪問を追加しました」 | success |
| 訪問編集成功 | 「訪問を更新しました」 | success |
| 訪問削除成功 | 「訪問を削除しました」 | info |
| バリデーションエラー | 「入力内容を確認してください」 | error |
| CSVインポート成功 | 「○件の訪問をインポートしました」 | success |

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
  z-index: 1100;
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

### 5.2 訪問項目のホバー効果

```css
.visit-item:hover {
  opacity: 0.8;
  transform: scale(1.05);
  transition: all 0.2s ease;
}
```

---

## 6. 印刷レイアウト

### 6.1 印刷用スタイル

```css
@media print {
  /* ヘッダー・フッターを非表示 */
  .calendar-header,
  .actions {
    display: none;
  }
  
  /* グリッドを最適化 */
  .schedule-grid {
    width: 100%;
    font-size: 9pt;
  }
  
  .schedule-cell {
    padding: 2px;
  }
  
  .visit-item {
    font-size: 9px;
    padding: 1px 3px;
  }
  
  /* 改ページを防ぐ */
  .schedule-grid tr {
    page-break-inside: avoid;
  }
  
  /* 色は印刷しない（インクの節約） */
  .visit-item {
    background-color: transparent !important;
    border: 1px solid #333;
    color: #000 !important;
  }
}
```

---

### 6.2 印刷範囲

**1ページに収める内容**:
- 月別予定表（横31日分 × 縦約20人）

**A4横向き**を推奨

---

## 7. レスポンシブ対応

### 7.1 画面サイズ別の対応

#### デスクトップ（1366px以上）

```css
.schedule-grid {
  font-size: 14px;
}

.schedule-cell {
  min-width: 60px;
  min-height: 40px;
}

.visit-item {
  font-size: 11px;
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
    min-width: 50px;
    min-height: 35px;
  }
  
  .visit-item {
    font-size: 10px;
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
    min-width: 40px;
    min-height: 30px;
  }
  
  .visit-item {
    font-size: 9px;
  }
}
```

**Phase 1ではデスクトップを優先** - スマホ対応は Phase 2以降

---

## 8. アクセシビリティ

### 8.1 キーボードナビゲーション

**Tabキー**でセル間を移動できるようにする:

```html
<td class="schedule-cell" 
    tabindex="0"
    data-user-id="user001" 
    data-date="2025-11-25">
  <div class="visit-list">
    <span class="visit-item morning">朝</span>
  </div>
</td>
```

---

### 8.2 スクリーンリーダー対応

```html
<td class="schedule-cell" 
    tabindex="0"
    role="button"
    aria-label="安藤さん、11月25日、訪問2件: 朝、夕"
    data-user-id="user001" 
    data-date="2025-11-25">
  <div class="visit-list">
    <span class="visit-item morning">朝</span>
    <span class="visit-item evening">夕</span>
  </div>
</td>
```

**Phase 1では優先度低** - Phase 2以降で対応

---

## 9. Phase 2以降の拡張機能

### 9.1 職員稼働状況の可視化

**目的**: 同時刻に複数の訪問が重なっていないか確認

```
┌─────────────────────────────────────────┐
│ 職員稼働状況（11月25日）                 │
├─────────────────────────────────────────┤
│ 佐藤: 朝(3件) 昼(2件) 夕(4件) ⚠️夕が過密 │
│ 鈴木: 朝(2件) 午後(3件) 夕(2件)         │
└─────────────────────────────────────────┘
```

---

### 9.2 ドラッグ&ドロップでの移動

**機能**: 訪問項目をドラッグして、別の日付にドロップ

```
例: 「朝」の訪問を25日から26日にドラッグ
→ 日付が変更される
```

---

### 9.3 訪問ルート最適化

**機能**: 移動時間を考慮した最適な訪問順序を提案

```
例: 
- 施設 → 安藤さん → 田中さん → 山田さん → 施設
- 総移動時間: 45分
```

---

## 10. まとめ

### 10.1 このドキュメントで定義したこと

```
✅ 定義したこと
├─ 画面構成（HTML構造）
├─ グリッド表示（複数訪問の扱い）
├─ セルと訪問項目のクリック処理
├─ 訪問追加・編集モーダル
├─ 時間帯別の色分け
├─ カレンダー操作（月切り替え）
├─ フィードバック（トースト、ホバー）
├─ 印刷レイアウト
└─ レスポンシブ対応
```

---

### 10.2 重要なポイント

1. **1セルに複数訪問を表示**: `朝・昼・夕` のように並べる
2. **時間帯別に色分け**: 厳守は赤、朝は黄色など
3. **訪問項目をクリックで編集**: 直接編集モーダルを開く
4. **時間指定モードで表示切り替え**: 厳守の場合は時刻入力欄を表示
5. **職員割り当ては任意**: Phase 1では未割り当て可

---

### 10.3 Phase 1で実装すること

```
✅ Phase 1
├─ セルのクリック処理（追加・編集）
├─ 訪問追加・編集モーダル
├─ 時間帯別の色分け
├─ 月の切り替え
├─ トースト通知
└─ 印刷レイアウト

⏭️ Phase 2以降
├─ 職員稼働状況の可視化
├─ ドラッグ&ドロップ
├─ 訪問ルート最適化
├─ スマートフォン対応
└─ アクセシビリティ向上
```

---

### 10.4 次のステップ

UI設計が確定したので、次は**ロジック設計**に進みます：

**L2_訪問_ロジック設計.md**で定義すること：
1. 訪問予定の追加・編集・削除のロジック
2. バリデーション処理
3. 移動時間を考慮した検証
4. イベント処理の順序

---

## 📚 次に読むべきドキュメント

このドキュメントを読了したら、以下のドキュメントに進んでください。

### 次のドキュメント

**L2_訪問_ロジック設計.md**
- 訪問予定の追加・編集・削除
- バリデーション処理
- 移動時間の検証
- イベント処理の詳細

---

## 📝 参考資料

- L2_訪問_データ構造.md（HoumonScheduleクラス）
- L1_技術_実装制約.md（UI/UX規約）
- L2_通い_UI設計.md（共通UI設計パターン）

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
- [x] 複雑な操作には代替手段がある
- [x] モーダルの開閉処理が明確
- [x] 複数訪問の表示方法が明確
- [x] 時間帯別の色分けが定義されている
- [x] **状態遷移図が作成されている**
- [x] **preventDefault/stopPropagationの使用箇所が明確**

---

**このドキュメントを読了したら、INDEX_ドキュメント構成.md に戻り、次のドキュメントに進んでください。**
