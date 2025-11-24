/**
 * ValidationUtils.js
 * バリデーションユーティリティ
 * 
 * 入力値の検証を行う
 */

export class ValidationUtils {
  /**
   * 日付文字列の形式チェック
   * @param {string} dateStr - "YYYY-MM-DD" 形式
   * @returns {boolean}
   */
  static isValidDateFormat(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return false;
    
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;

    // 実際に有効な日付かチェック
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.getFullYear() === year &&
           date.getMonth() === month - 1 &&
           date.getDate() === day;
  }

  /**
   * 年月文字列の形式チェック
   * @param {string} yearMonth - "YYYY-MM" 形式
   * @returns {boolean}
   */
  static isValidYearMonthFormat(yearMonth) {
    if (!yearMonth || typeof yearMonth !== 'string') return false;
    
    const regex = /^\d{4}-\d{2}$/;
    if (!regex.test(yearMonth)) return false;

    const [year, month] = yearMonth.split('-').map(Number);
    return year >= 2020 && year <= 2100 && month >= 1 && month <= 12;
  }

  /**
   * ユーザーIDの形式チェック
   * @param {string} userId - "user001" 形式
   * @returns {boolean}
   */
  static isValidUserId(userId) {
    if (!userId || typeof userId !== 'string') return false;
    return /^user\d{3}$/.test(userId);
  }

  /**
   * 定員チェック
   * @param {number} count - 現在の人数
   * @param {number} capacity - 定員
   * @returns {Object} { ok: boolean, message: string }
   */
  static checkCapacity(count, capacity) {
    if (count > capacity) {
      return {
        ok: false,
        message: `定員を超えています（${count}/${capacity}人）`
      };
    } else if (count === capacity) {
      return {
        ok: false,
        message: `定員に達しています（${count}/${capacity}人）`
      };
    } else {
      return {
        ok: true,
        message: `定員内です（${count}/${capacity}人）`
      };
    }
  }

  /**
   * セクション名のバリデーション
   * @param {string} section - "前半" | "後半" | "終日"
   * @returns {boolean}
   */
  static isValidKayoiSection(section) {
    return ['前半', '後半', '終日'].includes(section);
  }

  /**
   * 記号のバリデーション（通い）
   * @param {string} symbol - "○" | "◓" | "◒"
   * @returns {boolean}
   */
  static isValidKayoiSymbol(symbol) {
    return ['○', '◓', '◒'].includes(symbol);
  }

  /**
   * 泊まり記号のバリデーション
   * @param {string} symbol - "入" | "○" | "退"
   * @returns {boolean}
   */
  static isValidTomariSymbol(symbol) {
    return ['入', '○', '退'].includes(symbol);
  }

  /**
   * 訪問回数のバリデーション
   * @param {number} count - 0-9
   * @returns {boolean}
   */
  static isValidHoumonCount(count) {
    return Number.isInteger(count) && count >= 0 && count <= 9;
  }

  /**
   * 居室番号のバリデーション
   * @param {number} roomNumber - 1-9
   * @returns {boolean}
   */
  static isValidRoomNumber(roomNumber) {
    return Number.isInteger(roomNumber) && roomNumber >= 1 && roomNumber <= 9;
  }

  /**
   * 空文字列チェック
   * @param {string} str
   * @returns {boolean} - 空またはnullの場合true
   */
  static isEmpty(str) {
    return !str || str.trim() === '';
  }

  /**
   * 文字列長チェック
   * @param {string} str
   * @param {number} maxLength
   * @returns {boolean}
   */
  static isWithinLength(str, maxLength) {
    if (!str) return true;
    return str.length <= maxLength;
  }

  /**
   * 数値範囲チェック
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {boolean}
   */
  static isInRange(value, min, max) {
    return typeof value === 'number' && value >= min && value <= max;
  }
}
