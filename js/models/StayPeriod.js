/**
 * 小規模多機能利用調整システム - StayPeriodモデル
 * 宿泊期間（入所〜退所）を表すモデルクラス
 */

class StayPeriod {
  /**
   * StayPeriodコンストラクタ
   * @param {Date|string} startDate - 入所日
   * @param {Date|string} endDate - 退所日
   * @param {string} userId - 利用者ID
   */
  constructor(startDate, endDate, userId) {
    // 依存関係チェック
    if (typeof window.DateUtils === 'undefined') {
      throw new Error('StayPeriod model requires DateUtils utility');
    }

    // 必須パラメータチェック
    if (!startDate || !endDate || !userId) {
      throw new Error('startDate, endDate, and userId are required');
    }

    this.userId = userId;

    // 日付の処理
    this.startDate = this._parseDate(startDate, 'startDate');
    this.endDate = this._parseDate(endDate, 'endDate');

    // バリデーション
    this._validate();
  }

  /**
   * 日付文字列をDateオブジェクトに変換
   * @param {Date|string} date - 変換する日付
   * @param {string} paramName - パラメータ名（エラー表示用）
   * @returns {Date} Dateオブジェクト
   * @private
   */
  _parseDate(date, paramName) {
    if (date instanceof Date) {
      return new Date(date);
    }

    if (typeof date === 'string') {
      try {
        return window.DateUtils.parseDate(date);
      } catch (error) {
        throw new Error(`Invalid ${paramName} format: ${date}`);
      }
    }

    throw new Error(`${paramName} must be a Date object or date string`);
  }

  /**
   * バリデーション
   * @private
   */
  _validate() {
    // userIdの検証
    if (!this.userId || typeof this.userId !== 'string') {
      throw new Error('userId must be a non-empty string');
    }

    // 日付の検証
    if (!(this.startDate instanceof Date) || isNaN(this.startDate.getTime())) {
      throw new Error('Invalid startDate');
    }

    if (!(this.endDate instanceof Date) || isNaN(this.endDate.getTime())) {
      throw new Error('Invalid endDate');
    }

    // 期間の妥当性チェック
    if (!this.isValid()) {
      throw new Error('startDate must be less than or equal to endDate');
    }
  }

  /**
   * 期間が妥当かどうかをチェック
   * @returns {boolean} startDate <= endDate かどうか
   */
  isValid() {
    return this.startDate.getTime() <= this.endDate.getTime();
  }

  /**
   * 期間内の全日付配列を生成
   * @returns {Date[]} 期間内の全日付のDateオブジェクト配列
   */
  getDates() {
    const dates = [];
    let current = new Date(this.startDate);

    while (current.getTime() <= this.endDate.getTime()) {
      dates.push(new Date(current));
      current = window.DateUtils.addDays(current, 1);
    }

    return dates;
  }

  /**
   * 指定日が期間に含まれるかチェック
   * @param {Date|string} date - チェックする日付
   * @returns {boolean} 期間に含まれるかどうか
   */
  includes(date) {
    try {
      const targetDate = this._parseDate(date, 'target date');
      return window.DateUtils.isDateInRange(targetDate, this.startDate, this.endDate);
    } catch (error) {
      window.Logger?.warn('Error checking if date is included in period:', error);
      return false;
    }
  }

  /**
   * 宿泊日数を取得（endDate - startDate + 1）
   * @returns {number} 宿泊日数
   */
  getDuration() {
    const days = window.DateUtils.daysBetween(this.startDate, this.endDate);
    return days + 1; // 当日を含むため+1
  }

  /**
   * 期間の長さを取得（endDate - startDate）
   * @returns {number} 期間の長さ（日数）
   */
  getLength() {
    return window.DateUtils.daysBetween(this.startDate, this.endDate);
  }

  /**
   * 開始日の文字列を取得
   * @param {string} format - フォーマット（デフォルト: 'YYYY-MM-DD'）
   * @returns {string} フォーマットされた開始日文字列
   */
  getStartDateString(format = 'YYYY-MM-DD') {
    return window.DateUtils.formatDate(this.startDate, format);
  }

  /**
   * 終了日の文字列を取得
   * @param {string} format - フォーマット（デフォルト: 'YYYY-MM-DD'）
   * @returns {string} フォーマットされた終了日文字列
   */
  getEndDateString(format = 'YYYY-MM-DD') {
    return window.DateUtils.formatDate(this.endDate, format);
  }

  /**
   * 期間の文字列表現を取得
   * @param {string} format - 日付フォーマット
   * @param {string} separator - 区切り文字（デフォルト: ' ~ '）
   * @returns {string} 期間の文字列表現
   */
  getPeriodString(format = 'YYYY-MM-DD', separator = ' ~ ') {
    const start = this.getStartDateString(format);
    const end = this.getEndDateString(format);
    
    if (window.DateUtils.isSameDate(this.startDate, this.endDate)) {
      return start; // 同じ日の場合は1つだけ表示
    }
    
    return `${start}${separator}${end}`;
  }

  /**
   * 期間が今月に含まれるかチェック
   * @param {string} yearMonth - 年月文字列（YYYY-MM形式）
   * @returns {boolean} 今月に含まれるかどうか
   */
  isInMonth(yearMonth) {
    try {
      const monthDates = window.DateUtils.getMonthDates(yearMonth);
      if (monthDates.length === 0) {
        return false;
      }

      const monthStart = monthDates[0];
      const monthEnd = monthDates[monthDates.length - 1];

      // 期間が月と重複するかチェック
      return this.startDate <= monthEnd && this.endDate >= monthStart;
    } catch (error) {
      window.Logger?.warn('Error checking if period is in month:', error);
      return false;
    }
  }

