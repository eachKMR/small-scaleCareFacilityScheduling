/**
 * ScheduleCalendarクラス（月間予定）
 * 1人の利用者の1ヶ月分の予定を管理
 */
class ScheduleCalendar {
    /**
     * コンストラクタ
     * @param {string} userId - 利用者ID
     * @param {string} yearMonth - "YYYY-MM"形式
     */
    constructor(userId, yearMonth) {
        this.userId = userId;
        this.yearMonth = yearMonth;
        this.cells = new Map();  // キー: "date_cellType", 値: ScheduleCell
        this.prevMonthCell = null;  // 左特別セル（通泊）
        this.nextMonthCell = null;  // 右特別セル（通泊）
        this.prevMonthVisitCell = null;  // 左特別セル（訪問）
        this.nextMonthVisitCell = null;  // 右特別セル（訪問）
        this.stayPeriods = [];  // StayPeriod[]
        
        this.logger = new Logger('ScheduleCalendar');
        
        this._initializeCells();
    }

    /**
     * セルを初期化
     * @private
     */
    _initializeCells() {
        const {year, month} = DateUtils.parseYearMonth(this.yearMonth);
        const daysInMonth = DateUtils.getDaysInMonth(year, month);

        // 特別セルの初期化
        this.prevMonthCell = new ScheduleCell({
            userId: this.userId,
            date: `${this.yearMonth}-prevMonth`,
            cellType: 'dayStay'
        });

        this.nextMonthCell = new ScheduleCell({
            userId: this.userId,
            date: `${this.yearMonth}-nextMonth`,
            cellType: 'dayStay'
        });

        this.prevMonthVisitCell = new ScheduleCell({
            userId: this.userId,
            date: `${this.yearMonth}-prevMonth`,
            cellType: 'visit'
        });

        this.nextMonthVisitCell = new ScheduleCell({
            userId: this.userId,
            date: `${this.yearMonth}-nextMonth`,
            cellType: 'visit'
        });

        // 通常セルの初期化（1〜31日、通泊行+訪問行）
        for (let day = 1; day <= 31; day++) {
            const dateStr = `${this.yearMonth}-${String(day).padStart(2, '0')}`;
            
            // 通泊行
            const dayStayCell = new ScheduleCell({
                userId: this.userId,
                date: dateStr,
                cellType: 'dayStay'
            });
            this.cells.set(`${dateStr}_dayStay`, dayStayCell);

            // 訪問行
            const visitCell = new ScheduleCell({
                userId: this.userId,
                date: dateStr,
                cellType: 'visit'
            });
            this.cells.set(`${dateStr}_visit`, visitCell);
        }
    }

    /**
     * セルを取得
     * @param {string} date - "YYYY-MM-DD"形式
     * @param {string} cellType - 'dayStay' | 'visit'
     * @returns {ScheduleCell|null}
     */
    getCell(date, cellType = 'dayStay') {
        // 特別セルの場合
        if (date.endsWith('-prevMonth')) {
            return cellType === 'dayStay' ? this.prevMonthCell : this.prevMonthVisitCell;
        }
        if (date.endsWith('-nextMonth')) {
            return cellType === 'dayStay' ? this.nextMonthCell : this.nextMonthVisitCell;
        }

        // 通常セル
        const key = `${date}_${cellType}`;
        return this.cells.get(key) || null;
    }

    /**
     * セル値を設定
     * @param {string} date - "YYYY-MM-DD"形式
     * @param {string} cellType - 'dayStay' | 'visit'
     * @param {string} value - セル値
     * @returns {object} {valid: boolean, message: string}
     */
    setCell(date, cellType, value) {
        const cell = this.getCell(date, cellType);
        if (!cell) {
            return { valid: false, message: '無効なセルです' };
        }

        const result = cell.setValue(value);
        if (result.valid) {
            // 宿泊期間を再計算
            this.calculateStayPeriods();
            this.calculateAllFlags();
        }

        return result;
    }

    /**
     * 前月特別セルを取得
     * @param {string} cellType - 'dayStay' | 'visit'
     * @returns {ScheduleCell}
     */
    getPrevMonthCell(cellType = 'dayStay') {
        return cellType === 'dayStay' ? this.prevMonthCell : this.prevMonthVisitCell;
    }

    /**
     * 翌月特別セルを取得
     * @param {string} cellType - 'dayStay' | 'visit'
     * @returns {ScheduleCell}
     */
    getNextMonthCell(cellType = 'dayStay') {
        return cellType === 'dayStay' ? this.nextMonthCell : this.nextMonthVisitCell;
    }

