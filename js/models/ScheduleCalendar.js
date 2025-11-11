/**
 * 小規模多機能利用調整システム - ScheduleCalendarモデル
 * 1利用者×1ヶ月の予定を管理するモデルクラス
 */

class ScheduleCalendar {
  /**
   * ScheduleCalendarコンストラクタ
   * @param {string} userId - 利用者ID
   * @param {string} yearMonth - 年月文字列（"YYYY-MM"形式）
   */
  constructor(userId, yearMonth) {
    // 依存関係チェック
    if (typeof window.DateUtils === 'undefined') {
      throw new Error('ScheduleCalendar model requires DateUtils utility');
    }
    if (typeof window.ScheduleCell === 'undefined') {
      throw new Error('ScheduleCalendar model requires ScheduleCell model');
    }
    if (typeof window.StayPeriod === 'undefined') {
      throw new Error('ScheduleCalendar model requires StayPeriod model');
    }

    // 必須パラメータチェック
    if (!userId || typeof userId !== 'string') {
      throw new Error('userId is required and must be a string');
    }
    if (!yearMonth || typeof yearMonth !== 'string') {
      throw new Error('yearMonth is required and must be a string');
    }

    this.userId = userId;
    this.yearMonth = yearMonth;

    // セルを格納するMap（キー: dateString）
    this.dayStayCells = new Map();
    this.visitCells = new Map();

    // 宿泊期間のリスト
    this.stayPeriods = [];

    // バリデーション
    this._validate();
  }

  /**
   * バリデーション
   * @private
   */
  _validate() {
    // yearMonthの形式チェック
    if (!/^\d{4}-\d{2}$/.test(this.yearMonth)) {
      throw new Error('yearMonth must be in YYYY-MM format');
    }

    // 月の存在チェック
    try {
      const dates = window.DateUtils.getMonthDates(this.yearMonth);
      if (dates.length === 0) {
        throw new Error('Invalid yearMonth');
      }
    } catch (error) {
      throw new Error(`Invalid yearMonth: ${this.yearMonth}`);
    }
  }

  /**
   * 日付文字列をキーに変換
   * @param {Date|string} date - 日付
   * @returns {string} 日付文字列キー
   * @private
   */
  _getDateKey(date) {
    if (typeof date === 'string') {
      return date;
    }
    return window.DateUtils.formatDate(date);
  }

  /**
   * セルを取得（なければ空セルを生成）
   * @param {Date|string} date - 日付
   * @param {string} cellType - セルタイプ（"dayStay" | "visit"）
   * @returns {ScheduleCell} セル
   */
  getCell(date, cellType) {
    const dateKey = this._getDateKey(date);
    const cells = cellType === 'dayStay' ? this.dayStayCells : this.visitCells;

    if (!cells.has(dateKey)) {
      // 空セルを作成
      const cell = window.ScheduleCell.createEmpty(this.userId, date, cellType);
      cells.set(dateKey, cell);
    }

    return cells.get(dateKey);
  }

  /**
   * セルを設定
   * @param {ScheduleCell} cell - 設定するセル
   */
  setCell(cell) {
    if (!(cell instanceof window.ScheduleCell)) {
      throw new Error('cell must be a ScheduleCell instance');
    }

    if (cell.userId !== this.userId) {
      throw new Error('cell userId must match calendar userId');
    }

    const dateKey = this._getDateKey(cell.date);
    const cells = cell.cellType === 'dayStay' ? this.dayStayCells : this.visitCells;

    cells.set(dateKey, cell);

    window.Logger?.debug(`Cell set for ${this.userId} on ${dateKey} (${cell.cellType}): "${cell.inputValue}"`);
  }

  /**
   * セルを削除
   * @param {Date|string} date - 日付
   * @param {string} cellType - セルタイプ
   */
  removeCell(date, cellType) {
    const dateKey = this._getDateKey(date);
    const cells = cellType === 'dayStay' ? this.dayStayCells : this.visitCells;

    if (cells.has(dateKey)) {
      cells.delete(dateKey);
      window.Logger?.debug(`Cell removed for ${this.userId} on ${dateKey} (${cellType})`);
    }
  }

