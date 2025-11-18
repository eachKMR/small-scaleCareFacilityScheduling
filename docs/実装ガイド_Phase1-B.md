# 実装ガイド Phase 1-B: CellEditor（セル編集機能）

**作成日**: 2025年11月17日  
**対象**: GitHub Copilot（実装担当）  
**目的**: セル編集機能の実装指示

---

## 📋 前提条件

### 完了している必要があるフェーズ
- ✅ Phase 0: 基盤実装
- ✅ Phase 1-A: CSVService実装

### 必読ドキュメント
1. **要件定義書_予定管理_v1.2.1.md** - 操作方法の詳細
2. **要件定義書_UI_v1.3.1.md** - CSS仕様
3. **データモデル設計書_v3.0.md** - ScheduleCell構造

---

## 🎯 Phase 1-Bの目標

### 実装する機能
1. **フォーカス管理**: セルのフォーカス状態管理
2. **空欄⇔○トグル**: 通泊行の基本操作
3. **◎のクリック不可**: 連泊中セルの操作制限
4. **ドラッグ操作**: 宿泊期間の作成と調整
5. **右クリックメニュー**: コンテキストメニュー
6. **ツールチップ**: ホバー時の情報表示

---

## 📁 実装対象ファイル

### 新規作成
```
src/
  controllers/
    CellEditorController.js  ← 新規作成
  services/
    DragService.js           ← 新規作成
  components/
    ContextMenu.js           ← 新規作成
    Tooltip.js               ← 新規作成
```

### 修正
```
src/
  models/
    ScheduleCell.js          ← isClickable()追加
  views/
    ScheduleGridView.js      ← イベントハンドラー追加
  styles/
    schedule-grid.css        ← フォーカス、◎のCSS追加
```

---

## 🔨 実装タスク

### タスク1: ScheduleCellにisClickable()追加

**ファイル**: `src/models/ScheduleCell.js`

**追加するメソッド**:
```javascript
class ScheduleCell {
  constructor(userId, date, cellType) {
    this.userId = userId;
    this.date = date;
    this.cellType = cellType;
    this.inputValue = "";
    this.note = "";
    this.actualFlags = {
      day: false,
      stay: false,
      visit: 0,
      halfDayType: 'full'
    };
  }
  
  /**
   * セルがクリック可能かどうかを判定
   * @returns {boolean} クリック可能ならtrue
   */
  isClickable() {
    // ◎（連泊中）はクリック不可
    if (this.inputValue === '◎') {
      return false;
    }
    return true;
  }
  
  /**
   * 既存のメソッドはそのまま
   */
  // ... 他のメソッド
}
```

**テスト**:
```javascript
const cell = new ScheduleCell('user001', '2025-12-05', 'dayStay');
console.assert(cell.isClickable() === true, '空欄セルはクリック可能');

cell.inputValue = '○';
console.assert(cell.isClickable() === true, '○セルはクリック可能');

cell.inputValue = '◎';
console.assert(cell.isClickable() === false, '◎セルはクリック不可');
```

---

### タスク2: CSSの追加

**ファイル**: `src/styles/schedule-grid.css`

**追加するCSS**:
```css
/**
 * フォーカス中のセル
 */
.schedule-cell:focus,
.schedule-cell.focused {
  outline: 2px solid #0066cc;
  outline-offset: -2px;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.2);
  z-index: 10;
  position: relative;
}

/* フォーカス時のホバー効果は無効化 */
.schedule-cell.focused:hover {
  background: transparent;
}

/**
 * ◎（連泊中）セル - クリック不可
 */
.cell-stay-middle {
  cursor: default;
  pointer-events: none;
}

.cell-stay-middle:hover {
  background: transparent;
}

.cell-stay-middle:focus {
  outline: none;
  box-shadow: none;
}

.cell-stay-middle * {
  cursor: default;
}

/**
 * 退所日の右罫線
 */
.cell-check-out::after {
  content: '';
  position: absolute;
  right: 0;  /* 左から右に変更 */
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #0066cc;
}

/**
 * ドラッグ中のプレビュー
 */
.cell-drag-preview {
  background-color: rgba(0, 102, 204, 0.2);
  border: 2px dashed #0066cc;
}
```

