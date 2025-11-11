/**
 * 小規模多機能利用調整システム - 日付ユーティリティ
 * 日付操作、フォーマット、月間データ処理などの機能を提供
 */

class DateUtils {
  /**
   * 日付をフォーマットして文字列に変換
   * @param {Date|string} date - フォーマットする日付
   * @param {string} format - フォーマット文字列 (YYYY, MM, DD, HH, mm, ss)
   * @returns {string} フォーマットされた日付文字列
   */
  static formatDate(date, format = 'YYYY-MM-DD') {
    try {
      const dateObj = this._toDateObject(date);
      
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      
      return format
        .replace(/YYYY/g, year)
        .replace(/MM/g, month)
        .replace(/DD/g, day)
        .replace(/HH/g, hours)
        .replace(/mm/g, minutes)
        .replace(/ss/g, seconds);
        
    } catch (error) {
      window.Logger?.error('DateUtils.formatDate error:', error);
      return '';
    }
  }

  /**
   * 文字列をDateオブジェクトに変換
   * @param {string} dateString - 変換する日付文字列 (YYYY-MM-DD形式)
   * @returns {Date} Dateオブジェクト
   */
  static parseDate(dateString) {
    try {
      if (!dateString || typeof dateString !== 'string') {
        throw new Error('Invalid date string');
      }
      
      // YYYY-MM-DD形式をパース
      const parts = dateString.split('-');
      if (parts.length !== 3) {
        throw new Error('Date string must be in YYYY-MM-DD format');
      }
      
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Dateオブジェクトは0ベース
      const day = parseInt(parts[2], 10);
      
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        throw new Error('Invalid date components');
      }
      
      const date = new Date(year, month, day);
      
      // 日付の妥当性チェック
      if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        throw new Error('Invalid date');
      }
      