  /**
   * yearMonthの全日付を取得
   * @returns {Date[]} 全日付の配列
   */
  getAllDates() {
    return window.DateUtils.getMonthDates(this.yearMonth);
  }

  /**
   * 通いセルのリストを取得
   * @returns {ScheduleCell[]} 通いセルの配列
   */
  getDayCells() {
    return Array.from(this.dayStayCells.values())
      .filter(cell => cell.actualFlags.day);
  }

  /**
   * 泊りセルのリストを取得
   * @returns {ScheduleCell[]} 泊りセルの配列
   */
  getStayCells() {
    return Array.from(this.dayStayCells.values())
      .filter(cell => cell.actualFlags.stay);
  }

  /**
   * 訪問セルのリストを取得
   * @returns {ScheduleCell[]} 訪問セルの配列
   */
  getVisitCells() {
    return Array.from(this.visitCells.values())
      .filter(cell => cell.actualFlags.visit > 0);
  }

  /**
   * 全セルのリストを取得
   * @returns {ScheduleCell[]} 全セルの配列
   */
  getAllCells() {
    const dayStayCells = Array.from(this.dayStayCells.values());
    const visitCells = Array.from(this.visitCells.values());
    return [...dayStayCells, ...visitCells];
  }

  /**
   * 入力されているセルのみを取得
   * @returns {ScheduleCell[]} 入力されているセルの配列
   */
  getInputCells() {
    return this.getAllCells().filter(cell => !cell.isEmpty());
  }

  /**
   * "入所"〜"退所"を検出してstayPeriodsを更新
   */
  calculateStayPeriods() {
    this.stayPeriods = [];

    // 日付順にソート
    const dateKeys = Array.from(this.dayStayCells.keys()).sort();

    let startDate = null;
    let currentPeriod = null;

    for (const dateKey of dateKeys) {
      const cell = this.dayStayCells.get(dateKey);

      if (cell.isStayStart()) {
        // 入所
        if (currentPeriod) {
          // 前の期間が終了していない場合は警告
          window.Logger?.warn(`Unclosed stay period found for ${this.userId}, ending at ${dateKey}`);
        }
        startDate = new Date(cell.date);
        currentPeriod = { start: startDate, userId: this.userId };

      } else if (cell.isStayEnd() && startDate) {
        // 退所（対応する入所がある場合）
        try {
          const period = new window.StayPeriod(startDate, cell.date, this.userId);
          this.stayPeriods.push(period);
          window.Logger?.debug(`Stay period added: ${period.getPeriodString()}`);
        } catch (error) {
          window.Logger?.warn('Error creating stay period:', error);
        }

        startDate = null;
        currentPeriod = null;
      }
    }

    // 未終了の期間がある場合の警告
    if (currentPeriod) {
      window.Logger?.warn(`Unclosed stay period found for ${this.userId}, started at ${window.DateUtils.formatDate(startDate)}`);
    }

    window.Logger?.debug(`Calculated ${this.stayPeriods.length} stay periods for ${this.userId} in ${this.yearMonth}`);
  }

