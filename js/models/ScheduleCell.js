/**
 * 小規模多機能利用調整システム - ScheduleCellモデル
 * 予定セル（1利用者×1日×1種別）を表すモデルクラス
 */

class ScheduleCell {
  /**
   * ScheduleCellコンストラクタ
   * @param {Object} data - セルデータ
   * @param {string} data.userId - 利用者ID
   * @param {Date|string} data.date - 日付
   * @param {string} data.cellType - セルタイプ（"dayStay" | "visit"）
   * @param {string} data.inputValue - ユーザー入力値
   * @param {string} data.note - セル備考
   * @param {Object} data.actualFlags - 計算結果フラグ
   */
  constructor(data = {}) {
    // 依存関係チェック
    if (typeof window.DateUtils === 'undefined') {
      throw new Error('ScheduleCell model requires DateUtils utility');
    }

    // プロパティの初期化
    this.userId = data.userId || '';
    this.cellType = data.cellType || 'dayStay';
    this.inputValue = data.inputValue || '';
    this.note = data.note || '';

    // 日付の処理
    if (data.date) {
      if (typeof data.date === 'string') {
        try {
          this.date = window.DateUtils.parseDate(data.date);
        } catch (error) {
          window.Logger?.warn('Invalid date format, using current date:', data.date);
          this.date = window.DateUtils.today();
        }
      } else if (data.date instanceof Date) {
        this.date = new Date(data.date);
      } else {
        this.date = window.DateUtils.today();
      }
    } else {
      this.date = window.DateUtils.today();
    }

    // actualFlagsの初期化
    this.actualFlags = {
      day: false,
      stay: false,
      visit: 0,
      ...(data.actualFlags || {})
    };

    // バリデーション
    this._validate();
  }

  /**
   * バリデーション
   * @private
   */
  _validate() {
    // userIdの検証
    if (!this.userId || typeof this.userId !== 'string') {
      throw new Error('userId is required and must be a string');
    }

    // cellTypeの検証
    const validCellTypes = ['dayStay', 'visit'];
    if (!validCellTypes.includes(this.cellType)) {
      throw new Error(`cellType must be one of: ${validCellTypes.join(', ')}`);
    }

    // inputValueの検証
    if (typeof this.inputValue !== 'string') {
      throw new Error('inputValue must be a string');
    }

    // noteの検証
    if (typeof this.note !== 'string') {
      throw new Error('note must be a string');
    }

    // 日付の検証
    if (!(this.date instanceof Date) || isNaN(this.date.getTime())) {
      throw new Error('Invalid date');
    }

    // actualFlagsの検証
    if (!this.actualFlags || typeof this.actualFlags !== 'object') {
      throw new Error('actualFlags must be an object');
    }

    if (typeof this.actualFlags.day !== 'boolean') {
      this.actualFlags.day = false;
    }

    if (typeof this.actualFlags.stay !== 'boolean') {
      this.actualFlags.stay = false;
    }

    if (typeof this.actualFlags.visit !== 'number' || this.actualFlags.visit < 0) {
      this.actualFlags.visit = 0;
    }
  }

  /**
   * セルが空かどうか
   * @returns {boolean} 空かどうか
   */
  isEmpty() {
    return this.inputValue.trim().length === 0;
  }

  /**
   * 宿泊開始（入所）かどうか
   * @returns {boolean} 入所かどうか
   */
  isStayStart() {
    return this.inputValue.trim() === '入所';
  }

  /**
   * 宿泊終了（退所）かどうか
   * @returns {boolean} 退所かどうか
   */
  isStayEnd() {
    return this.inputValue.trim() === '退所';
  }

  /**
   * 備考があるかどうか
   * @returns {boolean} 備考があるかどうか
   */
  hasNote() {
    return this.note.trim().length > 0;
  }

  /**
   * 通いサービスが提供されるかどうか
   * @returns {boolean} 通いサービスが提供されるか
   */
  isDayService() {
    return this.actualFlags.day;
  }

  /**
   * 宿泊サービスが提供されるかどうか
   * @returns {boolean} 宿泊サービスが提供されるか
   */
  isStayService() {
    return this.actualFlags.stay;
  }

  /**
   * 訪問サービスが提供されるかどうか
   * @returns {boolean} 訪問サービスが提供されるか
   */
  hasVisitService() {
    return this.actualFlags.visit > 0;
  }

  /**
   * 訪問回数を取得
   * @returns {number} 訪問回数
   */
  getVisitCount() {
    return this.actualFlags.visit;
  }

  /**
   * セルIDを生成（userId_date_cellType形式）
   * @returns {string} セルID
   */
  getCellId() {
    const dateStr = window.DateUtils.formatDate(this.date);
    return `${this.userId}_${dateStr}_${this.cellType}`;
  }