---

### タスク3: CellEditorControllerの作成

**ファイル**: `src/controllers/CellEditorController.js`

**実装内容**:
```javascript
/**
 * CellEditorController
 * セルの編集機能を管理
 */
class CellEditorController {
  constructor(app) {
    this.app = app;
    this.focusedCell = null;  // 現在フォーカス中のセル
  }
  
  /**
   * セルのクリックを処理
   * @param {ScheduleCell} cell クリックされたセル
   */
  handleCellClick(cell) {
    // ◎はクリック不可
    if (!cell.isClickable()) {
      return;
    }
    
    // 通泊行の処理
    if (cell.cellType === 'dayStay') {
      this.handleDayStayCellClick(cell);
    }
    // 訪問行の処理
    else if (cell.cellType === 'visit') {
      this.handleVisitCellClick(cell);
    }
  }
  
  /**
   * 通泊行のクリック処理
   * @param {ScheduleCell} cell
   */
  handleDayStayCellClick(cell) {
    // 宿泊期間（入、退）の場合はフォーカスのみ
    if (cell.inputValue === '入' || cell.inputValue === '退') {
      this.setFocus(cell);
      return;
    }
    
    // 空欄 → ○
    if (cell.inputValue === '') {
      cell.inputValue = '○';
      this.setFocus(cell);
      this.saveCell(cell);
      return;
    }
    
    // ○ → 空欄
    if (cell.inputValue === '○') {
      cell.inputValue = '';
      this.setFocus(cell);
      this.saveCell(cell);
      return;
    }
    
    // ◓、◒ → 空欄
    if (cell.inputValue === '◓' || cell.inputValue === '◒') {
      cell.inputValue = '';
      this.setFocus(cell);
      this.saveCell(cell);
      return;
    }
  }
  
  /**
   * 訪問行のクリック処理
   * @param {ScheduleCell} cell
   */
  handleVisitCellClick(cell) {
    const currentValue = parseInt(cell.inputValue) || 0;
    const nextValue = (currentValue + 1) % 4; // 0→1→2→3→0
    
    cell.inputValue = nextValue === 0 ? '' : String(nextValue);
    this.setFocus(cell);
    this.saveCell(cell);
  }
  
  /**
   * セルにフォーカスを設定
   * @param {ScheduleCell} cell
   */
  setFocus(cell) {
    // 前のフォーカスを解除
    if (this.focusedCell) {
      const prevElement = this.app.views.grid.getCellElement(this.focusedCell);
      if (prevElement) {
        prevElement.classList.remove('focused');
      }
    }
    
    // 新しいセルにフォーカス
    this.focusedCell = cell;
    const element = this.app.views.grid.getCellElement(cell);
    if (element) {
      element.classList.add('focused');
      element.focus();
    }
  }
  
  /**
   * セルを保存
   * @param {ScheduleCell} cell
   */
  saveCell(cell) {
    // LocalStorageに保存
    this.app.services.storage.saveScheduleCell(cell);
    
    // 画面を再描画
    this.app.views.grid.renderCell(cell);
    
    // 定員状況を更新
    this.app.controllers.capacity.updateCapacityStatus();
  }
}

export default CellEditorController;
```

**チェックポイント**:
- [ ] 空欄をクリックすると○が追加される
- [ ] ○をクリックすると空欄に戻る
- [ ] ◎はクリックしても無反応
- [ ] 入・退はフォーカスのみ（操作なし）
- [ ] 訪問行は0→1→2→3→0

---

### タスク4: DragServiceの作成

**ファイル**: `src/services/DragService.js`

