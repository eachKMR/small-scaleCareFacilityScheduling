/**
 * ServiceCapacityクラス（定員管理）
 * 月全体の定員状況を管理・集計
 */
class ServiceCapacity {
    /**
     * コンストラクタ
     * @param {Array<ScheduleCalendar>} calendars - 全利用者のカレンダー配列
     */
    constructor(calendars = []) {
        this.calendars = calendars;
        this.logger = new Logger('ServiceCapacity');
    }

    /**
     * カレンダーを設定
     * @param {Array<ScheduleCalendar>} calendars - カレンダー配列
     */
    setCalendars(calendars) {
        this.calendars = calendars;
    }

    /**
     * 指定日の定員状況をチェック
     * @param {string} date - "YYYY-MM-DD"形式
     * @returns {DailyCapacity}
     */
    checkDate(date) {
        const capacity = new DailyCapacity(date);

        this.calendars.forEach(calendar => {
            // 通泊行のセル
            const dayStayCell = calendar.getCell(date, 'dayStay');
            if (dayStayCell) {
                capacity.addCellCount(dayStayCell);
            }

            // 訪問行のセル
            const visitCell = calendar.getCell(date, 'visit');
            if (visitCell) {
                capacity.addCellCount(visitCell);
            }
        });

        this.logger.debug(`Date checked: ${date}, ${capacity.getSummaryText()}`);
        
        return capacity;
    }

    /**
     * 月全体の定員状況をチェック
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {Array<DailyCapacity>}
     */
    checkMonth(yearMonth) {
        const {year, month} = DateUtils.parseYearMonth(yearMonth);
        const daysInMonth = DateUtils.getDaysInMonth(year, month);
        const capacities = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;
            const capacity = this.checkDate(dateStr);
            capacities.push(capacity);
        }

        this.logger.info(`Month checked: ${yearMonth}, ${daysInMonth} days`);
        
