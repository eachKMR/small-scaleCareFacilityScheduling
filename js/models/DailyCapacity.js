/**
 * DailyCapacityクラス（日別定員情報）
 * 1日の定員状況を管理
 */
class DailyCapacity {
    /**
     * コンストラクタ
     * @param {Date|string} date - 日付
     */
    constructor(date) {
        this.date = typeof date === 'string' ? DateUtils.parseDate(date) : date;
        this.dayCountMorning = 0;      // 前半通い人数
        this.dayCountAfternoon = 0;    // 後半通い人数
        this.stayCount = 0;            // 泊り人数
        this.visitCount = 0;           // 訪問回数合計
        this.dayLimit = AppConfig.CAPACITY.DAY_LIMIT;    // 通い定員(15)
        this.stayLimit = AppConfig.CAPACITY.STAY_LIMIT;  // 泊り定員(9)
        
        this.logger = new Logger('DailyCapacity');
    }

    /**
     * 前半後半の最大値を取得
     * @returns {number}
     */
    getMaxDayCount() {
        return Math.max(this.dayCountMorning, this.dayCountAfternoon);
    }

    /**
     * 定員超過かどうか
     * @returns {boolean}
     */
    isOverCapacity() {
        return this.getMaxDayCount() > this.dayLimit || this.stayCount > this.stayLimit;
    }

    /**
     * 通いの定員超過数
     * @returns {number} 超過数（超過していない場合は0）
     */
    getDayOverflow() {
        const overflow = this.getMaxDayCount() - this.dayLimit;
        return overflow > 0 ? overflow : 0;
    }

    /**
     * 泊りの定員超過数
     * @returns {number} 超過数（超過していない場合は0）
     */
    getStayOverflow() {
        const overflow = this.stayCount - this.stayLimit;
        return overflow > 0 ? overflow : 0;
    }

    /**
     * 通いの利用率を計算
     * @returns {number} パーセント値（0-100）
     */
    getDayUtilizationRate() {
        if (this.dayLimit === 0) return 0;
        return Math.round((this.getMaxDayCount() / this.dayLimit) * 100);
    }

    /**
     * 泊りの利用率を計算
     * @returns {number} パーセント値（0-100）
     */
    getStayUtilizationRate() {
        if (this.stayLimit === 0) return 0;
        return Math.round((this.stayCount / this.stayLimit) * 100);
    }

    /**
     * 最大利用率を取得
     * @returns {number} パーセント値（0-100）
     */
    getMaxUtilizationRate() {
        return Math.max(this.getDayUtilizationRate(), this.getStayUtilizationRate());
    }

    /**
     * 定員状況の記号を取得
     * @returns {string} '◎' | '○' | '△' | '×'
     */
    getCapacitySymbol() {
        const maxRate = this.getMaxUtilizationRate();
        const thresholds = AppConfig.CAPACITY.THRESHOLDS;

        if (maxRate <= thresholds.GOOD) return '◎';      // 良好
        if (maxRate <= thresholds.OK) return '○';        // 通常
        if (maxRate <= thresholds.WARN) return '△';      // 注意
        return '×';                                       // 定員オーバー
    }

    /**
     * 定員状況の説明テキストを取得
     * @returns {string}
     */
    getCapacityDescription() {
        const symbol = this.getCapacitySymbol();
        const descriptions = {
            '◎': '余裕あり',
            '○': '適正',
            '△': '注意',
            '×': '定員オーバー'
        };
        return descriptions[symbol] || '';
    }

    /**
     * ツールチップ用データを取得
     * @returns {object}
     */
    getTooltipData() {
        return {
            date: DateUtils.formatDate(this.date),
            dayOfWeek: DateUtils.getDayName(this.date),
            dayMorning: `前半: ${this.dayCountMorning}/${this.dayLimit}人`,
            dayAfternoon: `後半: ${this.dayCountAfternoon}/${this.dayLimit}人`,
            stay: `泊り: ${this.stayCount}/${this.stayLimit}人`,
            visit: `訪問: ${this.visitCount}回`,
            status: this.getCapacitySymbol(),
            description: this.getCapacityDescription(),
            dayRate: `${this.getDayUtilizationRate()}%`,
            stayRate: `${this.getStayUtilizationRate()}%`
        };
    }

    /**
     * 利用率データを取得
     * @returns {object}
     */
    getUtilizationRate() {
        return {
            day: this.getDayUtilizationRate(),
            stay: this.getStayUtilizationRate(),
            max: this.getMaxUtilizationRate()
        };
    }

