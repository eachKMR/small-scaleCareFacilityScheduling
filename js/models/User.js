/**
 * Userクラス（利用者）
 * 利用者の基本情報を管理
 */
class User {
    /**
     * コンストラクタ
     * @param {object} data - 利用者データ
     */
    constructor(data = {}) {
        this.id = data.id || IdGenerator.userId([]);
        this.name = data.name || '';
        this.registrationDate = data.registrationDate || DateUtils.formatDate(new Date());
        this.sortId = data.sortId !== undefined ? data.sortId : 0;
        this.note = data.note || '';
        this.isActive = data.isActive !== false;
        
        this.logger = new Logger('User');
    }

    /**
     * 利用者名の妥当性チェック
     * @returns {object} {valid: boolean, message: string}
     */
    validateName() {
        return Validator.validateUserName(this.name);
    }

    /**
     * 備考の妥当性チェック
     * @returns {object} {valid: boolean, message: string}
     */
    validateNote() {
        return Validator.validateNote(this.note);
    }

    /**
     * 利用者データの妥当性チェック
     * @returns {object} {valid: boolean, errors: Array}
     */
    validate() {
        const errors = [];

        const nameResult = this.validateName();
        if (!nameResult.valid) {
            errors.push({ field: 'name', message: nameResult.message });
        }

        const noteResult = this.validateNote();
        if (!noteResult.valid) {
            errors.push({ field: 'note', message: noteResult.message });
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * 論理削除
     */
    delete() {
        this.isActive = false;
        this.logger.info(`User deleted: ${this.id} (${this.name})`);
    }

    /**
     * 復元
     */
    restore() {
        this.isActive = true;
        this.logger.info(`User restored: ${this.id} (${this.name})`);
    }

    /**
     * 利用中かどうか
     * @returns {boolean}
     */
    isActiveUser() {
        return this.isActive === true;
    }

    /**
     * JSON形式に変換
     * @returns {object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            registrationDate: this.registrationDate,
            sortId: this.sortId,
            note: this.note,
            isActive: this.isActive
        };
    }

    /**
     * JSONからUserインスタンスを作成
     * @param {object} json - JSONデータ
     * @returns {User}
     */
    static fromJSON(json) {
        return new User(json);
    }

    /**
     * 複数のユーザーをJSONから作成
     * @param {Array} jsonArray - JSONデータの配列
     * @returns {Array<User>}
     */
    static fromJSONArray(jsonArray) {
        if (!Array.isArray(jsonArray)) {
            return [];
        }
        return jsonArray.map(json => User.fromJSON(json));
    }

    /**
     * ユーザーを並び替え順でソート
     * @param {Array<User>} users - ユーザーの配列
     * @returns {Array<User>}
     */
    static sortBySortId(users) {
        return users.slice().sort((a, b) => a.sortId - b.sortId);
    }

    /**
     * 利用中のユーザーのみをフィルタ
     * @param {Array<User>} users - ユーザーの配列
     * @returns {Array<User>}
     */
    static filterActive(users) {
        return users.filter(user => user.isActive);
    }

    /**
     * IDでユーザーを検索
     * @param {Array<User>} users - ユーザーの配列
     * @param {string} userId - 検索するユーザーID
     * @returns {User|null}
     */
    static findById(users, userId) {
        return users.find(user => user.id === userId) || null;
    }

    /**
     * 氏名でユーザーを検索
     * @param {Array<User>} users - ユーザーの配列
     * @param {string} name - 検索する氏名
     * @returns {Array<User>}
     */
    static findByName(users, name) {
        return users.filter(user => user.name === name);
    }
}

// グローバル変数として公開
window.User = User;