      return date;
      
    } catch (error) {
      window.Logger?.error('DateUtils.parseDate error:', error);
      throw error;
    }
  }

  /**
   * 指定月の全日付配列を取得
   * @param {string} yearMonth - 年月文字列 (YYYY-MM形式)
   * @returns {Date[]} その月の全日付のDateオブジェクト配列
   */
  static getMonthDates(yearMonth) {
    try {
      if (!yearMonth || typeof yearMonth !== 'string') {
        throw new Error('Invalid yearMonth parameter');
      }
      
      const parts = yearMonth.split('-');
      if (parts.length !== 2) {
        throw new Error('yearMonth must be in YYYY-MM format');
      }
      
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Dateオブジェクトは0ベース
      
      if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
        throw new Error('Invalid year or month');
      }
      
      // その月の1日と最終日を取得
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0); // 翌月の0日 = 当月の最終日
      
      const dates = [];
      for (let d = 1; d <= lastDay.getDate(); d++) {
        dates.push(new Date(year, month, d));
      }
      
      return dates;
      
    } catch (error) {
      window.Logger?.error('DateUtils.getMonthDates error:', error);
      return [];
    }
  }

  /**
   * 2つの日付が同じ日かどうかを判定
   * @param {Date|string} date1 - 比較する日付1
   * @param {Date|string} date2 - 比較する日付2
   * @returns {boolean} 同じ日かどうか
   */
  static isSameDate(date1, date2) {
    try {
      const d1 = this._toDateObject(date1);
      const d2 = this._toDateObject(date2);
      
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
             
    } catch (error) {
      window.Logger?.error('DateUtils.isSameDate error:', error);
      return false;
    }
  }

  /**
   * 日付に指定日数を加算
   * @param {Date|string} date - 基準日付
   * @param {number} days - 加算する日数（負数で減算）
   * @returns {Date} 加算後のDateオブジェクト
   */
  static addDays(date, days) {
    try {
      const dateObj = this._toDateObject(date);
      const result = new Date(dateObj);
      result.setDate(result.getDate() + days);
      return result;
      
    } catch (error) {
      window.Logger?.error('DateUtils.addDays error:', error);
      return new Date();
    }
  }

  /**
   * 日付に指定月数を加算
   * @param {Date|string} date - 基準日付
   * @param {number} months - 加算する月数（負数で減算）
   * @returns {Date} 加算後のDateオブジェクト
   */
  static addMonths(date, months) {
    try {
      const dateObj = this._toDateObject(date);
      const result = new Date(dateObj);
      result.setMonth(result.getMonth() + months);
      return result;
      
    } catch (error) {
      window.Logger?.error('DateUtils.addMonths error:', error);
      return new Date();
    }
  }

  /**
   * 今日の日付を取得
   * @returns {Date} 今日のDateオブジェクト（時刻は00:00:00）
   */
  static today() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  /**
   * 今月の年月文字列を取得
   * @returns {string} 今月の年月文字列 (YYYY-MM形式)
   */
  static getCurrentYearMonth() {
    return this.formatDate(new Date(), 'YYYY-MM');
  }

  /**
   * 日付から年月文字列を取得
   * @param {Date|string} date - 対象日付
   * @returns {string} 年月文字列 (YYYY-MM形式)
   */
  static getYearMonth(date) {
    return this.formatDate(date, 'YYYY-MM');
  }

  /**
   * 日付から曜日を取得
   * @param {Date|string} date - 対象日付
   * @param {string} format - フォーマット ('short': 月火水, 'long': 月曜日火曜日, 'en': Mon Tue)
   * @returns {string} 曜日文字列
   */
  static getDayOfWeek(date, format = 'short') {
    try {
      const dateObj = this._toDateObject(date);
      const dayIndex = dateObj.getDay();
      
      const days = {
        short: ['日', '月', '火', '水', '木', '金', '土'],
        long: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
        en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      };
      
      return days[format] ? days[format][dayIndex] : days.short[dayIndex];
      
    } catch (error) {
      window.Logger?.error('DateUtils.getDayOfWeek error:', error);
      return '';
    }
  }

  /**
   * 週末かどうかを判定
   * @param {Date|string} date - 判定する日付
   * @returns {boolean} 週末（土日）かどうか
   */
  static isWeekend(date) {
    try {
      const dateObj = this._toDateObject(date);
      const dayOfWeek = dateObj.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6; // 0=日曜日, 6=土曜日
      
    } catch (error) {
      window.Logger?.error('DateUtils.isWeekend error:', error);
      return false;
    }
  }

  /**
   * 2つの日付間の日数を計算
   * @param {Date|string} startDate - 開始日付
   * @param {Date|string} endDate - 終了日付
   * @returns {number} 日数（終了日付 - 開始日付）
   */
  static daysBetween(startDate, endDate) {
    try {
      const start = this._toDateObject(startDate);
      const end = this._toDateObject(endDate);
      
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
      
    } catch (error) {
      window.Logger?.error('DateUtils.daysBetween error:', error);
      return 0;
    }
  }

  /**
   * 日付が指定範囲内にあるかチェック
   * @param {Date|string} date - チェックする日付
   * @param {Date|string} startDate - 範囲開始日
   * @param {Date|string} endDate - 範囲終了日
   * @returns {boolean} 範囲内にあるかどうか
   */
  static isDateInRange(date, startDate, endDate) {
    try {
      const targetDate = this._toDateObject(date);
      const start = this._toDateObject(startDate);
      const end = this._toDateObject(endDate);
      
      return targetDate >= start && targetDate <= end;
      
    } catch (error) {
      window.Logger?.error('DateUtils.isDateInRange error:', error);
      return false;
    }
  }

  /**
   * 日付配列を昇順でソート
   * @param {(Date|string)[]} dates - ソートする日付配列
   * @returns {Date[]} ソート済みのDateオブジェクト配列
   */
  static sortDates(dates) {
    try {
      return dates
        .map(date => this._toDateObject(date))
        .sort((a, b) => a.getTime() - b.getTime());
        
    } catch (error) {
      window.Logger?.error('DateUtils.sortDates error:', error);
      return [];
    }
  }

  /**
   * 日付の妥当性をチェック
   * @param {Date|string} date - チェックする日付
   * @returns {boolean} 妥当な日付かどうか
   */
  static isValidDate(date) {
    try {
      const dateObj = this._toDateObject(date);
      return dateObj instanceof Date && !isNaN(dateObj.getTime());
    } catch (error) {
      return false;
    }
  }

  /**
   * 内部用：様々な入力をDateオブジェクトに変換
   * @param {Date|string} input - 変換する入力
   * @returns {Date} Dateオブジェクト
   * @private
   */
  static _toDateObject(input) {
    if (input instanceof Date) {
      return input;
    }
    
    if (typeof input === 'string') {
      // YYYY-MM-DD形式の場合はparseDate使用
      if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        return this.parseDate(input);
      }
      // その他の場合はDate.parse使用
      const parsed = new Date(input);
      if (isNaN(parsed.getTime())) {
        throw new Error('Invalid date string');
      }
      return parsed;
    }
    
    throw new Error('Invalid date input type');
  }
}

// グローバルに登録
window.DateUtils = DateUtils;