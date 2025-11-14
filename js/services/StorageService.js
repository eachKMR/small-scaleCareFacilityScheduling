/**
 * StorageServiceクラス（データ永続化サービス）
 * LocalStorageを使用したデータの保存・読み込みを管理
 */
class StorageService {
    constructor() {
        this.prefix = AppConfig.STORAGE.PREFIX;
        this.maxMonths = AppConfig.STORAGE.MAX_MONTHS;
        this.logger = new Logger('StorageService');
    }

    // ==================== 利用者マスタ ====================

    /**
     * 利用者マスタを保存
     * @param {Array<User>} users - 利用者の配列
     * @returns {boolean} 保存成功の場合true
     */
    saveUsers(users) {
        try {
            const jsonData = users.map(user => user.toJSON());
            localStorage.setItem('users', JSON.stringify(jsonData));
            this.logger.info(`Users saved: ${users.length} users`);
            return true;
        } catch (error) {
            this.logger.error('Failed to save users:', error);
            
            // 容量超過の場合は古いスケジュールを削除して再試行
            if (error.name === 'QuotaExceededError') {
                this.logger.warn('Storage quota exceeded, deleting old schedules');
                this.deleteOldestSchedule();
                
                try {
                    const jsonData = users.map(user => user.toJSON());
                    localStorage.setItem('users', JSON.stringify(jsonData));
                    this.logger.info(`Users saved after cleanup: ${users.length} users`);
                    return true;
                } catch (retryError) {
                    this.logger.error('Failed to save users after cleanup:', retryError);
                    return false;
                }
            }
            
            return false;
        }
    }

    /**
     * 利用者マスタを読み込み
     * @returns {Array<User>} 利用者の配列
     */
    loadUsers() {
        try {
            const jsonStr = localStorage.getItem('users');
            
            if (!jsonStr) {
                this.logger.info('No users found in storage');
                return [];
            }

            const jsonData = JSON.parse(jsonStr);
            const users = User.fromJSONArray(jsonData);
            
            this.logger.info(`Users loaded: ${users.length} users`);
            return users;
            
        } catch (error) {
            this.logger.error('Failed to load users:', error);
            return [];
        }
    }

    /**
     * 利用者マスタが存在するかチェック
     * @returns {boolean}
     */
    hasUsers() {
        const jsonStr = localStorage.getItem('users');
        return jsonStr !== null && jsonStr !== '[]';
    }

    // ==================== 月間スケジュール ====================

    /**
     * 月間スケジュールを保存
     * @param {string} yearMonth - "YYYY-MM"形式
     * @param {Map<string, ScheduleCalendar>} calendars - カレンダーのMap（キー: userId）
     * @returns {boolean} 保存成功の場合true
     */
    saveSchedule(yearMonth, calendars) {
        try {
            const key = `${this.prefix}schedule_${yearMonth}`;
            
            // Map → Object に変換
            const data = {};
            calendars.forEach((calendar, userId) => {
                data[userId] = calendar.toJSON();
            });

            const jsonStr = JSON.stringify(data);
            
            // 容量チェック
            if (this.isStorageQuotaExceeded()) {
                this.logger.warn('Storage quota near limit, deleting old schedules');
                this.deleteOldestSchedule();
            }

            localStorage.setItem(key, jsonStr);
            this.logger.info(`Schedule saved: ${yearMonth}, ${calendars.size} users`);
            
            return true;
            
        } catch (error) {
            this.logger.error(`Failed to save schedule for ${yearMonth}:`, error);
            
            // 容量超過の場合は古いスケジュールを削除して再試行
            if (error.name === 'QuotaExceededError') {
                this.logger.warn('Storage quota exceeded, deleting old schedules');
                this.deleteOldestSchedule();
                
                try {
                    const key = `${this.prefix}schedule_${yearMonth}`;
                    const data = {};
                    calendars.forEach((calendar, userId) => {
                        data[userId] = calendar.toJSON();
                    });
                    localStorage.setItem(key, JSON.stringify(data));
                    this.logger.info(`Schedule saved after cleanup: ${yearMonth}`);
                    return true;
                } catch (retryError) {
                    this.logger.error('Failed to save schedule after cleanup:', retryError);
                    return false;
                }
            }
            
            return false;
        }
    }

