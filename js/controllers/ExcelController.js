/**
 * ExcelControllerクラス（Excel入出力コントローラー）
 * Excelファイルの入出力を調整
 * 実際のExcel処理はExcelServiceに委譲
 */
class ExcelController {
    /**
     * コンストラクタ
     * @param {ScheduleController} scheduleController - スケジュールコントローラー
     * @param {CapacityCheckController} capacityCheckController - 定員チェックコントローラー
     * @param {NoteController} noteController - 備考コントローラー
     */
    constructor(scheduleController, capacityCheckController, noteController) {
        this.scheduleController = scheduleController;
        this.capacityCheckController = capacityCheckController;
        this.noteController = noteController;
        this.eventEmitter = new EventEmitter();
        this.logger = new Logger('ExcelController');
        
        // ExcelServiceは後で実装予定
        this.excelService = null;
    }

    // ==================== 初期化 ====================

    /**
     * ExcelServiceを設定
     * @param {ExcelService} excelService - Excelサービス
     */
    setExcelService(excelService) {
        this.excelService = excelService;
        this.logger.info('ExcelService set');
    }

    /**
     * ExcelServiceが利用可能かチェック
     * @returns {boolean}
     */
    isExcelServiceAvailable() {
        return this.excelService !== null && typeof XLSX !== 'undefined';
    }

    // ==================== エクスポート ====================

    /**
     * 現在の月をExcelエクスポート
     * @param {object} options - オプション
     * @returns {Promise<void>}
     */
    async exportCurrentMonth(options = {}) {
        try {
            if (!this.isExcelServiceAvailable()) {
                throw new Error('ExcelService is not available');
            }
            
            const yearMonth = this.scheduleController.getCurrentYearMonth();
            return await this.exportMonth(yearMonth, options);
            
        } catch (error) {
            this.logger.error('Failed to export current month:', error);
            this.eventEmitter.emit('export:error', error);
            throw error;
        }
    }

    /**
     * 指定月をExcelエクスポート
     * @param {string} yearMonth - "YYYY-MM"形式
     * @param {object} options - オプション
     * @returns {Promise<void>}
     */
    async exportMonth(yearMonth, options = {}) {
        try {
            if (!this.isExcelServiceAvailable()) {
                throw new Error('ExcelService is not available');
            }
            
            this.logger.info(`Exporting month: ${yearMonth}`);
            this.eventEmitter.emit('export:start', yearMonth);
            
            // データを収集
            const data = this.collectExportData(yearMonth);
            
            // ExcelServiceでエクスポート
            await this.excelService.exportSchedule(data, options);
            
            this.logger.info(`Export completed: ${yearMonth}`);
            this.eventEmitter.emit('export:complete', yearMonth);
            
        } catch (error) {
            this.logger.error('Failed to export month:', error);
            this.eventEmitter.emit('export:error', error);
            throw error;
        }
    }

    /**
     * エクスポート用データを収集
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {object}
     */
    collectExportData(yearMonth) {
        // 利用者一覧
        const users = this.scheduleController.getSortedUsers();
        
        // スケジュールデータ
        const calendars = this.scheduleController.getAllCalendars();
        
        // 定員データ
        const capacities = this.capacityCheckController.checkMonth(yearMonth);
        
        // 備考データ
        const notes = this.noteController.getAllNotes();
        
        return {
            yearMonth,
            users,
            calendars,
            capacities,
            notes
        };
    }

    /**
     * 複数月をまとめてエクスポート
     * @param {Array<string>} yearMonths - "YYYY-MM"形式の配列
     * @param {object} options - オプション
     * @returns {Promise<void>}
     */
    async exportMultipleMonths(yearMonths, options = {}) {
        try {
            if (!this.isExcelServiceAvailable()) {
                throw new Error('ExcelService is not available');
            }
            
            this.logger.info(`Exporting multiple months: ${yearMonths.join(', ')}`);
            this.eventEmitter.emit('export:start', yearMonths);
            
            const allData = yearMonths.map(yearMonth => this.collectExportData(yearMonth));
            
            // ExcelServiceで一括エクスポート
            await this.excelService.exportMultipleSchedules(allData, options);
            
            this.logger.info('Multiple months export completed');
            this.eventEmitter.emit('export:complete', yearMonths);
            
        } catch (error) {
            this.logger.error('Failed to export multiple months:', error);
            this.eventEmitter.emit('export:error', error);
            throw error;
        }
    }

