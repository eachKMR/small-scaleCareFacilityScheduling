/**
 * ScheduleControllerクラス（予定管理コントローラー）
 * 月間予定の管理とビジネスロジックを担当
 */
class ScheduleController {
    /**
     * コンストラクタ
     * @param {StorageService} storageService - ストレージサービス
     */
    constructor(storageService) {
        this.storageService = storageService;
        this.currentYearMonth = AppConfig.DEFAULTS.YEAR_MONTH;
        this.users = [];
        this.calendars = new Map();  // Map<userId, ScheduleCalendar>
        this.eventEmitter = new EventEmitter();
        this.logger = new Logger('ScheduleController');
    }

    // ==================== 初期化 ====================

    /**
     * コントローラーを初期化
     * @returns {Promise<boolean>}
     */
    async initialize() {
        try {
            this.logger.info('Initializing ScheduleController');
            
            // 利用者マスタを読み込み
            await this.loadUsers();
            
            // 現在月のスケジュールを読み込み
            await this.loadSchedule(this.currentYearMonth);
            
            this.logger.info('ScheduleController initialized successfully');
            return true;
            
        } catch (error) {
            this.logger.error('Failed to initialize ScheduleController:', error);
            return false;
        }
    }

    // ==================== 利用者管理 ====================

    /**
     * 利用者マスタを読み込み
     * @returns {Promise<boolean>}
     */
    async loadUsers() {
        try {
            this.users = this.storageService.loadUsers();
            
            if (this.users.length === 0) {
                this.logger.info('No users found, showing empty message');
                this.eventEmitter.emit('users:empty');
            } else {
                this.logger.info(`Loaded ${this.users.length} users`);
                this.eventEmitter.emit('users:loaded', this.users);
            }
            
            return true;
            
        } catch (error) {
            this.logger.error('Failed to load users:', error);
            this.eventEmitter.emit('users:error', error);
            return false;
        }
    }

    /**
     * 利用者マスタを保存
     * @returns {Promise<boolean>}
     */
    async saveUsers() {
        try {
            const success = this.storageService.saveUsers(this.users);
            
            if (success) {
                this.logger.info(`Saved ${this.users.length} users`);
                this.eventEmitter.emit('users:saved', this.users);
            }
            
            return success;
            
        } catch (error) {
            this.logger.error('Failed to save users:', error);
            this.eventEmitter.emit('users:error', error);
            return false;
        }
    }

    /**
     * 利用者を追加
     * @param {User} user - 追加する利用者
     * @returns {Promise<boolean>}
     */
    async addUser(user) {
        try {
            // バリデーション
            const validation = user.validate();
            if (!validation.valid) {
                this.logger.warn('User validation failed:', validation.errors);
                this.eventEmitter.emit('user:validation-error', validation.errors);
                return false;
            }

            // sortIdを設定
            if (user.sortId === 0) {
                const maxSortId = this.users.reduce((max, u) => Math.max(max, u.sortId), -1);
                user.sortId = maxSortId + 1;
            }

            this.users.push(user);
            
            // カレンダーを作成
            this.calendars.set(user.id, new ScheduleCalendar(user.id, this.currentYearMonth));
            
            // 保存
            await this.saveUsers();
            await this.saveSchedule();
            
            this.logger.info(`User added: ${user.id} (${user.name})`);
            this.eventEmitter.emit('user:added', user);
            
            return true;
            
        } catch (error) {
            this.logger.error('Failed to add user:', error);
            this.eventEmitter.emit('user:error', error);
            return false;
        }
    }

    /**
     * 利用者を削除（論理削除）
     * @param {string} userId - 利用者ID
     * @returns {Promise<boolean>}
     */
    async deleteUser(userId) {
        try {
            const user = this.getUserById(userId);
            if (!user) {
                this.logger.warn(`User not found: ${userId}`);
                return false;
            }

            user.delete();
            await this.saveUsers();
            
            this.logger.info(`User deleted: ${userId} (${user.name})`);
            this.eventEmitter.emit('user:deleted', user);
            
            return true;
            
        } catch (error) {
            this.logger.error('Failed to delete user:', error);
            this.eventEmitter.emit('user:error', error);
            return false;
        }
    }