    /**
     * 月間スケジュールを読み込み
     * @param {string} yearMonth - "YYYY-MM"形式
     * @param {Array<User>} users - 利用者の配列（カレンダー初期化用）
     * @returns {Map<string, ScheduleCalendar>} カレンダーのMap
     */
    loadSchedule(yearMonth, users = []) {
        try {
            const key = `${this.prefix}schedule_${yearMonth}`;
            const jsonStr = localStorage.getItem(key);
            
            if (!jsonStr) {
                this.logger.info(`No schedule found for ${yearMonth}`);
                return this.createEmptySchedule(yearMonth, users);
            }

            const data = JSON.parse(jsonStr);
            const calendars = new Map();

            // JSONデータからScheduleCalendarインスタンスを復元
            Object.entries(data).forEach(([userId, calendarData]) => {
                const calendar = ScheduleCalendar.fromJSON(calendarData);
                calendars.set(userId, calendar);
            });

            this.logger.info(`Schedule loaded: ${yearMonth}, ${calendars.size} users`);
            
            // 利用者マスタとの整合性チェック（存在しない利用者のカレンダーを除外）
            if (users.length > 0) {
                const userIds = new Set(users.map(u => u.id));
                const validCalendars = new Map();
                
                calendars.forEach((calendar, userId) => {
                    if (userIds.has(userId)) {
                        validCalendars.set(userId, calendar);
                    } else {
                        this.logger.warn(`Calendar found for non-existent user: ${userId}`);
                    }
                });

                // 新しい利用者のカレンダーを追加
                users.forEach(user => {
                    if (!validCalendars.has(user.id)) {
                        validCalendars.set(user.id, new ScheduleCalendar(user.id, yearMonth));
                    }
                });

                return validCalendars;
            }

            return calendars;
            
        } catch (error) {
            this.logger.error(`Failed to load schedule for ${yearMonth}:`, error);
            return this.createEmptySchedule(yearMonth, users);
        }
    }

    /**
     * 空のスケジュールを作成
     * @param {string} yearMonth - "YYYY-MM"形式
     * @param {Array<User>} users - 利用者の配列
     * @returns {Map<string, ScheduleCalendar>}
     * @private
     */
    createEmptySchedule(yearMonth, users) {
        const calendars = new Map();
        users.forEach(user => {
            calendars.set(user.id, new ScheduleCalendar(user.id, yearMonth));
        });
        return calendars;
    }

    /**
     * 指定月のスケジュールが存在するかチェック
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {boolean}
     */
    hasSchedule(yearMonth) {
        const key = `${this.prefix}schedule_${yearMonth}`;
        return localStorage.getItem(key) !== null;
    }

    /**
     * 指定月のスケジュールを削除
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {boolean} 削除成功の場合true
     */
    deleteSchedule(yearMonth) {
        try {
            const key = `${this.prefix}schedule_${yearMonth}`;
            localStorage.removeItem(key);
            this.logger.info(`Schedule deleted: ${yearMonth}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to delete schedule for ${yearMonth}:`, error);
            return false;
        }
    }

    // ==================== 備考 ====================

    /**
     * 備考を保存
     * @param {Array<Note>} notes - 備考の配列
     * @returns {boolean} 保存成功の場合true
     */
    saveNotes(notes) {
        try {
            const jsonData = notes.map(note => note.toJSON());
            localStorage.setItem('notes', JSON.stringify(jsonData));
            this.logger.info(`Notes saved: ${notes.length} notes`);
            return true;
        } catch (error) {
            this.logger.error('Failed to save notes:', error);
            
            if (error.name === 'QuotaExceededError') {
                this.logger.warn('Storage quota exceeded, deleting old schedules');
                this.deleteOldestSchedule();
                
                try {
                    const jsonData = notes.map(note => note.toJSON());
                    localStorage.setItem('notes', JSON.stringify(jsonData));
                    this.logger.info(`Notes saved after cleanup: ${notes.length} notes`);
                    return true;
                } catch (retryError) {
                    this.logger.error('Failed to save notes after cleanup:', retryError);
                    return false;
                }
            }
            
            return false;
        }
    }

    /**
     * 備考を読み込み
     * @returns {Array<Note>} 備考の配列
     */
    loadNotes() {
        try {
            const jsonStr = localStorage.getItem('notes');
            
            if (!jsonStr) {
                this.logger.info('No notes found in storage');
                return [];
            }

            const jsonData = JSON.parse(jsonStr);
            const notes = Note.fromJSONArray(jsonData);
            
            this.logger.info(`Notes loaded: ${notes.length} notes`);
            return notes;
            
        } catch (error) {
            this.logger.error('Failed to load notes:', error);
            return [];
        }
    }

    // ==================== ストレージ管理 ====================