    /**
     * 宿泊期間を計算
     */
    calculateStayPeriods() {
        this.stayPeriods = [];

        const {year, month} = DateUtils.parseYearMonth(this.yearMonth);
        const daysInMonth = DateUtils.getDaysInMonth(year, month);

        // 月内の宿泊期間を計算
        let stayStartDate = null;

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.yearMonth}-${String(day).padStart(2, '0')}`;
            const cell = this.getCell(dateStr, 'dayStay');

            if (!cell) continue;

            if (cell.isStayStart()) {
                // 入所
                stayStartDate = DateUtils.parseDate(dateStr);
            } else if (cell.isStayEnd() && stayStartDate) {
                // 退所
                const stayEndDate = DateUtils.parseDate(dateStr);
                this.stayPeriods.push(new StayPeriod({
                    startDate: stayStartDate,
                    endDate: stayEndDate,
                    userId: this.userId
                }));
                stayStartDate = null;
            }
        }

        // 月またぎ宿泊の計算
        const crossMonthPeriods = this.calculateCrossMonthStay();
        this.stayPeriods.push(...crossMonthPeriods);

        this.logger.debug(`Stay periods calculated: ${this.stayPeriods.length} periods`);
    }

    /**
     * 月またぎ宿泊を計算
     * @returns {Array<StayPeriod>}
     */
    calculateCrossMonthStay() {
        const periods = [];
        const {year, month} = DateUtils.parseYearMonth(this.yearMonth);

        // 前月から継続する宿泊
        if (this.prevMonthCell && !this.prevMonthCell.isEmpty()) {
            // 前月の入所日を取得（特別セルの値から）
            // 例: "11/28入" → "2025-11-28"
            const prevMonthDate = this._parseSpecialCellDate(this.prevMonthCell.inputValue, 'prev');
            
            if (prevMonthDate) {
                // 当月の退所日を探す
                const daysInMonth = DateUtils.getDaysInMonth(year, month);
                for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${this.yearMonth}-${String(day).padStart(2, '0')}`;
                    const cell = this.getCell(dateStr, 'dayStay');
                    