  /**
   * 日付文字列を取得
   * @returns {string} YYYY-MM-DD形式の日付文字列
   */
  getDateString() {
    return window.DateUtils.formatDate(this.date);
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
   * 数値入力かどうかをチェック
   * @returns {boolean} 数値入力かどうか
   */
  isNumericInput() {
    const trimmed = this.inputValue.trim();
    return /^\d+$/.test(trimmed);
  }

  /**
   * 数値入力の値を取得
   * @returns {number} 数値（数値でない場合は0）
   */
  getNumericValue() {
    const trimmed = this.inputValue.trim();
    const parsed = parseInt(trimmed, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * 特別な入力値かどうかをチェック
   * @returns {boolean} 特別な入力値かどうか
   */
  isSpecialInput() {
    const specialValues = ['入所', '退所', '外泊', '一時帰宅', '入院'];
    return specialValues.includes(this.inputValue.trim());
  }

  /**
   * セルの表示用文字列を取得
   * @returns {string} 表示用文字列
   */
  getDisplayValue() {
    if (this.isEmpty()) {
      return '';
    }

    const value = this.inputValue.trim();
    
    // 特別な値はそのまま表示
    if (this.isSpecialInput()) {
      return value;
    }

    // 数値は回数として表示
    if (this.isNumericInput()) {
      const count = this.getNumericValue();
      if (this.cellType === 'visit') {
        return count > 0 ? `${count}回` : '';
      } else {
        return count > 0 ? count.toString() : '';
      }
    }

    return value;
  }

  /**
   * セルの状態情報を取得
   * @returns {Object} セルの状態情報
   */
  getStatusInfo() {
    return {
      isEmpty: this.isEmpty(),
      hasNote: this.hasNote(),
      isStayStart: this.isStayStart(),
      isStayEnd: this.isStayEnd(),
      isNumericInput: this.isNumericInput(),
      isSpecialInput: this.isSpecialInput(),
      isDayService: this.isDayService(),
      isStayService: this.isStayService(),
      hasVisitService: this.hasVisitService(),
      visitCount: this.getVisitCount(),
      displayValue: this.getDisplayValue(),
      dayOfWeek: this.getDayOfWeek(),
      isWeekend: this.isWeekend()
    };
  }

  /**
   * actualFlagsをリセット
   */
  resetActualFlags() {
    this.actualFlags = {
      day: false,
      stay: false,
      visit: 0
    };
  }

  /**
   * actualFlagsを設定
   * @param {Object} flags - 設定するフラグ
   */
  setActualFlags(flags = {}) {
    this.actualFlags = {
      day: flags.day || false,
      stay: flags.stay || false,
      visit: flags.visit || 0
    };
  }

  /**
   * オブジェクトをJSON形式に変換
   * @returns {Object} JSON形式のオブジェクト
   */
  toJSON() {
    return {
      userId: this.userId,
      date: window.DateUtils.formatDate(this.date),
      cellType: this.cellType,
      inputValue: this.inputValue,
      note: this.note,
      actualFlags: { ...this.actualFlags },
      // 追加情報
      cellId: this.getCellId(),
      statusInfo: this.getStatusInfo()
    };
  }

  /**
   * JSON形式のデータからScheduleCellインスタンスを生成
   * @param {Object} data - JSON形式のデータ
   * @returns {ScheduleCell} ScheduleCellインスタンス
   */
  static fromJSON(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data for ScheduleCell.fromJSON');
    }

    try {
      return new ScheduleCell({
        userId: data.userId,
        date: data.date,
        cellType: data.cellType,
        inputValue: data.inputValue,
        note: data.note,
        actualFlags: data.actualFlags
      });
    } catch (error) {
      window.Logger?.error('Error creating ScheduleCell from JSON:', error);
      throw error;
    }
  }

  /**
   * 複数のJSON形式データからScheduleCellインスタンス配列を生成
   * @param {Array} dataArray - JSON形式データの配列
   * @returns {ScheduleCell[]} ScheduleCellインスタンスの配列
   */
  static fromJSONArray(dataArray) {
    if (!Array.isArray(dataArray)) {
      throw new Error('Input must be an array');
    }

    return dataArray.map((data, index) => {
      try {
        return ScheduleCell.fromJSON(data);
      } catch (error) {
        window.Logger?.error(`Error creating ScheduleCell from JSON at index ${index}:`, error);
        throw error;
      }
    });
  }

  /**
   * 空のセルを作成
   * @param {string} userId - 利用者ID
   * @param {Date|string} date - 日付
   * @param {string} cellType - セルタイプ
   * @returns {ScheduleCell} 空のScheduleCellインスタンス
   */
  static createEmpty(userId, date, cellType = 'dayStay') {
    return new ScheduleCell({
      userId,
      date,
      cellType,
      inputValue: '',
      note: '',
      actualFlags: { day: false, stay: false, visit: 0 }
    });
  }

  /**
   * 文字列表現を取得
   * @returns {string} 文字列表現
   */
  toString() {
    const dateStr = this.getDateString();
    const displayValue = this.getDisplayValue();
    return `ScheduleCell(${this.getCellId()}): "${displayValue}" [${this.cellType}]`;
  }

  /**
   * 2つのScheduleCellインスタンスが同じかどうかを比較
   * @param {ScheduleCell} other - 比較対象のScheduleCell
   * @returns {boolean} 同じかどうか
   */
  equals(other) {
    if (!(other instanceof ScheduleCell)) {
      return false;
    }

    return this.userId === other.userId &&
           window.DateUtils.isSameDate(this.date, other.date) &&
           this.cellType === other.cellType &&
           this.inputValue === other.inputValue &&
           this.note === other.note;
  }

  /**
   * ScheduleCellインスタンスのクローンを作成
   * @returns {ScheduleCell} クローンされたScheduleCellインスタンス
   */
  clone() {
    return new ScheduleCell({
      userId: this.userId,
      date: new Date(this.date),
      cellType: this.cellType,
      inputValue: this.inputValue,
      note: this.note,
      actualFlags: { ...this.actualFlags }
    });
  }
}

// グローバルに登録
window.ScheduleCell = ScheduleCell;