**実装内容**:
```javascript
/**
 * DragService
 * ドラッグ操作を管理
 */
class DragService {
  constructor(app) {
    this.app = app;
    this.isDragging = false;
    this.dragStartCell = null;
    this.dragEndCell = null;
  }
  
  /**
   * ドラッグ開始
   * @param {ScheduleCell} cell
   */
  onDragStart(cell) {
    // 通泊行のみドラッグ可能
    if (cell.cellType !== 'dayStay') {
      return;
    }
    
    // ◎はドラッグ開始不可
    if (!cell.isClickable()) {
      return;
    }
    
    this.isDragging = true;
    this.dragStartCell = cell;
    
    // 視覚的フィードバック
    const element = this.app.views.grid.getCellElement(cell);
    if (element) {
      element.classList.add('cell-drag-preview');
    }
  }
  
  /**
   * ドラッグ中
   * @param {ScheduleCell} cell
   */
  onDragMove(cell) {
    if (!this.isDragging) return;
    
    this.dragEndCell = cell;
    
    // プレビュー表示
    this.showDragPreview(this.dragStartCell, this.dragEndCell);
  }
  
  /**
   * ドラッグ終了
   * @param {ScheduleCell} cell
   */
  onDragEnd(cell) {
    if (!this.isDragging) return;
    
    this.dragEndCell = cell;
    this.isDragging = false;
    
    // プレビューをクリア
    this.clearDragPreview();
    
    // ドラッグの種類を判定して処理
    this.processDrag(this.dragStartCell, this.dragEndCell);
    
    this.dragStartCell = null;
    this.dragEndCell = null;
  }
  
  /**
   * ドラッグを処理
   * @param {ScheduleCell} startCell
   * @param {ScheduleCell} endCell
   */
  processDrag(startCell, endCell) {
    // 空欄からのドラッグ → 宿泊期間作成
    if (startCell.inputValue === '') {
      this.createStayPeriod(startCell, endCell);
      return;
    }
    
    // 入からのドラッグ → 入所日調整
    if (startCell.inputValue === '入') {
      this.adjustCheckInDate(startCell, endCell);
      return;
    }
    
    // 退からのドラッグ → 退所日調整
    if (startCell.inputValue === '退') {
      this.adjustCheckOutDate(startCell, endCell);
      return;
    }
  }
  
  /**
   * 宿泊期間を作成
   * @param {ScheduleCell} startCell
   * @param {ScheduleCell} endCell
   */
  createStayPeriod(startCell, endCell) {
    // startとendの日付を取得
    const startDate = new Date(startCell.date);
    const endDate = new Date(endCell.date);
    
    // 順序を確認（逆方向ドラッグ対応）
    const [checkInDate, checkOutDate] = startDate <= endDate 
      ? [startDate, endDate] 
      : [endDate, startDate];
    
    // 期間内のセルを取得
    const cells = this.getCellsInRange(startCell.userId, checkInDate, checkOutDate);
    
    // 入・◎・退を設定
    cells.forEach((cell, index) => {
      if (index === 0) {
        cell.inputValue = '入';
      } else if (index === cells.length - 1) {
        cell.inputValue = '退';
      } else {
        cell.inputValue = '◎';
      }
      this.app.controllers.cellEditor.saveCell(cell);
    });
  }
  
  /**
   * 入所日を調整
   * @param {ScheduleCell} currentCheckInCell 現在の入所日セル
   * @param {ScheduleCell} newCheckInCell 新しい入所日セル
   */
  adjustCheckInDate(currentCheckInCell, newCheckInCell) {
    // 現在の宿泊期間を取得
    const stayPeriod = this.findStayPeriod(currentCheckInCell);
    if (!stayPeriod) return;
    
    // 新しい入所日を設定
    const newCheckInDate = new Date(newCheckInCell.date);
    const checkOutDate = new Date(stayPeriod.checkOutCell.date);
    
    // 古い入所日〜新しい入所日の前日までをクリア
    const oldCheckInDate = new Date(currentCheckInCell.date);
    if (newCheckInDate > oldCheckInDate) {
      const cellsToClear = this.getCellsInRange(
        currentCheckInCell.userId, 
        oldCheckInDate, 
        new Date(newCheckInDate.getTime() - 86400000)
      );
      cellsToClear.forEach(cell => {
        cell.inputValue = '';
        this.app.controllers.cellEditor.saveCell(cell);
      });
    }
    
    // 新しい期間を作成
    this.createStayPeriod(newCheckInCell, stayPeriod.checkOutCell);
  }
  
  /**
   * 退所日を調整
   * @param {ScheduleCell} currentCheckOutCell 現在の退所日セル
   * @param {ScheduleCell} newCheckOutCell 新しい退所日セル
   */
  adjustCheckOutDate(currentCheckOutCell, newCheckOutCell) {
    // 入所日調整と同様の処理
    const stayPeriod = this.findStayPeriod(currentCheckOutCell);
    if (!stayPeriod) return;
    
    const checkInDate = new Date(stayPeriod.checkInCell.date);
    const newCheckOutDate = new Date(newCheckOutCell.date);
    const oldCheckOutDate = new Date(currentCheckOutCell.date);
    
    // 新しい退所日+1〜古い退所日までをクリア
    if (newCheckOutDate < oldCheckOutDate) {
      const cellsToClear = this.getCellsInRange(
        currentCheckOutCell.userId,
        new Date(newCheckOutDate.getTime() + 86400000),
        oldCheckOutDate
      );
      cellsToClear.forEach(cell => {
        cell.inputValue = '';
        this.app.controllers.cellEditor.saveCell(cell);
      });
    }
    
    // 新しい期間を作成
    this.createStayPeriod(stayPeriod.checkInCell, newCheckOutCell);
  }
  
  /**
   * 指定期間内のセルを取得
   * @param {string} userId
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {ScheduleCell[]}
   */
  getCellsInRange(userId, startDate, endDate) {
    const cells = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const cell = this.app.models.scheduleCalendar.getCell(userId, dateStr, 'dayStay');
      if (cell) {
        cells.push(cell);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return cells;
  }
  
  /**
   * セルが含まれる宿泊期間を検索
   * @param {ScheduleCell} cell
   * @returns {Object|null} {checkInCell, checkOutCell}
   */
  findStayPeriod(cell) {
    // 実装はScheduleCalendarのfindStayPeriodを利用
    return this.app.models.scheduleCalendar.findStayPeriod(cell);
  }
  
  /**
   * ドラッグプレビューを表示
   * @param {ScheduleCell} startCell
   * @param {ScheduleCell} endCell
   */
  showDragPreview(startCell, endCell) {
    // プレビュー実装（視覚的フィードバック）
    // TODO: 実装
  }
  
  /**
   * ドラッグプレビューをクリア
   */
  clearDragPreview() {
    // プレビューをクリア
    const previews = document.querySelectorAll('.cell-drag-preview');
    previews.forEach(el => el.classList.remove('cell-drag-preview'));
  }
}

export default DragService;
```