        return capacities;
    }

    /**
     * 定員オーバーの日付を取得
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {Array<Date>}
     */
    getOverCapacityDates(yearMonth) {
        const capacities = this.checkMonth(yearMonth);
        const overCapacityDates = capacities
            .filter(c => c.isOverCapacity())
            .map(c => c.date);

        this.logger.info(`Over capacity dates: ${overCapacityDates.length} days`);
        
        return overCapacityDates;
    }

    /**
     * 定員オーバーの日別定員情報を取得
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {Array<DailyCapacity>}
     */
    getOverCapacities(yearMonth) {
        const capacities = this.checkMonth(yearMonth);
        return DailyCapacity.filterOverCapacity(capacities);
    }

    /**
     * 月のサマリー情報を取得
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {object}
     */
    getSummary(yearMonth) {
        const capacities = this.checkMonth(yearMonth);
        
        // 前半通いの平均・最大
        const dayMorningCounts = capacities.map(c => c.dayCountMorning);
        const dayMorningAvg = dayMorningCounts.reduce((a, b) => a + b, 0) / dayMorningCounts.length;
        const dayMorningMax = Math.max(...dayMorningCounts);

        // 後半通いの平均・最大
        const dayAfternoonCounts = capacities.map(c => c.dayCountAfternoon);
        const dayAfternoonAvg = dayAfternoonCounts.reduce((a, b) => a + b, 0) / dayAfternoonCounts.length;
        const dayAfternoonMax = Math.max(...dayAfternoonCounts);

        // 通いの最大値（前半後半の最大）
        const dayMaxCounts = capacities.map(c => c.getMaxDayCount());
        const dayMaxAvg = dayMaxCounts.reduce((a, b) => a + b, 0) / dayMaxCounts.length;
        const dayMax = Math.max(...dayMaxCounts);

        // 泊りの平均・最大
        const stayCounts = capacities.map(c => c.stayCount);
        const stayAvg = stayCounts.reduce((a, b) => a + b, 0) / stayCounts.length;
        const stayMax = Math.max(...stayCounts);

        // 訪問の合計
        const visitTotal = capacities.reduce((sum, c) => sum + c.visitCount, 0);

        // 定員オーバー日数
        const overCapacityDays = capacities.filter(c => c.isOverCapacity()).length;

        // 各記号の日数
        const symbolCounts = {
            '◎': capacities.filter(c => c.getCapacitySymbol() === '◎').length,
            '○': capacities.filter(c => c.getCapacitySymbol() === '○').length,
            '△': capacities.filter(c => c.getCapacitySymbol() === '△').length,
            '×': capacities.filter(c => c.getCapacitySymbol() === '×').length
        };

        return {
            yearMonth: yearMonth,
            totalDays: capacities.length,
            day: {
                morningAvg: Math.round(dayMorningAvg * 10) / 10,
                morningMax: dayMorningMax,
                afternoonAvg: Math.round(dayAfternoonAvg * 10) / 10,
                afternoonMax: dayAfternoonMax,
                maxAvg: Math.round(dayMaxAvg * 10) / 10,
                max: dayMax,
                limit: AppConfig.CAPACITY.DAY_LIMIT
            },
            stay: {
                avg: Math.round(stayAvg * 10) / 10,
                max: stayMax,
                limit: AppConfig.CAPACITY.STAY_LIMIT
            },
            visit: {
                total: visitTotal,
                avg: Math.round((visitTotal / capacities.length) * 10) / 10
            },
            overCapacity: {
                days: overCapacityDays,
                rate: Math.round((overCapacityDays / capacities.length) * 100)
            },
            symbols: symbolCounts
        };
    }

    /**
     * 週末の定員状況を取得
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {Array<DailyCapacity>}
     */
    getWeekendCapacities(yearMonth) {
        const capacities = this.checkMonth(yearMonth);
        return DailyCapacity.filterWeekends(capacities);
    }

    /**
     * 特定の利用率以上の日を取得
     * @param {string} yearMonth - "YYYY-MM"形式
     * @param {number} threshold - 利用率の閾値（0-100）
     * @returns {Array<DailyCapacity>}
     */
    getHighUtilizationDays(yearMonth, threshold = 80) {
        const capacities = this.checkMonth(yearMonth);
        return capacities.filter(c => c.getMaxUtilizationRate() >= threshold);
    }

    /**
     * 日ごとの定員推移データを取得（グラフ用）
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {object}
     */
    getChartData(yearMonth) {
        const capacities = this.checkMonth(yearMonth);
        
        return {
            labels: capacities.map(c => c.date.getDate()),
            datasets: [
                {
                    label: '通い（前半）',
                    data: capacities.map(c => c.dayCountMorning)
                },
                {
                    label: '通い（後半）',
                    data: capacities.map(c => c.dayCountAfternoon)
                },
                {
                    label: '泊り',
                    data: capacities.map(c => c.stayCount)
                }
            ],
            limits: {
                day: AppConfig.CAPACITY.DAY_LIMIT,
                stay: AppConfig.CAPACITY.STAY_LIMIT
            }
        };
    }

    /**
     * 定員状況のテキストレポートを生成
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {string}
     */
    generateReport(yearMonth) {
        const summary = this.getSummary(yearMonth);
        const overCapacities = this.getOverCapacities(yearMonth);
        
        let report = `■ ${yearMonth} 定員状況レポート\n\n`;
        
        // サマリー
        report += `【概要】\n`;
        report += `総日数: ${summary.totalDays}日\n`;
        report += `定員オーバー: ${summary.overCapacity.days}日 (${summary.overCapacity.rate}%)\n\n`;
        
        // 通い
        report += `【通い】定員 ${summary.day.limit}人\n`;
        report += `  前半: 平均 ${summary.day.morningAvg}人, 最大 ${summary.day.morningMax}人\n`;
        report += `  後半: 平均 ${summary.day.afternoonAvg}人, 最大 ${summary.day.afternoonMax}人\n`;
        report += `  最大値: 平均 ${summary.day.maxAvg}人, 最大 ${summary.day.max}人\n\n`;
        
        // 泊り
        report += `【泊り】定員 ${summary.stay.limit}人\n`;
        report += `  平均: ${summary.stay.avg}人, 最大 ${summary.stay.max}人\n\n`;
        
        // 訪問
        report += `【訪問】\n`;
        report += `  合計: ${summary.visit.total}回, 1日平均: ${summary.visit.avg}回\n\n`;
        
        // 定員状況記号
        report += `【定員状況】\n`;
        report += `  ◎（良好）: ${summary.symbols['◎']}日\n`;
        report += `  ○（通常）: ${summary.symbols['○']}日\n`;
        report += `  △（注意）: ${summary.symbols['△']}日\n`;
        report += `  ×（超過）: ${summary.symbols['×']}日\n\n`;
        
        // 定員オーバー詳細
        if (overCapacities.length > 0) {
            report += `【定員オーバー詳細】\n`;
            overCapacities.forEach(c => {
                const dateStr = DateUtils.formatDate(c.date);
                const dayName = DateUtils.getDayName(c.date);
                report += `  ${dateStr}(${dayName}): ${c.getSummaryText()}\n`;
            });
        }
        
        return report;
    }

    /**
     * JSON形式に変換
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {object}
     */
    toJSON(yearMonth) {
        const capacities = this.checkMonth(yearMonth);
        
        return {
            yearMonth: yearMonth,
            capacities: capacities.map(c => c.toJSON()),
            summary: this.getSummary(yearMonth)
        };
    }
}

// グローバル変数として公開
window.ServiceCapacity = ServiceCapacity;