    // ==================== インポート ====================

    /**
     * Excelファイルをインポート
     * @param {File} file - Excelファイル
     * @param {object} options - オプション
     * @returns {Promise<object>}
     */
    async importFile(file, options = {}) {
        try {
            if (!this.isExcelServiceAvailable()) {
                throw new Error('ExcelService is not available');
            }
            
            this.logger.info(`Importing file: ${file.name}`);
            this.eventEmitter.emit('import:start', file.name);
            
            // ExcelServiceでパース
            const data = await this.excelService.importSchedule(file, options);
            
            // データを検証
            const validation = this.validateImportData(data);
            
            if (!validation.valid) {
                throw new Error(`Import validation failed: ${validation.errors.join(', ')}`);
            }
            
            this.logger.info('Import data validated');
            this.eventEmitter.emit('import:validated', data);
            
            return {
                data,
                validation
            };
            
        } catch (error) {
            this.logger.error('Failed to import file:', error);
            this.eventEmitter.emit('import:error', error);
            throw error;
        }
    }

    /**
     * インポートデータを検証
     * @param {object} data - インポートデータ
     * @returns {object} {valid: boolean, errors: Array<string>, warnings: Array<string>}
     */
    validateImportData(data) {
        const errors = [];
        const warnings = [];
        
        // 年月のチェック
        if (!data.yearMonth) {
            errors.push('yearMonth is required');
        }
        
        // 利用者データのチェック
        if (!Array.isArray(data.users) || data.users.length === 0) {
            errors.push('users array is required and must not be empty');
        }
        
        // スケジュールデータのチェック
        if (!data.calendars) {
            errors.push('calendars is required');
        }
        
        // 個別利用者の検証
        if (data.users) {
            data.users.forEach((user, index) => {
                if (!user.id) {
                    errors.push(`User ${index}: id is required`);
                }
                if (!user.name) {
                    errors.push(`User ${index}: name is required`);
                }
            });
        }
        
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * インポートデータを適用
     * @param {object} data - インポートデータ
     * @param {object} options - オプション
     * @returns {Promise<void>}
     */
    async applyImportData(data, options = {}) {
        try {
            const { yearMonth, users, calendars, notes } = data;
            const { merge = false } = options;
            
            this.logger.info(`Applying import data for ${yearMonth}`);
            
            // 利用者データを適用
            if (merge) {
                // マージモード: 既存利用者を保持
                for (const user of users) {
                    const existingUser = this.scheduleController.getUserById(user.id);
                    if (!existingUser) {
                        await this.scheduleController.addUser(user);
                    }
                }
            } else {
                // 上書きモード: 利用者を完全に置き換え
                await this.scheduleController.clearAllSchedules();
                for (const user of users) {
                    await this.scheduleController.addUser(user);
                }
            }
            
            // スケジュールデータを適用
            await this.scheduleController.loadSchedule(yearMonth);
            
            // カレンダーデータを復元
            if (calendars) {
                // ExcelServiceから復元されたカレンダーデータを設定
                // 実際の実装はExcelService実装後に詳細化
                this.logger.debug('Calendar data restoration is pending ExcelService implementation');
            }
            
            // 備考データを適用
            if (notes && notes.length > 0) {
                // 備考データの復元
                // 実際の実装はExcelService実装後に詳細化
                this.logger.debug('Note data restoration is pending ExcelService implementation');
            }
            
            this.logger.info('Import data applied successfully');
            this.eventEmitter.emit('import:complete', data);
            
        } catch (error) {
            this.logger.error('Failed to apply import data:', error);
            this.eventEmitter.emit('import:error', error);
            throw error;
        }
    }

    /**
     * インポート処理（ファイル選択から適用まで）
     * @param {File} file - Excelファイル
     * @param {object} options - オプション
     * @returns {Promise<void>}
     */
    async import(file, options = {}) {
        try {
            // ファイルをインポート
            const result = await this.importFile(file, options);
            
            // データを適用
            await this.applyImportData(result.data, options);
            
            this.logger.info('Import completed');
            
        } catch (error) {
            this.logger.error('Failed to import:', error);
            throw error;
        }
    }

    // ==================== テンプレート ====================

    /**
     * 空のテンプレートをエクスポート
     * @param {string} yearMonth - "YYYY-MM"形式
     * @param {object} options - オプション
     * @returns {Promise<void>}
     */
    async exportTemplate(yearMonth, options = {}) {
        try {
            if (!this.isExcelServiceAvailable()) {
                throw new Error('ExcelService is not available');
            }
            
            this.logger.info(`Exporting template for ${yearMonth}`);
            
            // 空のデータを作成
            const data = {
                yearMonth,
                users: [],
                calendars: new Map(),
                capacities: [],
                notes: []
            };
            
            await this.excelService.exportSchedule(data, {
                ...options,
                template: true
            });
            
            this.logger.info('Template export completed');
            
        } catch (error) {
            this.logger.error('Failed to export template:', error);
            throw error;
        }
    }

    // ==================== ファイル選択 ====================

    /**
     * ファイル選択ダイアログを表示（エクスポート用）
     * @param {object} options - オプション
     * @returns {Promise<void>}
     */
    async showExportDialog(options = {}) {
        try {
            const yearMonth = this.scheduleController.getCurrentYearMonth();
            
            // ファイル名を生成
            const fileName = options.fileName || `schedule_${yearMonth}.xlsx`;
            
            this.logger.debug(`Export dialog: ${fileName}`);
            
            await this.exportCurrentMonth({
                ...options,
                fileName
            });
            
        } catch (error) {
            this.logger.error('Failed to show export dialog:', error);
            throw error;
        }
    }

    /**
     * ファイル選択ダイアログを表示（インポート用）
     * @param {object} options - オプション
     * @returns {Promise<void>}
     */
    async showImportDialog(options = {}) {
        try {
            // file inputを作成
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx,.xls';
            
            // ファイル選択イベント
            input.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        await this.import(file, options);
                    } catch (error) {
                        this.logger.error('Import failed:', error);
                    }
                }
            });
            
            // ダイアログを表示
            input.click();
            
        } catch (error) {
            this.logger.error('Failed to show import dialog:', error);
            throw error;
        }
    }

    // ==================== ユーティリティ ====================

    /**
     * SheetJSライブラリが読み込まれているかチェック
     * @returns {boolean}
     */
    isSheetJSLoaded() {
        return typeof XLSX !== 'undefined';
    }

    /**
     * サポートされているファイル形式を取得
     * @returns {Array<string>}
     */
    getSupportedFormats() {
        return ['.xlsx', '.xls'];
    }

    /**
     * ファイルサイズの制限を取得（バイト）
     * @returns {number}
     */
    getMaxFileSize() {
        return 10 * 1024 * 1024; // 10MB
    }

    /**
     * ファイルサイズをチェック
     * @param {File} file - チェックするファイル
     * @returns {boolean}
     */
    isFileSizeValid(file) {
        return file.size <= this.getMaxFileSize();
    }

    /**
     * ファイル形式をチェック
     * @param {File} file - チェックするファイル
     * @returns {boolean}
     */
    isFileFormatValid(file) {
        const supportedFormats = this.getSupportedFormats();
        return supportedFormats.some(format => file.name.toLowerCase().endsWith(format));
    }

    /**
     * ファイルを検証
     * @param {File} file - 検証するファイル
     * @returns {object} {valid: boolean, errors: Array<string>}
     */
    validateFile(file) {
        const errors = [];
        
        if (!this.isFileFormatValid(file)) {
            errors.push(`Unsupported file format. Supported: ${this.getSupportedFormats().join(', ')}`);
        }
        
        if (!this.isFileSizeValid(file)) {
            errors.push(`File size exceeds limit: ${this.getMaxFileSize() / 1024 / 1024}MB`);
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
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
window.ExcelController = ExcelController;
