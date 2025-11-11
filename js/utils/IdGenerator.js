/**
 * 小規模多機能利用調整システム - ID生成ユーティリティ
 * 一意な識別子の生成機能を提供
 */

class IdGenerator {
  // 内部カウンター（セッション内での連番）
  static _counter = 0;

  /**
   * プレフィックス付きのIDを生成
   * タイムスタンプとランダム値を組み合わせた一意なIDを生成
   * @param {string} prefix - IDのプレフィックス（例: "user", "schedule", "note"）
   * @returns {string} 生成されたID（例: "user_1700000000000_123"）
   */
  static generate(prefix = '') {
    try {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const counter = this._getNextCounter();
      
      if (prefix) {
        return `${prefix}_${timestamp}_${random}_${counter}`;
      } else {
        return `${timestamp}_${random}_${counter}`;
      }
      
    } catch (error) {
      window.Logger?.error('IdGenerator.generate error:', error);
      // フォールバック：シンプルなタイムスタンプベースのID
      return `${prefix ? prefix + '_' : ''}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * UUID v4風のランダムIDを生成
   * RFC 4122に近い形式だが、完全なUUIDではない
   * @returns {string} UUID v4風の文字列（例: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"）
   */
  static generateUUID() {
    try {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
    } catch (error) {
      window.Logger?.error('IdGenerator.generateUUID error:', error);
      // フォールバック：タイムスタンプベースの代替UUID
      const timestamp = Date.now().toString(16);
      const random1 = Math.random().toString(16).substr(2, 8);
      const random2 = Math.random().toString(16).substr(2, 8);
      const random3 = Math.random().toString(16).substr(2, 8);
      
      return `${timestamp.substr(0, 8)}-${random1.substr(0, 4)}-4${random2.substr(0, 3)}-y${random3.substr(0, 3)}-${timestamp}${random1.substr(4)}`;
    }
  }

  /**
   * ショートIDを生成（可読性重視）
   * 英数字を使用した短いID（重複の可能性は高くなる）
   * @param {number} length - IDの長さ（デフォルト: 8）
   * @returns {string} ショートID（例: "Ab3kN9Qs"）
   */
  static generateShortId(length = 8) {
    try {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      return result;
      
    } catch (error) {
      window.Logger?.error('IdGenerator.generateShortId error:', error);
      // フォールバック：タイムスタンプの末尾を使用
      return Date.now().toString(36).substr(-length);
    }
  }

  /**
   * 数値のみのIDを生成
   * データベースの主キーなどで使用可能
   * @param {number} digits - 桁数（デフォルト: 10）
   * @returns {string} 数値ID（例: "1234567890"）
   */
  static generateNumericId(digits = 10) {
    try {
      let result = '';
      
      // 最初の桁は1-9（0で始まらないようにする）
      result += Math.floor(Math.random() * 9) + 1;
      
      // 残りの桁は0-9
      for (let i = 1; i < digits; i++) {
        result += Math.floor(Math.random() * 10);
      }
      
      return result;
      
    } catch (error) {
      window.Logger?.error('IdGenerator.generateNumericId error:', error);
      // フォールバック：タイムスタンプベース
      return Date.now().toString().substr(-digits);
    }
  }

  /**
   * 日付ベースのIDを生成
   * 日付とシーケンス番号を組み合わせた可読性の高いID
   * @param {string} prefix - プレフィックス
   * @param {Date} date - 基準日付（デフォルト: 今日）
   * @returns {string} 日付ベースID（例: "user_20231115_001"）
   */
  static generateDateBasedId(prefix = '', date = new Date()) {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      const dateStr = window.DateUtils ? 
        window.DateUtils.formatDate(dateObj, 'YYYYMMDD') :
        dateObj.toISOString().substr(0, 10).replace(/-/g, '');
      
      const sequence = String(this._getNextCounter()).padStart(3, '0');
      
      if (prefix) {
        return `${prefix}_${dateStr}_${sequence}`;
      } else {
        return `${dateStr}_${sequence}`;
      }
      
    } catch (error) {
      window.Logger?.error('IdGenerator.generateDateBasedId error:', error);
      // フォールバック：シンプルな生成方法
      return this.generate(prefix);
    }
  }

  /**
   * 連番IDを生成
   * セッション内で連続した番号を生成
   * @param {string} prefix - プレフィックス
   * @param {number} padding - ゼロパディングの桁数（デフォルト: 3）
   * @returns {string} 連番ID（例: "item_001", "item_002"）
   */
  static generateSequentialId(prefix = 'item', padding = 3) {
    try {
      const sequence = String(this._getNextCounter()).padStart(padding, '0');
      return `${prefix}_${sequence}`;
      
    } catch (error) {
      window.Logger?.error('IdGenerator.generateSequentialId error:', error);
      // フォールバック：タイムスタンプベース
      return `${prefix}_${Date.now()}`;
    }
  }

  /**
   * ハッシュベースのIDを生成
   * 入力文字列からハッシュ風のIDを生成（実際のハッシュではない）
   * @param {string} input - ハッシュ化する文字列
   * @param {number} length - 出力長（デフォルト: 8）
   * @returns {string} ハッシュ風ID
   */
  static generateHashBasedId(input, length = 8) {
    try {
      if (!input || typeof input !== 'string') {
        throw new Error('Input must be a non-empty string');
      }
      
      // シンプルなハッシュ風アルゴリズム
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32bit整数に変換
      }
      
      // 負数を正数に変換し、指定長の16進文字列に変換
      const hashStr = Math.abs(hash).toString(16);
      const result = hashStr.substr(0, length).padStart(length, '0');
      
      return result;
      
    } catch (error) {
      window.Logger?.error('IdGenerator.generateHashBasedId error:', error);
      // フォールバック：ランダムID
      return this.generateShortId(length);
    }
  }

  /**
   * IDの妥当性をチェック
   * 生成されたIDが適切な形式かどうかを確認
   * @param {string} id - チェックするID
   * @param {string} expectedPrefix - 期待されるプレフィックス（オプション）
   * @returns {boolean} IDが妥当かどうか
   */
  static isValidId(id, expectedPrefix = null) {
    try {
      if (!id || typeof id !== 'string') {
        return false;
      }
      
      // 空文字列や極端に短いIDは無効
      if (id.trim().length < 3) {
        return false;
      }
      
      // プレフィックスが指定されている場合はチェック
      if (expectedPrefix && !id.startsWith(expectedPrefix + '_')) {
        return false;
      }
      
      // 基本的な文字チェック（英数字、ハイフン、アンダースコアのみ許可）
      const validCharPattern = /^[a-zA-Z0-9_-]+$/;
      if (!validCharPattern.test(id)) {
        return false;
      }
      
      return true;
      
    } catch (error) {
      window.Logger?.error('IdGenerator.isValidId error:', error);
      return false;
    }
  }

  /**
   * 複数のIDを一括生成
   * @param {number} count - 生成する数
   * @param {string} prefix - プレフィックス
   * @param {string} type - 生成タイプ（'default', 'uuid', 'short', 'numeric'）
   * @returns {string[]} 生成されたIDの配列
   */
  static generateBatch(count, prefix = '', type = 'default') {
    try {
      const ids = [];
      
      for (let i = 0; i < count; i++) {
        switch (type) {
          case 'uuid':
            ids.push(this.generateUUID());
            break;
          case 'short':
            ids.push(this.generateShortId());
            break;
          case 'numeric':
            ids.push(this.generateNumericId());
            break;
          case 'sequential':
            ids.push(this.generateSequentialId(prefix));
            break;
          default:
            ids.push(this.generate(prefix));
            break;
        }
      }
      
      return ids;
      
    } catch (error) {
      window.Logger?.error('IdGenerator.generateBatch error:', error);
      return [];
    }
  }

  /**
   * カウンターをリセット
   * テスト用途などで連番をリセットする場合に使用
   */
  static resetCounter() {
    this._counter = 0;
    window.Logger?.debug('IdGenerator: Counter reset to 0');
  }

  /**
   * 現在のカウンター値を取得
   * @returns {number} 現在のカウンター値
   */
  static getCurrentCounter() {
    return this._counter;
  }

  /**
   * 内部用：次のカウンター値を取得
   * @returns {number} インクリメントされたカウンター値
   * @private
   */
  static _getNextCounter() {
    return ++this._counter;
  }
}

// グローバルに登録
window.IdGenerator = IdGenerator;