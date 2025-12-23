/**
 * KayoiUI.js
 * 通いUI描画クラス
 * 
 * カレンダーグリッドの生成と更新
 */

import { DateUtils } from '../common/utils/DateUtils.js';

export class KayoiUI {
  constructor(containerElement, masterDataManager, kayoiLogic) {
    this.container = containerElement;
    this.masterData = masterDataManager;
    this.logic = kayoiLogic;
    
    this.currentYearMonth = DateUtils.getCurrentYearMonth();
    this.onCellClick = null; // コールバック関数
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

    // ヘッダー行を作成
    this.renderHeader(dates);

    // 各利用者の行を作成
    users.forEach(user => {
      this.renderUserRow(user, dates);
    });

    // 空の状態メッセージ
    if (users.length === 0) {
      this.renderEmptyState();
    }

    // 定員カウントを更新
    this.updateCapacityDisplay();
  }

  /**
   * ヘッダー行を描画
   * @param {string[]} dates - "YYYY-MM-DD" 形式の日付配列
   */
  renderHeader(dates) {
    const headerRow = document.createElement('div');
    headerRow.className = 'grid-row grid-header';

    // 利用者名列
    const nameCell = document.createElement('div');
    nameCell.className = 'grid-cell header-cell sticky-left';
    nameCell.textContent = '利用者名';
    headerRow.appendChild(nameCell);

    // 日付列
    dates.forEach(dateStr => {
      const dayOfWeek = DateUtils.getDayOfWeek(dateStr);
      const dayName = DateUtils.getDayOfWeekName(dateStr);
      const dateObj = DateUtils.parseDate(dateStr);
      const isHoliday = DateUtils.isHoliday(dateObj);
      const isWeekend = DateUtils.isWeekend(dateObj);

      const cell = document.createElement('div');
      cell.className = 'grid-cell header-cell date-header';
      
      if (isHoliday) cell.classList.add('holiday');
      else if (isWeekend) cell.classList.add('weekend');

      cell.innerHTML = `
        <div class="date-day">${dateObj.getDate()}</div>
        <div class="date-weekday">${dayName}</div>
      `;
      
      cell.dataset.date = dateStr;
      headerRow.appendChild(cell);
    });

    this.container.appendChild(headerRow);
  }

  /**
   * 利用者行を描画（1利用者1行）
   * @param {User} user
   * @param {string[]} dates - "YYYY-MM-DD" 形式の日付配列
   */
  renderUserRow(user, dates) {
    const row = this.createDataRow(user, dates);
    this.container.appendChild(row);
  }

