/**
 * 小規模多機能利用調整システム - Noteモデル
 * 備考を表すモデルクラス
 */

class Note {
  /**
   * Noteコンストラクタ
   * @param {Object} data - 備考データ
   * @param {string} data.id - 備考ID（省略時は自動生成）
   * @param {string} data.targetType - 対象タイプ（"user" | "cell"）
   * @param {string} data.targetId - 対象のID
   * @param {string} data.content - 備考内容
   * @param {Date|string} data.createdAt - 作成日時
   * @param {Date|string} data.updatedAt - 更新日時
   */
  constructor(data = {}) {
    // 依存関係チェック
    if (typeof window.IdGenerator === 'undefined') {
      throw new Error('Note model requires IdGenerator utility');
    }
    if (typeof window.DateUtils === 'undefined') {
      throw new Error('Note model requires DateUtils utility');
    }

    // プロパティの初期化
    this.id = data.id || window.IdGenerator.generate('note');
    this.targetType = data.targetType || '';
    this.targetId = data.targetId || '';
    this.content = data.content || '';

    // 日時の処理
    const now = new Date();
    
    // createdAtの処理
    if (data.createdAt) {
      this.createdAt = this._parseDateTime(data.createdAt);
    } else {
      this.createdAt = new Date(now);
    }

    // updatedAtの処理
    if (data.updatedAt) {
      this.updatedAt = this._parseDateTime(data.updatedAt);
    } else {
      this.updatedAt = new Date(now);
    }

    // バリデーション
    this._validate();
  }

  /**
   * 日時文字列をDateオブジェクトに変換
   * @param {Date|string} dateTime - 変換する日時
   * @returns {Date} Dateオブジェクト
   * @private
   */
  _parseDateTime(dateTime) {
    if (dateTime instanceof Date) {
      return new Date(dateTime);
    }

    if (typeof dateTime === 'string') {
      try {
        // ISO形式の場合
        if (dateTime.includes('T') || dateTime.includes('Z')) {
          const parsed = new Date(dateTime);
          if (!isNaN(parsed.getTime())) {
            return parsed;
          }
        }
        
        // YYYY-MM-DD形式の場合（時刻は00:00:00）
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateTime)) {
          return window.DateUtils.parseDate(dateTime);
        }

        // その他の形式を試行
        const parsed = new Date(dateTime);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }

        throw new Error('Invalid date format');
      } catch (error) {
        window.Logger?.warn('Invalid dateTime format, using current time:', dateTime);
        return new Date();
      }
    }

    return new Date();
  }

  /**
   * バリデーション
   * @private
   */
  _validate() {
    // targetTypeの検証
    const validTargetTypes = ['user', 'cell'];
    if (!validTargetTypes.includes(this.targetType)) {
      throw new Error(`targetType must be one of: ${validTargetTypes.join(', ')}`);
    }

    // targetIdの検証
    if (!this.targetId || typeof this.targetId !== 'string' || this.targetId.trim().length === 0) {
      throw new Error('targetId is required and must be a non-empty string');
    }

    // contentの検証
    if (typeof this.content !== 'string') {
      throw new Error('content must be a string');
    }

    // 内容の長さチェック（AppConfigが利用可能な場合）
    if (window.AppConfig && window.AppConfig.VALIDATION && window.AppConfig.VALIDATION.NOTE_MAX_LENGTH) {
      const maxLength = window.AppConfig.VALIDATION.NOTE_MAX_LENGTH;
      if (this.content.length > maxLength) {
        throw new Error(`Note content must be ${maxLength} characters or less`);
      }
    }

    // 日時の検証
    if (!(this.createdAt instanceof Date) || isNaN(this.createdAt.getTime())) {
      throw new Error('Invalid createdAt');
    }

    if (!(this.updatedAt instanceof Date) || isNaN(this.updatedAt.getTime())) {
      throw new Error('Invalid updatedAt');
    }
  }

  /**
   * 備考内容を更新
   * @param {string} content - 新しい備考内容
   */
  update(content) {
    if (typeof content !== 'string') {
      throw new Error('Content must be a string');
    }

    // 内容の長さチェック
    if (window.AppConfig && window.AppConfig.VALIDATION && window.AppConfig.VALIDATION.NOTE_MAX_LENGTH) {
      const maxLength = window.AppConfig.VALIDATION.NOTE_MAX_LENGTH;
      if (content.length > maxLength) {
        throw new Error(`Note content must be ${maxLength} characters or less`);
      }
    }

    this.content = content;
    this.updatedAt = new Date();

    window.Logger?.debug(`Note ${this.id} updated`);
  }

  /**
   * 備考が空かどうか
   * @returns {boolean} 空かどうか
   */
  isEmpty() {
    return this.content.trim().length === 0;
  }

  /**
   * 備考がユーザー向けかどうか
   * @returns {boolean} ユーザー向けかどうか
   */
  isUserNote() {
    return this.targetType === 'user';
  }

  /**
   * 備考がセル向けかどうか
   * @returns {boolean} セル向けかどうか
   */
  isCellNote() {
    return this.targetType === 'cell';
  }

  /**
   * 作成からの経過時間を取得（分単位）
   * @returns {number} 経過分数
   */
  getMinutesAge() {
    const now = new Date();
    const diffMs = now.getTime() - this.createdAt.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  /**
   * 更新からの経過時間を取得（分単位）
   * @returns {number} 経過分数
   */
  getMinutesSinceUpdate() {
    const now = new Date();
    const diffMs = now.getTime() - this.updatedAt.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  /**
   * 作成・更新日時の表示用文字列を取得
   * @returns {Object} 作成・更新日時の情報
   */
  getDateTimeInfo() {
    return {
      created: window.DateUtils.formatDate(this.createdAt, 'YYYY-MM-DD HH:mm'),
      updated: window.DateUtils.formatDate(this.updatedAt, 'YYYY-MM-DD HH:mm'),
      createdAge: this.getMinutesAge(),
      updatedAge: this.getMinutesSinceUpdate(),
      wasUpdated: !window.DateUtils.isSameDate(this.createdAt, this.updatedAt) || 
                  Math.abs(this.updatedAt.getTime() - this.createdAt.getTime()) > 60000 // 1分以上の差
    };
  }

  /**
   * オブジェクトをJSON形式に変換
   * @returns {Object} JSON形式のオブジェクト
   */
  toJSON() {
    return {
      id: this.id,
      targetType: this.targetType,
      targetId: this.targetId,
      content: this.content,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      // 追加情報
      isEmpty: this.isEmpty(),
      dateTimeInfo: this.getDateTimeInfo()
    };
  }

  /**
   * JSON形式のデータからNoteインスタンスを生成
   * @param {Object} data - JSON形式のデータ
   * @returns {Note} Noteインスタンス
   */
  static fromJSON(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data for Note.fromJSON');
    }

    try {
      return new Note({
        id: data.id,
        targetType: data.targetType,
        targetId: data.targetId,
        content: data.content,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    } catch (error) {
      window.Logger?.error('Error creating Note from JSON:', error);
      throw error;
    }
  }

  /**
   * 複数のJSON形式データからNoteインスタンス配列を生成
   * @param {Array} dataArray - JSON形式データの配列
   * @returns {Note[]} Noteインスタンスの配列
   */
  static fromJSONArray(dataArray) {
    if (!Array.isArray(dataArray)) {
      throw new Error('Input must be an array');
    }

    return dataArray.map((data, index) => {
      try {
        return Note.fromJSON(data);
      } catch (error) {
        window.Logger?.error(`Error creating Note from JSON at index ${index}:`, error);
        throw error;
      }
    });
  }

  /**
   * 指定されたtargetTypeとtargetIdでNoteを検索
   * @param {Note[]} notes - 検索対象のNote配列
   * @param {string} targetType - 対象タイプ
   * @param {string} targetId - 対象ID
   * @returns {Note[]} マッチするNote配列
   */
  static findByTarget(notes, targetType, targetId) {
    if (!Array.isArray(notes)) {
      return [];
    }

    return notes.filter(note => 
      note instanceof Note &&
      note.targetType === targetType &&
      note.targetId === targetId
    );
  }

  /**
   * 文字列表現を取得
   * @returns {string} 文字列表現
   */
  toString() {
    const preview = this.content.length > 30 ? 
      this.content.substring(0, 30) + '...' : 
      this.content;
    return `Note(${this.id}): ${this.targetType}:${this.targetId} "${preview}"`;
  }

  /**
   * 2つのNoteインスタンスが同じかどうかを比較
   * @param {Note} other - 比較対象のNote
   * @returns {boolean} 同じかどうか
   */
  equals(other) {
    if (!(other instanceof Note)) {
      return false;
    }

    return this.id === other.id &&
           this.targetType === other.targetType &&
           this.targetId === other.targetId &&
           this.content === other.content;
  }

  /**
   * Noteインスタンスのクローンを作成
   * @returns {Note} クローンされたNoteインスタンス
   */
  clone() {
    return new Note({
      id: this.id,
      targetType: this.targetType,
      targetId: this.targetId,
      content: this.content,
      createdAt: new Date(this.createdAt),
      updatedAt: new Date(this.updatedAt)
    });
  }
}

// グローバルに登録
window.Note = Note;