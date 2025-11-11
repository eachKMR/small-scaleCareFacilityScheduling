/**
 * 小規模多機能利用調整システム - Userモデル
 * 利用者を表すモデルクラス
 */

class User {
  /**
   * Userコンストラクタ
   * @param {Object} data - 利用者データ
   * @param {string} data.id - 利用者ID（省略時は自動生成）
   * @param {string} data.name - 氏名
   * @param {Date|string} data.registrationDate - 登録日
   * @param {string} data.note - 備考
   * @param {boolean} data.isActive - 利用中フラグ
   */
  constructor(data = {}) {
    // 依存関係チェック
    if (typeof window.IdGenerator === 'undefined') {
      throw new Error('User model requires IdGenerator utility');
    }
    if (typeof window.DateUtils === 'undefined') {
      throw new Error('User model requires DateUtils utility');
    }

    // プロパティの初期化
    this.id = data.id || window.IdGenerator.generate('user');
    this.name = data.name || '';
    this.note = data.note || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;

    // registrationDateの処理
    if (data.registrationDate) {
      if (typeof data.registrationDate === 'string') {
        try {
          this.registrationDate = window.DateUtils.parseDate(data.registrationDate);
        } catch (error) {
          window.Logger?.warn('Invalid registrationDate format, using current date:', data.registrationDate);
          this.registrationDate = new Date();
        }
      } else if (data.registrationDate instanceof Date) {
        this.registrationDate = new Date(data.registrationDate);
      } else {
        this.registrationDate = new Date();
      }
    } else {
      this.registrationDate = new Date();
    }

    // バリデーション
    this._validate();
  }

  /**
   * バリデーション
   * @private
   */
  _validate() {
    if (!this.name || typeof this.name !== 'string' || this.name.trim().length === 0) {
      throw new Error('User name is required and must be a non-empty string');
    }

    if (!(this.registrationDate instanceof Date) || isNaN(this.registrationDate.getTime())) {
      throw new Error('Invalid registrationDate');
    }

    if (typeof this.isActive !== 'boolean') {
      throw new Error('isActive must be a boolean value');
    }

    // 名前の長さチェック（AppConfigが利用可能な場合）
    if (window.AppConfig && window.AppConfig.VALIDATION && window.AppConfig.VALIDATION.USER_NAME_MAX_LENGTH) {
      const maxLength = window.AppConfig.VALIDATION.USER_NAME_MAX_LENGTH;
      if (this.name.length > maxLength) {
        throw new Error(`User name must be ${maxLength} characters or less`);
      }
    }
  }

  /**
   * 利用者が現在利用中かどうか
   * @returns {boolean} 利用中かどうか
   */
  isCurrentlyActive() {
    return this.isActive;
  }

  /**
   * 利用者の状態を変更
   * @param {boolean} active - 新しい状態
   */
  setActive(active) {
    if (typeof active !== 'boolean') {
      throw new Error('Active status must be a boolean value');
    }
    this.isActive = active;
  }

  /**
   * 備考を更新
   * @param {string} note - 新しい備考
   */
  updateNote(note) {
    if (typeof note !== 'string') {
      throw new Error('Note must be a string');
    }
    this.note = note;
  }

  /**
   * 登録からの経過日数を取得
   * @returns {number} 経過日数
   */
  getDaysSinceRegistration() {
    const today = window.DateUtils.today();
    return window.DateUtils.daysBetween(this.registrationDate, today);
  }

  /**
   * 登録日の年月を取得
   * @returns {string} YYYY-MM形式の年月
   */
  getRegistrationYearMonth() {
    return window.DateUtils.getYearMonth(this.registrationDate);
  }

  /**
   * オブジェクトをJSON形式に変換
   * @returns {Object} JSON形式のオブジェクト
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      registrationDate: window.DateUtils.formatDate(this.registrationDate),
      note: this.note,
      isActive: this.isActive,
      // 追加情報
      daysSinceRegistration: this.getDaysSinceRegistration(),
      registrationYearMonth: this.getRegistrationYearMonth()
    };
  }

  /**
   * JSON形式のデータからUserインスタンスを生成
   * @param {Object} data - JSON形式のデータ
   * @returns {User} Userインスタンス
   */
  static fromJSON(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data for User.fromJSON');
    }

    try {
      return new User({
        id: data.id,
        name: data.name,
        registrationDate: data.registrationDate,
        note: data.note,
        isActive: data.isActive
      });
    } catch (error) {
      window.Logger?.error('Error creating User from JSON:', error);
      throw error;
    }
  }

  /**
   * 複数のJSON形式データからUserインスタンス配列を生成
   * @param {Array} dataArray - JSON形式データの配列
   * @returns {User[]} Userインスタンスの配列
   */
  static fromJSONArray(dataArray) {
    if (!Array.isArray(dataArray)) {
      throw new Error('Input must be an array');
    }

    return dataArray.map((data, index) => {
      try {
        return User.fromJSON(data);
      } catch (error) {
        window.Logger?.error(`Error creating User from JSON at index ${index}:`, error);
        throw error;
      }
    });
  }

  /**
   * デフォルトユーザーデータからUserインスタンス配列を生成
   * @returns {User[]} Userインスタンスの配列
   */
  static fromDefaultUsers() {
    if (typeof window.DEFAULT_USERS === 'undefined') {
      window.Logger?.warn('DEFAULT_USERS not found');
      return [];
    }

    try {
      return window.DEFAULT_USERS.map(userData => new User({
        id: userData.id,
        name: userData.name,
        registrationDate: userData.registrationDate,
        note: userData.note || '',
        isActive: userData.isActive !== undefined ? userData.isActive : true
      }));
    } catch (error) {
      window.Logger?.error('Error creating Users from DEFAULT_USERS:', error);
      return [];
    }
  }

  /**
   * 文字列表現を取得
   * @returns {string} 文字列表現
   */
  toString() {
    const status = this.isActive ? '利用中' : '停止中';
    return `User(${this.id}): ${this.name} [${status}]`;
  }

  /**
   * 2つのUserインスタンスが同じかどうかを比較
   * @param {User} other - 比較対象のUser
   * @returns {boolean} 同じかどうか
   */
  equals(other) {
    if (!(other instanceof User)) {
      return false;
    }

    return this.id === other.id &&
           this.name === other.name &&
           window.DateUtils.isSameDate(this.registrationDate, other.registrationDate) &&
           this.note === other.note &&
           this.isActive === other.isActive;
  }

  /**
   * Userインスタンスのクローンを作成
   * @returns {User} クローンされたUserインスタンス
   */
  clone() {
    return new User({
      id: this.id,
      name: this.name,
      registrationDate: new Date(this.registrationDate),
      note: this.note,
      isActive: this.isActive
    });
  }
}

// グローバルに登録
window.User = User;