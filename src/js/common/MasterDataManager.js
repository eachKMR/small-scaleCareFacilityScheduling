/**
 * MasterDataManager.js
 * マスターデータ管理クラス
 * 
 * 利用者・スタッフ・居室の一元管理
 */

import { User } from './User.js';
import { Staff } from './Staff.js';
import { Room } from './Room.js';
import { StorageUtils } from './utils/StorageUtils.js';

export class MasterDataManager {
  constructor() {
    this.users = [];
    this.staff = [];
    this.rooms = [];
    
    this.load();
  }

  /**
   * データを読み込み
   */
  load() {
    // 利用者データ
    const usersData = StorageUtils.load('users', []);
    this.users = usersData.map(data => User.fromJSON(data));
    
    // スタッフデータ
    const staffData = StorageUtils.load('staff', []);
    this.staff = staffData.map(data => Staff.fromJSON(data));
    
    // 居室データ（初回はデフォルト生成）
    const roomsData = StorageUtils.load('rooms', null);
    if (roomsData === null) {
      this.rooms = Room.createDefaultRooms();
      this.save(); // デフォルトを保存
    } else {
      this.rooms = roomsData.map(data => Room.fromJSON(data));
    }
    
    console.log('MasterDataManager loaded:', {
      users: this.users.length,
      staff: this.staff.length,
      rooms: this.rooms.length
    });
  }

  /**
   * データを保存
   */
  save() {
    StorageUtils.save('users', this.users.map(u => u.toJSON()));
    StorageUtils.save('staff', this.staff.map(s => s.toJSON()));
    StorageUtils.save('rooms', this.rooms.map(r => r.toJSON()));
    StorageUtils.updateLastSaved();
  }

  // ========== 利用者管理 ==========

  /**
   * 利用者を取得
   * @param {string} userId
   * @returns {User|null}
   */
  getUser(userId) {
    return this.users.find(u => u.userId === userId) || null;
  }

  /**
   * 全利用者を取得（表示順ソート）
   * @returns {User[]}
   */
  getAllUsers() {
    return [...this.users].sort((a, b) => a.sortId - b.sortId);
  }

  /**
   * 利用者を追加
   * @param {User} user
   * @returns {boolean}
   */
  addUser(user) {
    // 定員チェック
    if (this.users.length >= User.MAX_USERS) {
      console.error(`登録定員${User.MAX_USERS}人に達しています`);
      return false;
    }

    // バリデーション
    const validation = user.validate();
    if (!validation.ok) {
      console.error('User validation failed:', validation.errors);
      return false;
    }

    // 重複チェック
    if (this.users.find(u => u.userId === user.userId)) {
      console.error(`userId ${user.userId} は既に存在します`);
      return false;
    }

    this.users.push(user);
    this.save();
    return true;
  }

  /**
   * 利用者を更新
   * @param {string} userId
   * @param {Object} updates
   * @returns {boolean}
   */
  updateUser(userId, updates) {
    const user = this.getUser(userId);
    if (!user) return false;

    Object.assign(user, updates);
    
    const validation = user.validate();
    if (!validation.ok) {
      console.error('User validation failed:', validation.errors);
      return false;
    }

    this.save();
    return true;
  }

  /**
   * 利用者を削除
   * @param {string} userId
   * @returns {boolean}
   */
  deleteUser(userId) {
    const index = this.users.findIndex(u => u.userId === userId);
    if (index === -1) return false;

    this.users.splice(index, 1);
    this.save();
    return true;
  }

  // ========== スタッフ管理 ==========

  /**
   * スタッフを取得
   * @param {string} staffId
   * @returns {Staff|null}
   */
  getStaff(staffId) {
    return this.staff.find(s => s.staffId === staffId) || null;
  }

  /**
   * 全スタッフを取得
   * @returns {Staff[]}
   */
  getAllStaff() {
    return [...this.staff];
  }

  /**
   * スタッフを追加
   * @param {Staff} staff
   * @returns {boolean}
   */
  addStaff(staff) {
    if (this.staff.find(s => s.staffId === staff.staffId)) {
      console.error(`staffId ${staff.staffId} は既に存在します`);
      return false;
    }

    this.staff.push(staff);
    this.save();
    return true;
  }

  // ========== 居室管理 ==========

  /**
   * 居室を取得
   * @param {string} roomId
   * @returns {Room|null}
   */
  getRoom(roomId) {
    return this.rooms.find(r => r.roomId === roomId) || null;
  }

  /**
   * 全居室を取得（表示順ソート）
   * @returns {Room[]}
   */
  getAllRooms() {
    return [...this.rooms].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  /**
   * 居室番号から居室を取得
   * @param {number} roomNumber
   * @returns {Room|null}
   */
  getRoomByNumber(roomNumber) {
    return this.rooms.find(r => r.roomNumber === roomNumber) || null;
  }
}
