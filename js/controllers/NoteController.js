/**
 * NoteControllerクラス（備考コントローラー）
 * 利用者備考とセル備考の管理を担当
 */
class NoteController {
    /**
     * コンストラクタ
     * @param {StorageService} storageService - ストレージサービス
     * @param {ScheduleController} scheduleController - スケジュールコントローラー
     */
    constructor(storageService, scheduleController) {
        this.storageService = storageService;
        this.scheduleController = scheduleController;
        this.notes = [];
        this.eventEmitter = new EventEmitter();
        this.logger = new Logger('NoteController');
    }

    // ==================== 初期化 ====================

    /**
     * 初期化
     */
    async initialize() {
        try {
            await this.loadNotes();
            this.logger.info('NoteController initialized');
        } catch (error) {
            this.logger.error('Failed to initialize:', error);
            throw error;
        }
    }

    // ==================== 備考の読み込み・保存 ====================

    /**
     * 備考を読み込み
     */
    async loadNotes() {
        try {
            this.notes = await this.storageService.loadNotes();
            this.logger.info(`Notes loaded: ${this.notes.length} notes`);
            this.eventEmitter.emit('notes:loaded', this.notes);
            
        } catch (error) {
            this.logger.error('Failed to load notes:', error);
            this.eventEmitter.emit('notes:error', error);
            throw error;
        }
    }

    /**
     * 備考を保存
     */
    async saveNotes() {
        try {
            await this.storageService.saveNotes(this.notes);
            this.logger.info(`Notes saved: ${this.notes.length} notes`);
            this.eventEmitter.emit('notes:saved', this.notes);
            
            // 自動保存が有効な場合は通知しない
            if (!AppConfig.STORAGE.AUTO_SAVE) {
                this.logger.debug('Auto save is disabled');
            }
            
        } catch (error) {
            this.logger.error('Failed to save notes:', error);
            this.eventEmitter.emit('notes:error', error);
            throw error;
        }
    }

    // ==================== 利用者備考 ====================

    /**
     * 利用者備考を作成
     * @param {string} userId - 利用者ID
     * @param {string} content - 備考内容
     * @returns {Note}
     */
    async createUserNote(userId, content) {
        try {
            // 利用者が存在するかチェック
            const user = this.scheduleController.getUserById(userId);
            if (!user) {
                throw new Error(`User not found: ${userId}`);
            }
            
            const note = Note.createUserNote(userId, content);
            this.notes.push(note);
            
            await this.saveNotes();
            
            this.logger.info(`User note created: ${note.id}`);
            this.eventEmitter.emit('note:created', note);
            
            return note;
            
        } catch (error) {
            this.logger.error('Failed to create user note:', error);
            this.eventEmitter.emit('note:error', error);
            throw error;
        }
    }

    /**
     * 利用者備考を取得
     * @param {string} userId - 利用者ID
     * @returns {Array<Note>}
     */
    getUserNotes(userId) {
        return Note.filterUserNotes(this.notes, userId);
    }

    /**
     * 利用者備考を更新
     * @param {string} userId - 利用者ID
     * @param {string} content - 備考内容
     * @returns {Note}
     */
    async updateUserNote(userId, content) {
        try {
            const notes = this.getUserNotes(userId);
            
            if (notes.length === 0) {
                // 備考がない場合は新規作成
                return await this.createUserNote(userId, content);
            }
            
            // 最新の備考を更新
            const note = notes[notes.length - 1];
            note.setContent(content);
            
            await this.saveNotes();
            
            this.logger.info(`User note updated: ${note.id}`);
            this.eventEmitter.emit('note:updated', note);
            
            return note;
            
        } catch (error) {
            this.logger.error('Failed to update user note:', error);
            this.eventEmitter.emit('note:error', error);
            throw error;
        }
    }

    /**
     * 利用者備考を削除
     * @param {string} userId - 利用者ID
     */
    async deleteUserNote(userId) {
        try {
            const beforeCount = this.notes.length;
            this.notes = this.notes.filter(note => {
                if (note.isUserNote() && note.targetId === userId) {
                    return false;
                }
                return true;
            });
            
            const deletedCount = beforeCount - this.notes.length;
            
            if (deletedCount > 0) {
                await this.saveNotes();
                this.logger.info(`User notes deleted: ${deletedCount} notes for user ${userId}`);
                this.eventEmitter.emit('note:deleted', { userId, count: deletedCount });
            }
            
        } catch (error) {
            this.logger.error('Failed to delete user note:', error);
            this.eventEmitter.emit('note:error', error);
            throw error;
        }
    }

