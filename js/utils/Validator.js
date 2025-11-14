/**
 * バリデーションユーティリティ
 * 入力値の妥当性検証を提供
 */
class Validator {
    /**
     * 必須チェック
     * @param {any} value - 検証値
     * @returns {boolean} 値が存在する場合true
     */
    static required(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return true;
    }

    /**
     * 数値チェック
     * @param {any} value - 検証値
     * @returns {boolean} 数値の場合true
     */
    static isNumber(value) {
        return !isNaN(value) && isFinite(value);
    }

    /**
     * 整数チェック
     * @param {any} value - 検証値
     * @returns {boolean} 整数の場合true
     */
    static isInteger(value) {
        return Number.isInteger(Number(value));
    }

    /**
     * 範囲チェック
     * @param {number} value - 検証値
     * @param {number} min - 最小値
     * @param {number} max - 最大値
     * @returns {boolean} 範囲内の場合true
     */
    static range(value, min, max) {
        const num = Number(value);
        return num >= min && num <= max;
    }

    /**
     * 文字数チェック
     * @param {string} value - 検証値
     * @param {number} min - 最小文字数
     * @param {number} max - 最大文字数
     * @returns {boolean} 文字数が範囲内の場合true
     */
    static length(value, min = 0, max = Infinity) {
        if (typeof value !== 'string') return false;
        const len = value.length;
        return len >= min && len <= max;
    }

    /**
     * 日付形式チェック（YYYY-MM-DD）
     * @param {string} value - 検証値
     * @returns {boolean} 正しい日付形式の場合true
     */
    static isDate(value) {
        if (typeof value !== 'string') return false;
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(value)) return false;
        
        const date = new Date(value);
        return date instanceof Date && !isNaN(date);
    }

    /**
     * 年月形式チェック（YYYY-MM）
     * @param {string} value - 検証値
     * @returns {boolean} 正しい年月形式の場合true
     */
    static isYearMonth(value) {
        if (typeof value !== 'string') return false;
        const regex = /^\d{4}-\d{2}$/;
        if (!regex.test(value)) return false;
        
        const parts = value.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        
        return year >= 1900 && year <= 2100 && month >= 1 && month <= 12;
    }

    /**
     * セル入力値の妥当性チェック
     * @param {string} value - セルの入力値
     * @param {string} cellType - セルタイプ（'dayStay' or 'visit'）
     * @returns {object} {valid: boolean, message: string}
     */
    static validateCellInput(value, cellType) {
        if (!value || value === '') {
            return { valid: true, message: '' };
        }

        if (cellType === 'dayStay') {
            // 通い・泊まり行の検証
            const validSymbols = [
                AppConfig.SYMBOLS.FULL_DAY,
                AppConfig.SYMBOLS.MORNING,
                AppConfig.SYMBOLS.AFTERNOON,
                AppConfig.SYMBOLS.CHECK_IN,
                AppConfig.SYMBOLS.CHECK_OUT
            ];
            
            if (validSymbols.includes(value)) {
                return { valid: true, message: '' };
            } else {
                return { 
                    valid: false, 
                    message: `有効な記号を入力してください（${validSymbols.join('、')}）` 
                };
            }
        } else if (cellType === 'visit') {
            // 訪問行の検証
            if (!this.isInteger(value)) {
                return { valid: false, message: '訪問回数は整数で入力してください' };
            }
            
            const num = parseInt(value);
            if (num < 0 || num > 10) {
                return { valid: false, message: '訪問回数は0〜10の範囲で入力してください' };
            }
            
            return { valid: true, message: '' };
        }

        return { valid: false, message: '不正な入力です' };
    }

    /**
     * ユーザー名の妥当性チェック
     * @param {string} name - ユーザー名
     * @returns {object} {valid: boolean, message: string}
     */
    static validateUserName(name) {
        if (!this.required(name)) {
            return { valid: false, message: '氏名は必須です' };
        }
        
        if (!this.length(name, 1, 50)) {
            return { valid: false, message: '氏名は1〜50文字で入力してください' };
        }

        // 使用禁止文字のチェック
        const invalidChars = /[<>\"\'&]/;
        if (invalidChars.test(name)) {
            return { valid: false, message: '使用できない文字が含まれています' };
        }

        return { valid: true, message: '' };
    }

    /**
     * 備考の妥当性チェック
     * @param {string} note - 備考
     * @returns {object} {valid: boolean, message: string}
     */
    static validateNote(note) {
        if (!note) {
            return { valid: true, message: '' };
        }

        if (!this.length(note, 0, 1000)) {
            return { valid: false, message: '備考は1000文字以内で入力してください' };
        }

        return { valid: true, message: '' };
    }
}

// グローバル変数として公開
window.Validator = Validator;
