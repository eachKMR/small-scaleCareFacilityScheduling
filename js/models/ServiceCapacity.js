/**
 * 小規模多機能利用調整システム - ServiceCapacityモデル
 * 定員チェックを行うモデルクラス
 */

class ServiceCapacity {
  // 定員定数
  static DAY_CAPACITY = 15;     // 通い定員
  static STAY_CAPACITY = 9;     // 泊り定員
  static REGISTRATION_CAPACITY = 29; // 登録定員

  /**
   * ServiceCapacityは静的メソッドのみを提供するため
   * インスタンスの作成は禁止
   */
  constructor() {
    throw new Error('ServiceCapacity is a static class and cannot be instantiated');
  }

  /**
   * 定員設定を初期化（AppConfigから取得）
   * @private
   */
  static _initializeCapacities() {
    if (typeof window.AppConfig !== 'undefined' && window.AppConfig.CAPACITY) {
      this.DAY_CAPACITY = window.AppConfig.CAPACITY.DAY || 15;
      this.STAY_CAPACITY = window.AppConfig.CAPACITY.STAY || 9;
      this.REGISTRATION_CAPACITY = window.AppConfig.CAPACITY.REGISTRATION || 29;
    }
  }

  /**
   * 依存関係をチェック
   * @private
   */
  static _checkDependencies() {
    const dependencies = ['DateUtils', 'DailyCapacity', 'ScheduleCalendar'];
    const missing = dependencies.filter(dep => typeof window[dep] === 'undefined');

    if (missing.length > 0) {
      throw new Error(`ServiceCapacity requires: ${missing.join(', ')}`);
    }
  }

  /**
   * 指定日の定員状況をチェック
   * @param {Date|string} date - チェック対象の日付
   * @param {ScheduleCalendar[]} calendars - スケジュールカレンダー配列
   * @param {User[]} users - 利用者配列（オプション）
   * @returns {DailyCapacity} 日別定員状況
   */
  static checkDate(date, calendars = [], users = []) {
    try {
      // 依存関係チェック
      this._checkDependencies();
      this._initializeCapacities();

      // DailyCapacityオブジェクトを作成
      const dailyCapacity = new window.DailyCapacity(date);
      const targetDateStr = window.DateUtils.formatDate(date);

      window.Logger?.debug(`Checking capacity for ${targetDateStr}`);

      // 利用者IDとUserオブジェクトのマップを作成
      const userMap = new Map();
      if (Array.isArray(users)) {
        users.forEach(user => {
          if (user && (user.id || user.userId)) {
            const userId = user.id || user.userId;
            userMap.set(userId, user);
          }
        });
      }

      // 各カレンダーをチェック
      if (Array.isArray(calendars)) {
        for (const calendar of calendars) {
          if (!(calendar instanceof window.ScheduleCalendar)) {
            window.Logger?.warn('Invalid calendar object, skipping');
            continue;
          }

          try {
            // 通泊セルをチェック
            const dayStayCell = calendar.getCell(date, 'dayStay');
            if (dayStayCell) {
              const flags = dayStayCell.actualFlags;
              const user = userMap.get(calendar.userId) || { id: calendar.userId, name: 'Unknown' };

              // 通いサービス
              if (flags.day) {
                dailyCapacity.addDayUser(user);
                window.Logger?.debug(`Added day user: ${calendar.userId}`);
              }

              // 宿泊サービス
              if (flags.stay) {
                dailyCapacity.addStayUser(user);
                window.Logger?.debug(`Added stay user: ${calendar.userId}`);
              }
            }

            // 訪問セルをチェック
            const visitCell = calendar.getCell(date, 'visit');
            if (visitCell && visitCell.actualFlags.visit > 0) {
              dailyCapacity.addVisitCount(visitCell.actualFlags.visit);
              window.Logger?.debug(`Added visit count: ${visitCell.actualFlags.visit} for ${calendar.userId}`);
            }

          } catch (error) {
            window.Logger?.warn(`Error processing calendar for ${calendar.userId}:`, error);
          }
        }
      }

      window.Logger?.debug(`Capacity check complete for ${targetDateStr}: ${dailyCapacity.getSummary()}`);
      return dailyCapacity;

    } catch (error) {
      window.Logger?.error('Error in ServiceCapacity.checkDate:', error);

      // エラー時は空のDailyCapacityを返す
      try {
        return new window.DailyCapacity(date);
      } catch (fallbackError) {
        throw new Error('Failed to create fallback DailyCapacity');
      }
    }
  }