    // ==================== セル備考 ====================

    /**
     * セル備考を作成
     * @param {string} userId - 利用者ID
     * @param {string} date - "YYYY-MM-DD"形式
     * @param {string} cellType - 'prevMonth' | 'am' | 'pm' | 'nextMonth'
     * @param {string} content - 備考内容
     * @returns {Note}
     */
    async createCellNote(userId, date, cellType, content) {
        try {
            // セルが存在するかチェック
            const cell = this.scheduleController.getCell(userId, date, cellType);
            if (!cell) {
                throw new Error(`Cell not found: ${userId} ${date} ${cellType}`);
            }
            
            const note = Note.createCellNote(userId, date, cellType, content);
            this.notes.push(note);
            
            await this.saveNotes();
            
            this.logger.info(`Cell note created: ${note.id}`);
            this.eventEmitter.emit('note:created', note);
            
            return note;
            
        } catch (error) {
            this.logger.error('Failed to create cell note:', error);
            this.eventEmitter.emit('note:error', error);
            throw error;
        }
    }

    /**
     * セル備考を取得
     * @param {string} userId - 利用者ID
     * @param {string} date - "YYYY-MM-DD"形式
     * @param {string} cellType - 'prevMonth' | 'am' | 'pm' | 'nextMonth'
     * @returns {Array<Note>}
     */
    getCellNotes(userId, date, cellType) {
        return Note.filterCellNotes(this.notes, userId, date, cellType);
    }

    /**
     * セル備考を更新
     * @param {string} userId - 利用者ID
     * @param {string} date - "YYYY-MM-DD"形式
     * @param {string} cellType - 'prevMonth' | 'am' | 'pm' | 'nextMonth'
     * @param {string} content - 備考内容
     * @returns {Note}
     */
    async updateCellNote(userId, date, cellType, content) {
        try {
            const notes = this.getCellNotes(userId, date, cellType);
            
            if (notes.length === 0) {
                // 備考がない場合は新規作成
                return await this.createCellNote(userId, date, cellType, content);
            }
            
            // 最新の備考を更新
            const note = notes[notes.length - 1];
            note.setContent(content);
            
            await this.saveNotes();
            
            this.logger.info(`Cell note updated: ${note.id}`);
            this.eventEmitter.emit('note:updated', note);
            
            return note;
            
        } catch (error) {
            this.logger.error('Failed to update cell note:', error);
            this.eventEmitter.emit('note:error', error);
            throw error;
        }
    }

    /**
     * セル備考を削除
     * @param {string} userId - 利用者ID
     * @param {string} date - "YYYY-MM-DD"形式
     * @param {string} cellType - 'prevMonth' | 'am' | 'pm' | 'nextMonth'
     */
    async deleteCellNote(userId, date, cellType) {
        try {
            const beforeCount = this.notes.length;
            this.notes = this.notes.filter(note => {
                if (note.isCellNote()) {
                    const target = note.parseCellTarget();
                    if (target.userId === userId && 
                        target.date === date && 
                        target.cellType === cellType) {
                        return false;
                    }
                }
                return true;
            });
            
            const deletedCount = beforeCount - this.notes.length;
            
            if (deletedCount > 0) {
                await this.saveNotes();
                this.logger.info(`Cell notes deleted: ${deletedCount} notes for ${userId} ${date} ${cellType}`);
                this.eventEmitter.emit('note:deleted', { userId, date, cellType, count: deletedCount });
            }
            
        } catch (error) {
            this.logger.error('Failed to delete cell note:', error);
            this.eventEmitter.emit('note:error', error);
            throw error;
        }
    }

