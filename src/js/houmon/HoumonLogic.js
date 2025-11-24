/**
 * 訪問スケジュール管理ロジック
 * 訪問予定の追加・編集・削除、制約チェックなどを管理
 */
import { HoumonSchedule } from './HoumonSchedule.js';

export class HoumonLogic {
  constructor(masterDataManager) {
    this.masterData = masterDataManager;
    this.schedules = []; // HoumonSchedule[]
  }

  /**
   * 初期化
   */
  initialize() {
    this.loadFromStorage();
  }

  /**
   * ストレージから読み込み
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem('houmon_schedules');
      if (data) {
        const parsed = JSON.parse(data);
        this.schedules = parsed.map(item => HoumonSchedule.fromJSON(item));
      }
    } catch (error) {
      console.error('訪問スケジュールデータ読み込みエラー:', error);
      this.schedules = [];
    }
  }

  /**
   * ストレージに保存
   */
  saveToStorage() {
    try {
      const data = this.schedules.map(s => s.toJSON());
      localStorage.setItem('houmon_schedules', JSON.stringify(data));
    } catch (error) {
      console.error('訪問スケジュールデータ保存エラー:', error);
    }
  }

  /**
   * スケジュール追加
   * @param {Object} scheduleData - スケジュールデータ
   * @returns {HoumonSchedule|null}
   */
  addSchedule(scheduleData) {
    try {
      const schedule = new HoumonSchedule(scheduleData);
      
      // バリデーション
      const validation = schedule.validate();
      if (!validation.isValid) {
        console.error('スケジュールデータが無効:', validation.errors);
        return null;
      }

      this.schedules.push(schedule);
      this.saveToStorage();
      return schedule;
    } catch (error) {
      console.error('スケジュール追加エラー:', error);
      return null;
    }
  }

  /**
   * スケジュール更新
   * @param {string} id - スケジュールID
   * @param {Object} updates - 更新データ
   * @returns {boolean}
   */
  updateSchedule(id, updates) {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index === -1) return false;

    try {
      const updated = new HoumonSchedule({
        ...this.schedules[index].toJSON(),
        ...updates
      });

      const validation = updated.validate();
      if (!validation.isValid) {
        console.error('更新データが無効:', validation.errors);
        return false;
      }

      this.schedules[index] = updated;
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('スケジュール更新エラー:', error);
      return false;
    }
  }

  /**
   * スケジュール削除
   * @param {string} id - スケジュールID
   * @returns {boolean}
   */
  deleteSchedule(id) {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index === -1) return false;

    this.schedules.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  /**
   * 特定日・利用者のスケジュール取得
   * @param {string} userId - 利用者ID
   * @param {string} date - 日付 (YYYY-MM-DD)
   * @returns {HoumonSchedule[]}
   */
  getSchedulesForUserAndDate(userId, date) {
    return this.schedules.filter(s => 
      s.userId === userId && s.date === date
    );
  }

  /**
   * 特定日の全スケジュール取得
   * @param {string} date - 日付 (YYYY-MM-DD)
   * @returns {HoumonSchedule[]}
   */
  getSchedulesForDate(date) {
    return this.schedules.filter(s => s.date === date);
  }

  /**
   * 利用者IDでスケジュール検索
   * @param {string} userId - 利用者ID
   * @returns {HoumonSchedule[]}
   */
  getSchedulesByUserId(userId) {
    return this.schedules.filter(s => s.userId === userId);
  }

  /**
   * 日付範囲でスケジュール取得
   * @param {string} startDate - 開始日 (YYYY-MM-DD)
   * @param {string} endDate - 終了日 (YYYY-MM-DD)
   * @returns {HoumonSchedule[]}
   */
  getSchedulesInRange(startDate, endDate) {
    return this.schedules.filter(s => {
      return s.date >= startDate && s.date <= endDate;
    });
  }

  /**
   * 全スケジュール取得
   * @returns {HoumonSchedule[]}
   */
  getAllSchedules() {
    return [...this.schedules];
  }

  /**
   * データクリア
   */
  clearAll() {
    this.schedules = [];
    this.saveToStorage();
  }

  /**
   * 特定の条件でスケジュールをフィルタリング
   * @param {Object} filters - フィルタ条件
   * @returns {HoumonSchedule[]}
   */
  filterSchedules(filters) {
    let results = this.schedules;

    if (filters.userId) {
      results = results.filter(s => s.userId === filters.userId);
    }

    if (filters.date) {
      results = results.filter(s => s.date === filters.date);
    }

    if (filters.timeMode) {
      results = results.filter(s => s.timeMode === filters.timeMode);
    }

    if (filters.staffId) {
      results = results.filter(s => s.staffId === filters.staffId);
    }

    return results;
  }
}