  /**
   * 指定月の全日付について定員状況をチェック
   * @param {string} yearMonth - 年月文字列（"YYYY-MM"形式）
   * @param {ScheduleCalendar[]} calendars - スケジュールカレンダー配列
   * @param {User[]} users - 利用者配列（オプション）
   * @returns {DailyCapacity[]} 日別定員状況の配列
   */
  static checkMonth(yearMonth, calendars = [], users = []) {
    try {
      // 依存関係チェック
      this._checkDependencies();
      this._initializeCapacities();

      window.Logger?.debug(`Checking monthly capacity for ${yearMonth}`);

      // 月の全日付を取得
      const dates = window.DateUtils.getMonthDates(yearMonth);
      const results = [];

      // 各日付について定員チェックを実行
      for (const date of dates) {
        const dailyCapacity = this.checkDate(date, calendars, users);
        results.push(dailyCapacity);
      }

      window.Logger?.info(`Monthly capacity check complete for ${yearMonth}: ${results.length} days processed`);
      return results;

    } catch (error) {
      window.Logger?.error('Error in ServiceCapacity.checkMonth:', error);
      return [];
    }
  }

  /**
   * 複数月の定員状況をチェック
   * @param {string[]} yearMonths - 年月文字列の配列
   * @param {ScheduleCalendar[]} calendars - スケジュールカレンダー配列
   * @param {User[]} users - 利用者配列（オプション）
   * @returns {Object} 年月をキーとした日別定員状況のマップ
   */
  static checkMultipleMonths(yearMonths, calendars = [], users = []) {
    const results = {};

    if (!Array.isArray(yearMonths)) {
      return results;
    }

    for (const yearMonth of yearMonths) {
      if (typeof yearMonth === 'string' && /^\d{4}-\d{2}$/.test(yearMonth)) {
        results[yearMonth] = this.checkMonth(yearMonth, calendars, users);
      }
    }

    return results;
  }

  /**
   * 定員オーバーの日付を抽出
   * @param {DailyCapacity[]} dailyCapacities - 日別定員状況の配列
   * @returns {DailyCapacity[]} 定員オーバーの日の配列
   */
  static getOverCapacityDays(dailyCapacities) {
    if (!Array.isArray(dailyCapacities)) {
      return [];
    }

    return dailyCapacities.filter(capacity => 
      capacity instanceof window.DailyCapacity && capacity.isOverCapacity()
    );
  }

  /**
   * 定員の使用率統計を取得
   * @param {DailyCapacity[]} dailyCapacities - 日別定員状況の配列
   * @returns {Object} 使用率統計
   */
  static getUsageStats(dailyCapacities) {
    if (!Array.isArray(dailyCapacities) || dailyCapacities.length === 0) {
      return {
        dayUsage: { min: 0, max: 0, avg: 0 },
        stayUsage: { min: 0, max: 0, avg: 0 },
        overCapacityDays: 0,
        totalDays: 0
      };
    }

    const validCapacities = dailyCapacities.filter(cap => cap instanceof window.DailyCapacity);
    
    if (validCapacities.length === 0) {
      return {
        dayUsage: { min: 0, max: 0, avg: 0 },
        stayUsage: { min: 0, max: 0, avg: 0 },
        overCapacityDays: 0,
        totalDays: 0
      };
    }

    const dayUsageRates = validCapacities.map(cap => cap.getDayUsageRate());
    const stayUsageRates = validCapacities.map(cap => cap.getStayUsageRate());
    const overCapacityCount = validCapacities.filter(cap => cap.isOverCapacity()).length;

    return {
      dayUsage: {
        min: Math.min(...dayUsageRates),
        max: Math.max(...dayUsageRates),
        avg: dayUsageRates.reduce((sum, rate) => sum + rate, 0) / dayUsageRates.length
      },
      stayUsage: {
        min: Math.min(...stayUsageRates),
        max: Math.max(...stayUsageRates),
        avg: stayUsageRates.reduce((sum, rate) => sum + rate, 0) / stayUsageRates.length
      },
      overCapacityDays: overCapacityCount,
      totalDays: validCapacities.length
    };
  }