    /**
     * 利用者を復元
     * @param {string} userId - 利用者ID
     * @returns {Promise<boolean>}
     */
    async restoreUser(userId) {
        try {
            const user = this.getUserById(userId);
            if (!user) {
                this.logger.warn(`User not found: ${userId}`);
                return false;
            }

            user.restore();
            await this.saveUsers();
            
            this.logger.info(`User restored: ${userId} (${user.name})`);
            this.eventEmitter.emit('user:restored', user);
            
            return true;
            
        } catch (error) {
            this.logger.error('Failed to restore user:', error);
            this.eventEmitter.emit('user:error', error);
            return false;
        }
    }

    /**
     * 利用者を取得
     * @param {string} userId - 利用者ID
     * @returns {User|null}
     */
    getUserById(userId) {
        return User.findById(this.users, userId);
    }

    /**
     * 有効な利用者のみを取得
     * @returns {Array<User>}
     */
    getActiveUsers() {
        return User.filterActive(this.users);
    }

    /**
     * 利用者をソート順で取得
     * @returns {Array<User>}
     */
    getSortedUsers() {
        return User.sortBySortId(this.users);
    }

    // ==================== スケジュール管理 ====================

    /**
     * 月間スケジュールを読み込み
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {Promise<boolean>}
     */
    async loadSchedule(yearMonth) {
        try {
            this.currentYearMonth = yearMonth;
            this.calendars = this.storageService.loadSchedule(yearMonth, this.users);
            
            this.logger.info(`Loaded schedule for ${yearMonth}, ${this.calendars.size} calendars`);
            this.eventEmitter.emit('schedule:loaded', { yearMonth, calendars: this.calendars });
            
            return true;
            
        } catch (error) {
            this.logger.error(`Failed to load schedule for ${yearMonth}:`, error);
            this.eventEmitter.emit('schedule:error', error);
            return false;
        }
    }

    /**
     * 月間スケジュールを保存
     * @returns {Promise<boolean>}
     */
    async saveSchedule() {
        try {
            const success = this.storageService.saveSchedule(this.currentYearMonth, this.calendars);
            
            if (success) {
                this.logger.info(`Saved schedule for ${this.currentYearMonth}`);
                this.eventEmitter.emit('schedule:saved', this.currentYearMonth);
            }
            
            return success;
            
        } catch (error) {
            this.logger.error('Failed to save schedule:', error);
            this.eventEmitter.emit('schedule:error', error);
            return false;
        }
    }

    /**
     * 月を変更
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {Promise<boolean>}
     */
    async changeMonth(yearMonth) {
        try {
            // 現在のスケジュールを保存
            await this.saveSchedule();
            
            // 新しい月のスケジュールを読み込み
            await this.loadSchedule(yearMonth);
            
            this.logger.info(`Month changed to ${yearMonth}`);
            this.eventEmitter.emit('month:changed', yearMonth);
            
            return true;
            
        } catch (error) {
            this.logger.error('Failed to change month:', error);
            this.eventEmitter.emit('month:error', error);
            return false;
        }
    }

    /**
     * 前月へ移動
     * @returns {Promise<boolean>}
     */
    async moveToPreviousMonth() {
        const previousMonth = DateUtils.getPreviousMonth(this.currentYearMonth);
        return await this.changeMonth(previousMonth);
    }

    /**
     * 翌月へ移動
     * @returns {Promise<boolean>}
     */
    async moveToNextMonth() {
        const nextMonth = DateUtils.getNextMonth(this.currentYearMonth);
        return await this.changeMonth(nextMonth);
    }

    /**
     * 現在の年月を取得
     * @returns {string}
     */
    getCurrentYearMonth() {
        return this.currentYearMonth;
    }

    // ==================== セル操作 ====================