    /**
     * 利用者の全セル備考を削除
     * @param {string} userId - 利用者ID
     */
    async deleteUserCellNotes(userId) {
        try {
            const beforeCount = this.notes.length;
            this.notes = this.notes.filter(note => {
                if (note.isCellNote()) {
                    const target = note.parseCellTarget();
                    if (target.userId === userId) {
                        return false;
                    }
                }
                return true;
            });
            
            const deletedCount = beforeCount - this.notes.length;
            
            if (deletedCount > 0) {
                await this.saveNotes();
                this.logger.info(`All cell notes deleted for user: ${userId} (${deletedCount} notes)`);
                this.eventEmitter.emit('note:deleted', { userId, count: deletedCount });
            }
            
        } catch (error) {
            this.logger.error('Failed to delete user cell notes:', error);
            this.eventEmitter.emit('note:error', error);
            throw error;
        }
    }

    // ==================== 検索・取得 ====================

    /**
     * IDで備考を取得
     * @param {string} id - 備考ID
     * @returns {Note|null}
     */
    getNoteById(id) {
        return this.notes.find(note => note.id === id) || null;
    }

    /**
     * すべての備考を取得
     * @returns {Array<Note>}
     */
    getAllNotes() {
        return [...this.notes];
    }

    /**
     * すべての利用者備考を取得
     * @returns {Array<Note>}
     */
    getAllUserNotes() {
        return this.notes.filter(note => note.isUserNote());
    }

    /**
     * すべてのセル備考を取得
     * @returns {Array<Note>}
     */
    getAllCellNotes() {
        return this.notes.filter(note => note.isCellNote());
    }

    /**
     * 指定期間のセル備考を取得
     * @param {string} startDate - "YYYY-MM-DD"形式
     * @param {string} endDate - "YYYY-MM-DD"形式
     * @returns {Array<Note>}
     */
    getCellNotesInRange(startDate, endDate) {
        return this.notes.filter(note => {
            if (!note.isCellNote()) {
                return false;
            }
            
            const target = note.parseCellTarget();
            return target.date >= startDate && target.date <= endDate;
        });
    }

    /**
     * キーワードで備考を検索
     * @param {string} keyword - 検索キーワード
     * @returns {Array<Note>}
     */
    searchNotes(keyword) {
        if (!keyword) {
            return [];
        }
        
        const lowerKeyword = keyword.toLowerCase();
        return this.notes.filter(note => {
            return note.content.toLowerCase().includes(lowerKeyword);
        });
    }

    // ==================== 統計・集計 ====================

    /**
     * 備考の統計情報を取得
     * @returns {object}
     */
    getStatistics() {
        const userNotes = this.getAllUserNotes();
        const cellNotes = this.getAllCellNotes();
        
        return {
            total: this.notes.length,
            userNotes: userNotes.length,
            cellNotes: cellNotes.length,
            averageLength: this.notes.reduce((sum, note) => sum + note.content.length, 0) / this.notes.length || 0
        };
    }

    /**
     * 備考が多い利用者を取得
     * @param {number} limit - 取得件数
     * @returns {Array<object>}
     */
    getTopNotedUsers(limit = 10) {
        const userNoteCounts = new Map();
        
        this.notes.forEach(note => {
            let userId;
            if (note.isUserNote()) {
                userId = note.targetId;
            } else if (note.isCellNote()) {
                const target = note.parseCellTarget();
                userId = target.userId;
            }
            
            if (userId) {
                userNoteCounts.set(userId, (userNoteCounts.get(userId) || 0) + 1);
            }
        });
        
        const result = Array.from(userNoteCounts.entries())
            .map(([userId, count]) => {
                const user = this.scheduleController.getUserById(userId);
                return {
                    userId,
                    userName: user ? user.name : '不明',
                    noteCount: count
                };
            })
            .sort((a, b) => b.noteCount - a.noteCount)
            .slice(0, limit);
        
        return result;
    }

    // ==================== クリア ====================

    /**
     * すべての備考をクリア
     */
    async clearAllNotes() {
        try {
            const count = this.notes.length;
            this.notes = [];
            
            await this.saveNotes();
            
            this.logger.info(`All notes cleared: ${count} notes`);
            this.eventEmitter.emit('notes:cleared', count);
            
        } catch (error) {
            this.logger.error('Failed to clear notes:', error);
            this.eventEmitter.emit('notes:error', error);
            throw error;
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
window.NoteController = NoteController;
