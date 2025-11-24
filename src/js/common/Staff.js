/**
 * Staff.js
 * スタッフクラス
 * 
 * Phase 1では最小限の実装
 */

export class Staff {
  /**
   * @param {Object} data
   * @param {string} data.staffId - "staff001" 形式
   * @param {string} data.name - スタッフ名
   */
  constructor(data) {
    this.staffId = data.staffId;
    this.name = data.name;
  }

  /**
   * JSONシリアライズ用
   * @returns {Object}
   */
  toJSON() {
    return {
      staffId: this.staffId,
      name: this.name
    };
  }

  /**
   * JSONから復元
   * @param {Object} json
   * @returns {Staff}
   */
  static fromJSON(json) {
    return new Staff(json);
  }
}
