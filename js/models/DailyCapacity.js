/**
 * 小規模多機能利用調整システム - DailyCapacityモデル
 * 特定日の定員状況を表すモデルクラス
 */

class DailyCapacity {
  /**
   * DailyCapacityコンストラクタ
   * @param {Date|string} date - 対象日
   */
  constructor(date) {
    // 依存関係チェック
    if (typeof window.DateUtils === 'undefined') {
      throw new Error('DailyCapacity model requires DateUtils utility');
    }
    if (typeof window.AppConfig === 'undefined') {
      throw new Error('DailyCapacity model requires AppConfig');
    }

    // 日付の処理
    if (date) {
      if (typeof date === 'string') {
        try {
          this.date = window.DateUtils.parseDate(date);
        } catch (error) {
          window.Logger?.warn('Invalid date format, using current date:', date);
          this.date = window.DateUtils.today();
        }
      } else if (date instanceof Date) {
        this.date = new Date(date);
      } else {
        this.date = window.DateUtils.today();
      }
    } else {
      this.date = window.DateUtils.today();
    }

    // 定員情報の初期化
    this.dayCount = 0;      // 通い利用者数
    this.stayCount = 0;     // 泊り利用者数
    this.visitCount = 0;    // 訪問回数合計

    // 定員オーバーフラグ
    this.dayOver = false;   // 通い定員オーバー
    this.stayOver = false;  // 泊り定員オーバー

    // 利用者リスト
    this.dayUsers = [];     // 通い利用者リスト
    this.stayUsers = [];    // 泊り利用者リスト

    // 定員設定を取得
    this.dayCapacity = window.AppConfig.CAPACITY.DAY;
    this.stayCapacity = window.AppConfig.CAPACITY.STAY;

    // バリデーション
    this._validate();
  }

  /**
   * バリデーション
   * @private
   */
  _validate() {
    // 日付の検証
    if (!(this.date instanceof Date) || isNaN(this.date.getTime())) {
      throw new Error('Invalid date');
    }

    // 数値プロパティの検証と修正
    if (typeof this.dayCount !== 'number' || this.dayCount < 0) {
      this.dayCount = 0;
    }
    if (typeof this.stayCount !== 'number' || this.stayCount < 0) {
      this.stayCount = 0;
    }
    if (typeof this.visitCount !== 'number' || this.visitCount < 0) {
      this.visitCount = 0;
    }

    // 配列プロパティの検証と修正
    if (!Array.isArray(this.dayUsers)) {
      this.dayUsers = [];
    }
    if (!Array.isArray(this.stayUsers)) {
      this.stayUsers = [];
    }

    // 定員オーバーフラグの更新
    this._updateOverFlags();
  }

  /**
   * 定員オーバーフラグを更新
   * @private
   */
  _updateOverFlags() {
    this.dayOver = this.dayCount >= this.dayCapacity;
    this.stayOver = this.stayCount >= this.stayCapacity;
  }

  /**
   * 定員オーバーかどうか
   * @returns {boolean} いずれかの定員がオーバーしているか
   */
  isOverCapacity() {
    return this.dayOver || this.stayOver;
  }

  /**
   * 通い定員の残り人数を取得
   * @returns {number} 残り人数（負数の場合は超過人数）
   */
  getDayRemaining() {
    return this.dayCapacity - this.dayCount;
  }

  /**
   * 泊り定員の残り人数を取得
   * @returns {number} 残り人数（負数の場合は超過人数）
   */
  getStayRemaining() {
    return this.stayCapacity - this.stayCount;
  }

  /**
   * 通い定員の使用率を取得
   * @returns {number} 使用率（0-1の範囲、1を超える場合もある）
   */
  getDayUsageRate() {
    return this.dayCapacity > 0 ? this.dayCount / this.dayCapacity : 0;
  }

  /**
   * 泊り定員の使用率を取得
   * @returns {number} 使用率（0-1の範囲、1を超える場合もある）
   */
  getStayUsageRate() {
    return this.stayCapacity > 0 ? this.stayCount / this.stayCapacity : 0;
  }