    /**
     * セル値を更新（Phase 1-B対応）
     * @param {string} userId - 利用者ID
     * @param {string} date - "YYYY-MM-DD"形式
     * @param {string} cellType - 'dayStay' | 'visit'
     * @param {string} value - セル値
     * @returns {Promise<boolean>}
     */
    async updateCell(userId, date, cellType, value) {
        try {
            const calendar = this.calendars.get(userId);
            if (!calendar) {
                this.logger.warn(`Calendar not found for user: ${userId}`);
                return false;
            }

            const result = calendar.setCell(date, cellType, value);
            
            if (!result.valid) {
                this.logger.warn(`Cell validation failed: ${result.message}`);
                this.eventEmitter.emit('cell:validation-error', { userId, date, cellType, message: result.message });
                return false;
            }

            // フラグを再計算
            calendar.calculateAllFlags();

            // 自動保存
            if (AppConfig.STORAGE.AUTO_SAVE) {
                await this.saveSchedule();
            }

            // 定員を再計算（同期的に実行）
            this.recalculateCapacity();

            this.logger.debug(`Cell updated: ${userId}, ${date}, ${cellType} = ${value}`);
            this.eventEmitter.emit('cell:updated', { userId, date, cellType, value });
            
            return true;
            
        } catch (error) {
            this.logger.error('Failed to update cell:', error);
            this.eventEmitter.emit('cell:error', error);
            return false;
        }
    }

    /**
     * セルを取得
     * @param {string} userId - 利用者ID
     * @param {string} date - "YYYY-MM-DD"形式
     * @param {string} cellType - 'dayStay' | 'visit'
     * @returns {ScheduleCell|null}
     */
    getCell(userId, date, cellType) {
        const calendar = this.calendars.get(userId);
        if (!calendar) {
            return null;
        }
        return calendar.getCell(date, cellType);
    }

    /**
     * セルを削除（復元可能）
     * @param {string} userId - 利用者ID
     * @param {string} date - "YYYY-MM-DD"形式
     * @param {string} cellType - 'dayStay' | 'visit'
     * @returns {Promise<boolean>}
     */
    async deleteCell(userId, date, cellType) {
        try {
            const cell = this.getCell(userId, date, cellType);
            if (!cell) {
                return false;
            }

            cell.delete();

            if (AppConfig.STORAGE.AUTO_SAVE) {
                await this.saveSchedule();
            }

            this.logger.debug(`Cell deleted: ${userId}, ${date}, ${cellType}`);
            this.eventEmitter.emit('cell:deleted', { userId, date, cellType });
            
            return true;
            
        } catch (error) {
            this.logger.error('Failed to delete cell:', error);
            return false;
        }
    }

    /**
     * セルを復元
     * @param {string} userId - 利用者ID
     * @param {string} date - "YYYY-MM-DD"形式
     * @param {string} cellType - 'dayStay' | 'visit'
     * @returns {Promise<boolean>}
     */
    async restoreCell(userId, date, cellType) {
        try {
            const cell = this.getCell(userId, date, cellType);
            if (!cell) {
                return false;
            }

            const success = cell.restore();
            if (!success) {
                this.logger.warn('Cell cannot be restored');
                return false;
            }

            if (AppConfig.STORAGE.AUTO_SAVE) {
                await this.saveSchedule();
            }

            this.logger.debug(`Cell restored: ${userId}, ${date}, ${cellType}`);
            this.eventEmitter.emit('cell:restored', { userId, date, cellType });
            
            return true;
            
        } catch (error) {
            this.logger.error('Failed to restore cell:', error);
            return false;
        }
    }

    // ==================== カレンダー取得 ====================

    /**
     * 指定利用者のカレンダーを取得
     * @param {string} userId - 利用者ID
     * @returns {ScheduleCalendar|null}
     */
    getCalendar(userId) {
        return this.calendars.get(userId) || null;
    }

    /**
     * 全カレンダーを取得
     * @returns {Map<string, ScheduleCalendar>}
     */
    getAllCalendars() {
        return this.calendars;
    }

    /**
     * 宿泊期間を取得
     * @param {string} userId - 利用者ID
     * @returns {Array<StayPeriod>}
     */
    getStayPeriods(userId) {
        const calendar = this.getCalendar(userId);
        return calendar ? calendar.stayPeriods : [];
    }

