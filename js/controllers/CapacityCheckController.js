/**
 * 小規模多機能利用調整システム - CapacityCheckController
 * 定員チェックを行うコントローラークラス
 */

class CapacityCheckController {
  /**
   * コンストラクタ
   * @param {ScheduleController} scheduleController - スケジュールコントローラー
   */
  constructor(scheduleController) {
    // 依存関係チェック
    if (typeof window.Logger === 'undefined') {
      throw new Error('CapacityCheckController requires Logger');
    }
    if (typeof window.ServiceCapacity === 'undefined') {
      throw new Error('CapacityCheckController requires ServiceCapacity');
    }
    if (typeof window.DailyCapacity === 'undefined') {
      throw new Error('CapacityCheckController requires DailyCapacity');
    }
    if (typeof window.ScheduleController === 'undefined') {
      throw new Error('CapacityCheckController requires ScheduleController');
    }
    if (typeof window.AppConfig === 'undefined') {
      throw new Error('CapacityCheckController requires AppConfig');
    }

    this.scheduleController = scheduleController;

    // セル更新時の自動チェック
    this.scheduleController.on('cellUpdated', (data) => {
      window.Logger?.debug('Cell updated, capacity check triggered:', data);
      // 必要に応じて自動チェック処理を追加
    });

    // 予定読み込み時の自動チェック
    this.scheduleController.on('scheduleLoaded', (data) => {
      window.Logger?.debug('Schedule loaded, capacity check ready:', data);
    });

    window.Logger?.info('CapacityCheckController initialized');
  }

  /**
   * 指定日の定員状況をチェック
   * @param {Date} date - チェック対象の日付
   * @returns {DailyCapacity} 日別定員状況
   */
  checkDate(date) {
    try {
      const calendars = this.scheduleController.getAllCalendars();
      const users = this.scheduleController.users;

      const result = window.ServiceCapacity.checkDate(date, calendars, users);
      
      window.Logger?.debug(`Capacity check for ${window.DateUtils.formatDate(date)}:`, result.getSummary());
      return result;
    } catch (error) {
      window.Logger?.error('Failed to check date capacity:', error);
      // エラー時は空のDailyCapacityを返す
      try {
        return new window.DailyCapacity(date);
      } catch (fallbackError) {
        window.Logger?.error('Failed to create fallback DailyCapacity:', fallbackError);
        return null;
      }
    }
  }

  /**
   * 現在の月の全日付をチェック
   * @returns {DailyCapacity[]} 日別定員状況の配列
   */
  checkMonth() {
    try {
      const calendars = this.scheduleController.getAllCalendars();
      const users = this.scheduleController.users;
      const yearMonth = this.scheduleController.getCurrentYearMonth();

      if (!yearMonth) {
        window.Logger?.warn('No current year-month set');
        return [];
      }

      const results = window.ServiceCapacity.checkMonth(yearMonth, calendars, users);
      
      window.Logger?.debug(`Monthly capacity check for ${yearMonth}:`, {
        totalDays: results.length,
        overCapacityDays: results.filter(r => r.isOverCapacity()).length
      });
      
      return results;
    } catch (error) {
      window.Logger?.error('Failed to check month capacity:', error);
      return [];
    }
  }

  /**
   * checkMonth()のエイリアス
   * @returns {DailyCapacity[]} 日別定員状況の配列
   */
  checkAll() {
    return this.checkMonth();
  }

  /**
   * 定員オーバーの日付リストを返す
   * @returns {Date[]} 定員オーバーの日付配列
   */
  getOverCapacityDates() {
    try {
      const results = this.checkMonth();
      const overDates = results
        .filter(r => r.isOverCapacity())
        .map(r => r.date);
      
      window.Logger?.debug('Over capacity dates found:', overDates.length);
      return overDates;
    } catch (error) {
      window.Logger?.error('Failed to get over capacity dates:', error);
      return [];
    }
  }

