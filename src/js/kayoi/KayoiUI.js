/**
 * KayoiUI.js
 * 通いUI描画クラス
 * 
 * カレンダーグリッドの生成と更新
 */

import { DateUtils } from '../common/utils/DateUtils.js';

export class KayoiUI {
  constructor(containerElement, masterDataManager, kayoiLogic) {
    console.log('KayoiUI constructor called');
    console.log('Container:', containerElement);
    console.log('MasterData:', masterDataManager);
    console.log('Logic:', kayoiLogic);
    
    this.container = containerElement;
    this.masterData = masterDataManager;
    this.logic = kayoiLogic;
    
    this.currentYearMonth = DateUtils.getCurrentYearMonth();
    this.onCellClick = null; // コールバック関数
    
    // v4.0: 長押し検出
    this.longPressTimer = null;
    this.LONG_PRESS_DURATION = 800; // 0.8秒（変更不可）
    
    // v4.0: カレンダー状態
    this.calendarState = null;
    
    // v4.0: カレンダーのイベントリスナーが初期化済みかのフラグ
    this.calendarListenersInitialized = false;
  }

  /**
   * v4.0: カレンダーのイベントリスナーを初期化
   */
  initializeCalendarEventListeners() {
    // すでに初期化済みの場合はスキップ
    if (this.calendarListenersInitialized) return;
    
    // カレンダーセルのクリック
    document.addEventListener('click', (e) => {
      const cell = e.target.closest('.calendar-cell');
      if (!cell || !cell.dataset.date) return;
      
      this.handleCalendarCellClick(cell);
    });
    
    // クリアボタン
    const clearBtn = document.getElementById('calendar-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (!this.calendarState) return;
        
        if (this.calendarState.isCleared) {
          // 元に戻す
          this.calendarState.checkInDate = this.calendarState.originalCheckInDate;
          this.calendarState.checkOutDate = this.calendarState.originalCheckOutDate;
          this.calendarState.isCleared = false;
        } else {
          // クリア
          this.calendarState.isCleared = true;
        }
        
        this.renderCalendar();
      });
    }
    
    // 確定/戻るボタン
    const confirmBtn = document.getElementById('calendar-confirm-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (!this.calendarState) return;
        
        if (confirmBtn.textContent === '確定') {
          // 変更を確定
          if (this.calendarState.isCleared) {
            // 泊まり期間削除
            this.clearTomariPeriod(this.calendarState.userId);
          } else {
            // 泊まり期間更新
            this.setTomariPeriod(
              this.calendarState.userId,
              this.calendarState.checkInDate,
              this.calendarState.checkOutDate
            );
          }
          
          // カレンダーを閉じる
          this.hideCalendar();
          
          // グリッドを再描画
          this.refreshGrid();
        } else {
          // 戻る（キャンセル）
          this.hideCalendar();
        }
      });
    }
    
    // 初期化完了フラグを立てる
    this.calendarListenersInitialized = true;
  }

  /**
   * カレンダーを描画
   * @param {string} yearMonth - "YYYY-MM"
   */
  render(yearMonth) {
    this.currentYearMonth = yearMonth;
    
    const dates = DateUtils.generateDatesInMonth(yearMonth);
    const users = this.masterData.getAllUsers();

    // グリッドをクリア
    this.container.innerHTML = '';

    // tbody参照をクリア
    this.tbody = null;
    this.table = null;

    // ヘッダー行を作成（table、thead、tbodyも作成）
    this.renderHeader(dates);

    // 各利用者の行を作成
    users.forEach(user => {
      this.renderUserRow(user, dates);
    });

    // 空の状態メッセージ
    if (users.length === 0) {
      this.renderEmptyState();
    }

    // ❌ 定員表示は v3.1 で削除済み（日別サマリーで管理）
    // this.updateCapacityDisplay();
  }

  /**
   * ヘッダー行を描画
   * v4.0: 日付ヘッダーは L3_UI_統合UI設計.md の責任のため、利用者名ヘッダーのみ作成
   * @param {string[]} dates - "YYYY-MM-DD" 形式の日付配列（列幅計算に使用）
   */
  renderHeader(dates) {
    // コンテナがtableでない場合、tableに変換
    if (this.container.tagName !== 'TABLE') {
      const table = document.createElement('table');
      table.id = 'kayoi-grid';
      table.className = 'schedule-grid';
      
      // 既存のコンテナの内容をクリア
      this.container.innerHTML = '';
      this.container.appendChild(table);
      
      // コンテナをtableに更新
      this.table = table;
    } else {
      this.table = this.container;
    }

    // colgroup要素で列幅を定義（table-layout: fixedのため必須）
    const colgroup = document.createElement('colgroup');
    
    // 利用者名列
    const nameCol = document.createElement('col');
    nameCol.className = 'user-col';
    colgroup.appendChild(nameCol);
    
    // 日付列（31日分）
    dates.forEach(() => {
      const dateCol = document.createElement('col');
      dateCol.className = 'date-col';
      colgroup.appendChild(dateCol);
    });
    
    this.table.appendChild(colgroup);

    // thead要素を作成
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // 利用者名ヘッダーのみ作成
    const nameHeader = document.createElement('th');
    nameHeader.className = 'user-header sticky-left';
    nameHeader.textContent = '利用者名';
    nameHeader.colSpan = 1;
    headerRow.appendChild(nameHeader);

    // ❌ 日付ヘッダーは作らない（L3_UI_統合UI設計.md v3.1 の責任）
    // カレンダーヘッダーがすべてのセクションの日付表示を担当
    // colgroup で列幅を制御

    thead.appendChild(headerRow);
    this.table.appendChild(thead);

    // tbody要素を作成（データ行用）
    if (!this.tbody) {
      this.tbody = document.createElement('tbody');
      this.table.appendChild(this.tbody);
    }
  }

  /**
   * 利用者行を描画（1利用者1行）
   * @param {User} user
   * @param {string[]} dates - "YYYY-MM-DD" 形式の日付配列
   */
  renderUserRow(user, dates) {
    const row = this.createDataRow(user, dates);
    this.tbody.appendChild(row);
  }

  /**
   * データ行を作成（1利用者1行、記号で前半・後半を表現）
   * @param {User} user
   * @param {string[]} dates - "YYYY-MM-DD" 形式の日付配列
   * @returns {HTMLElement}
   */
  createDataRow(user, dates) {
    const row = document.createElement('tr');
    row.dataset.userId = user.userId;

    // 利用者名列
    const nameCell = document.createElement('td');
    nameCell.className = 'user-cell sticky-left';
    nameCell.innerHTML = `<span class="user-name">${user.displayName}</span>`;
    row.appendChild(nameCell);

    // 日付セル
    dates.forEach(dateStr => {
      const cell = this.createScheduleCell(user.userId, dateStr);
      row.appendChild(cell);
    });

    return row;
  }

  /**
   * スケジュールセルを作成（記号で前半・後半を表現）
   * @param {string} userId
   * @param {string} date
   * @returns {HTMLElement}
   */
  createScheduleCell(userId, date) {
    const cell = document.createElement('td');
    cell.className = 'schedule-cell';
    cell.dataset.userId = userId;
    cell.dataset.date = date;

    // v4.0: 新しい表示ロジックを使用
    const symbol = this.logic.getDisplaySymbol(userId, date);
    const borderState = this.logic.getBorderState(userId, date);
    
    // data-border-state属性を追加
    cell.dataset.borderState = borderState;
    
    if (symbol) {
      cell.classList.add('has-schedule');
      cell.innerHTML = `
        <span class="symbol">${symbol}</span>
      `;
    }

    // v4.0: 長押し検出イベント
    cell.addEventListener('mousedown', (e) => {
      this.handleMouseDown(cell, userId, date);
    });
    
    cell.addEventListener('mouseup', (e) => {
      this.handleMouseUp(cell, userId, date);
    });
    
    cell.addEventListener('mouseleave', (e) => {
      this.handleMouseLeave();
    });

    return cell;
  }

  /**
   * その日のスケジュールを取得（前半・後半・終日を統合）
   * @param {string} userId
   * @param {string} date
   * @returns {Object|null}
   */
  getScheduleForDate(userId, date) {
    // 終日を優先
    const zennitsu = this.logic.getSchedule(userId, date, '終日');
    if (zennitsu) return zennitsu;

    // 前半をチェック
    const zenhan = this.logic.getSchedule(userId, date, '前半');
    if (zenhan) return zenhan;

    // 後半をチェック
    const kouhan = this.logic.getSchedule(userId, date, '後半');
    if (kouhan) return kouhan;

    return null;
  }

  /**
   * section値から記号とクラス名を取得
   * @param {string} section - "前半" | "後半" | "終日"
   * @returns {{symbol: string, className: string}}
   */
  getSymbolAndClass(section) {
    switch (section) {
      case '終日':
        return { symbol: '○', className: 'zennitsu' };
      case '前半':
        return { symbol: '◓', className: 'zenhan' };
      case '後半':
        return { symbol: '◒', className: 'kouhan' };
      default:
        return { symbol: '-', className: '' };
    }
  }

  // ❌ v3.1: 定員表示関連メソッドを削除（日別サマリーで管理）
  // updateCellCapacityStatus() 削除
  // updateCapacityDisplay() 削除  
  // applyColorGradient() 削除
  // getColorAndBorder() 削除

  /**
   * 空の状態を描画
   */
  renderEmptyState() {
    const emptyRow = document.createElement('tr');
    emptyRow.className = 'empty-state';
    
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 32;  // 利用者名列 + 31日
    emptyCell.style.textAlign = 'center';
    emptyCell.style.padding = '40px';
    emptyCell.innerHTML = `
      <p>利用者が登録されていません</p>
      <p>設定から利用者を登録してください</p>
    `;
    
    emptyRow.appendChild(emptyCell);
    this.tbody.appendChild(emptyRow);
  }

  /**
   * 特定のセルを更新
   * @param {string} userId
   * @param {string} date
   */
  updateCell(userId, date) {
    const cell = this.container.querySelector(
      `.schedule-cell[data-user-id="${userId}"][data-date="${date}"]`
    );

    if (!cell) return;

    // その日のスケジュールを取得
    const schedule = this.getScheduleForDate(userId, date);
    
    if (schedule) {
      const { symbol, className } = this.getSymbolAndClass(schedule.section);
      
      cell.classList.add('has-schedule');
      cell.innerHTML = `
        <span class="symbol ${className}">${symbol}</span>
        ${schedule.note ? `<span class="note">${schedule.note}</span>` : ''}
      `;
      
      // ❌ v3.1: 定員表示は削除済み
      // this.updateCellCapacityStatus(cell, date, schedule.section);
    } else {
      cell.classList.remove('has-schedule');
      cell.innerHTML = '';
    }
  }

  // ❌ v3.1: updateDateCapacity() 削除（定員表示は日別サマリーで管理）
  // ❌ v3.1: updateCapacityDisplay() 削除
  // ❌ v3.1: applyColorGradient() 削除
  // ❌ v3.1: getColorAndBorder() 削除

  // ========== v4.0: 長押し検出とカレンダー表示 ==========

  /**
   * mousedown イベント処理
   */
  handleMouseDown(cell, userId, date) {
    // 長押しタイマー開始
    this.longPressTimer = setTimeout(() => {
      this.handleLongPress(cell, userId, date);
      this.longPressTimer = null;
    }, this.LONG_PRESS_DURATION);
  }

  /**
   * mouseup イベント処理
   */
  handleMouseUp(cell, userId, date) {
    if (this.longPressTimer) {
      // タイマーが残っている = 短押し
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
      
      // 短押し処理
      this.handleCellClick(cell, userId, date);
    }
  }

  /**
   * mouseleave イベント処理
   */
  handleMouseLeave() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  /**
   * 短押し時の処理：通い記号のトグル
   * v4.0: 空欄 → ○ → ◓ → ◒ → 空欄
   * @param {HTMLElement} cell - クリックされたセル
   * @param {string} userId - 利用者ID
   * @param {string} date - 日付 (YYYY-MM-DD)
   */
  handleCellClick(cell, userId, date) {
    // 現在の記号を取得
    const symbolElement = cell.querySelector('.symbol');
    const currentSymbol = symbolElement ? symbolElement.textContent.trim() : '';
    
    // 次の状態を決定
    let nextSymbol;
    let nextSection;
    
    if (!currentSymbol || currentSymbol === '-') {
      // 空欄 → 終日
      nextSymbol = '○';
      nextSection = '終日';
    } else if (currentSymbol === '○') {
      // 終日 → 前半
      nextSymbol = '◓';
      nextSection = '前半';
    } else if (currentSymbol === '◓') {
      // 前半 → 後半
      nextSymbol = '◒';
      nextSection = '後半';
    } else if (currentSymbol === '◒') {
      // 後半 → 空欄
      nextSymbol = '';
      nextSection = null;
    } else {
      // 不明な記号 → 終日にリセット
      nextSymbol = '○';
      nextSection = '終日';
    }
    
    // データ更新
    if (nextSection) {
      this.logic.setKayoi(userId, date, nextSection);
      cell.classList.add('has-schedule');
      cell.innerHTML = `<span class="symbol">${nextSymbol}</span>`;
    } else {
      this.logic.removeKayoi(userId, date);
      cell.classList.remove('has-schedule');
      cell.innerHTML = '';
    }
    
    // アニメーション
    cell.classList.add('updated');
    setTimeout(() => cell.classList.remove('updated'), 200);
  }

  /**
   * 長押し時の処理
   */
  handleLongPress(cell, userId, date) {
    const userData = this.logic.getUserData(userId);
    
    if (!userData) return;
    
    if (userData.tomariPeriod) {
      // 編集モード
      this.showCalendarEditMode(cell, userId, date, userData.tomariPeriod);
    } else {
      // 新規追加モード
      this.showCalendarAddMode(cell, userId, date);
    }
  }

  /**
   * カレンダーを新規追加モードで表示
   */
  showCalendarAddMode(cell, userId, date) {
    // イベントリスナーを初期化（初回のみ）
    this.initializeCalendarEventListeners();
    
    // 状態を作成
    this.calendarState = new CalendarState('add', userId, date);
    
    // カレンダーを配置
    this.positionCalendar(cell);
    
    // カレンダーを描画
    this.renderCalendar();
    
    // カレンダーを表示
    document.getElementById('tomari-calendar').style.display = 'block';
  }

  /**
   * カレンダーを編集モードで表示
   */
  showCalendarEditMode(cell, userId, date, tomariPeriod) {
    // イベントリスナーを初期化（初回のみ）
    this.initializeCalendarEventListeners();
    
    // 状態を作成
    this.calendarState = new CalendarState('edit', userId, date, tomariPeriod);
    
    // カレンダーを配置
    this.positionCalendar(cell);
    
    // カレンダーを描画
    this.renderCalendar();
    
    // カレンダーを表示
    document.getElementById('tomari-calendar').style.display = 'block';
  }

  /**
   * カレンダーの配置を計算
   */
  positionCalendar(cell) {
    const calendar = document.getElementById('tomari-calendar');
    const cellRect = cell.getBoundingClientRect();
    
    // 基本位置：セルの右下
    let left = cellRect.right + 10;
    let top = cellRect.top;
    
    // カレンダーのサイズ
    const calendarWidth = 260;
    const calendarHeight = 300;
    
    // 画面端チェック（右側）
    if (left + calendarWidth > window.innerWidth) {
      // 左側に表示
      left = cellRect.left - calendarWidth - 10;
    }
    
    // 画面端チェック（下側）
    if (top + calendarHeight > window.innerHeight) {
      // 上に調整
      top = window.innerHeight - calendarHeight - 10;
    }
    
    // 画面端チェック（上側）
    if (top < 10) {
      top = 10;
    }
    
    // 画面端チェック（左側）
    if (left < 10) {
      left = 10;
    }
    
    // 位置を設定
    calendar.style.left = left + 'px';
    calendar.style.top = top + 'px';
  }

  /**
   * カレンダーを閉じる
   */
  hideCalendar() {
    document.getElementById('tomari-calendar').style.display = 'none';
    this.calendarState = null;
  }

  /**
   * カレンダーセルのクリック処理
   * @param {HTMLElement} cell - クリックされたセル
   */
  handleCalendarCellClick(cell) {
    if (!this.calendarState) return;
    
    const clickedDate = cell.dataset.date;
    
    if (this.calendarState.mode === 'add') {
      this.handleAddModeClick(clickedDate);
    } else if (this.calendarState.mode === 'edit') {
      this.handleEditModeClick(clickedDate);
    }
    
    // 再描画
    this.renderCalendar();
  }

  /**
   * 新規追加モードでのセルクリック
   * @param {string} clickedDate - クリックされた日付
   */
  handleAddModeClick(clickedDate) {
    if (!this.calendarState.checkInDate) {
      // 初回クリック
      if (clickedDate < this.calendarState.origin) {
        // 起点より前 → 起点が退所日
        this.calendarState.checkInDate = clickedDate;
        this.calendarState.checkOutDate = this.calendarState.origin;
      } else if (clickedDate > this.calendarState.origin) {
        // 起点より後 → 起点が入所日
        this.calendarState.checkInDate = this.calendarState.origin;
        this.calendarState.checkOutDate = clickedDate;
      } else {
        // 起点と同じ → 1泊（翌日が退所日）
        this.calendarState.checkInDate = clickedDate;
        this.calendarState.checkOutDate = this.addDays(clickedDate, 1);
      }
    } else {
      // 期間変更
      const distToCheckIn = Math.abs(this.dateDiff(clickedDate, this.calendarState.checkInDate));
      const distToCheckOut = Math.abs(this.dateDiff(clickedDate, this.calendarState.checkOutDate));
      
      if (distToCheckIn < distToCheckOut) {
        this.calendarState.checkInDate = clickedDate;
      } else {
        this.calendarState.checkOutDate = clickedDate;
      }
      
      // 入所日 > 退所日の場合は入れ替え
      if (this.calendarState.checkInDate > this.calendarState.checkOutDate) {
        [this.calendarState.checkInDate, this.calendarState.checkOutDate] = 
          [this.calendarState.checkOutDate, this.calendarState.checkInDate];
      }
    }
  }

  /**
   * 編集モードでのセルクリック
   * @param {string} clickedDate - クリックされた日付
   */
  handleEditModeClick(clickedDate) {
    // どちらかの枠に近い方を変更
    const distToCheckIn = Math.abs(this.dateDiff(clickedDate, this.calendarState.checkInDate));
    const distToCheckOut = Math.abs(this.dateDiff(clickedDate, this.calendarState.checkOutDate));
    
    if (distToCheckIn < distToCheckOut) {
      this.calendarState.checkInDate = clickedDate;
    } else {
      this.calendarState.checkOutDate = clickedDate;
    }
    
    // 入所日 > 退所日の場合は入れ替え
    if (this.calendarState.checkInDate > this.calendarState.checkOutDate) {
      [this.calendarState.checkInDate, this.calendarState.checkOutDate] = 
        [this.calendarState.checkOutDate, this.calendarState.checkInDate];
    }
  }

  /**
   * 泊まり期間を設定
   * @param {string} userId - 利用者ID
   * @param {string} checkInDate - 入所日
   * @param {string} checkOutDate - 退所日
   */
  setTomariPeriod(userId, checkInDate, checkOutDate) {
    const userData = this.logic.getUserData(userId);
    if (!userData) return;
    
    // バリデーション
    if (checkInDate >= checkOutDate) {
      alert('入所日は退所日より前である必要があります');
      return;
    }
    
    // 泊まり期間を設定
    userData.tomariPeriod = { checkInDate, checkOutDate };
    userData.updatedAt = new Date().toISOString();
    
    // localStorageに保存
    this.saveToStorage();
    
    console.log('泊まり期間設定:', userId, checkInDate, checkOutDate);
  }

  /**
   * 泊まり期間を削除
   * @param {string} userId - 利用者ID
   */
  clearTomariPeriod(userId) {
    const userData = this.logic.getUserData(userId);
    if (!userData) return;
    
    const oldPeriod = userData.tomariPeriod;
    
    // 泊まり期間を削除
    userData.tomariPeriod = null;
    
    // 泊まり期間内の通い情報も削除
    if (oldPeriod) {
      let date = oldPeriod.checkInDate;
      while (date <= oldPeriod.checkOutDate) {
        delete userData.kayoiSchedule[date];
        date = this.addDays(date, 1);
      }
    }
    
    userData.updatedAt = new Date().toISOString();
    
    // localStorageに保存
    this.saveToStorage();
    
    console.log('泊まり期間削除:', userId);
  }

  /**
   * グリッドを再描画
   */
  refreshGrid() {
    // 月全体を再描画
    this.render(this.currentYearMonth);
  }

  /**
   * 日付にN日を加算
   * @param {string} dateStr - 日付（YYYY-MM-DD）
   * @param {number} days - 加算する日数
   * @returns {string} 加算後の日付
   */
  addDays(dateStr, days) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  /**
   * 日付の差を計算
   * @param {string} date1 - 日付1（YYYY-MM-DD）
   * @param {string} date2 - 日付2（YYYY-MM-DD）
   * @returns {number} 日数差
   */
  dateDiff(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
  }

  /**
   * カレンダーを描画
   */
  renderCalendar() {
    if (!this.calendarState) return;
    
    // 月タイトル更新
    const [year, month] = this.calendarState.origin.split('-');
    document.querySelector('.month-title').textContent = 
      `${year}年 ${parseInt(month)}月`;
    
    // カレンダーセル生成
    const tbody = document.getElementById('calendar-tbody');
    tbody.innerHTML = this.generateCalendarCells(year, month);
    
    // クラス適用
    this.applyCalendarCellClasses();
    
    // ボタン更新
    this.updateCalendarButtons();
  }

  /**
   * カレンダーセルのHTMLを生成
   * @param {string} year - 年
   * @param {string} month - 月（01-12または1-12）
   * @returns {string} HTMLテキスト
   */
  generateCalendarCells(year, month) {
    const monthNum = parseInt(month);
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    let html = '<tr>';
    
    // 前月の空欄
    for (let i = 0; i < firstDayOfWeek; i++) {
      html += '<td></td>';
    }
    
    // 今月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      html += `<td class="calendar-cell" data-date="${dateStr}">${day}</td>`;
      
      // 土曜日で改行
      if ((firstDayOfWeek + day) % 7 === 0 && day < daysInMonth) {
        html += '</tr><tr>';
      }
    }
    
    html += '</tr>';
    return html;
  }

  /**
   * カレンダーセルにクラスを適用
   */
  applyCalendarCellClasses() {
    if (!this.calendarState) return;
    
    const cells = document.querySelectorAll('.calendar-cell');
    
    cells.forEach(cell => {
      const date = cell.dataset.date;
      if (!date) return;
      
      // リセット
      cell.classList.remove('origin', 'checkin', 'checkout', 'in-period', 'deleting');
      
      if (this.calendarState.isCleared) {
        // クリア状態
        if (this.calendarState.originalCheckInDate && this.calendarState.originalCheckOutDate) {
          if (date >= this.calendarState.originalCheckInDate && date <= this.calendarState.originalCheckOutDate) {
            cell.classList.add('deleting');
          }
        }
      } else if (this.calendarState.mode === 'add' && !this.calendarState.checkInDate) {
        // 新規追加：起点のみ
        if (date === this.calendarState.origin) {
          cell.classList.add('origin');
        }
      } else if (this.calendarState.checkInDate && this.calendarState.checkOutDate) {
        // 期間が設定されている
        if (date === this.calendarState.checkInDate) {
          cell.classList.add('checkin');
        }
        if (date === this.calendarState.checkOutDate) {
          cell.classList.add('checkout');
        }
        if (date > this.calendarState.checkInDate && date < this.calendarState.checkOutDate) {
          cell.classList.add('in-period');
        }
      }
    });
  }

  /**
   * カレンダーのボタンラベルを更新
   */
  updateCalendarButtons() {
    if (!this.calendarState) return;
    
    const clearBtn = document.getElementById('calendar-clear-btn');
    const confirmBtn = document.getElementById('calendar-confirm-btn');
    
    // 左ボタン（クリア/元に戻す）
    if (this.calendarState.isCleared) {
      clearBtn.textContent = '元に戻す';
    } else {
      clearBtn.textContent = 'クリア';
    }
    
    // 右ボタン（確定/戻る）
    if (this.calendarState.hasChanges()) {
      confirmBtn.textContent = '確定';
    } else {
      confirmBtn.textContent = '戻る';
    }
  }

  /**
   * localStorageからデータを読み込み
   */
  loadFromStorage() {
    const stored = localStorage.getItem('kayoi_data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.logic.fromJSON(data);
        console.log('Kayoi data loaded from storage');
      } catch (error) {
        console.error('Failed to load kayoi data:', error);
      }
    }
  }

  /**
   * localStorageにデータを保存
   */
  saveToStorage() {
    try {
      const data = this.logic.toJSON();
      localStorage.setItem('kayoi_data', JSON.stringify(data));
      console.log('Kayoi data saved to storage');
    } catch (error) {
      console.error('Failed to save kayoi data:', error);
    }
  }
}

// ========== v4.0: CalendarStateクラス ==========

/**
 * カレンダーの状態を管理するクラス
 */
class CalendarState {
  constructor(mode, userId, origin, tomariPeriod = null) {
    this.mode = mode;  // 'add' | 'edit'
    this.userId = userId;
    this.origin = origin;  // 起点となる日付
    
    if (tomariPeriod) {
      // 編集モード
      this.checkInDate = tomariPeriod.checkInDate;
      this.checkOutDate = tomariPeriod.checkOutDate;
      this.originalCheckInDate = tomariPeriod.checkInDate;
      this.originalCheckOutDate = tomariPeriod.checkOutDate;
    } else {
      // 新規追加モード
      this.checkInDate = null;
      this.checkOutDate = null;
      this.originalCheckInDate = null;
      this.originalCheckOutDate = null;
    }
    
    this.isCleared = false;
  }
  
  /**
   * 変更があるかチェック
   */
  hasChanges() {
    return (
      this.isCleared ||
      this.checkInDate !== this.originalCheckInDate ||
      this.checkOutDate !== this.originalCheckOutDate
    );
  }
}