    /**
     * 最も古いスケジュールを削除
     * @returns {boolean} 削除成功の場合true
     */
    deleteOldestSchedule() {
        try {
            const scheduleKeys = this.getAllScheduleKeys();
            
            if (scheduleKeys.length === 0) {
                this.logger.info('No schedules to delete');
                return false;
            }

            // 日付順にソート（古い順）
            scheduleKeys.sort();
            
            // 最も古いものを削除
            const oldestKey = scheduleKeys[0];
            localStorage.removeItem(oldestKey);
            
            this.logger.info(`Oldest schedule deleted: ${oldestKey}`);
            return true;
            
        } catch (error) {
            this.logger.error('Failed to delete oldest schedule:', error);
            return false;
        }
    }

    /**
     * 全てのスケジュールキーを取得
     * @returns {Array<string>}
     * @private
     */
    getAllScheduleKeys() {
        const keys = [];
        const prefix = `${this.prefix}schedule_`;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key);
            }
        }
        
        return keys;
    }

    /**
     * 保存されている全てのスケジュールの年月を取得
     * @returns {Array<string>} "YYYY-MM"形式の配列
     */
    getAllScheduleMonths() {
        const keys = this.getAllScheduleKeys();
        const prefix = `${this.prefix}schedule_`;
        
        return keys.map(key => key.replace(prefix, '')).sort();
    }

    /**
     * 容量が上限に近いかチェック
     * @returns {boolean}
     */
    isStorageQuotaExceeded() {
        try {
            const testKey = `${this.prefix}test`;
            const testData = new Array(100000).join('a'); // 約100KB
            localStorage.setItem(testKey, testData);
            localStorage.removeItem(testKey);
            return false;
        } catch (error) {
            return true;
        }
    }

    /**
     * 使用中のストレージサイズを取得（概算）
     * @returns {number} バイト数
     */
    getStorageSize() {
        let totalSize = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                totalSize += key.length + (value ? value.length : 0);
            }
        }
        
        return totalSize * 2; // UTF-16なので2倍
    }

    /**
     * ストレージサイズを人間が読める形式で取得
     * @returns {string} 例: "1.5 MB"
     */
    getStorageSizeFormatted() {
        const size = this.getStorageSize();
        
        if (size < 1024) {
            return `${size} B`;
        } else if (size < 1024 * 1024) {
            return `${(size / 1024).toFixed(1)} KB`;
        } else {
            return `${(size / (1024 * 1024)).toFixed(1)} MB`;
        }
    }

    /**
     * 全データをクリア
     * @returns {boolean}
     */
    clearAll() {
        try {
            localStorage.clear();
            this.logger.info('All storage cleared');
            return true;
        } catch (error) {
            this.logger.error('Failed to clear storage:', error);
            return false;
        }
    }

    /**
     * アプリケーション関連のデータのみクリア
     * @returns {boolean}
     */
    clearAppData() {
        try {
            // 利用者マスタを削除
            localStorage.removeItem('users');
            
            // 備考を削除
            localStorage.removeItem('notes');
            
            // 全てのスケジュールを削除
            const scheduleKeys = this.getAllScheduleKeys();
            scheduleKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            this.logger.info('App data cleared');
            return true;
            
        } catch (error) {
            this.logger.error('Failed to clear app data:', error);
            return false;
        }
    }

    /**
     * データのバックアップ（JSON形式）
     * @returns {object} バックアップデータ
     */
    exportBackup() {
        try {
            const backup = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                users: localStorage.getItem('users'),
                notes: localStorage.getItem('notes'),
                schedules: {}
            };

            // 全てのスケジュールを含める
            const scheduleKeys = this.getAllScheduleKeys();
            scheduleKeys.forEach(key => {
                const yearMonth = key.replace(`${this.prefix}schedule_`, '');
                backup.schedules[yearMonth] = localStorage.getItem(key);
            });

            this.logger.info('Backup exported');
            return backup;
            
        } catch (error) {
            this.logger.error('Failed to export backup:', error);
            return null;
        }
    }

    /**
     * バックアップからデータを復元
     * @param {object} backup - バックアップデータ
     * @returns {boolean} 復元成功の場合true
     */
    importBackup(backup) {
        try {
            if (!backup || !backup.version) {
                this.logger.error('Invalid backup data');
                return false;
            }

            // 利用者マスタを復元
            if (backup.users) {
                localStorage.setItem('users', backup.users);
            }

            // 備考を復元
            if (backup.notes) {
                localStorage.setItem('notes', backup.notes);
            }

            // スケジュールを復元
            if (backup.schedules) {
                Object.entries(backup.schedules).forEach(([yearMonth, data]) => {
                    const key = `${this.prefix}schedule_${yearMonth}`;
                    localStorage.setItem(key, data);
                });
            }

            this.logger.info('Backup imported');
            return true;
            
        } catch (error) {
            this.logger.error('Failed to import backup:', error);
            return false;
        }
    }
}

// グローバル変数として公開
window.StorageService = StorageService;