  /**
   * ステータスアイコンを取得
   * @returns {string} ステータスアイコン
   */
  getStatusIcon() {
    if (this.isOverCapacity()) {
      return '✗'; // 定員オーバー
    }

    // 定員ギリギリ（定員-1）の場合は警告
    const dayWarning = this.dayCount >= (this.dayCapacity - 1);
    const stayWarning = this.stayCount >= (this.stayCapacity - 1);

    if (dayWarning || stayWarning) {
      return '⚠'; // 定員ギリギリ
    }

    return '✓'; // 正常
  }

  /**
   * ステータスの色を取得
   * @returns {string} ステータスの色クラス
   */
  getStatusColor() {
    if (this.isOverCapacity()) {
      return 'error';
    }

    const dayWarning = this.dayCount >= (this.dayCapacity - 1);
    const stayWarning = this.stayCount >= (this.stayCapacity - 1);

    if (dayWarning || stayWarning) {
      return 'warning';
    }

    return 'success';
  }

  /**
   * サマリー文字列を取得
   * @returns {string} "通い: 12/15 | 泊り: 7/9"形式の文字列
   */
  getSummary() {
    return `通い: ${this.dayCount}/${this.dayCapacity} | 泊り: ${this.stayCount}/${this.stayCapacity}`;
  }

  /**
   * 詳細サマリー文字列を取得
   * @returns {string} 詳細な情報を含むサマリー
   */
  getDetailedSummary() {
    const dayStatus = this.dayOver ? '超過' : `残り${this.getDayRemaining()}名`;
    const stayStatus = this.stayOver ? '超過' : `残り${this.getStayRemaining()}名`;
    const visitInfo = this.visitCount > 0 ? ` | 訪問: ${this.visitCount}回` : '';

    return `通い: ${this.dayCount}/${this.dayCapacity} (${dayStatus}) | 泊り: ${this.stayCount}/${this.stayCapacity} (${stayStatus})${visitInfo}`;
  }

  /**
   * 日付文字列を取得
   * @param {string} format - フォーマット（デフォルト: 'YYYY-MM-DD'）
   * @returns {string} フォーマットされた日付文字列
   */
  getDateString(format = 'YYYY-MM-DD') {
    return window.DateUtils.formatDate(this.date, format);
  }

  /**
   * 曜日を取得
   * @returns {string} 曜日文字列
   */
  getDayOfWeek() {
    return window.DateUtils.getDayOfWeek(this.date);
  }

  /**
   * 週末かどうか
   * @returns {boolean} 週末かどうか
   */
  isWeekend() {
    return window.DateUtils.isWeekend(this.date);
  }

  /**
   * 通い利用者を追加
   * @param {User|Object} user - 追加する利用者
   */
  addDayUser(user) {
    if (!user) return;

    // 重複チェック
    const userId = user.id || user.userId || user;
    if (!this.dayUsers.find(u => (u.id || u.userId || u) === userId)) {
      this.dayUsers.push(user);
      this.dayCount = this.dayUsers.length;
      this._updateOverFlags();
    }
  }

  /**
   * 泊り利用者を追加
   * @param {User|Object} user - 追加する利用者
   */
  addStayUser(user) {
    if (!user) return;

    // 重複チェック
    const userId = user.id || user.userId || user;
    if (!this.stayUsers.find(u => (u.id || u.userId || u) === userId)) {
      this.stayUsers.push(user);
      this.stayCount = this.stayUsers.length;
      this._updateOverFlags();
    }
  }

  /**
   * 訪問回数を追加
   * @param {number} count - 追加する回数
   */
  addVisitCount(count) {
    if (typeof count === 'number' && count > 0) {
      this.visitCount += count;
    }
  }

  /**
   * データをリセット
   */
  reset() {
    this.dayCount = 0;
    this.stayCount = 0;
    this.visitCount = 0;
    this.dayUsers = [];
    this.stayUsers = [];
    this._updateOverFlags();
  }