  /**
   * 期間が週末を含むかチェック
   * @returns {boolean} 週末を含むかどうか
   */
  includesWeekend() {
    const dates = this.getDates();
    return dates.some(date => window.DateUtils.isWeekend(date));
  }

  /**
   * 期間内の週末日数を取得
   * @returns {number} 週末日数
   */
  getWeekendDays() {
    const dates = this.getDates();
    return dates.filter(date => window.DateUtils.isWeekend(date)).length;
  }

  /**
   * 期間内の平日日数を取得
   * @returns {number} 平日日数
   */
  getWeekdays() {
    const total = this.getDuration();
    const weekends = this.getWeekendDays();
    return total - weekends;
  }

  /**
   * 他の期間と重複するかチェック
   * @param {StayPeriod} other - 比較対象の期間
   * @returns {boolean} 重複するかどうか
   */
  overlaps(other) {
    if (!(other instanceof StayPeriod)) {
      return false;
    }

    return this.startDate <= other.endDate && this.endDate >= other.startDate;
  }

  /**
   * 他の期間との重複部分を取得
   * @param {StayPeriod} other - 比較対象の期間
   * @returns {StayPeriod|null} 重複部分の期間（重複しない場合はnull）
   */
  getOverlap(other) {
    if (!this.overlaps(other)) {
      return null;
    }

    const overlapStart = this.startDate > other.startDate ? this.startDate : other.startDate;
    const overlapEnd = this.endDate < other.endDate ? this.endDate : other.endDate;

    try {
      return new StayPeriod(overlapStart, overlapEnd, this.userId);
    } catch (error) {
      return null;
    }
  }

  /**
   * 期間を拡張
   * @param {number} daysBefore - 開始日前に追加する日数
   * @param {number} daysAfter - 終了日後に追加する日数
   * @returns {StayPeriod} 拡張された新しい期間
   */
  extend(daysBefore = 0, daysAfter = 0) {
    const newStartDate = window.DateUtils.addDays(this.startDate, -daysBefore);
    const newEndDate = window.DateUtils.addDays(this.endDate, daysAfter);

    return new StayPeriod(newStartDate, newEndDate, this.userId);
  }

  /**
   * 期間の詳細情報を取得
   * @returns {Object} 期間の詳細情報
   */
  getDetailInfo() {
    return {
      userId: this.userId,
      startDate: this.getStartDateString(),
      endDate: this.getEndDateString(),
      duration: this.getDuration(),
      length: this.getLength(),
      periodString: this.getPeriodString(),
      includesWeekend: this.includesWeekend(),
      weekendDays: this.getWeekendDays(),
      weekdays: this.getWeekdays(),
      isValid: this.isValid()
    };
  }

  /**
   * オブジェクトをJSON形式に変換
   * @returns {Object} JSON形式のオブジェクト
   */
  toJSON() {
    return {
      userId: this.userId,
      startDate: this.getStartDateString(),
      endDate: this.getEndDateString(),
      // 追加情報
      ...this.getDetailInfo()
    };
  }

  /**
   * JSON形式のデータからStayPeriodインスタンスを生成
   * @param {Object} data - JSON形式のデータ
   * @returns {StayPeriod} StayPeriodインスタンス
   */
  static fromJSON(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data for StayPeriod.fromJSON');
    }

    try {
      return new StayPeriod(data.startDate, data.endDate, data.userId);
    } catch (error) {
      window.Logger?.error('Error creating StayPeriod from JSON:', error);
      throw error;
    }
  }

  /**
   * 複数のJSON形式データからStayPeriodインスタンス配列を生成
   * @param {Array} dataArray - JSON形式データの配列
   * @returns {StayPeriod[]} StayPeriodインスタンスの配列
   */
  static fromJSONArray(dataArray) {
    if (!Array.isArray(dataArray)) {
      throw new Error('Input must be an array');
    }

    return dataArray.map((data, index) => {
      try {
        return StayPeriod.fromJSON(data);
      } catch (error) {
        window.Logger?.error(`Error creating StayPeriod from JSON at index ${index}:`, error);
        throw error;
      }
    });
  }

  /**
   * 期間配列を開始日でソート
   * @param {StayPeriod[]} periods - ソート対象の期間配列
   * @returns {StayPeriod[]} ソート済みの期間配列
   */
  static sortByStartDate(periods) {
    if (!Array.isArray(periods)) {
      return [];
    }

    return periods
      .filter(period => period instanceof StayPeriod)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  /**
   * 文字列表現を取得
   * @returns {string} 文字列表現
   */
  toString() {
    return `StayPeriod(${this.userId}): ${this.getPeriodString()} [${this.getDuration()}日間]`;
  }

  /**
   * 2つのStayPeriodインスタンスが同じかどうかを比較
   * @param {StayPeriod} other - 比較対象のStayPeriod
   * @returns {boolean} 同じかどうか
   */
  equals(other) {
    if (!(other instanceof StayPeriod)) {
      return false;
    }

    return this.userId === other.userId &&
           window.DateUtils.isSameDate(this.startDate, other.startDate) &&
           window.DateUtils.isSameDate(this.endDate, other.endDate);
  }

  /**
   * StayPeriodインスタンスのクローンを作成
   * @returns {StayPeriod} クローンされたStayPeriodインスタンス
   */
  clone() {
    return new StayPeriod(
      new Date(this.startDate),
      new Date(this.endDate),
      this.userId
    );
  }
}

// グローバルに登録
window.StayPeriod = StayPeriod;