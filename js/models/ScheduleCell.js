/**
 * ScheduleCellクラス（予定セル）
 * グリッドの各セルのデータを管理
 */
class ScheduleCell {
    /**
     * コンストラクタ
     * @param {object} data - セルデータ
     */
    constructor(data = {}) {
        this.userId = data.userId || '';
        this.date = data.date || '';  // "YYYY-MM-DD" または "YYYY-MM-prevMonth" / "YYYY-MM-nextMonth"
        this.cellType = data.cellType || 'dayStay';  // 'dayStay' | 'visit'
        this.inputValue = data.inputValue || '';  // "○", "◓", "◒", "入", "退", 数値
        this.note = data.note || '';
        
        // 計算結果フラグ
        this.actualFlags = data.actualFlags || {
            day: false,
            stay: false,
            visit: 0,
            halfDayType: 'full'  // 'full' | 'morning' | 'afternoon'
        };
        
        // 削除⇔復元機能
        this.deletedValue = data.deletedValue || null;
        this.deletedAt = data.deletedAt || null;
        
        this.logger = new Logger('ScheduleCell');
    }

    /**
     * セルが空かどうか
     * @returns {boolean}
     */
    isEmpty() {
        return !this.inputValue || this.inputValue === '';
    }

    /**
     * 入所判定（"入"）
     * @returns {boolean}
     */
    isStayStart() {
        return this.inputValue === AppConfig.SYMBOLS.CHECK_IN;
    }

    /**
     * 退所判定（"退"）
     * @returns {boolean}
     */
    isStayEnd() {
        return this.inputValue === AppConfig.SYMBOLS.CHECK_OUT;
    }

    /**
     * 終日通い判定（"○"）
     * @returns {boolean}
     */
    isFullDay() {
        return this.inputValue === AppConfig.SYMBOLS.FULL_DAY;
    }

    /**
     * 前半通い判定（"◓"）
     * @returns {boolean}
     */
    isMorning() {
        return this.inputValue === AppConfig.SYMBOLS.MORNING;
    }

    /**
     * 後半通い判定（"◒"）
     * @returns {boolean}
     */
    isAfternoon() {
        return this.inputValue === AppConfig.SYMBOLS.AFTERNOON;
    }

    /**
     * 前月特別セル判定
     * @returns {boolean}
     */
    isPrevMonthCell() {
        return this.date && this.date.endsWith('-prevMonth');
    }

    /**
     * 翌月特別セル判定
     * @returns {boolean}
     */
    isNextMonthCell() {
        return this.date && this.date.endsWith('-nextMonth');
    }

    /**
     * 特別セル判定
     * @returns {boolean}
     */
    isSpecialCell() {
        return this.isPrevMonthCell() || this.isNextMonthCell();
    }

    /**
     * 通い行のセルかどうか
     * @returns {boolean}
     */
    isDayStayCell() {
        return this.cellType === 'dayStay';
    }

    /**
     * 訪問行のセルかどうか
     * @returns {boolean}
     */
    isVisitCell() {
        return this.cellType === 'visit';
    }

    /**
     * 備考があるかどうか
     * @returns {boolean}
     */
    hasNote() {
        return this.note && this.note.length > 0;
    }

    /**
     * セル値を設定
     * @param {string} value - 設定する値
     * @returns {object} {valid: boolean, message: string}
     */
    setValue(value) {
        const validation = Validator.validateCellInput(value, this.cellType);
        
        if (!validation.valid) {
            return validation;
        }

        this.inputValue = value;
        this.calculateFlags();
        
        this.logger.debug(`Cell value set: ${this.date} ${this.cellType} = ${value}`);
        
        return { valid: true, message: '' };
    }