  /**
   * 容量情報を取得
   * @returns {Object} 容量情報
   */
  getCapacityInfo() {
    return {
      date: this.getDateString(),
      dayOfWeek: this.getDayOfWeek(),
      isWeekend: this.isWeekend(),
      day: {
        count: this.dayCount,
        capacity: this.dayCapacity,
        remaining: this.getDayRemaining(),
        usageRate: this.getDayUsageRate(),
        isOver: this.dayOver,
        users: this.dayUsers.length
      },
      stay: {
        count: this.stayCount,
        capacity: this.stayCapacity,
        remaining: this.getStayRemaining(),
        usageRate: this.getStayUsageRate(),
        isOver: this.stayOver,
        users: this.stayUsers.length
      },
      visit: {
        count: this.visitCount
      },
      status: {
        icon: this.getStatusIcon(),
        color: this.getStatusColor(),
        isOverCapacity: this.isOverCapacity(),
        summary: this.getSummary(),
        detailedSummary: this.getDetailedSummary()
      }
    };
  }

  /**
   * オブジェクトをJSON形式に変換
   * @returns {Object} JSON形式のオブジェクト
   */
  toJSON() {
    return {
      date: this.getDateString(),
      dayCount: this.dayCount,
      stayCount: this.stayCount,
      visitCount: this.visitCount,
      dayOver: this.dayOver,
      stayOver: this.stayOver,
      dayUsers: this.dayUsers,
      stayUsers: this.stayUsers,
      // 容量設定
      dayCapacity: this.dayCapacity,
      stayCapacity: this.stayCapacity,
      // 追加情報
      capacityInfo: this.getCapacityInfo()
    };
  }

  /**
   * JSON形式のデータからDailyCapacityインスタンスを生成
   * @param {Object} data - JSON形式のデータ
   * @returns {DailyCapacity} DailyCapacityインスタンス
   */
  static fromJSON(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data for DailyCapacity.fromJSON');
    }

    try {
      const capacity = new DailyCapacity(data.date);

      capacity.dayCount = data.dayCount || 0;
      capacity.stayCount = data.stayCount || 0;
      capacity.visitCount = data.visitCount || 0;
      capacity.dayUsers = data.dayUsers || [];
      capacity.stayUsers = data.stayUsers || [];

      capacity._updateOverFlags();

      return capacity;
    } catch (error) {
      window.Logger?.error('Error creating DailyCapacity from JSON:', error);
      throw error;
    }
  }

  /**
   * 複数のJSON形式データからDailyCapacityインスタンス配列を生成
   * @param {Array} dataArray - JSON形式データの配列
   * @returns {DailyCapacity[]} DailyCapacityインスタンスの配列
   */
  static fromJSONArray(dataArray) {
    if (!Array.isArray(dataArray)) {
      throw new Error('Input must be an array');
    }

    return dataArray.map((data, index) => {
      try {
        return DailyCapacity.fromJSON(data);
      } catch (error) {
        window.Logger?.error(`Error creating DailyCapacity from JSON at index ${index}:`, error);
        throw error;
      }
    });
  }

  /**
   * 空のDailyCapacityを作成
   * @param {Date|string} date - 日付
   * @returns {DailyCapacity} 空のDailyCapacityインスタンス
   */
  static createEmpty(date) {
    return new DailyCapacity(date);
  }

  /**
   * 文字列表現を取得
   * @returns {string} 文字列表現
   */
  toString() {
    return `DailyCapacity(${this.getDateString()}): ${this.getSummary()} [${this.getStatusIcon()}]`;
  }

  /**
   * 2つのDailyCapacityインスタンスが同じかどうかを比較
   * @param {DailyCapacity} other - 比較対象のDailyCapacity
   * @returns {boolean} 同じかどうか
   */
  equals(other) {
    if (!(other instanceof DailyCapacity)) {
      return false;
    }

    return window.DateUtils.isSameDate(this.date, other.date) &&
           this.dayCount === other.dayCount &&
           this.stayCount === other.stayCount &&
           this.visitCount === other.visitCount;
  }

  /**
   * DailyCapacityインスタンスのクローンを作成
   * @returns {DailyCapacity} クローンされたDailyCapacityインスタンス
   */
  clone() {
    const cloned = new DailyCapacity(new Date(this.date));
    cloned.dayCount = this.dayCount;
    cloned.stayCount = this.stayCount;
    cloned.visitCount = this.visitCount;
    cloned.dayUsers = [...this.dayUsers];
    cloned.stayUsers = [...this.stayUsers];
    cloned._updateOverFlags();
    return cloned;
  }
}

// グローバルに登録
window.DailyCapacity = DailyCapacity;