                    if (cell && cell.isStayEnd()) {
                        periods.push(new StayPeriod({
                            startDate: prevMonthDate,
                            endDate: DateUtils.parseDate(dateStr),
                            userId: this.userId
                        }));
                        break;
                    }
                }
            }
        }

        // 翌月へ継続する宿泊
        if (this.nextMonthCell && !this.nextMonthCell.isEmpty()) {
            // 翌月の退所日を取得（特別セルの値から）
            // 例: "1/3退" → "2026-01-03"
            const nextMonthDate = this._parseSpecialCellDate(this.nextMonthCell.inputValue, 'next');
            
            if (nextMonthDate) {
                // 当月の入所日を探す
                const daysInMonth = DateUtils.getDaysInMonth(year, month);
                for (let day = daysInMonth; day >= 1; day--) {
                    const dateStr = `${this.yearMonth}-${String(day).padStart(2, '0')}`;
                    const cell = this.getCell(dateStr, 'dayStay');
                    
                    if (cell && cell.isStayStart()) {
                        periods.push(new StayPeriod({
                            startDate: DateUtils.parseDate(dateStr),
                            endDate: nextMonthDate,
                            userId: this.userId
                        }));
                        break;
                    }
                }
            }
        }

        return periods;
    }

    /**
     * 特別セルの日付を解析
     * @param {string} value - 特別セルの値（例: "11/28入", "1/3退"）
     * @param {string} direction - 'prev' | 'next'
     * @returns {Date|null}
     * @private
     */
    _parseSpecialCellDate(value, direction) {
        if (!value) return null;

        // "M/D入" または "M/D退" の形式を想定
        const match = value.match(/(\d+)\/(\d+)/);
        if (!match) return null;

        const {year, month} = DateUtils.parseYearMonth(this.yearMonth);
        const targetMonth = direction === 'prev' ? month - 1 : month + 1;
        const targetYear = targetMonth < 1 ? year - 1 : targetMonth > 12 ? year + 1 : year;
        const normalizedMonth = targetMonth < 1 ? 12 : targetMonth > 12 ? 1 : targetMonth;

        const day = parseInt(match[2]);
        return new Date(targetYear, normalizedMonth - 1, day);
    }

    /**
     * 全セルのフラグを再計算
     */
    calculateAllFlags() {
        // 各セルのstayフラグを宿泊期間に基づいて更新
        this.stayPeriods.forEach(period => {
            const dates = period.getDatesInMonth(this.yearMonth);
            
            dates.forEach(date => {
                const dateStr = DateUtils.formatDate(date);
                const cell = this.getCell(dateStr, 'dayStay');
                
                if (cell && !cell.isEmpty()) {
                    // 退所日は泊りフラグをfalseに
                    if (cell.isStayEnd()) {
                        cell.actualFlags.stay = false;
                        // 退所日は通いとしてカウント
                        cell.actualFlags.day = true;
                    } else {
                        cell.actualFlags.stay = true;
                    }
                }
            });
        });
    }

    /**
     * 月の日数を取得
     * @returns {number}
     */
    getDaysInMonth() {
        const {year, month} = DateUtils.parseYearMonth(this.yearMonth);
        return DateUtils.getDaysInMonth(year, month);
    }

    /**
     * 全セルをクリア
     */
    clear() {
        this.cells.forEach(cell => {
            cell.inputValue = '';
            cell.calculateFlags();
        });
        
        if (this.prevMonthCell) {
            this.prevMonthCell.inputValue = '';
            this.prevMonthCell.calculateFlags();
        }
        
        if (this.nextMonthCell) {
            this.nextMonthCell.inputValue = '';
            this.nextMonthCell.calculateFlags();
        }

        if (this.prevMonthVisitCell) {
            this.prevMonthVisitCell.inputValue = '';
            this.prevMonthVisitCell.calculateFlags();
        }

        if (this.nextMonthVisitCell) {
            this.nextMonthVisitCell.inputValue = '';
            this.nextMonthVisitCell.calculateFlags();
        }

        this.stayPeriods = [];
        
        this.logger.info(`Calendar cleared: ${this.userId} ${this.yearMonth}`);
    }

    /**
     * JSON形式に変換
     * @returns {object}
     */
    toJSON() {
        const cellsObj = {};
        
        // 通常セル
        this.cells.forEach((cell, key) => {
            if (!cell.isEmpty() || cell.hasNote()) {
                cellsObj[key] = cell.toJSON();
            }
        });

        // 特別セル
        if (this.prevMonthCell && (!this.prevMonthCell.isEmpty() || this.prevMonthCell.hasNote())) {
            cellsObj[`${this.yearMonth}-prevMonth_dayStay`] = this.prevMonthCell.toJSON();
        }
        if (this.nextMonthCell && (!this.nextMonthCell.isEmpty() || this.nextMonthCell.hasNote())) {
            cellsObj[`${this.yearMonth}-nextMonth_dayStay`] = this.nextMonthCell.toJSON();
        }
        if (this.prevMonthVisitCell && (!this.prevMonthVisitCell.isEmpty() || this.prevMonthVisitCell.hasNote())) {
            cellsObj[`${this.yearMonth}-prevMonth_visit`] = this.prevMonthVisitCell.toJSON();
        }
        if (this.nextMonthVisitCell && (!this.nextMonthVisitCell.isEmpty() || this.nextMonthVisitCell.hasNote())) {
            cellsObj[`${this.yearMonth}-nextMonth_visit`] = this.nextMonthVisitCell.toJSON();
        }

        return {
            userId: this.userId,
            yearMonth: this.yearMonth,
            cells: cellsObj,
            stayPeriods: this.stayPeriods.map(p => p.toJSON())
        };
    }

    /**
     * JSONからScheduleCalendarインスタンスを作成
     * @param {object} json - JSONデータ
     * @returns {ScheduleCalendar}
     */
    static fromJSON(json) {
        const calendar = new ScheduleCalendar(json.userId, json.yearMonth);
        
        // セルデータを復元
        if (json.cells) {
            Object.entries(json.cells).forEach(([key, cellData]) => {
                const cell = ScheduleCell.fromJSON(cellData);
                
                // 特別セルの判定
                if (key.includes('-prevMonth_dayStay')) {
                    calendar.prevMonthCell = cell;
                } else if (key.includes('-nextMonth_dayStay')) {
                    calendar.nextMonthCell = cell;
                } else if (key.includes('-prevMonth_visit')) {
                    calendar.prevMonthVisitCell = cell;
                } else if (key.includes('-nextMonth_visit')) {
                    calendar.nextMonthVisitCell = cell;
                } else {
                    calendar.cells.set(key, cell);
                }
            });
        }

        // 宿泊期間を復元
        if (json.stayPeriods) {
            calendar.stayPeriods = StayPeriod.fromJSONArray(json.stayPeriods);
        }

        return calendar;
    }
}

// グローバル変数として公開
window.ScheduleCalendar = ScheduleCalendar;