  /**
   * stayPeriodsを元に全セルのactualFlagsを計算
   */
  calculateAllFlags() {
    // 全セルのフラグをリセット
    for (const cell of this.dayStayCells.values()) {
      cell.resetActualFlags();
    }
    for (const cell of this.visitCells.values()) {
      cell.resetActualFlags();
    }

    // 各宿泊期間について処理
    for (const period of this.stayPeriods) {
      const dates = period.getDates();

      for (const date of dates) {
        const dateKey = this._getDateKey(date);

        // 通泊セルの処理
        if (this.dayStayCells.has(dateKey)) {
          const cell = this.dayStayCells.get(dateKey);
          cell.actualFlags.stay = true;
          cell.actualFlags.day = true; // 宿泊中は通いも利用
        } else {
          // セルが存在しない場合は空セルを作成してフラグを設定
          const cell = window.ScheduleCell.createEmpty(this.userId, date, 'dayStay');
          cell.actualFlags.stay = true;
          cell.actualFlags.day = true;
          this.dayStayCells.set(dateKey, cell);
        }
      }
    }

    // 通い単体の処理（数値入力など）
    for (const cell of this.dayStayCells.values()) {
      if (!cell.actualFlags.stay && !cell.isEmpty()) {
        if (cell.isNumericInput()) {
          const count = cell.getNumericValue();
          if (count > 0) {
            cell.actualFlags.day = true;
          }
        } else if (!cell.isStayStart() && !cell.isStayEnd()) {
          // 特別な入力値でない場合は通いとして扱う
          cell.actualFlags.day = true;
        }
      }
    }

    // 訪問セルの処理
    for (const cell of this.visitCells.values()) {
      if (!cell.isEmpty()) {
        if (cell.isNumericInput()) {
          cell.actualFlags.visit = cell.getNumericValue();
        } else {
          // 数値でない場合は1回とみなす
          cell.actualFlags.visit = 1;
        }
      }
    }

    window.Logger?.debug(`Calculated flags for ${this.userId} in ${this.yearMonth}`);
  }

  /**
   * 宿泊期間とフラグを一括計算
   */
  calculateAll() {
    this.calculateStayPeriods();
    this.calculateAllFlags();
  }

  /**
   * 指定日のサービス情報を取得
   * @param {Date|string} date - 日付
   * @returns {Object} サービス情報
   */
  getServiceInfo(date) {
    const dayStayCell = this.getCell(date, 'dayStay');
    const visitCell = this.getCell(date, 'visit');

    return {
      date: this._getDateKey(date),
      dayOfWeek: window.DateUtils.getDayOfWeek(date),
      isWeekend: window.DateUtils.isWeekend(date),
      dayStay: {
        inputValue: dayStayCell.inputValue,
        displayValue: dayStayCell.getDisplayValue(),
        note: dayStayCell.note,
        actualFlags: { ...dayStayCell.actualFlags },
        statusInfo: dayStayCell.getStatusInfo()
      },
      visit: {
        inputValue: visitCell.inputValue,
        displayValue: visitCell.getDisplayValue(),
        note: visitCell.note,
        actualFlags: { ...visitCell.actualFlags },
        statusInfo: visitCell.getStatusInfo()
      }
    };
  }

  /**
   * 月の統計情報を取得
   * @returns {Object} 統計情報
   */
  getMonthlyStats() {
    const dayCells = this.getDayCells();
    const stayCells = this.getStayCells();
    const visitCells = this.getVisitCells();

    const totalVisits = visitCells.reduce((sum, cell) => sum + cell.getVisitCount(), 0);

    return {
      userId: this.userId,
      yearMonth: this.yearMonth,
      dayCount: dayCells.length,
      stayCount: stayCells.length,
      visitCount: totalVisits,
      stayPeriodCount: this.stayPeriods.length,
      totalStayDays: this.stayPeriods.reduce((sum, period) => sum + period.getDuration(), 0),
      inputCellCount: this.getInputCells().length,
      totalCellCount: this.getAllCells().length
    };
  }

  /**
   * 月の詳細情報を取得
   * @returns {Object} 詳細情報
   */
  getMonthlyDetail() {
    const dates = this.getAllDates();
    const services = dates.map(date => this.getServiceInfo(date));

    return {
      userId: this.userId,
      yearMonth: this.yearMonth,
      dates: dates.map(date => this._getDateKey(date)),
      services,
      stayPeriods: this.stayPeriods.map(period => period.toJSON()),
      stats: this.getMonthlyStats()
    };
  }

