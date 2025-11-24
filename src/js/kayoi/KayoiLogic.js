/**
 * KayoiLogic.js
 * 通いビジネスロジッククラス
 * 
 * 定員チェック、バリデーション、集計処理
 */

import { KayoiSchedule } from './KayoiSchedule.js';
import { ValidationUtils } from '../common/utils/ValidationUtils.js';
import { DateUtils } from '../common/utils/DateUtils.js';

export class KayoiLogic {
  /**
   * セクションごとの定員
   */
  static CAPACITY = {
    '前半': 15,
    '後半': 15,
    '終日': 15 // 終日は前半としてカウント
  };

  constructor(masterDataManager) {
    this.masterData = masterDataManager;
    this.schedules = new Map(); // key: スケジュールのkey, value: KayoiSchedule
  }

  /**
   * スケジュールを追加・更新
   * @param {KayoiSchedule} schedule
   * @returns {Object} { ok: boolean, message: string }
   */
  setSchedule(schedule) {
    // バリデーション
    const validation = schedule.validate();
    if (!validation.ok) {
      return {
        ok: false,
        message: validation.errors.join(', ')
      };
    }

    // 利用者存在チェック
    const user = this.masterData.getUser(schedule.userId);
    if (!user) {
      return {
        ok: false,
        message: '利用者が見つかりません'
      };
    }

    // 定員チェック
    const capacityCheck = this.checkCapacity(schedule.date, schedule.section, schedule.userId);
    if (!capacityCheck.ok) {
      return capacityCheck;
    }

    // 登録
    const key = schedule.getKey();
    this.schedules.set(key, schedule);

    return {
      ok: true,
      message: '登録しました'
    };
  }

  /**
   * スケジュールを削除
   * @param {string} userId
   * @param {string} date
   * @param {string} section
   * @returns {boolean}
   */
  deleteSchedule(userId, date, section) {
    const key = `${userId}_${date}_${section}`;
    return this.schedules.delete(key);
  }

  /**
   * スケジュールを取得
   * @param {string} userId
   * @param {string} date
   * @param {string} section
   * @returns {KayoiSchedule|null}
   */
  getSchedule(userId, date, section) {
    const key = `${userId}_${date}_${section}`;
    return this.schedules.get(key) || null;
  }

  /**
   * 日付とセクションの定員チェック
   * @param {string} date
   * @param {string} section
   * @param {string} excludeUserId - 除外するユーザーID（更新時）
   * @returns {Object} { ok: boolean, message: string, count: number, capacity: number }
   */
  checkCapacity(date, section, excludeUserId = null) {
    const count = this.getCapacityCount(date, section, excludeUserId);
    const capacity = KayoiLogic.CAPACITY[section];

    const result = ValidationUtils.checkCapacity(count, capacity);
    
    return {
      ...result,
      count,
      capacity
    };
  }

  /**
   * 日付とセクションの利用人数を取得
   * @param {string} date
   * @param {string} section
   * @param {string} excludeUserId - 除外するユーザーID
   * @returns {number}
   */
  getCapacityCount(date, section, excludeUserId = null) {
    let count = 0;

    // 前半・後半・終日それぞれをカウント
    if (section === '前半') {
      // 前半のみ + 終日
      count += this.countSchedules(date, '前半', excludeUserId);
      count += this.countSchedules(date, '終日', excludeUserId);
    } else if (section === '後半') {
      // 後半のみ + 終日
      count += this.countSchedules(date, '後半', excludeUserId);
      count += this.countSchedules(date, '終日', excludeUserId);
    } else if (section === '終日') {
      // 終日を登録する場合、前半と後半の最大値をチェック
      const zenhan = this.countSchedules(date, '前半', excludeUserId);
      const kohan = this.countSchedules(date, '後半', excludeUserId);
      const zenjitsu = this.countSchedules(date, '終日', excludeUserId);
      
      count = Math.max(zenhan + zenjitsu, kohan + zenjitsu);
    }

    return count;
  }

  /**
   * 特定の日付・セクションのスケジュール数をカウント
   * @param {string} date
   * @param {string} section
   * @param {string} excludeUserId
   * @returns {number}
   */
  countSchedules(date, section, excludeUserId = null) {
    let count = 0;

    for (const schedule of this.schedules.values()) {
      if (schedule.date === date && schedule.section === section) {
        if (!excludeUserId || schedule.userId !== excludeUserId) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * 月のスケジュールを取得
   * @param {string} yearMonth - "YYYY-MM"
   * @returns {KayoiSchedule[]}
   */
  getMonthSchedules(yearMonth) {
    const schedules = [];
    const [year, month] = yearMonth.split('-').map(Number);

    for (const schedule of this.schedules.values()) {
      const [scheduleYear, scheduleMonth] = schedule.date.split('-').map(Number);
      if (scheduleYear === year && scheduleMonth === month) {
        schedules.push(schedule);
      }
    }

    return schedules;
  }

  /**
   * ユーザーの月間スケジュールを取得
   * @param {string} userId
   * @param {string} yearMonth
   * @returns {KayoiSchedule[]}
   */
  getUserMonthSchedules(userId, yearMonth) {
    return this.getMonthSchedules(yearMonth)
      .filter(s => s.userId === userId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * データをJSONに変換
   * @returns {Object}
   */
  toJSON() {
    const schedules = Array.from(this.schedules.values()).map(s => s.toJSON());
    return { schedules };
  }

  /**
   * JSONから復元
   * @param {Object} json
   */
  fromJSON(json) {
    this.schedules.clear();
    
    if (json && json.schedules) {
      json.schedules.forEach(data => {
        const schedule = KayoiSchedule.fromJSON(data);
        const key = schedule.getKey();
        this.schedules.set(key, schedule);
      });
    }
  }
}
