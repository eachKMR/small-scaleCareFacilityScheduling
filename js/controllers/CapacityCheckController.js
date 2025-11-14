/**
 * CapacityCheckControllerクラス（定員チェックコントローラー）
 * 定員状況の確認と管理を担当
 */
class CapacityCheckController {
    /**
     * コンストラクタ
     * @param {ScheduleController} scheduleController - スケジュールコントローラー
     */
    constructor(scheduleController) {
        this.scheduleController = scheduleController;
        this.serviceCapacity = new ServiceCapacity();
        this.eventEmitter = new EventEmitter();
        this.logger = new Logger('CapacityCheckController');
        
        // スケジュール更新時に定員を再計算
        this.scheduleController.on('cell:updated', () => this.updateCapacity());
        this.scheduleController.on('schedule:loaded', () => this.updateCapacity());
    }

    // ==================== 定員チェック ====================

    /**
     * 定員状況を更新
     */
    updateCapacity() {
        try {
            const calendars = Array.from(this.scheduleController.getAllCalendars().values());
            this.serviceCapacity.setCalendars(calendars);
            
            this.logger.debug('Capacity updated');
            this.eventEmitter.emit('capacity:updated');
            
        } catch (error) {
            this.logger.error('Failed to update capacity:', error);
            this.eventEmitter.emit('capacity:error', error);
        }
    }

    /**
     * 指定日の定員状況をチェック
     * @param {string} date - "YYYY-MM-DD"形式
     * @returns {DailyCapacity}
     */
    checkDate(date) {
        try {
            return this.serviceCapacity.checkDate(date);
        } catch (error) {
            this.logger.error(`Failed to check date ${date}:`, error);
            return new DailyCapacity(date);
        }
    }

    /**
     * 月全体の定員状況をチェック
     * @param {string} yearMonth - "YYYY-MM"形式（省略時は現在月）
     * @returns {Array<DailyCapacity>}
     */
    checkMonth(yearMonth = null) {
        try {
            const targetMonth = yearMonth || this.scheduleController.getCurrentYearMonth();
            return this.serviceCapacity.checkMonth(targetMonth);
        } catch (error) {
            this.logger.error(`Failed to check month ${yearMonth}:`, error);
            return [];
        }
    }

    /**
     * 定員オーバーの日付を取得
     * @param {string} yearMonth - "YYYY-MM"形式（省略時は現在月）
     * @returns {Array<Date>}
     */
    getOverCapacityDates(yearMonth = null) {
        try {
            const targetMonth = yearMonth || this.scheduleController.getCurrentYearMonth();
            return this.serviceCapacity.getOverCapacityDates(targetMonth);
        } catch (error) {
            this.logger.error('Failed to get over capacity dates:', error);
            return [];
        }
    }

    /**
     * 定員オーバーの日別定員情報を取得
     * @param {string} yearMonth - "YYYY-MM"形式（省略時は現在月）
     * @returns {Array<DailyCapacity>}
     */
    getOverCapacities(yearMonth = null) {
        try {
            const targetMonth = yearMonth || this.scheduleController.getCurrentYearMonth();
            return this.serviceCapacity.getOverCapacities(targetMonth);
        } catch (error) {
            this.logger.error('Failed to get over capacities:', error);
            return [];
        }
    }

    /**
     * 定員オーバーかどうか
     * @param {string} yearMonth - "YYYY-MM"形式（省略時は現在月）
     * @returns {boolean}
     */
    hasOverCapacity(yearMonth = null) {
        const overCapacities = this.getOverCapacities(yearMonth);
        return overCapacities.length > 0;
    }

    // ==================== サマリー情報 ====================

    /**
     * 月のサマリー情報を取得
     * @param {string} yearMonth - "YYYY-MM"形式（省略時は現在月）
     * @returns {object}
     */
    getSummary(yearMonth = null) {
        try {
            const targetMonth = yearMonth || this.scheduleController.getCurrentYearMonth();
            return this.serviceCapacity.getSummary(targetMonth);
        } catch (error) {
            this.logger.error('Failed to get summary:', error);
            return null;
        }
    }

    /**
     * 週末の定員状況を取得
     * @param {string} yearMonth - "YYYY-MM"形式（省略時は現在月）
     * @returns {Array<DailyCapacity>}
     */
    getWeekendCapacities(yearMonth = null) {
        try {
            const targetMonth = yearMonth || this.scheduleController.getCurrentYearMonth();
            return this.serviceCapacity.getWeekendCapacities(targetMonth);
        } catch (error) {
            this.logger.error('Failed to get weekend capacities:', error);
            return [];
        }
    }

    /**
     * 高利用率の日を取得
     * @param {string} yearMonth - "YYYY-MM"形式（省略時は現在月）
     * @param {number} threshold - 利用率の閾値（0-100）
     * @returns {Array<DailyCapacity>}
     */
    getHighUtilizationDays(yearMonth = null, threshold = 80) {
        try {
            const targetMonth = yearMonth || this.scheduleController.getCurrentYearMonth();
            return this.serviceCapacity.getHighUtilizationDays(targetMonth, threshold);
        } catch (error) {
            this.logger.error('Failed to get high utilization days:', error);
            return [];
        }
    }

    // ==================== グラフ・レポート ====================

    /**
     * グラフ用のデータを取得
     * @param {string} yearMonth - "YYYY-MM"形式（省略時は現在月）
     * @returns {object}
     */
    getChartData(yearMonth = null) {
        try {
            const targetMonth = yearMonth || this.scheduleController.getCurrentYearMonth();
            return this.serviceCapacity.getChartData(targetMonth);
        } catch (error) {
            this.logger.error('Failed to get chart data:', error);
            return null;
        }
    }