**チェックポイント**:
- [ ] 空欄からドラッグで宿泊期間が作成される
- [ ] 入をドラッグで入所日が調整される
- [ ] 退をドラッグで退所日が調整される
- [ ] 逆方向ドラッグも機能する
- [ ] ◎はドラッグ開始不可

---

### タスク5: ContextMenuの作成

**ファイル**: `src/components/ContextMenu.js`

**実装内容**:
```javascript
/**
 * ContextMenu
 * 右クリックメニュー
 */
class ContextMenu {
  constructor(app) {
    this.app = app;
    this.currentCell = null;
    this.menuElement = null;
  }
  
  /**
   * メニューを表示
   * @param {ScheduleCell} cell
   * @param {number} x
   * @param {number} y
   */
  show(cell, x, y) {
    this.currentCell = cell;
    
    // 既存のメニューを削除
    this.hide();
    
    // メニュー要素を作成
    this.menuElement = this.createMenuElement(cell);
    
    // 位置を設定
    this.menuElement.style.left = `${x}px`;
    this.menuElement.style.top = `${y}px`;
    
    // DOMに追加
    document.body.appendChild(this.menuElement);
    
    // 外側クリックで閉じる
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick.bind(this), { once: true });
    }, 0);
  }
  
  /**
   * メニュー要素を作成
   * @param {ScheduleCell} cell
   * @returns {HTMLElement}
   */
  createMenuElement(cell) {
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    
    let items = [];
    
    // 通泊行のメニュー
    if (cell.cellType === 'dayStay') {
      // 宿泊期間中の場合
      if (this.isInStayPeriod(cell)) {
        items = [
          { label: 'クリア', action: () => this.clearStayPeriod(cell) },
          { separator: true },
          { label: '備考', action: () => this.showNotePanel(cell) }
        ];
      } 
      // 通常セルの場合
      else {
        items = [
          { label: '通い全日', action: () => this.setSymbol(cell, '○') },
          { label: '前半通い', action: () => this.setSymbol(cell, '◓') },
          { label: '後半通い', action: () => this.setSymbol(cell, '◒') },
          { label: '入所', action: () => this.setSymbol(cell, '入') },
          { label: '退所', action: () => this.setSymbol(cell, '退') },
          { label: 'クリア', action: () => this.setSymbol(cell, '') },
          { separator: true },
          { label: '備考', action: () => this.showNotePanel(cell) }
        ];
      }
    }
    // 訪問行のメニュー
    else if (cell.cellType === 'visit') {
      items = [
        { label: '1回', action: () => this.setVisitCount(cell, 1) },
        { label: '2回', action: () => this.setVisitCount(cell, 2) },
        { label: '3回', action: () => this.setVisitCount(cell, 3) },
        { label: '直接入力', action: () => this.showDirectInput(cell) },
        { label: 'クリア', action: () => this.setVisitCount(cell, 0) },
        { separator: true },
        { label: '備考', action: () => this.showNotePanel(cell) }
      ];
    }
    
    // メニュー項目を追加
    items.forEach(item => {
      if (item.separator) {
        const separator = document.createElement('div');
        separator.className = 'context-menu-separator';
        menu.appendChild(separator);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.textContent = item.label;
        menuItem.addEventListener('click', () => {
          item.action();
          this.hide();
        });
        menu.appendChild(menuItem);
      }
    });
    
    return menu;
  }
  
  /**
   * セルが宿泊期間内かどうか
   * @param {ScheduleCell} cell
   * @returns {boolean}
   */
  isInStayPeriod(cell) {
    return cell.inputValue === '入' || 
           cell.inputValue === '◎' || 
           cell.inputValue === '退';
  }
  
  /**
   * 宿泊期間をクリア
   * @param {ScheduleCell} cell
   */
  clearStayPeriod(cell) {
    const stayPeriod = this.app.services.drag.findStayPeriod(cell);
    if (!stayPeriod) return;
    
    const cells = this.app.services.drag.getCellsInRange(
      cell.userId,
      new Date(stayPeriod.checkInCell.date),
      new Date(stayPeriod.checkOutCell.date)
    );
    
    cells.forEach(c => {
      c.inputValue = '';
      this.app.controllers.cellEditor.saveCell(c);
    });
  }
  
  /**
   * 記号を設定
   * @param {ScheduleCell} cell
   * @param {string} symbol
   */
  setSymbol(cell, symbol) {
    cell.inputValue = symbol;
    this.app.controllers.cellEditor.saveCell(cell);
  }
  
  /**
   * 訪問回数を設定
   * @param {ScheduleCell} cell
   * @param {number} count
   */
  setVisitCount(cell, count) {
    cell.inputValue = count === 0 ? '' : String(count);
    this.app.controllers.cellEditor.saveCell(cell);
  }
  
  /**
   * 直接入力ダイアログを表示
   * @param {ScheduleCell} cell
   */
  showDirectInput(cell) {
    const count = prompt('訪問回数を入力してください（数値）:', cell.inputValue || '');
    if (count === null) return;
    
    const num = parseInt(count);
    if (isNaN(num) || num < 0) {
      alert('1以上の数値を入力してください');
      return;
    }
    
    this.setVisitCount(cell, num);
  }
  
  /**
   * 備考パネルを表示
   * @param {ScheduleCell} cell
   */
  showNotePanel(cell) {
    // TODO: Phase 1-Dで実装
    alert('備考機能は未実装です');
  }
  
  /**
   * メニューを非表示
   */
  hide() {
    if (this.menuElement) {
      this.menuElement.remove();
      this.menuElement = null;
    }
  }
  
  /**
   * 外側クリックを処理
   * @param {Event} e
   */
  handleOutsideClick(e) {
    if (!this.menuElement?.contains(e.target)) {
      this.hide();
    }
  }
}

export default ContextMenu;
```