  /**
   * オブジェクトをJSON形式に変換
   * @returns {Object} JSON形式のオブジェクト
   */
  toJSON() {
    const dayStayCellsData = {};
    for (const [key, cell] of this.dayStayCells) {
      dayStayCellsData[key] = cell.toJSON();
    }

    const visitCellsData = {};
    for (const [key, cell] of this.visitCells) {
      visitCellsData[key] = cell.toJSON();
    }

    return {
      userId: this.userId,
      yearMonth: this.yearMonth,
      dayStayCells: dayStayCellsData,
      visitCells: visitCellsData,
      stayPeriods: this.stayPeriods.map(period => period.toJSON()),
      stats: this.getMonthlyStats()
    };
  }

  /**
   * JSON形式のデータからScheduleCalendarインスタンスを生成
   * @param {Object} data - JSON形式のデータ
   * @returns {ScheduleCalendar} ScheduleCalendarインスタンス
   */
  static fromJSON(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data for ScheduleCalendar.fromJSON');
    }

    try {
      const calendar = new ScheduleCalendar(data.userId, data.yearMonth);

      // dayStayCellsの復元
      if (data.dayStayCells) {
        for (const [dateKey, cellData] of Object.entries(data.dayStayCells)) {
          const cell = window.ScheduleCell.fromJSON(cellData);
          calendar.dayStayCells.set(dateKey, cell);
        }
      }

      // visitCellsの復元
      if (data.visitCells) {
        for (const [dateKey, cellData] of Object.entries(data.visitCells)) {
          const cell = window.ScheduleCell.fromJSON(cellData);
          calendar.visitCells.set(dateKey, cell);
        }
      }

      // stayPeriodsの復元
      if (data.stayPeriods && Array.isArray(data.stayPeriods)) {
        calendar.stayPeriods = data.stayPeriods.map(periodData => 
          window.StayPeriod.fromJSON(periodData)
        );
      }

      return calendar;
    } catch (error) {
      window.Logger?.error('Error creating ScheduleCalendar from JSON:', error);
      throw error;
    }
  }

  /**
   * 複数のJSON形式データからScheduleCalendarインスタンス配列を生成
   * @param {Array} dataArray - JSON形式データの配列
   * @returns {ScheduleCalendar[]} ScheduleCalendarインスタンスの配列
   */
  static fromJSONArray(dataArray) {
    if (!Array.isArray(dataArray)) {
      throw new Error('Input must be an array');
    }

    return dataArray.map((data, index) => {
      try {
        return ScheduleCalendar.fromJSON(data);
      } catch (error) {
        window.Logger?.error(`Error creating ScheduleCalendar from JSON at index ${index}:`, error);
        throw error;
      }
    });
  }

  /**
   * 文字列表現を取得
   * @returns {string} 文字列表現
   */
  toString() {
    const stats = this.getMonthlyStats();
    return `ScheduleCalendar(${this.userId}, ${this.yearMonth}): Day=${stats.dayCount}, Stay=${stats.stayCount}, Visit=${stats.visitCount}`;
  }

  /**
   * 2つのScheduleCalendarインスタンスが同じかどうかを比較
   * @param {ScheduleCalendar} other - 比較対象のScheduleCalendar
   * @returns {boolean} 同じかどうか
   */
  equals(other) {
    if (!(other instanceof ScheduleCalendar)) {
      return false;
    }

    return this.userId === other.userId && this.yearMonth === other.yearMonth;
  }

  /**
   * ScheduleCalendarインスタンスのクローンを作成
   * @returns {ScheduleCalendar} クローンされたScheduleCalendarインスタンス
   */
  clone() {
    const cloned = new ScheduleCalendar(this.userId, this.yearMonth);

    // セルをクローン
    for (const [key, cell] of this.dayStayCells) {
      cloned.dayStayCells.set(key, cell.clone());
    }
    for (const [key, cell] of this.visitCells) {
      cloned.visitCells.set(key, cell.clone());
    }

    // 宿泊期間をクローン
    cloned.stayPeriods = this.stayPeriods.map(period => period.clone());

    return cloned;
  }
}

// グローバルに登録
window.ScheduleCalendar = ScheduleCalendar;