    /**
     * フラグを計算
     */
    calculateFlags() {
        if (this.cellType === 'dayStay') {
            // 通い・泊まり行
            if (this.isFullDay()) {
                this.actualFlags = {
                    day: true,
                    stay: false,
                    visit: 0,
                    halfDayType: 'full'
                };
            } else if (this.isMorning()) {
                this.actualFlags = {
                    day: true,
                    stay: false,
                    visit: 0,
                    halfDayType: 'morning'
                };
            } else if (this.isAfternoon()) {
                this.actualFlags = {
                    day: true,
                    stay: false,
                    visit: 0,
                    halfDayType: 'afternoon'
                };
            } else if (this.isStayStart() || this.isStayEnd()) {
                // 入所・退所は後でStayPeriod計算時にstayフラグを設定
                this.actualFlags = {
                    day: false,
                    stay: false,
                    visit: 0,
                    halfDayType: 'full'
                };
            } else {
                this.actualFlags = {
                    day: false,
                    stay: false,
                    visit: 0,
                    halfDayType: 'full'
                };
            }
        } else if (this.cellType === 'visit') {
            // 訪問行
            const visitCount = parseInt(this.inputValue) || 0;
            this.actualFlags = {
                day: false,
                stay: false,
                visit: visitCount,
                halfDayType: 'full'
            };
        }
    }

    /**
     * 定員カウントへの寄与を計算
     * @returns {object} {morning: number, afternoon: number, stay: boolean}
     */
    getDayCountContribution() {
        // 特別セルは定員カウントに含めない
        if (this.isSpecialCell()) {
            return { morning: 0, afternoon: 0, stay: false };
        }

        // 退所日は泊りカウントなし、通いは前半1+後半1
        if (this.isStayEnd()) {
            return { 
                morning: this.actualFlags.day ? 1 : 0, 
                afternoon: this.actualFlags.day ? 1 : 0, 
                stay: false 
            };
        }

        // 通いの前半後半判定
        if (this.isFullDay()) {
            return { 
                morning: 1, 
                afternoon: 1, 
                stay: this.actualFlags.stay 
            };
        } else if (this.isMorning()) {
            return { 
                morning: 1, 
                afternoon: 0, 
                stay: this.actualFlags.stay 
            };
        } else if (this.isAfternoon()) {
            return { 
                morning: 0, 
                afternoon: 1, 
                stay: this.actualFlags.stay 
            };
        }

        // 泊りのみ（通いなし）
        if (this.actualFlags.stay) {
            return { morning: 0, afternoon: 0, stay: true };
        }

        return { morning: 0, afternoon: 0, stay: false };
    }

    /**
     * セル値を削除（復元可能）
     */
    delete() {
        if (this.isEmpty()) {
            return;
        }

        this.deletedValue = this.inputValue;
        this.deletedAt = Date.now();
        this.inputValue = '';
        this.calculateFlags();
        
        this.logger.debug(`Cell deleted: ${this.date} ${this.cellType}`);
    }

    /**
     * セル値を復元
     * @returns {boolean} 復元に成功した場合true
     */
    restore() {
        if (!this.canRestore()) {
            return false;
        }

        this.inputValue = this.deletedValue;
        this.deletedValue = null;
        this.deletedAt = null;
        this.calculateFlags();
        
        this.logger.debug(`Cell restored: ${this.date} ${this.cellType}`);
        return true;
    }

    /**
     * 復元可能かどうか
     * @returns {boolean}
     */
    canRestore() {
        if (!this.deletedValue) {
            return false;
        }

        // タイムアウトチェック
        const timeout = AppConfig.STORAGE.RESTORE_TIMEOUT;
        if (timeout > 0 && Date.now() - this.deletedAt > timeout) {
            return false;
        }

        return true;
    }

    /**
     * JSON形式に変換
     * @returns {object}
     */
    toJSON() {
        return {
            userId: this.userId,
            date: this.date,
            cellType: this.cellType,
            inputValue: this.inputValue,
            note: this.note,
            actualFlags: this.actualFlags,
            deletedValue: this.deletedValue,
            deletedAt: this.deletedAt
        };
    }

    /**
     * JSONからScheduleCellインスタンスを作成
     * @param {object} json - JSONデータ
     * @returns {ScheduleCell}
     */
    static fromJSON(json) {
        return new ScheduleCell(json);
    }
}

// グローバル変数として公開
window.ScheduleCell = ScheduleCell;