**必要なCSS** (`src/styles/context-menu.css`):
```css
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 150px;
  z-index: 1000;
}

.context-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
}

.context-menu-item:hover {
  background: #f0f0f0;
}

.context-menu-separator {
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
}
```

---

### タスク6: Tooltipの作成

**ファイル**: `src/components/Tooltip.js`

**実装内容**:
```javascript
/**
 * Tooltip
 * ホバー時のツールチップ
 */
class Tooltip {
  constructor(app) {
    this.app = app;
    this.tooltipElement = null;
    this.currentCell = null;
    this.showTimeout = null;
  }
  
  /**
   * ツールチップを表示（遅延あり）
   * @param {ScheduleCell} cell
   * @param {HTMLElement} targetElement
   */
  showDelayed(cell, targetElement) {
    this.currentCell = cell;
    
    // 既存のタイムアウトをクリア
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
    }
    
    // 500ms後に表示
    this.showTimeout = setTimeout(() => {
      this.show(cell, targetElement);
    }, 500);
  }
  
  /**
   * ツールチップを表示
   * @param {ScheduleCell} cell
   * @param {HTMLElement} targetElement
   */
  show(cell, targetElement) {
    // ツールチップ内容を生成
    const content = this.generateContent(cell);
    if (!content) return;
    
    // 既存のツールチップを削除
    this.hide();
    
    // ツールチップ要素を作成
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = 'tooltip';
    this.tooltipElement.innerHTML = content;
    
    // 位置を計算
    const rect = targetElement.getBoundingClientRect();
    this.tooltipElement.style.left = `${rect.left + rect.width / 2}px`;
    this.tooltipElement.style.top = `${rect.top - 10}px`;
    
    // DOMに追加
    document.body.appendChild(this.tooltipElement);
  }
  
  /**
   * ツールチップの内容を生成
   * @param {ScheduleCell} cell
   * @returns {string|null}
   */
  generateContent(cell) {
    const user = this.app.models.users.find(u => u.id === cell.userId);
    const date = new Date(cell.date);
    const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
    
    let content = `<div class="tooltip-name">${user.name}</div>`;
    content += `<div class="tooltip-date">${dateStr}</div>`;
    
    // 通泊行
    if (cell.cellType === 'dayStay') {
      if (cell.inputValue === '') {
        content += `<div class="tooltip-hint">クリックで通い全日</div>`;
      } else if (cell.inputValue === '○') {
        content += `<div class="tooltip-status">通い全日</div>`;
        content += `<div class="tooltip-hint">クリックで空欄に</div>`;
      } else if (cell.inputValue === '入') {
        const stayPeriod = this.app.services.drag.findStayPeriod(cell);
        if (stayPeriod) {
          content += `<div class="tooltip-status">入所</div>`;
          content += `<div class="tooltip-period">（期間情報）</div>`;
          content += `<div class="tooltip-hint">ドラッグで調整可能</div>`;
        }
      } else if (cell.inputValue === '◎') {
        content += `<div class="tooltip-status">宿泊中</div>`;
        content += `<div class="tooltip-hint">右クリック→クリアで期間削除</div>`;
      } else if (cell.inputValue === '退') {
        content += `<div class="tooltip-status">退所</div>`;
        content += `<div class="tooltip-hint">ドラッグで調整可能</div>`;
      }
    }
    // 訪問行
    else if (cell.cellType === 'visit') {
      if (cell.inputValue === '') {
        content += `<div class="tooltip-hint">クリックで訪問追加</div>`;
      } else {
        content += `<div class="tooltip-status">訪問${cell.inputValue}回</div>`;
      }
    }
    
    // 備考があれば表示
    if (cell.note) {
      content += `<div class="tooltip-note">備考: ${cell.note}</div>`;
    }
    
    return content;
  }
  
  /**
   * ツールチップを非表示
   */
  hide() {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    
    if (this.tooltipElement) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }
  }
}

export default Tooltip;
```