    /**
     * サマリーテキストを取得
     * @returns {string}
     */
    getSummaryText() {
        const dayMax = this.getMaxDayCount();
        const dayText = `通い: ${dayMax}/${this.dayLimit}人 (前${this.dayCountMorning}/後${this.dayCountAfternoon})`;
        const stayText = `泊り: ${this.stayCount}/${this.stayLimit}人`;
        const visitText = `訪問: ${this.visitCount}回`;
        
        return `${dayText}, ${stayText}, ${visitText}`;
    }

    /**
     * 通いの空き人数を取得
     * @returns {number}
     */
    getDayAvailability() {
        const available = this.dayLimit - this.getMaxDayCount();
        return available > 0 ? available : 0;
    }

    /**
     * 泊りの空き人数を取得
     * @returns {number}
     */
    getStayAvailability() {
        const available = this.stayLimit - this.stayCount;
        return available > 0 ? available : 0;
    }

    /**
     * 通いが満員かどうか
     * @returns {boolean}
     */
    isDayFull() {
        return this.getMaxDayCount() > this.dayLimit;
    }

    /**
     * 泊りが満員かどうか
     * @returns {boolean}
     */
    isStayFull() {
        return this.stayCount > this.stayLimit;
    }

    /**
     * 泊りが満員に近いかどうか（80%以上）
     * @returns {boolean}
     */
    isStayNearFull() {
        return this.getStayUtilizationRate() >= 80;
    }

    /**
     * 泊りの定員状況記号を取得
     * @returns {string} '◎' | '○' | '△' | '×'
     */
    getStaySymbol() {
        const rate = this.getStayUtilizationRate();
        const thresholds = AppConfig.CAPACITY.THRESHOLDS;

        if (rate <= thresholds.GOOD) return '◎';      // 良好
        if (rate <= thresholds.OK) return '○';        // 通常
        if (rate <= thresholds.WARN) return '△';      // 注意
        return '×';                                    // 定員オーバー
    }

    /**
     * 週末かどうか
     * @returns {boolean}
     */
    isWeekend() {
        return DateUtils.isWeekend(this.date);
    }

    /**
     * 定員情報をリセット
     */
    reset() {
        this.dayCountMorning = 0;
        this.dayCountAfternoon = 0;
        this.stayCount = 0;
        this.visitCount = 0;
    }

    /**
     * セルの定員カウントを加算
     * @param {ScheduleCell} cell - セル
     */
    addCellCount(cell) {
        if (!cell || cell.isEmpty()) {
            return;
        }

        const contribution = cell.getDayCountContribution();
        
        this.dayCountMorning += contribution.morning;
        this.dayCountAfternoon += contribution.afternoon;
        
        if (contribution.stay) {
            this.stayCount++;
        }

        if (cell.isVisitCell()) {
            this.visitCount += cell.actualFlags.visit;
        }
    }

    /**
     * JSON形式に変換
     * @returns {object}
     */
    toJSON() {
        return {
            date: DateUtils.formatDate(this.date),
            dayCountMorning: this.dayCountMorning,
            dayCountAfternoon: this.dayCountAfternoon,
            stayCount: this.stayCount,
            visitCount: this.visitCount,
            dayLimit: this.dayLimit,
            stayLimit: this.stayLimit
        };
    }

    /**
     * JSONからDailyCapacityインスタンスを作成
     * @param {object} json - JSONデータ
     * @returns {DailyCapacity}
     */
    static fromJSON(json) {
        const capacity = new DailyCapacity(json.date);
        capacity.dayCountMorning = json.dayCountMorning || 0;
        capacity.dayCountAfternoon = json.dayCountAfternoon || 0;
        capacity.stayCount = json.stayCount || 0;
        capacity.visitCount = json.visitCount || 0;
        
        if (json.dayLimit !== undefined) {
            capacity.dayLimit = json.dayLimit;
        }
        if (json.stayLimit !== undefined) {
            capacity.stayLimit = json.stayLimit;
        }
        
        return capacity;
    }

    /**
     * 複数の日別定員をソート（日付順）
     * @param {Array<DailyCapacity>} capacities - 日別定員の配列
     * @returns {Array<DailyCapacity>}
     */
    static sortByDate(capacities) {
        return capacities.slice().sort((a, b) => a.date - b.date);
    }

    /**
     * 定員オーバーの日のみフィルタ
     * @param {Array<DailyCapacity>} capacities - 日別定員の配列
     * @returns {Array<DailyCapacity>}
     */
    static filterOverCapacity(capacities) {
        return capacities.filter(c => c.isOverCapacity());
    }

    /**
     * 週末のみフィルタ
     * @param {Array<DailyCapacity>} capacities - 日別定員の配列
     * @returns {Array<DailyCapacity>}
     */
    static filterWeekends(capacities) {
        return capacities.filter(c => c.isWeekend());
    }
}

// グローバル変数として公開
window.DailyCapacity = DailyCapacity;
