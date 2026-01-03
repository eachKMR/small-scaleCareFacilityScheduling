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
    
    // v5.0: 利用者ごとのデータ構造（tomariPeriod削除）
    this.userDataMap = new Map(); // key: userId, value: { userId, kayoiSchedule, updatedAt }
    
    // v5.0: 泊まり予約データ（TomariReservation配列）
    this.tomariReservations = []; // TomariReservationの配列
  }

  /**
   * v5.0: 利用者データを取得または初期化
   * @param {string} userId
   * @returns {Object} { userId, kayoiSchedule, updatedAt }
   */
  getUserData(userId) {
    if (!this.userDataMap.has(userId)) {
      this.userDataMap.set(userId, {
        userId: userId,
        kayoiSchedule: {},
        updatedAt: new Date().toISOString()
      });
    }
    return this.userDataMap.get(userId);
  }

  /**
   * v5.0: 指定日の泊まり予約を検索
   * @param {string} userId
   * @param {string} date - 日付（YYYY-MM-DD）
   * @returns {Object|null} TomariReservation or null
   */
  findTomariReservation(userId, date) {
    return this.tomariReservations.find(r =>
      r.userId === userId &&
      date >= r.startDate &&
      date <= r.endDate
    ) || null;
  }

  /**
   * v5.0: セルに表示する記号を取得
   * @param {string} userId
   * @param {string} date - 日付（YYYY-MM-DD）
   * @returns {string} 表示記号（"", "○", "◓", "◒"）
   */
  getDisplaySymbol(userId, date) {
    const userData = this.userDataMap.get(userId);
    if (!userData) return "";
    
    // 泊まり期間内かチェック（TomariReservation配列を検索）
    const isInTomariPeriod = this.tomariReservations.some(r =>
      r.userId === userId &&
      date >= r.startDate &&
      date <= r.endDate
    );
    
    // 明示的なkayoi設定を確認
    const kayoi = userData.kayoiSchedule[date];
    
    // ケース1: 明示的に設定されている
    if (kayoi === "終日") return "○";
    if (kayoi === "前半") return "◓";
    if (kayoi === "後半") return "◒";
    if (kayoi === null) return "";  // 明示的に空欄
    
    // ケース2: 泊まり期間内でkayoi未設定 → デフォルト○
    if (isInTomariPeriod && kayoi === undefined) {
      return "○";
    }
    
    // ケース3: その他 → 空欄
    return "";
  }

  /**
   * v5.0: セルの罫線状態を取得
   * @param {string} userId
   * @param {string} date - 日付（YYYY-MM-DD）
   * @returns {string} 罫線状態（"none", "stay", "checkout"）
   */
  getBorderState(userId, date) {
    // その日の泊まり予約を検索
    const reservation = this.findTomariReservation(userId, date);
    if (!reservation) return "none";
    
    // 入所日〜退所日前日: stay（青罫線）
    if (date < reservation.endDate) {
      return "stay";
    }
    
    // 退所日: checkout（薄青罫線）
    if (date === reservation.endDate) {
      return "checkout";
    }
    
    return "none";
  }

  /**
   * v4.0: 通い予定を設定（短押し用）
   * @param {string} userId
   * @param {string} date - 日付（YYYY-MM-DD）
   * @param {string} section - "終日" | "前半" | "後半"
   */
  setKayoi(userId, date, section) {
    const userData = this.getUserData(userId);
    userData.kayoiSchedule[date] = section;
    userData.updatedAt = new Date().toISOString();
  }

  /**
   * v4.0: 通い予定を削除（短押し用）
   * @param {string} userId
   * @param {string} date - 日付（YYYY-MM-DD）
   */
  removeKayoi(userId, date) {
    const userData = this.getUserData(userId);
    userData.kayoiSchedule[date] = null;
    userData.updatedAt = new Date().toISOString();
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
   * 日別の前半・後半カウントを取得
   * @param {string} date
   * @returns {{zenhan: number, kohan: number}}
   */
  countSchedulesByDate(date) {
    let zenhan = 0;
    let kohan = 0;

    for (const schedule of this.schedules.values()) {
      if (schedule.date === date) {
        if (schedule.section === '前半' || schedule.section === '終日') {
          zenhan++;
        }
        if (schedule.section === '後半' || schedule.section === '終日') {
          kohan++;
        }
      }
    }

    return { zenhan, kohan };
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
    
    // v4.0: userDataMapも保存
    const userData = Array.from(this.userDataMap.values());
    
    return { 
      schedules,
      userData 
    };
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
    
    // v4.0: userDataMapを復元
    this.userDataMap.clear();
    if (json && json.userData) {
      json.userData.forEach(data => {
        this.userDataMap.set(data.userId, data);
      });
    }
  }

  /**
   * v5.0: 泊まりデータを同期（配列を保持）
   * @param {Array} tomariReservations - TomariReservationの配列
   */
  syncTomariData(tomariReservations) {
    // TomariReservation配列をそのまま保持
    this.tomariReservations = tomariReservations || [];
    console.log('✅ KayoiLogic: 泊まりデータ同期完了', this.tomariReservations.length, '件');
  }
}