  /**
   * 定員ギリギリ（警告）の日付リストを返す
   * @returns {Date[]} 警告対象の日付配列
   */
  getWarningDates() {
    try {
      const results = this.checkMonth();
      const dayCapacity = window.AppConfig.CAPACITY.DAY;
      const stayCapacity = window.AppConfig.CAPACITY.STAY;
      
      const warningDates = results
        .filter(r => {
          if (r.isOverCapacity()) {
            return false; // オーバー済みは除外
          }
          
          const dayWarning = r.dayCount >= dayCapacity - 1;
          const stayWarning = r.stayCount >= stayCapacity - 1;
          
          return dayWarning || stayWarning;
        })
        .map(r => r.date);
      
      window.Logger?.debug('Warning dates found:', warningDates.length);
      return warningDates;
    } catch (error) {
      window.Logger?.error('Failed to get warning dates:', error);
      return [];
    }
  }

  /**
   * 月全体のサマリーを返す
   * @returns {Object} サマリー情報
   */
  getSummary() {
    try {
      const results = this.checkMonth();
      
      const summary = {
        totalDays: results.length,
        okDays: 0,
        warningDays: 0,
        errorDays: 0,
        totalDayUsage: 0,
        totalStayUsage: 0,
        maxDayUsage: 0,
        maxStayUsage: 0,
        avgDayUsage: 0,
        avgStayUsage: 0
      };

      if (results.length === 0) {
        return summary;
      }

      const dayCapacity = window.AppConfig.CAPACITY.DAY;
      const stayCapacity = window.AppConfig.CAPACITY.STAY;

      results.forEach(r => {
        // 日数カウント
        if (r.isOverCapacity()) {
          summary.errorDays++;
        } else if (r.dayCount >= dayCapacity - 1 || r.stayCount >= stayCapacity - 1) {
          summary.warningDays++;
        } else {
          summary.okDays++;
        }

        // 使用率計算
        summary.totalDayUsage += r.dayCount;
        summary.totalStayUsage += r.stayCount;
        summary.maxDayUsage = Math.max(summary.maxDayUsage, r.dayCount);
        summary.maxStayUsage = Math.max(summary.maxStayUsage, r.stayCount);
      });

      summary.avgDayUsage = Math.round((summary.totalDayUsage / results.length) * 100) / 100;
      summary.avgStayUsage = Math.round((summary.totalStayUsage / results.length) * 100) / 100;

      window.Logger?.debug('Monthly summary:', summary);
      return summary;
    } catch (error) {
      window.Logger?.error('Failed to get summary:', error);
      return {
        totalDays: 0,
        okDays: 0,
        warningDays: 0,
        errorDays: 0,
        totalDayUsage: 0,
        totalStayUsage: 0,
        maxDayUsage: 0,
        maxStayUsage: 0,
        avgDayUsage: 0,
        avgStayUsage: 0
      };
    }
  }

  /**
   * 指定期間の定員チェック
   * @param {Date} startDate - 開始日
   * @param {Date} endDate - 終了日
   * @returns {DailyCapacity[]} 期間内の日別定員状況
   */
  checkPeriod(startDate, endDate) {
    try {
      const results = [];
      const current = new Date(startDate);
      
      while (current <= endDate) {
        const dailyResult = this.checkDate(new Date(current));
        if (dailyResult) {
          results.push(dailyResult);
        }
        current.setDate(current.getDate() + 1);
      }
      
      window.Logger?.debug(`Period capacity check (${window.DateUtils.formatDate(startDate)} - ${window.DateUtils.formatDate(endDate)}):`, results.length);
      return results;
    } catch (error) {
      window.Logger?.error('Failed to check period capacity:', error);
      return [];
    }
  }

