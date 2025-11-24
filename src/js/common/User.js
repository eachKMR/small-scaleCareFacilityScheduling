/**
 * User.js
 * 利用者クラス
 * 
 * 登録定員29人の管理を行う
 */

import { ValidationUtils } from './utils/ValidationUtils.js';

export class User {
  /**
   * 最大登録定員
   */
  static MAX_USERS = 29;

  /**
   * @param {Object} data
   * @param {string} data.userId - "user001" 形式
   * @param {string} data.name - 利用者名
   * @param {string} data.displayName - 表示名（任意、なければnameを使用）
   * @param {string} data.registrationDate - 登録日 "YYYY-MM-DD"
   * @param {number} data.sortId - 表示順（1-29）
   */
  constructor(data) {
    this.userId = data.userId;
    this.name = data.name;
    this.displayName = data.displayName || data.name;
    this.registrationDate = data.registrationDate;
    this.sortId = data.sortId;
  }

  /**
   * バリデーション
   * @returns {Object} { ok: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!ValidationUtils.isValidUserId(this.userId)) {
      errors.push('userIdの形式が不正です');
    }

    if (ValidationUtils.isEmpty(this.name)) {
      errors.push('名前は必須です');
    }

    if (!ValidationUtils.isWithinLength(this.name, 50)) {
      errors.push('名前は50文字以内です');
    }

    if (this.registrationDate && !ValidationUtils.isValidDateFormat(this.registrationDate)) {
      errors.push('登録日の形式が不正です');
    }

    if (!ValidationUtils.isInRange(this.sortId, 1, User.MAX_USERS)) {
      errors.push(`sortIdは1-${User.MAX_USERS}の範囲です`);
    }

    return {
      ok: errors.length === 0,
      errors
    };
  }

  /**
   * JSONシリアライズ用
   * @returns {Object}
   */
  toJSON() {
    return {
      userId: this.userId,
      name: this.name,
      displayName: this.displayName,
      registrationDate: this.registrationDate,
      sortId: this.sortId
    };
  }

  /**
   * JSONから復元
   * @param {Object} json
   * @returns {User}
   */
  static fromJSON(json) {
    return new User(json);
  }

  /**
   * 新規ユーザーIDを生成
   * @param {User[]} existingUsers - 既存ユーザーリスト
   * @returns {string} - "user001" 形式
   */
  static generateNewUserId(existingUsers) {
    const usedIds = existingUsers.map(u => parseInt(u.userId.replace('user', '')));
    
    for (let i = 1; i <= User.MAX_USERS; i++) {
      if (!usedIds.includes(i)) {
        return `user${String(i).padStart(3, '0')}`;
      }
    }
    
    throw new Error(`登録定員${User.MAX_USERS}人に達しています`);
  }

  /**
   * 次のsortIdを取得
   * @param {User[]} existingUsers - 既存ユーザーリスト
   * @returns {number}
   */
  static getNextSortId(existingUsers) {
    if (existingUsers.length === 0) return 1;
    
    const maxSortId = Math.max(...existingUsers.map(u => u.sortId));
    return maxSortId + 1;
  }
}