**必要なCSS** (`src/styles/tooltip.css`):
```css
.tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 2000;
  pointer-events: none;
  transform: translate(-50%, -100%);
  white-space: nowrap;
}

.tooltip-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.tooltip-date {
  color: #ccc;
  margin-bottom: 4px;
}

.tooltip-status {
  margin: 4px 0;
}

.tooltip-period {
  color: #aaa;
  font-size: 11px;
}

.tooltip-hint {
  color: #ffd700;
  font-size: 11px;
  margin-top: 4px;
}

.tooltip-note {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  max-width: 200px;
  white-space: normal;
}
```

---

### タスク7: ScheduleGridViewの修正

**ファイル**: `src/views/ScheduleGridView.js`

**追加するメソッド**:
```javascript
class ScheduleGridView {
  constructor(app) {
    this.app = app;
    // 既存のプロパティ
  }
  
  /**
   * セル要素にイベントハンドラーを追加
   * @param {HTMLElement} cellElement
   * @param {ScheduleCell} cell
   */
  attachCellEventHandlers(cellElement, cell) {
    // クリックイベント
    cellElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.app.controllers.cellEditor.handleCellClick(cell);
    });
    
    // 右クリックイベント
    cellElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.app.components.contextMenu.show(cell, e.clientX, e.clientY);
    });
    
    // ホバーイベント
    cellElement.addEventListener('mouseenter', () => {
      this.app.components.tooltip.showDelayed(cell, cellElement);
    });
    
    cellElement.addEventListener('mouseleave', () => {
      this.app.components.tooltip.hide();
    });
    
    // ドラッグイベント
    cellElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // 左クリックのみ
        this.app.services.drag.onDragStart(cell);
      }
    });
    
    cellElement.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.app.services.drag.onDragEnd(cell);
      }
    });
    
    cellElement.addEventListener('mousemove', () => {
      this.app.services.drag.onDragMove(cell);
    });
  }
  
  /**
   * セル要素を取得
   * @param {ScheduleCell} cell
   * @returns {HTMLElement|null}
   */
  getCellElement(cell) {
    const selector = `[data-user-id="${cell.userId}"][data-date="${cell.date}"][data-cell-type="${cell.cellType}"]`;
    return document.querySelector(selector);
  }
  
  /**
   * セルを描画
   * @param {ScheduleCell} cell
   */
  renderCell(cell) {
    const element = this.getCellElement(cell);
    if (!element) return;
    
    // 値を更新
    element.textContent = cell.inputValue;
    
    // CSSクラスを更新
    element.className = 'schedule-cell';
    
    if (cell.cellType === 'dayStay') {
      element.classList.add('cell-day-stay');
    } else {
      element.classList.add('cell-visit');
    }
    
    // ◎の場合はクリック不可クラスを追加
    if (cell.inputValue === '◎') {
      element.classList.add('cell-stay-middle');
    }
    
    // 宿泊期間のスタイル
    if (cell.inputValue === '入') {
      element.classList.add('cell-check-in');
    } else if (cell.inputValue === '退') {
      element.classList.add('cell-check-out');
    } else if (cell.inputValue === '◎') {
      element.classList.add('cell-stay');
    }
    
    // 備考がある場合
    if (cell.note) {
      element.classList.add('cell-has-note');
    }
  }
}
```

---

## ✅ 完成条件

### 機能テスト
- [ ] 空欄をクリックすると○が追加される
- [ ] ○をクリックすると空欄に戻る
- [ ] ◎はクリックしても無反応
- [ ] 訪問行は0→1→2→3→0でカウントアップ
- [ ] 空欄からドラッグで宿泊期間が作成される
- [ ] 入をドラッグで入所日が調整される
- [ ] 退をドラッグで退所日が調整される
- [ ] 右クリックでメニューが表示される
- [ ] ホバーでツールチップが表示される

### CSSテスト
- [ ] フォーカス中のセルに青枠が表示される
- [ ] ◎のカーソルがdefault（矢印）
- [ ] ◎がクリックできない（pointer-events: none）
- [ ] ドラッグ中のプレビューが表示される

---

## 🚀 次のフェーズ

Phase 1-Bが完了したら、以下に進みます：
- **Phase 1-C**: ExcelService実装
- **Phase 1-D**: 備考機能実装

---

**作成者**: Claude（設計担当）  
**作成日**: 2025年11月17日  
**対象**: Phase 1-B実装

実装完了後、フィードバックをお願いします！