  /**
   * 特定利用者の定員への影響をチェック
   * @param {string} userId - 利用者ID
   * @returns {Object} 利用者の定員への影響情報
   */
  checkUserImpact(userId) {
    try {
      const user = this.scheduleController.getUser(userId);
      if (!user) {
        window.Logger?.warn('User not found:', userId);
        return null;
      }

      const calendar = this.scheduleController.getCalendar(userId);
      if (!calendar) {
        window.Logger?.warn('Calendar not found for user:', userId);
        return null;
      }

      const dates = this.scheduleController.getAllDates();
      const impact = {
        userId: userId,
        userName: user.name,
        dayCount: 0,
        stayCount: 0,
        visitCount: 0,
        activeDates: [],
        stayPeriods: calendar.stayPeriods || []
      };

      dates.forEach(date => {
        const dayStayCell = calendar.getCell(date, 'dayStay');
        const visitCell = calendar.getCell(date, 'visit');

        if (dayStayCell && dayStayCell.actualFlags) {
          if (dayStayCell.actualFlags.day) {
            impact.dayCount++;
            impact.activeDates.push({
              date: date,
              type: 'day'
            });
          }
          if (dayStayCell.actualFlags.stay) {
            impact.stayCount++;
            impact.activeDates.push({
              date: date,
              type: 'stay'
            });
          }
        }

        if (visitCell && visitCell.actualFlags && visitCell.actualFlags.visit > 0) {
          impact.visitCount += visitCell.actualFlags.visit;
          impact.activeDates.push({
            date: date,
            type: 'visit',
            count: visitCell.actualFlags.visit
          });
        }
      });

      window.Logger?.debug('User impact:', impact);
      return impact;
    } catch (error) {
      window.Logger?.error('Failed to check user impact:', error);
      return null;
    }
  }

  /**
   * 定員状況の詳細レポートを生成
   * @returns {Object} 詳細レポート
   */
  generateDetailedReport() {
    try {
      const results = this.checkMonth();
      const summary = this.getSummary();
      const overDates = this.getOverCapacityDates();
      const warningDates = this.getWarningDates();

      const report = {
        summary,
        yearMonth: this.scheduleController.getCurrentYearMonth(),
        generatedAt: new Date().toISOString(),
        overCapacityDays: overDates.map(date => ({
          date: window.DateUtils.formatDate(date),
          capacity: this.checkDate(date)
        })),
        warningDays: warningDates.map(date => ({
          date: window.DateUtils.formatDate(date),
          capacity: this.checkDate(date)
        })),
        dailyDetails: results.map(r => ({
          date: window.DateUtils.formatDate(r.date),
          dayCount: r.dayCount,
          stayCount: r.stayCount,
          visitCount: r.visitCount,
          status: r.getStatusIcon(),
          isOverCapacity: r.isOverCapacity(),
          summary: r.getSummary()
        }))
      };

      window.Logger?.info('Detailed report generated');
      return report;
    } catch (error) {
      window.Logger?.error('Failed to generate detailed report:', error);
      return null;
    }
  }

  /**
   * デバッグ情報を出力
   */
  debug() {
    window.Logger?.group('CapacityCheckController Debug Info');
    
    const summary = this.getSummary();
    const overDates = this.getOverCapacityDates();
    const warningDates = this.getWarningDates();

    window.Logger?.info('Current YearMonth:', this.scheduleController.getCurrentYearMonth());
    window.Logger?.info('Capacity Limits:', window.AppConfig.CAPACITY);
    window.Logger?.info('Monthly Summary:', summary);
    window.Logger?.info('Over Capacity Days:', overDates.length);
    window.Logger?.info('Warning Days:', warningDates.length);

    if (overDates.length > 0) {
      window.Logger?.warn('Over Capacity Dates:', overDates.map(d => window.DateUtils.formatDate(d)));
    }

    if (warningDates.length > 0) {
      window.Logger?.warn('Warning Dates:', warningDates.map(d => window.DateUtils.formatDate(d)));
    }

    // 最近の数日分をサンプル表示
    const sampleResults = this.checkMonth().slice(0, 7);
    if (sampleResults.length > 0) {
      const sampleData = sampleResults.map(r => ({
        date: window.DateUtils.formatDate(r.date),
        day: r.dayCount,
        stay: r.stayCount,
        visit: r.visitCount,
        status: r.getStatusIcon()
      }));
      window.Logger?.table(sampleData);
    }

    window.Logger?.groupEnd();
  }
}

// グローバルに登録
window.CapacityCheckController = CapacityCheckController;