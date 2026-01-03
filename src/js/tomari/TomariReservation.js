/**
 * TomariReservation.js
 * 泊まり予約データクラス (v2.0)
 * 
 * 泊まり予約を管理
 * - roomId: null 対応（未割当状態）
 * - 期間管理（入所日～退所日）
 * 
 * @version 2.0
 * @reference L2_泊まり_データ構造.md v2.0 セクション2.2
 */

export class TomariReservation {
  /**
   * @param {Object} data
   * @param {string} data.id - 一意識別子（自動生成）
   * @param {string} data.userId - 利用者ID
   * @param {string|null} data.roomId - 居室ID（nullは未割当を表す）
   * @param {string} data.startDate - 入所日 "YYYY-MM-DD"
   * @param {string} data.endDate - 退所日 "YYYY-MM-DD"
   * @param {string} data.status - "計画"|"実施"|"中止"
   * @param {string} data.note - メモ
   * @param {string} data.createdAt - 作成日時（ISO形式）
   * @param {string} data.updatedAt - 更新日時（ISO形式）
   */
  constructor(data) {
    this.id = data.id || this.#generateId(data.startDate);
    this.userId = data.userId;
    this.roomId = data.roomId !== undefined ? data.roomId : null;
    this.startDate = data.startDate; // "YYYY-MM-DD"
    this.endDate = data.endDate;     // "YYYY-MM-DD"
    this.status = data.status || "計画";
    this.note = data.note || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * ID生成（内部使用）
   * @param {string} startDate
   * @returns {string}
   * @private
   */
  #generateId(startDate) {
    const dateStr = startDate.replace(/-/g, '');
    const sequence = Math.floor(Math.random() * 1000);
    return `tomari_${dateStr}_${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * バリデーション
   * @returns {Object} { valid: boolean, error?: string }
   */
  validate() {
    if (!this.userId) return { valid: false, error: '利用者IDは必須です' };
    // roomIdはnull許可（未割当の場合）
    if (!this.startDate) return { valid: false, error: '入所日は必須です' };
    if (!this.endDate) return { valid: false, error: '退所日は必須です' };
    
    // 日付の形式チェック
    if (!this.#isValidDate(this.startDate)) {
      return { valid: false, error: '入所日の形式が不正です' };
    }
    if (!this.#isValidDate(this.endDate)) {
      return { valid: false, error: '退所日の形式が不正です' };
    }
    
    // 日付の前後関係チェック
    if (this.startDate >= this.endDate) {
      return { valid: false, error: '退所日は入所日より後である必要があります' };
    }
    
    return { valid: true };
  }

  /**
   * 日付形式のチェック
   * @param {string} date
   * @returns {boolean}
   * @private
   */
  #isValidDate(date) {
    // "YYYY-MM-DD" 形式のチェック
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    
    // 実在する日付かチェック
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  /**
   * 未割当かどうか
   * @returns {boolean}
   */
  isUnassigned() {
    return this.roomId === null;
  }

  /**
   * 部屋を割り当て
   * @param {string} roomId - 居室ID
   */
  assignRoom(roomId) {
    this.roomId = roomId;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 部屋の割り当てを解除
   */
  unassignRoom() {
    this.roomId = null;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * 指定日の状態を取得
   * @param {string} date - 日付 "YYYY-MM-DD"
   * @returns {string|null} "入所"|"継続"|"退所"|null
   */
  getStatusForDate(date) {
    if (!this.includesDate(date)) return null;
    if (date === this.startDate) return "入所";
    if (date === this.endDate) return "退所";
    return "継続";
  }

  /**
   * 指定日が期間内かチェック
   * @param {string} date - 日付 "YYYY-MM-DD"
   * @returns {boolean}
   */
  includesDate(date) {
    return this.startDate <= date && date <= this.endDate;
  }

  /**
   * 期間内の日数を計算
   * @returns {number}
   */
  getDays() {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // 開始日を含めるため+1
  }

  /**
   * JSONシリアライズ用
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      roomId: this.roomId,
      startDate: this.startDate,
      endDate: this.endDate,
      status: this.status,
      note: this.note,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * JSONからインスタンスを生成
   * @param {Object} data
   * @returns {TomariReservation}
   */
  static fromJSON(data) {
    return new TomariReservation(data);
  }
}