  /**
   * データ行を作成（1利用者1行、記号で前半・後半を表現）
   * @param {User} user
   * @param {string[]} dates - "YYYY-MM-DD" 形式の日付配列
   * @returns {HTMLElement}
   */
  createDataRow(user, dates) {
    const row = document.createElement('div');
    row.className = 'grid-row data-row';
    row.dataset.userId = user.userId;

    // 利用者名列
    const nameCell = document.createElement('div');
    nameCell.className = 'grid-cell name-cell sticky-left';
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
    const cell = document.createElement('div');
    cell.className = 'grid-cell schedule-cell';
    cell.dataset.userId = userId;
    cell.dataset.date = date;

    // その日のスケジュールを取得（前半・後半・終日を統合）
    const schedule = this.getScheduleForDate(userId, date);
    
    if (schedule) {
      const { symbol, className } = this.getSymbolAndClass(schedule.section);
      
      cell.classList.add('has-schedule');
      cell.innerHTML = `
        <span class="symbol ${className}">${symbol}</span>
        ${schedule.note ? `<span class="note">${schedule.note}</span>` : ''}
      `;
      
      // 定員状況を反映
      this.updateCellCapacityStatus(cell, date, schedule.section);
    }

    // クリックイベント
    cell.addEventListener('click', () => {
      if (this.onCellClick) {
        this.onCellClick({ userId, date, schedule });
      }
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

  /**
   * セルの定員状況を更新
   * @param {HTMLElement} cell
   * @param {string} date
   * @param {string} section
   */
  updateCellCapacityStatus(cell, date, section) {
    const capacityInfo = this.logic.checkCapacity(date, section);
    const { count, capacity } = capacityInfo;
    
    cell.classList.remove('capacity-ok', 'capacity-near', 'capacity-full');
    
    if (count >= capacity) {
      cell.classList.add('capacity-full');
    } else if (count >= capacity - 2) {
      cell.classList.add('capacity-near');
    } else {
      cell.classList.add('capacity-ok');
    }

    cell.title = `${section}: ${count}/${capacity}人`;
  }

  /**
   * 空の状態を描画
   */
  renderEmptyState() {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.innerHTML = `
      <p>利用者が登録されていません</p>
      <p>設定から利用者を登録してください</p>
    `;
    this.container.appendChild(emptyDiv);
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
      
      this.updateCellCapacityStatus(cell, date, schedule.section);
    } else {
      cell.classList.remove('has-schedule');
      cell.innerHTML = '';
    }
  }

  /**
   * 日付の全セルの定員状況を更新
   * @param {string} date
   */
  updateDateCapacity(date) {
    const cells = this.container.querySelectorAll(`.schedule-cell[data-date="${date}"]`);
    
    cells.forEach(cell => {
      const userId = cell.dataset.userId;
      const schedule = this.getScheduleForDate(userId, date);
      if (schedule) {
        this.updateCellCapacityStatus(cell, date, schedule.section);
      }
    });
  }

  /**
   * 定員カウントを更新
   */
  updateCapacityDisplay() {
    const dates = DateUtils.generateDatesInMonth(this.currentYearMonth);
    
    // 月全体の最大値を計算
    let maxZenhan = 0;
    let maxKohan = 0;
    
    dates.forEach(date => {
      const { zenhan, kohan } = this.logic.countSchedulesByDate(date);
      maxZenhan = Math.max(maxZenhan, zenhan);
      maxKohan = Math.max(maxKohan, kohan);
    });
    
    // 表示を更新
    const zenhanCount = document.getElementById('zenhan-count');
    const kohanCount = document.getElementById('kohan-count');
    
    if (zenhanCount) zenhanCount.textContent = maxZenhan;
    if (kohanCount) kohanCount.textContent = maxKohan;
    
    // カラーグラデーションを適用
    this.applyColorGradient('zenhan', maxZenhan, 15);
    this.applyColorGradient('kohan', maxKohan, 15);
  }

  /**
   * カラーグラデーションを適用
   * @param {string} section - 'zenhan' | 'kohan'
   * @param {number} actual - 実際の人数
   * @param {number} capacity - 定員
   */
  applyColorGradient(section, actual, capacity) {
    const element = document.getElementById(`${section}-capacity`);
    if (!element) return;
    
    // 登録率を計算（仮に29人とする）
    const registeredUsers = this.masterData.getAllUsers().length;
    const baseline = capacity * (registeredUsers / 29);
    
    const { backgroundColor, border, className } = this.getColorAndBorder(
      actual,
      baseline,
      capacity
    );
    
    // スタイルを適用
    element.style.backgroundColor = backgroundColor;
    element.style.border = border || 'none';
    
    // クラスを設定
    element.className = `capacity-item ${className}`;
  }

  /**
   * カラーとボーダーを取得
   * @param {number} actual - 実際の人数
   * @param {number} baseline - 基準線
   * @param {number} capacity - 定員
   * @returns {{backgroundColor: string, border: string, className: string}}
   */
  getColorAndBorder(actual, baseline, capacity) {
    // 定員超過
    if (actual > capacity) {
      return {
        backgroundColor: 'hsl(0, 100%, 90%)',
        border: '4px double hsl(0, 100%, 50%)',
        className: 'over-capacity'
      };
    }
    
    const ratio = actual / baseline;
    
    // 基準線超過（定員以内）
    if (ratio > 1.0) {
      return {
        backgroundColor: 'hsl(45, 100%, 85%)',
        border: '2px solid hsl(45, 100%, 50%)',
        className: 'over-baseline'
      };
    }
    
    // グラデーション範囲（80-100%）
    if (ratio >= 0.80) {
      const progress = (ratio - 0.80) / 0.20; // 0.0 → 1.0
      
      // 明度を段階的に変化（85% → 50%）
      const lightness = 85 - (35 * progress);
      
      // 彩度も段階的に変化（30% → 60%）
      const saturation = 30 + (30 * progress);
      
      return {
        backgroundColor: `hsl(200, ${saturation}%, ${lightness}%)`,
        border: 'none',
        className: 'in-gradient'
      };
    }
    
    // 80%未満（余裕あり）
    return {
      backgroundColor: 'hsl(200, 30%, 85%)',
      border: 'none',
      className: 'plenty'
    };
  }
}
