/**
 * ID生成ユーティリティ
 * 一意なIDを生成する各種メソッドを提供
 */
class IdGenerator {
    /**
     * UUIDv4を生成
     * @returns {string} UUID文字列
     */
    static uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * 連番IDを生成（user001, user002, ...）
     * @param {string} prefix - IDのプレフィックス
     * @param {Array} existingItems - 既存アイテムの配列
     * @param {string} idField - IDフィールド名
     * @returns {string} 新しいID
     */
    static sequential(prefix, existingItems = [], idField = 'id') {
        let maxNum = 0;
        
        existingItems.forEach(item => {
            const id = item[idField];
            if (id && id.startsWith(prefix)) {
                const num = parseInt(id.substring(prefix.length));
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            }
        });

        const nextNum = maxNum + 1;
        return `${prefix}${String(nextNum).padStart(3, '0')}`;
    }

    /**
     * タイムスタンプベースのIDを生成
     * @param {string} prefix - IDのプレフィックス
     * @returns {string} タイムスタンプID
     */
    static timestamp(prefix = '') {
        const now = new Date();
        const timestamp = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0') +
            String(now.getMilliseconds()).padStart(3, '0');
        
        return prefix ? `${prefix}_${timestamp}` : timestamp;
    }

    /**
     * ランダムIDを生成（指定長の英数字）
     * @param {number} length - ID長
     * @returns {string} ランダムID
     */
    static random(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * ユーザーIDを生成（user001形式）
     * @param {Array} existingUsers - 既存ユーザーの配列
     * @returns {string} 新しいユーザーID
     */
    static userId(existingUsers = []) {
        return this.sequential('user', existingUsers);
    }

    /**
     * ノートIDを生成（note_タイムスタンプ形式）
     * @returns {string} 新しいノートID
     */
    static noteId() {
        return this.timestamp('note');
    }
}

// グローバル変数として公開
window.IdGenerator = IdGenerator;
