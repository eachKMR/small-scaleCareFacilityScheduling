/**
 * DateUtils.js
 * 日付処理ユーティリティ
 * 
 * L1_データ_共通データ構造.md の日付仕様に基づく
 */

/**
 * 祝日カレンダークラス（簡易版）
 */
class HolidayCalendar {
  static holidays = {
    '01-01': '元日',
    '01-02': '年始',
    '01-03': '年始',
    '02-11': '建国記念の日',
    '02-23': '天皇誕生日',
    '03-20': '春分の日',
    '04-29': '昭和の日',
    '05-03': '憲法記念日',
    '05-04': 'みどりの日',
    '05-05': 'こどもの日',
    '07-15': '海の日',
    '08-11': '山の日',
    '09-15': '敬老の日',
    '09-23': '秋分の日',
    '10-10': 'スポーツの日',
    '11-03': '文化の日',
    '11-23': '勤労感謝の日',
    '12-31': '大晦日'
  };

  static isHoliday(date) {
    const key = this.formatKey(date);
    return key in this.holidays;
  }

  static formatKey(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  }
}

export class DateUtils {
  /**
   * 日付文字列をパース
   * @param {string} dateStr - "YYYY-MM-DD" 形式
   * @returns {Date}
   */
  static parseDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * DateオブジェクトをYYYY-MM-DD形式に変換
   * @param {Date} date
   * @returns {string}
   */
  static formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 年月文字列をパース
   * @param {string} yearMonth - "YYYY-MM" 形式
   * @returns {Object} { year, month }
   */
  static parseYearMonth(yearMonth) {
    const [year, month] = yearMonth.split('-').map(Number);
    return { year, month };
  }

  /**
   * 指定年月の日数を取得
   * @param {number} year
   * @param {number} month - 1-12
   * @returns {number}
   */
  static getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  /**
   * 指定年月の全日付を生成
   * @param {string} yearMonth - "YYYY-MM" 形式
   * @returns {string[]} - ["YYYY-MM-01", "YYYY-MM-02", ...]
   */
  static generateDatesInMonth(yearMonth) {
    const { year, month } = this.parseYearMonth(yearMonth);
    const daysInMonth = this.getDaysInMonth(year, month);
    const dates = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      dates.push(`${yearMonth}-${dayStr}`);
    }

    return dates;
  }

  /**
   * 曜日を取得
   * @param {string} dateStr - "YYYY-MM-DD" 形式
   * @returns {number} - 0=日, 1=月, ..., 6=土
   */
  static getDayOfWeek(dateStr) {
    return this.parseDate(dateStr).getDay();
  }

  /**
   * 曜日名を取得
   * @param {string} dateStr - "YYYY-MM-DD" 形式
   * @returns {string} - "日", "月", ..., "土"
   */
  static getDayOfWeekName(dateStr) {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return dayNames[this.getDayOfWeek(dateStr)];
  }

  /**
   * 現在の年月を取得
   * @returns {string} - "YYYY-MM" 形式
   */
  static getCurrentYearMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * 月を加算/減算
   * @param {string} yearMonth - "YYYY-MM" 形式
   * @param {number} delta - 加算する月数（負数で減算）
   * @returns {string} - "YYYY-MM" 形式
   */
  static addMonths(yearMonth, delta) {
    const { year, month } = this.parseYearMonth(yearMonth);
    const date = new Date(year, month - 1 + delta, 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    return `${newYear}-${newMonth}`;
  }

  /**
   * 日を加算/減算
   * @param {string} dateStr - "YYYY-MM-DD" 形式
   * @param {number} delta - 加算する日数
   * @returns {string} - "YYYY-MM-DD" 形式
   */
  static addDays(dateStr, delta) {
    const date = this.parseDate(dateStr);
    date.setDate(date.getDate() + delta);
    return this.formatDate(date);
  }

  /**
   * 2つの日付の差（日数）を計算
   * @param {string} dateStr1 - "YYYY-MM-DD" 形式
   * @param {string} dateStr2 - "YYYY-MM-DD" 形式
   * @returns {number} - 日数の差
   */
  static diffDays(dateStr1, dateStr2) {
    const date1 = this.parseDate(dateStr1);
    const date2 = this.parseDate(dateStr2);
    const diffTime = date2.getTime() - date1.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 日付が範囲内にあるかチェック
   * @param {string} dateStr - チェックする日付
   * @param {string} startDate - 開始日
   * @param {string} endDate - 終了日
   * @returns {boolean}
   */
  static isDateInRange(dateStr, startDate, endDate) {
    const date = this.parseDate(dateStr);
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);
    return date >= start && date <= end;
  }

  /**
   * 祝日判定
   * @param {Date} date - Dateオブジェクト
   * @returns {boolean}
   */
  static isHoliday(date) {
    return HolidayCalendar.isHoliday(date);
  }

  /**
   * 週末判定（土日）
   * @param {Date} date - Dateオブジェクト
   * @returns {boolean}
   */
  static isWeekend(date) {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 日曜 or 土曜
  }

  /**
   * 日付の表示文字列を生成
   * @param {string} dateStr - "YYYY-MM-DD" 形式
   * @param {boolean} showYear - 年を表示するか
   * @returns {string} - "11月23日(土)" または "2025年11月23日(土)"
   */
  static formatDateDisplay(dateStr, showYear = false) {
    const { year, month } = this.parseYearMonth(dateStr.substring(0, 7));
    const day = parseInt(dateStr.substring(8, 10), 10);
    const dayOfWeek = this.getDayOfWeekName(dateStr);

    if (showYear) {
      return `${year}年${month}月${day}日(${dayOfWeek})`;
    } else {
      return `${month}月${day}日(${dayOfWeek})`;
    }
  }
}
