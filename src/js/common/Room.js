/**
 * Room.js
 * 居室クラス
 * 
 * 9室の管理
 */

import { ValidationUtils } from './utils/ValidationUtils.js';

export class Room {
  /**
   * 居室総数
   */
  static TOTAL_ROOMS = 9;

  /**
   * @param {Object} data
   * @param {string} data.roomId - "room1" 形式
   * @param {number} data.roomNumber - 居室番号 1-9
   * @param {string} data.name - 居室名（任意、デフォルトは"居室X"）
   * @param {number} data.displayOrder - 表示順
   */
  constructor(data) {
    this.roomId = data.roomId;
    this.roomNumber = data.roomNumber;
    this.name = data.name || `居室${data.roomNumber}`;
    this.displayOrder = data.displayOrder;
  }

  /**
   * バリデーション
   * @returns {Object} { ok: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    if (!ValidationUtils.isValidRoomNumber(this.roomNumber)) {
      errors.push('居室番号は1-9の範囲です');
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
      roomId: this.roomId,
      roomNumber: this.roomNumber,
      name: this.name,
      displayOrder: this.displayOrder
    };
  }

  /**
   * JSONから復元
   * @param {Object} json
   * @returns {Room}
   */
  static fromJSON(json) {
    return new Room(json);
  }

  /**
   * デフォルトの居室データを生成
   * @returns {Room[]}
   */
  static createDefaultRooms() {
    const rooms = [];
    
    for (let i = 1; i <= Room.TOTAL_ROOMS; i++) {
      rooms.push(new Room({
        roomId: `room${i}`,
        roomNumber: i,
        name: `居室${i}`,
        displayOrder: i
      }));
    }
    
    return rooms;
  }
}
