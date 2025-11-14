/**
 * StayPeriodクラス（宿泊期間）
 * 入所から退所までの期間を管理
 */
class StayPeriod {
    /**
     * コンストラクタ
     * @param {object} data - 宿泊期間データ
     */
    constructor(data = {}) {
        this.startDate = data.startDate ? this._parseDate(data.startDate) : null;
        this.endDate = data.endDate ? this._parseDate(data.endDate) : null;
        this.userId = data.userId || '';
        this.note = data.note || '';
        
        this.logger = new Logger('StayPeriod');
    }

    /**
     * 日付を解析してDateオブジェクトに変換
     * @param {Date|string} date - 日付
     * @returns {Date}
     * @private
     */
    _parseDate(date) {
        if (date instanceof Date) {
            return date;
        }
        if (typeof date === 'string') {
            return DateUtils.parseDate(date);
        }
        return null;
    }

    /**
     * 宿泊期間が妥当かどうか
     * @returns {boolean}
     */
    isValid() {
        if (!this.startDate || !this.endDate) {
            return false;
        }

        // 開始日 <= 終了日
        return this.startDate <= this.endDate;
    }

    /**
     * 宿泊期間の日数を取得
     * @returns {number} 日数（開始日〜終了日を含む）
     */
    getDuration() {
        if (!this.isValid()) {
            return 0;
        }

        const diffTime = this.endDate.getTime() - this.startDate.getTime();
        return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;  // +1は開始日を含むため
    }

    /**
     * 指定月に含まれる日付のみを取得
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {Array<Date>}
     */
    getDatesInMonth(yearMonth) {
        if (!this.isValid()) {
            return [];
        }

        const dates = [];
        const {year, month} = DateUtils.parseYearMonth(yearMonth);
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0);

        // 宿泊期間と月の範囲の重なりを計算
        const periodStart = this.startDate > monthStart ? this.startDate : monthStart;
        const periodEnd = this.endDate < monthEnd ? this.endDate : monthEnd;

        // 重なりがない場合
        if (periodStart > periodEnd) {
            return [];
        }

        // 日付を列挙
        const current = new Date(periodStart);
        while (current <= periodEnd) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return dates;
    }

    /**
     * 指定日が宿泊期間に含まれるかどうか
     * @param {Date|string} date - 日付
     * @returns {boolean}
     */
    includesDate(date) {
        if (!this.isValid()) {
            return false;
        }

        const targetDate = this._parseDate(date);
        if (!targetDate) {
            return false;
        }

        // 時刻を無視して日付のみで比較
        const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const start = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate());
        const end = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate());

        return target >= start && target <= end;
    }

    /**
     * 他の宿泊期間と重複するかどうか
     * @param {StayPeriod} other - 他の宿泊期間
     * @returns {boolean}
     */
    overlaps(other) {
        if (!this.isValid() || !other.isValid()) {
            return false;
        }

        // 期間が重複する条件:
        // this.start <= other.end AND this.end >= other.start
        return this.startDate <= other.endDate && this.endDate >= other.startDate;
    }

    /**
     * 指定月と重複するかどうか
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {boolean}
     */
    overlapsMonth(yearMonth) {
        if (!this.isValid()) {
            return false;
        }

        const monthStart = DateUtils.getFirstDayOfMonth(yearMonth);
        const monthEnd = DateUtils.getLastDayOfMonth(yearMonth);

        return this.startDate <= monthEnd && this.endDate >= monthStart;
    }

    /**
     * 前月から継続する宿泊期間かどうか
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {boolean}
     */
    startsBeforeMonth(yearMonth) {
        if (!this.isValid()) {
            return false;
        }

        const monthStart = DateUtils.getFirstDayOfMonth(yearMonth);
        return this.startDate < monthStart;
    }

    /**
     * 翌月へ継続する宿泊期間かどうか
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {boolean}
     */
    continuesAfterMonth(yearMonth) {
        if (!this.isValid()) {
            return false;
        }

        const monthEnd = DateUtils.getLastDayOfMonth(yearMonth);
        return this.endDate > monthEnd;
    }

    /**
     * 開始日の文字列表現（YYYY-MM-DD）
     * @returns {string}
     */
    getStartDateString() {
        return this.startDate ? DateUtils.formatDate(this.startDate) : '';
    }

    /**
     * 終了日の文字列表現（YYYY-MM-DD）
     * @returns {string}
     */
    getEndDateString() {
        return this.endDate ? DateUtils.formatDate(this.endDate) : '';
    }

    /**
     * 期間の文字列表現
     * @returns {string} 例: "2025-12-25 〜 2025-12-28 (4日間)"
     */
    toString() {
        if (!this.isValid()) {
            return '無効な期間';
        }

        const start = this.getStartDateString();
        const end = this.getEndDateString();
        const duration = this.getDuration();

        return `${start} 〜 ${end} (${duration}日間)`;
    }

    /**
     * JSON形式に変換
     * @returns {object}
     */
    toJSON() {
        return {
            startDate: this.getStartDateString(),
            endDate: this.getEndDateString(),
            userId: this.userId,
            note: this.note
        };
    }

    /**
     * JSONからStayPeriodインスタンスを作成
     * @param {object} json - JSONデータ
     * @returns {StayPeriod}
     */
    static fromJSON(json) {
        return new StayPeriod(json);
    }

    /**
     * 複数の宿泊期間をJSONから作成
     * @param {Array} jsonArray - JSONデータの配列
     * @returns {Array<StayPeriod>}
     */
    static fromJSONArray(jsonArray) {
        if (!Array.isArray(jsonArray)) {
            return [];
        }
        return jsonArray.map(json => StayPeriod.fromJSON(json));
    }

    /**
     * 宿泊期間を開始日でソート
     * @param {Array<StayPeriod>} periods - 宿泊期間の配列
     * @returns {Array<StayPeriod>}
     */
    static sortByStartDate(periods) {
        return periods.slice().sort((a, b) => {
            if (!a.startDate || !b.startDate) return 0;
            return a.startDate - b.startDate;
        });
    }

    /**
     * 指定月に重複する宿泊期間をフィルタ
     * @param {Array<StayPeriod>} periods - 宿泊期間の配列
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {Array<StayPeriod>}
     */
    static filterByMonth(periods, yearMonth) {
        return periods.filter(period => period.overlapsMonth(yearMonth));
    }
}

// グローバル変数として公開
window.StayPeriod = StayPeriod;
