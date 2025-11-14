/**
 * Noteクラス（備考）
 * 利用者備考とセル備考を管理
 */
class Note {
    /**
     * コンストラクタ
     * @param {object} data - 備考データ
     */
    constructor(data = {}) {
        this.id = data.id || IdGenerator.noteId();
        this.targetType = data.targetType || 'user';  // 'user' | 'cell'
        this.targetId = data.targetId || '';
        this.content = data.content || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        
        this.logger = new Logger('Note');
    }

    /**
     * 利用者備考かどうか
     * @returns {boolean}
     */
    isUserNote() {
        return this.targetType === 'user';
    }

    /**
     * セル備考かどうか
     * @returns {boolean}
     */
    isCellNote() {
        return this.targetType === 'cell';
    }

    /**
     * 備考が空かどうか
     * @returns {boolean}
     */
    isEmpty() {
        return !this.content || this.content.trim().length === 0;
    }

    /**
     * 備考内容を設定
     * @param {string} content - 備考内容
     * @returns {object} {valid: boolean, message: string}
     */
    setContent(content) {
        const validation = Validator.validateNote(content);
        
        if (!validation.valid) {
            return validation;
        }

        this.content = content;
        this.updatedAt = new Date().toISOString();
        
        this.logger.debug(`Note content updated: ${this.id}`);
        
        return { valid: true, message: '' };
    }

    /**
     * 備考を削除（内容をクリア）
     */
    clear() {
        this.content = '';
        this.updatedAt = new Date().toISOString();
        
        this.logger.debug(`Note cleared: ${this.id}`);
    }

    /**
     * 作成日時を取得
     * @returns {Date}
     */
    getCreatedDate() {
        return new Date(this.createdAt);
    }

    /**
     * 更新日時を取得
     * @returns {Date}
     */
    getUpdatedDate() {
        return new Date(this.updatedAt);
    }

    /**
     * 作成日時の文字列表現
     * @returns {string} 例: "2025-11-14 22:30:15"
     */
    getCreatedDateString() {
        const date = this.getCreatedDate();
        return `${DateUtils.formatDate(date)} ${this._formatTime(date)}`;
    }

    /**
     * 更新日時の文字列表現
     * @returns {string}
     */
    getUpdatedDateString() {
        const date = this.getUpdatedDate();
        return `${DateUtils.formatDate(date)} ${this._formatTime(date)}`;
    }

    /**
     * 時刻をフォーマット
     * @param {Date} date - 日付
     * @returns {string} "HH:MM:SS"形式
     * @private
     */
    _formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    /**
     * セルIDから対象情報を解析
     * @returns {object|null} {userId: string, date: string, cellType: string}
     */
    parseCellTarget() {
        if (!this.isCellNote()) {
            return null;
        }

        // targetId形式: "userId_date_cellType"
        const parts = this.targetId.split('_');
        if (parts.length !== 3) {
            return null;
        }

        return {
            userId: parts[0],
            date: parts[1],
            cellType: parts[2]
        };
    }

    /**
     * 備考の文字数を取得
     * @returns {number}
     */
    getLength() {
        return this.content.length;
    }

    /**
     * 備考が最近更新されたかどうか
     * @param {number} minutes - 判定する分数（デフォルト: 5分）
     * @returns {boolean}
     */
    isRecentlyUpdated(minutes = 5) {
        const now = Date.now();
        const updated = this.getUpdatedDate().getTime();
        const diff = now - updated;
        return diff < minutes * 60 * 1000;
    }

    /**
     * JSON形式に変換
     * @returns {object}
     */
    toJSON() {
        return {
            id: this.id,
            targetType: this.targetType,
            targetId: this.targetId,
            content: this.content,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * JSONからNoteインスタンスを作成
     * @param {object} json - JSONデータ
     * @returns {Note}
     */
    static fromJSON(json) {
        return new Note(json);
    }

    /**
     * 複数の備考をJSONから作成
     * @param {Array} jsonArray - JSONデータの配列
     * @returns {Array<Note>}
     */
    static fromJSONArray(jsonArray) {
        if (!Array.isArray(jsonArray)) {
            return [];
        }
        return jsonArray.map(json => Note.fromJSON(json));
    }

    /**
     * 利用者備考を作成
     * @param {string} userId - 利用者ID
     * @param {string} content - 備考内容
     * @returns {Note}
     */
    static createUserNote(userId, content = '') {
        return new Note({
            targetType: 'user',
            targetId: userId,
            content: content
        });
    }

    /**
     * セル備考を作成
     * @param {string} userId - 利用者ID
     * @param {string} date - 日付（"YYYY-MM-DD"形式）
     * @param {string} cellType - セルタイプ
     * @param {string} content - 備考内容
     * @returns {Note}
     */
    static createCellNote(userId, date, cellType, content = '') {
        return new Note({
            targetType: 'cell',
            targetId: `${userId}_${date}_${cellType}`,
            content: content
        });
    }

    /**
     * 利用者備考をフィルタ
     * @param {Array<Note>} notes - 備考の配列
     * @returns {Array<Note>}
     */
    static filterUserNotes(notes) {
        return notes.filter(note => note.isUserNote());
    }

    /**
     * セル備考をフィルタ
     * @param {Array<Note>} notes - 備考の配列
     * @returns {Array<Note>}
     */
    static filterCellNotes(notes) {
        return notes.filter(note => note.isCellNote());
    }

    /**
     * 特定の対象IDの備考を検索
     * @param {Array<Note>} notes - 備考の配列
     * @param {string} targetId - 対象ID
     * @returns {Note|null}
     */
    static findByTargetId(notes, targetId) {
        return notes.find(note => note.targetId === targetId) || null;
    }

    /**
     * 特定の利用者の備考を検索
     * @param {Array<Note>} notes - 備考の配列
     * @param {string} userId - 利用者ID
     * @returns {Note|null}
     */
    static findUserNote(notes, userId) {
        return notes.find(note => note.isUserNote() && note.targetId === userId) || null;
    }

    /**
     * 特定のセルの備考を検索
     * @param {Array<Note>} notes - 備考の配列
     * @param {string} userId - 利用者ID
     * @param {string} date - 日付
     * @param {string} cellType - セルタイプ
     * @returns {Note|null}
     */
    static findCellNote(notes, userId, date, cellType) {
        const targetId = `${userId}_${date}_${cellType}`;
        return notes.find(note => note.isCellNote() && note.targetId === targetId) || null;
    }

    /**
     * 空でない備考のみをフィルタ
     * @param {Array<Note>} notes - 備考の配列
     * @returns {Array<Note>}
     */
    static filterNonEmpty(notes) {
        return notes.filter(note => !note.isEmpty());
    }

    /**
     * 更新日時でソート（新しい順）
     * @param {Array<Note>} notes - 備考の配列
     * @returns {Array<Note>}
     */
    static sortByUpdatedDate(notes) {
        return notes.slice().sort((a, b) => {
            const dateA = a.getUpdatedDate();
            const dateB = b.getUpdatedDate();
            return dateB - dateA;  // 降順
        });
    }
}

// グローバル変数として公開
window.Note = Note;