    /**
     * テキストレポートを生成
     * @param {string} yearMonth - "YYYY-MM"形式（省略時は現在月）
     * @returns {string}
     */
    generateReport(yearMonth = null) {
        try {
            const targetMonth = yearMonth || this.scheduleController.getCurrentYearMonth();
            return this.serviceCapacity.generateReport(targetMonth);
        } catch (error) {
            this.logger.error('Failed to generate report:', error);
            return '';
        }
    }

    /**
     * レポートをコンソールに出力
     * @param {string} yearMonth - "YYYY-MM"形式（省略時は現在月）
     */
    printReport(yearMonth = null) {
        const report = this.generateReport(yearMonth);
        console.log(report);
    }

    // ==================== 定員状況の判定 ====================

    /**
     * 指定日が受け入れ可能かチェック
     * @param {string} date - "YYYY-MM-DD"形式
     * @param {string} serviceType - 'day' | 'stay'
     * @returns {boolean}
     */
    canAccept(date, serviceType = 'day') {
        try {
            const capacity = this.checkDate(date);
            
            if (serviceType === 'day') {
                return !capacity.isDayFull();
            } else if (serviceType === 'stay') {
                return !capacity.isStayFull();
            }
            
            return false;
            
        } catch (error) {
            this.logger.error('Failed to check acceptance:', error);
            return false;
        }
    }

    /**
     * 指定日の空き人数を取得
     * @param {string} date - "YYYY-MM-DD"形式
     * @param {string} serviceType - 'day' | 'stay'
     * @returns {number}
     */
    getAvailability(date, serviceType = 'day') {
        try {
            const capacity = this.checkDate(date);
            
            if (serviceType === 'day') {
                return capacity.getDayAvailability();
            } else if (serviceType === 'stay') {
                return capacity.getStayAvailability();
            }
            
            return 0;
            
        } catch (error) {
            this.logger.error('Failed to get availability:', error);
            return 0;
        }
    }

    /**
     * 定員状況の記号を取得
     * @param {string} date - "YYYY-MM-DD"形式
     * @returns {string} '◎' | '○' | '△' | '×'
     */
    getCapacitySymbol(date) {
        try {
            const capacity = this.checkDate(date);
            return capacity.getCapacitySymbol();
        } catch (error) {
            this.logger.error('Failed to get capacity symbol:', error);
            return '×';
        }
    }

    /**
     * 定員状況の説明を取得
     * @param {string} date - "YYYY-MM-DD"形式
     * @returns {string}
     */
    getCapacityDescription(date) {
        try {
            const capacity = this.checkDate(date);
            return capacity.getCapacityDescription();
        } catch (error) {
            this.logger.error('Failed to get capacity description:', error);
            return '';
        }
    }

    /**
     * ツールチップ用データを取得
     * @param {string} date - "YYYY-MM-DD"形式
     * @returns {object}
     */
    getTooltipData(date) {
        try {
            const capacity = this.checkDate(date);
            return capacity.getTooltipData();
        } catch (error) {
            this.logger.error('Failed to get tooltip data:', error);
            return null;
        }
    }

    // ==================== 月間の集計 ====================

    /**
     * 月間の平均利用率を取得
     * @param {string} yearMonth - "YYYY-MM"形式（省略時は現在月）
     * @returns {object} {day: number, stay: number}
     */
    getAverageUtilization(yearMonth = null) {
        try {
            const summary = this.getSummary(yearMonth);
            if (!summary) {
                return { day: 0, stay: 0 };
            }
            
            return {
                day: summary.day.maxAvg,
                stay: summary.stay.avg
            };
            
        } catch (error) {
            this.logger.error('Failed to get average utilization:', error);
            return { day: 0, stay: 0 };
        }
    }

    /**
     * 月間の最大利用人数を取得
     * @param {string} yearMonth - "YYYY-MM"形式（省略時は現在月）
     * @returns {object} {day: number, stay: number}
     */
    getMaxUtilization(yearMonth = null) {
        try {
            const summary = this.getSummary(yearMonth);
            if (!summary) {
                return { day: 0, stay: 0 };
            }
            
            return {
                day: summary.day.max,
                stay: summary.stay.max
            };
            
        } catch (error) {
            this.logger.error('Failed to get max utilization:', error);
            return { day: 0, stay: 0 };
        }
    }

    /**
     * 定員状況の分布を取得
     * @param {string} yearMonth - "YYYY-MM"形式（省略時は現在月）
     * @returns {object} {◎: number, ○: number, △: number, ×: number}
     */
    getSymbolDistribution(yearMonth = null) {
        try {
            const summary = this.getSummary(yearMonth);
            if (!summary) {
                return { '◎': 0, '○': 0, '△': 0, '×': 0 };
            }
            
            return summary.symbols;
            
        } catch (error) {
            this.logger.error('Failed to get symbol distribution:', error);
            return { '◎': 0, '○': 0, '△': 0, '×': 0 };
        }
    }

    // ==================== イベント管理 ====================

    /**
     * イベントリスナーを登録
     * @param {string} eventName - イベント名
     * @param {Function} callback - コールバック関数
     * @returns {Function} 登録解除関数
     */
    on(eventName, callback) {
        return this.eventEmitter.on(eventName, callback);
    }

    /**
     * イベントリスナーを解除
     * @param {string} eventName - イベント名
     * @param {Function} callback - コールバック関数
     */
    off(eventName, callback) {
        this.eventEmitter.off(eventName, callback);
    }
}

// グローバル変数として公開
window.CapacityCheckController = CapacityCheckController;
