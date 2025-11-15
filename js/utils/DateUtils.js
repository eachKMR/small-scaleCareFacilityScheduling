/**
 * 日付処理ユーティリティ
 * 日付関連の共通処理を提供
 */
class DateUtils {
    /**
     * 指定月の日数を取得
     * @param {number} year - 年
     * @param {number} month - 月（1-12）
     * @returns {number} 日数
     */
    static getDaysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    }

    /**
     * YYYY-MM形式の文字列から年月を取得
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {object} {year: number, month: number}
     */
    static parseYearMonth(yearMonth) {
        const parts = yearMonth.split('-');
        return {
            year: parseInt(parts[0]),
            month: parseInt(parts[1])
        };
    }

    /**
     * 年月を文字列形式に変換
     * @param {number} year - 年
     * @param {number} month - 月
     * @returns {string} "YYYY-MM"形式
     */
    static formatYearMonth(year, month) {
        return `${year}-${String(month).padStart(2, '0')}`;
    }

    /**
     * 日付を文字列形式に変換
     * @param {Date|string} date - 日付オブジェクトまたは文字列
     * @param {string} format - フォーマット (YYYY-MM-DD, YYYY-MM, YYYY年MM月, YYYY年MM月DD日, MM/DD など)
     * @returns {string} フォーマット済み文字列
     */
    static formatDate(date, format = 'YYYY-MM-DD') {
        // 文字列の場合はDateオブジェクトに変換
        if (typeof date === 'string') {
            date = this.parseDate(date);
        }
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // フォーマット文字列を置換
        return format
            .replace('YYYY', year)
            .replace('MM', String(month).padStart(2, '0'))
            .replace('DD', String(day).padStart(2, '0'))
            .replace('M', month)
            .replace('D', day);
    }

    /**
     * 文字列から日付オブジェクトを作成
     * @param {string} dateStr - "YYYY-MM-DD"形式
     * @returns {Date} 日付オブジェクト
     */
    static parseDate(dateStr) {
        const parts = dateStr.split('-');
        return new Date(
            parseInt(parts[0]),
            parseInt(parts[1]) - 1,
            parseInt(parts[2])
        );
    }

    /**
     * 曜日を取得（0:日曜〜6:土曜）
     * @param {Date} date - 日付
     * @returns {number} 曜日
     */
    static getDayOfWeek(date) {
        return date.getDay();
    }

    /**
     * 曜日名を取得
     * @param {Date} date - 日付
     * @returns {string} 曜日名
     */
    static getDayName(date) {
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        return days[date.getDay()];
    }

    /**
     * 週末かどうか判定
     * @param {Date} date - 日付
     * @returns {boolean} 週末の場合true
     */
    static isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    /**
     * 月の最初の日を取得
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {Date} 月初日
     */
    static getFirstDayOfMonth(yearMonth) {
        const {year, month} = this.parseYearMonth(yearMonth);
        return new Date(year, month - 1, 1);
    }

    /**
     * 月の最後の日を取得
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {Date} 月末日
     */
    static getLastDayOfMonth(yearMonth) {
        const {year, month} = this.parseYearMonth(yearMonth);
        return new Date(year, month, 0);
    }

    /**
     * 前月を取得
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {string} 前月の"YYYY-MM"
     */
    static getPreviousMonth(yearMonth) {
        const {year, month} = this.parseYearMonth(yearMonth);
        if (month === 1) {
            return this.formatYearMonth(year - 1, 12);
        }
        return this.formatYearMonth(year, month - 1);
    }

    /**
     * 翌月を取得
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {string} 翌月の"YYYY-MM"
     */
    static getNextMonth(yearMonth) {
        const {year, month} = this.parseYearMonth(yearMonth);
        if (month === 12) {
            return this.formatYearMonth(year + 1, 1);
        }
        return this.formatYearMonth(year, month + 1);
    }

    /**
     * 日付の差分を日数で取得
     * @param {Date} date1 - 日付1
     * @param {Date} date2 - 日付2
     * @returns {number} 日数差
     */
    static getDaysDiff(date1, date2) {
        const diffTime = Math.abs(date2 - date1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * 現在の年月を取得
     * @returns {string} "YYYY-MM"形式
     */
    static getCurrentYearMonth() {
        const now = new Date();
        return this.formatYearMonth(now.getFullYear(), now.getMonth() + 1);
    }
}

// グローバル変数として公開
window.DateUtils = DateUtils;