  /**
   * 月別サマリーを取得
   * @param {string} yearMonth - 年月文字列
   * @param {DailyCapacity[]} dailyCapacities - 日別定員状況の配列
   * @returns {Object} 月別サマリー
   */
  static getMonthlySummary(yearMonth, dailyCapacities) {
    const stats = this.getUsageStats(dailyCapacities);
    const overCapacityDays = this.getOverCapacityDays(dailyCapacities);

    // 各日の合計を計算
    const totalDayCount = dailyCapacities.reduce((sum, cap) => sum + (cap.dayCount || 0), 0);
    const totalStayCount = dailyCapacities.reduce((sum, cap) => sum + (cap.stayCount || 0), 0);
    const totalVisitCount = dailyCapacities.reduce((sum, cap) => sum + (cap.visitCount || 0), 0);

    return {
      yearMonth,
      totalDays: dailyCapacities.length,
      overCapacityDays: overCapacityDays.length,
      overCapacityDates: overCapacityDays.map(cap => cap.getDateString()),
      usage: stats,
      totals: {
        day: totalDayCount,
        stay: totalStayCount,
        visit: totalVisitCount
      },
      averages: {
        day: dailyCapacities.length > 0 ? totalDayCount / dailyCapacities.length : 0,
        stay: dailyCapacities.length > 0 ? totalStayCount / dailyCapacities.length : 0,
        visit: dailyCapacities.length > 0 ? totalVisitCount / dailyCapacities.length : 0
      }
    };
  }

  /**
   * 現在の定員設定を取得
   * @returns {Object} 定員設定
   */
  static getCurrentCapacities() {
    this._initializeCapacities();

    return {
      day: this.DAY_CAPACITY,
      stay: this.STAY_CAPACITY,
      registration: this.REGISTRATION_CAPACITY
    };
  }

  /**
   * 定員設定を更新
   * @param {Object} capacities - 新しい定員設定
   * @param {number} capacities.day - 通い定員
   * @param {number} capacities.stay - 泊り定員
   * @param {number} capacities.registration - 登録定員
   */
  static updateCapacities(capacities) {
    if (capacities.day && typeof capacities.day === 'number' && capacities.day > 0) {
      this.DAY_CAPACITY = capacities.day;
    }
    if (capacities.stay && typeof capacities.stay === 'number' && capacities.stay > 0) {
      this.STAY_CAPACITY = capacities.stay;
    }
    if (capacities.registration && typeof capacities.registration === 'number' && capacities.registration > 0) {
      this.REGISTRATION_CAPACITY = capacities.registration;
    }

    window.Logger?.info('Capacities updated:', this.getCurrentCapacities());
  }

  /**
   * デバッグ情報を出力
   * @param {DailyCapacity[]} dailyCapacities - 日別定員状況の配列
   */
  static debug(dailyCapacities) {
    if (!Array.isArray(dailyCapacities)) {
      window.Logger?.info('ServiceCapacity Debug: No data provided');
      return;
    }

    const summary = dailyCapacities.map(cap => ({
      date: cap.getDateString(),
      summary: cap.getSummary(),
      status: cap.getStatusIcon()
    }));

    const stats = this.getUsageStats(dailyCapacities);
    const overCapacityDays = this.getOverCapacityDays(dailyCapacities);

    window.Logger?.group('ServiceCapacity Debug Info');
    window.Logger?.info('Current Capacities:', this.getCurrentCapacities());
    window.Logger?.info('Total Days:', dailyCapacities.length);
    window.Logger?.info('Over Capacity Days:', overCapacityDays.length);
    window.Logger?.info('Usage Stats:', stats);
    window.Logger?.table(summary);
    window.Logger?.groupEnd();
  }
}

// グローバルに登録
window.ServiceCapacity = ServiceCapacity;