    // ==================== スケジュールクリア ====================

    /**
     * 指定利用者のスケジュールをクリア
     * @param {string} userId - 利用者ID
     * @returns {Promise<boolean>}
     */
    async clearUserSchedule(userId) {
        try {
            const calendar = this.calendars.get(userId);
            if (!calendar) {
                return false;
            }

            calendar.clear();
            await this.saveSchedule();

            this.logger.info(`User schedule cleared: ${userId}`);
            this.eventEmitter.emit('schedule:cleared', userId);
            
            return true;
            
        } catch (error) {
            this.logger.error('Failed to clear user schedule:', error);
            return false;
        }
    }

    /**
     * 全利用者のスケジュールをクリア
     * @returns {Promise<boolean>}
     */
    async clearAllSchedules() {
        try {
            this.calendars.forEach(calendar => {
                calendar.clear();
            });

            await this.saveSchedule();

            this.logger.info('All schedules cleared');
            this.eventEmitter.emit('schedules:cleared');
            
            return true;
            
        } catch (error) {
            this.logger.error('Failed to clear all schedules:', error);
            return false;
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

    // ==================== CSV インポート ====================

    /**
     * CSVファイルから利用者とスケジュールをインポート
     * @param {FileList|Array<File>} files - CSVファイル（介護.csv, 予防.csv等）
     * @returns {Promise<boolean>}
     */
    async importCSV(files) {
        try {
            this.logger.info('CSV import started');
            this.eventEmitter.emit('import:start', { fileCount: files.length });
            
            // 1. CSVパース
            const csvService = new CSVService();
            const { users, weeklyPatterns } = await csvService.parseCSVFiles(files);
            
            this.logger.info(`Parsed ${users.length} users from CSV`);
            
            // 2. 既存ユーザーチェック
            const hasExistingUsers = this.users.length > 0;
            
            if (hasExistingUsers) {
                // TODO: 利用者確認画面を表示（Phase 2で実装）
                this.logger.warn('Existing users found, will be overwritten');
            }
            
            // 3. 利用者マスタ更新
            this.users = users;
            await this.storageService.saveUsers(users);
            this.logger.info('User master updated');
            
            // 4. 週間→月間展開
            const calendars = csvService.expandWeeklyToMonthly(
                weeklyPatterns,
                this.currentYearMonth,
                users
            );
            
            this.logger.info('Weekly patterns expanded to monthly');
            
            // 5. 既存スケジュールチェック
            const hasExistingSchedule = this.storageService.hasSchedule(this.currentYearMonth);
            
            if (hasExistingSchedule) {
                // TODO: 上書き確認ダイアログ（Phase 2で実装）
                this.logger.warn('Existing schedule found, will be overwritten with notes preserved');
                
                // 6. 備考を保持したまま上書き
                const mergedCalendars = csvService.mergeWithExistingNotes(
                    calendars,
                    this.currentYearMonth,
                    this.storageService
                );
                
                // マージ済みカレンダーを設定
                this.calendars = mergedCalendars;
            } else {
                // 既存スケジュールがない場合はそのまま設定
                this.calendars = calendars;
            }
            
            // 7. 保存
            await this.storageService.saveSchedule(this.currentYearMonth, this.calendars);
            this.logger.info('Schedule saved');
            
            // 8. イベント発火
            this.eventEmitter.emit('users:loaded', { users: this.users });
            this.eventEmitter.emit('schedule:loaded', { yearMonth: this.currentYearMonth });
            this.eventEmitter.emit('import:complete', { 
                userCount: users.length,
                yearMonth: this.currentYearMonth
            });
            
            this.logger.info('CSV import completed successfully');
            return true;
            
        } catch (error) {
            this.logger.error('CSV import failed:', error);
            this.eventEmitter.emit('import:error', { error });
            throw error;
        }
    }

    // ==================== Phase 1-B: UI機能強化 ====================

    /**
     * 宿泊期間を設定（Phase 1-B）
     * @param {string} userId - 利用者ID
     * @param {string} startDate - 開始日（YYYY-MM-DD）
     * @param {string} endDate - 終了日（YYYY-MM-DD）
     * @returns {Promise<boolean>}
     */
    async setStayPeriod(userId, startDate, endDate) {
        try {
            const calendar = this.calendars.get(userId);
            if (!calendar) {
                this.logger.warn(`Calendar not found for user: ${userId}`);
                return false;
            }
            
            // 日付の順序を正規化
            const [start, end] = [startDate, endDate].sort();
            
            // 期間内のセルを設定
            const dates = DateUtils.getDateRange(start, end);
            
            dates.forEach((date, index) => {
                if (index === 0) {
                    // 初日: 入
                    calendar.setCell(date, 'dayStay', AppConfig.SYMBOLS.CHECK_IN);
                } else if (index === dates.length - 1) {
                    // 最終日: 退
                    calendar.setCell(date, 'dayStay', AppConfig.SYMBOLS.CHECK_OUT);
                } else {
                    // 中間: ◎（連泊中）
                    calendar.setCell(date, 'dayStay', AppConfig.SYMBOLS.STAY_MIDDLE);
                }
            });
            
            // フラグを再計算
            calendar.calculateAllFlags();

            // 自動保存
            if (AppConfig.STORAGE.AUTO_SAVE) {
                await this.saveSchedule();
            }

            // 定員を再計算
            this.recalculateCapacity();

            // イベント発火
            this.eventEmitter.emit('stayPeriodSet', { userId, startDate: start, endDate: end });
            
            this.logger.debug(`Stay period set: ${userId}, ${start} to ${end}`);
            return true;
            
        } catch (error) {
            this.logger.error('Failed to set stay period:', error);
            return false;
        }
    }

    /**
     * 孤立した入・退を○に変換（Phase 1-B）
     * StayPeriodに含まれない入・退記号を○に自動変換する
     * @param {ScheduleCalendar} calendar - 対象カレンダー
     */
    cleanupOrphanedCheckouts(calendar) {
        try {
            // StayPeriodを再構築
            calendar.calculateStayPeriods();
            
            // 全セルをチェック
            for (const cell of calendar.cells.values()) {
                if (cell.cellType === 'dayStay') {
                    // 退記号をチェック
                    if (cell.isStayEnd()) {
                        const isValidCheckout = calendar.stayPeriods.some(period => 
                            period.endDate === cell.date
                        );
                        
                        // 孤立した退を○に変換
                        if (!isValidCheckout) {
                            cell.inputValue = AppConfig.SYMBOLS.FULL_DAY;
                            calendar.calculateFlagsForDate(cell.date);
                            this.logger.debug(`Converted orphaned checkout to full day: ${cell.date}`);
                        }
                    }
                    
                    // 入記号をチェック
                    if (cell.isStayStart()) {
                        const isValidCheckin = calendar.stayPeriods.some(period => 
                            period.startDate === cell.date
                        );
                        
                        // 孤立した入を○に変換
                        if (!isValidCheckin) {
                            cell.inputValue = AppConfig.SYMBOLS.FULL_DAY;
                            calendar.calculateFlagsForDate(cell.date);
                            this.logger.debug(`Converted orphaned checkin to full day: ${cell.date}`);
                        }
                    }
                }
            }
        } catch (error) {
            this.logger.error('Failed to cleanup orphaned checkouts:', error);
        }
    }

    /**
     * 定員を再計算（Phase 1-B）
     * CapacityCheckControllerを呼び出して定員を再計算
     */
    recalculateCapacity() {
        // App.jsで設定されたcapacityControllerを呼び出す
        if (this.capacityController) {
            this.capacityController.updateCapacity();
            this.logger.debug('Capacity recalculated');
        } else {
            this.logger.warn('CapacityController not set');
        }
    }

    /**
     * CapacityControllerを設定（Phase 1-B）
     * App.jsから呼び出される
     * @param {CapacityCheckController} capacityController
     */
    setCapacityController(capacityController) {
        this.capacityController = capacityController;
    }
}

// グローバル変数として公開
window.ScheduleController = ScheduleController;
