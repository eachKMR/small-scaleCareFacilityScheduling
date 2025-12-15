/**
 * KayoiSchedule.js
 * 通いスケジュールクラス
 * 
 * 通いの予定データを管理
 * @version 3.0 - 送迎タイプ追加
 */

import { ValidationUtils } from '../common/utils/ValidationUtils.js';

export class KayoiSchedule {
  /**
   * @param {Object} data
   * @param {string} data.id - 一意識別子（自動生成）
   * @param {string} data.userId - 利用者ID
   * @param {string} data.date - 日付 "YYYY-MM-DD"
   * @param {string} data.section - "前半" | "後半" | "終日"
   * @param {string} data.pickupType - "staff" | "family" (デフォルト: "staff")
   * @param {string} data.dropoffType - "staff" | "family" (デフォルト: "staff")
   * @param {string} data.note - 備考（任意）
   */
  constructor(data) {
    this.id = data.id || this._generateId(data.date);
    this.userId = data.userId;
    this.date = data.date;
    this.section = data.section;
    this.pickupType = data.pickupType || 'staff';
    this.dropoffType = data.dropoffType || 'staff';
    this.note = data.note || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * ID生成（内部使用）
   * @param {string} date
   * @returns {string}
   */
  _generateId(date) {
    const dateStr = date.replace(/-/g, '');
    const sequence = Math.floor(Math.random() * 1000);
    return `kayoi_${dateStr}_${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * バリデーション
   * @returns {Object} { ok: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!ValidationUtils.isValidUserId(this.userId)) {
      errors.push('userIdが不正です');
    }

    if (!ValidationUtils.isValidDateFormat(this.date)) {
      errors.push('日付が不正です');
    }

    if (!ValidationUtils.isValidKayoiSection(this.section)) {
      errors.push('セクションが不正です');
    }

    // 送迎タイプのバリデーション
    if (!['staff', 'family'].includes(this.pickupType)) {
      errors.push('pickupTypeは"staff"または"family"である必要があります');
    }

    if (!['staff', 'family'].includes(this.dropoffType)) {
      errors.push('dropoffTypeは"staff"または"family"である必要があります');
    }

    if (!ValidationUtils.isWithinLength(this.note, 100)) {
      errors.push('備考は100文字以内です');
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
      id: this.id,
      userId: this.userId,
      date: this.date,
      section: this.section,
      pickupType: this.pickupType,
      dropoffType: this.dropoffType,
      note: this.note,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * JSONから復元
   * @param {Object} json
   * @returns {KayoiSchedule}
   */
  static fromJSON(json) {
    return new KayoiSchedule(json);
  }

  /**
   * 一意のキーを生成
   * @returns {string} "user001_2024-11-23_前半"
   */
  getKey() {
    return `${this.userId}_${this.date}_${this.section}`;
  }

  /**
   * 表示用の記号を取得
   * @returns {string}
   */
  getSymbol() {
    switch (this.section) {
      case '終日': return '○';
      case '前半': return '◓';
      case '後半': return '◒';
      default: return '';
    }
  }

  /**
   * 表示用の文字列を取得
   * @returns {string}
   */
  getDisplayText() {
    const parts = [this.getSymbol()];
    if (this.note) {
      parts.push(this.note);
    }
    return parts.join(' ');
  }
}
