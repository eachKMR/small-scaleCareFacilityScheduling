/**
 * UserScheduleData.js
 * 利用者スケジュールデータクラス（v5.0）
 * 
 * 利用者ごとの通いスケジュールを管理
 * - 通い情報：日付ごとのkayoi設定のみ
 * - 泊まり情報：TomariReservationで管理（このクラスは参照しない）
 * 
 * 設計原則：
 * - このクラスは通い情報のみを保持
 * - 泊まり期間はTomariReservation配列を別途管理
 * - 表示ロジックは両方を参照してデフォルト○を決定
 * 
 * @version 5.0
 * @reference L2_通い_データ構造.md v5.0 セクション2.1
 */

export class UserScheduleData {
  /**
   * @param {Object} data
   * @param {string} data.userId - 利用者ID
   * @param {Object} data.kayoiSchedule - 日付ごとの通い情報 { "YYYY-MM-DD": "終日"|"前半"|"後半"|null }
   * @param {string} data.updatedAt - 更新日時（ISO形式）
   */
  constructor(data) {
    this.userId = data.userId;
    this.kayoiSchedule = data.kayoiSchedule || {};
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * バリデーション
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // userId必須チェック
    if (!this.userId) {
      errors.push('利用者IDは必須です');
    }

    // kayoiScheduleのバリデーション
    for (const [date, kayoi] of Object.entries(this.kayoiSchedule)) {
      const kayoiValidation = this._validateKayoi(date, kayoi);
      if (!kayoiValidation.valid) {
        errors.push(...kayoiValidation.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 通い情報のバリデーション
   * @param {string} date
   * @param {string|null} kayoi
   * @returns {Object} { valid: boolean, errors: string[] }
   * @private
   */
  _validateKayoi(date, kayoi) {
    const errors = [];

    // 日付の形式チェック
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
      errors.push(`日付の形式が不正です: ${date}（YYYY-MM-DD）`);
    }

    // kayoiの値チェック
    const validKayoiValues = [null, "終日", "前半", "後半"];
    if (!validKayoiValues.includes(kayoi)) {
      errors.push(`通い情報の値が不正です: ${kayoi}`);
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 通い情報を設定
   * @param {string} date - 日付
   * @param {string|null} kayoi - "終日" | "前半" | "後半" | null
   * @returns {Object} { success: boolean, errors?: string[] }
   */
  setKayoi(date, kayoi) {
    // バリデーション
    const validation = this._validateKayoi(date, kayoi);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // 設定
    if (kayoi === null) {
      // nullは明示的な空欄を意味するため、削除ではなく設定
      this.kayoiSchedule[date] = null;
    } else {
      this.kayoiSchedule[date] = kayoi;
    }
    this.updatedAt = new Date().toISOString();

    return { success: true };
  }

  /**
   * 通い情報を削除（未設定状態に戻す）
   * @param {string} date - 日付
   */
  deleteKayoi(date) {
    delete this.kayoiSchedule[date];
    this.updatedAt = new Date().toISOString();
  }

  /**
   * JSONシリアライズ用
   * @returns {Object}
   */
  toJSON() {
    return {
      userId: this.userId,
      kayoiSchedule: this.kayoiSchedule,
      updatedAt: this.updatedAt
    };
  }

  /**
   * JSONからインスタンスを生成
   * @param {Object} json
   * @returns {UserScheduleData}
   */
  static fromJSON(json) {
    return new UserScheduleData(json);
  }
}
