/**
 * 小規模多機能利用調整システム - ScheduleController
 * 予定管理の中核となるコントローラークラス
 * EventEmitterを継承
 */

class ScheduleController extends EventEmitter {
  /**
   * コンストラクタ
   * @param {StorageService} storageService - ストレージサービス
   */
  constructor(storageService) {
    super();

    // 依存関係チェック
    if (typeof window.Logger === 'undefined') {
      throw new Error('ScheduleController requires Logger');
    }
    if (typeof window.EventEmitter === 'undefined') {
      throw new Error('ScheduleController requires EventEmitter');
    }
    if (typeof window.StorageService === 'undefined') {
      throw new Error('ScheduleController requires StorageService');
    }
    if (typeof window.User === 'undefined') {
      throw new Error('ScheduleController requires User model');
    }
    if (typeof window.ScheduleCalendar === 'undefined') {
      throw new Error('ScheduleController requires ScheduleCalendar model');
    }
    if (typeof window.ScheduleCell === 'undefined') {
      throw new Error('ScheduleController requires ScheduleCell model');
    }
    if (typeof window.DateUtils === 'undefined') {
      throw new Error('ScheduleController requires DateUtils');
    }

    this.storageService = storageService;
    this.currentYearMonth = null;
    this.users = [];
    this.calendars = new Map();

    window.Logger?.info('ScheduleController initialized');
  }

  /**
   * 利用者データを読み込み
   */
  loadUsers() {
    try {
      this.users = this.storageService.loadUsers();

      // なければデフォルトユーザーを使用
      if (this.users.length === 0 && window.DEFAULT_USERS) {
        this.users = window.DEFAULT_USERS.map(data => new window.User(data));
        this.saveUsers();
        window.Logger?.info('Created users from DEFAULT_USERS:', this.users.length);
      }

      window.Logger?.info('Loaded users:', this.users.length);
    } catch (error) {
      window.Logger?.error('Failed to load users:', error);
      this.users = [];
    }
  }

  /**
   * 利用者データを保存
   * @returns {boolean} 成功かどうか
   */
  saveUsers() {
    try {
      const success = this.storageService.saveUsers(this.users);
      if (success) {
        window.Logger?.debug('Users saved successfully');
      }
      return success;
    } catch (error) {
      window.Logger?.error('Failed to save users:', error);
      return false;
    }
  }

  /**
   * 指定した利用者を取得
   * @param {string} userId - 利用者ID
   * @returns {User|null} 利用者またはnull
   */
  getUser(userId) {
    return this.users.find(user => user.id === userId) || null;
  }

  /**
   * 利用者を追加
   * @param {User} user - 追加する利用者
   * @returns {boolean} 成功かどうか
   */
  addUser(user) {
    try {
      if (!(user instanceof window.User)) {
        throw new Error('Invalid user object');
      }

      // 重複チェック
      if (this.getUser(user.id)) {
        window.Logger?.warn('User already exists:', user.id);
        return false;
      }

      this.users.push(user);

      // 現在の月のカレンダーがあれば、新しい利用者用のカレンダーも作成
      if (this.currentYearMonth) {
        const calendar = new window.ScheduleCalendar(user.id, this.currentYearMonth);
        this.calendars.set(user.id, calendar);
      }

      this.saveUsers();
      window.Logger?.info('User added:', user.name);
      return true;
    } catch (error) {
      window.Logger?.error('Failed to add user:', error);
      return false;
    }
  }

  /**
   * 予定を読み込み
   * @param {string} yearMonth - 年月（"YYYY-MM"形式）
   */
  loadSchedule(yearMonth) {
    try {
      if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
        throw new Error('Invalid yearMonth format');
      }

      this.currentYearMonth = yearMonth;

      // storageから読み込み
      const data = this.storageService.loadSchedule(yearMonth);

      if (data && data.calendars) {
        // 既存データをScheduleCalendarインスタンスに復元
        this.calendars.clear();
        for (const [userId, calendarData] of Object.entries(data.calendars)) {
          try {
            let calendar;
            if (typeof window.ScheduleCalendar.fromJSON === 'function') {
              calendar = window.ScheduleCalendar.fromJSON(calendarData);
            } else {
              // fromJSONメソッドがない場合は直接コンストラクタを使用
              calendar = new window.ScheduleCalendar(userId, yearMonth);
              // データを復元（簡易版）
              if (calendarData.cells) {
                Object.entries(calendarData.cells).forEach(([dateKey, cellsData]) => {
                  Object.entries(cellsData).forEach(([cellType, cellData]) => {
                    const cell = new window.ScheduleCell({
                      userId: userId,
                      date: window.DateUtils.parseDate(dateKey),
                      cellType: cellType,
                      inputValue: cellData.inputValue || '',
                      actualFlags: cellData.actualFlags || {}
                    });
                    calendar.setCell(cell);
                  });
                });
              }
            }
            this.calendars.set(userId, calendar);
          } catch (error) {
            window.Logger?.warn(`Failed to restore calendar for user ${userId}:`, error);
          }
        }
      } else {
        // 新規作成
        this.calendars.clear();
        this.users.forEach(user => {
          const calendar = new window.ScheduleCalendar(user.id, yearMonth);
          this.calendars.set(user.id, calendar);
        });
      }

      window.Logger?.info(`Loaded schedule: ${yearMonth}, calendars: ${this.calendars.size}`);
      this.emit('scheduleLoaded', { yearMonth });
    } catch (error) {
      window.Logger?.error('Failed to load schedule:', error);
      this.calendars.clear();
    }
  }

  /**
   * 予定を保存
   * @returns {boolean} 成功かどうか
   */
  saveSchedule() {
    try {
      if (!this.currentYearMonth) {
        window.Logger?.warn('No current yearMonth set');
        return false;
      }

      const calendarsData = {};
      this.calendars.forEach((calendar, userId) => {
        calendarsData[userId] = calendar.toJSON();
      });

      const success = this.storageService.saveSchedule(this.currentYearMonth, calendarsData);

      if (success) {
        this.emit('scheduleUpdated', { yearMonth: this.currentYearMonth });
        window.Logger?.debug('Schedule saved:', this.currentYearMonth);
      }

      return success;
    } catch (error) {
      window.Logger?.error('Failed to save schedule:', error);
      return false;
    }
  }

  /**
   * セルを更新
   * @param {string} userId - 利用者ID
   * @param {Date} date - 日付
   * @param {string} cellType - セルタイプ（'dayStay' | 'visit'）
   * @param {string} value - 値
   * @returns {boolean} 成功かどうか
   */
  updateCell(userId, date, cellType, value) {
    try {
      const calendar = this.calendars.get(userId);
      if (!calendar) {
        window.Logger?.error('Calendar not found for user:', userId);
        return false;
      }

      // セル取得または生成
      let cell = calendar.getCell(date, cellType);
      if (!cell) {
        cell = new window.ScheduleCell({
          userId: userId,
          date: new Date(date),
          cellType: cellType,
          inputValue: value
        });
      } else {
        cell.inputValue = value;
      }

      // セット
      calendar.setCell(cell);

      // 通泊セルの場合、宿泊期間とフラグを再計算
      if (cellType === 'dayStay') {
        calendar.calculateStayPeriods();
        calendar.calculateAllFlags();
      }

      // イベント発火
      this.emit('cellUpdated', { userId, date, cellType, value });

      // 自動保存
      this.saveSchedule();

      window.Logger?.debug('Cell updated:', userId, window.DateUtils.formatDate(date), cellType, value);
      return true;
    } catch (error) {
      window.Logger?.error('Failed to update cell:', error);
      return false;
    }
  }

  /**
   * セルを取得
   * @param {string} userId - 利用者ID
   * @param {Date} date - 日付
   * @param {string} cellType - セルタイプ
   * @returns {ScheduleCell|null} セルまたはnull
   */
  getCell(userId, date, cellType) {
    try {
      const calendar = this.calendars.get(userId);
      if (!calendar) {
        return null;
      }

      let cell = calendar.getCell(date, cellType);
      if (!cell) {
        // セルが存在しない場合は空のセルを作成
        cell = new window.ScheduleCell({
          userId: userId,
          date: new Date(date),
          cellType: cellType,
          inputValue: ''
        });
      }

      return cell;
    } catch (error) {
      window.Logger?.error('Failed to get cell:', error);
      return null;
    }
  }

  /**
   * 指定利用者のカレンダーを取得
   * @param {string} userId - 利用者ID
   * @returns {ScheduleCalendar|null} カレンダーまたはnull
   */
  getCalendar(userId) {
    return this.calendars.get(userId) || null;
  }

  /**
   * 全カレンダーの配列を返す
   * @returns {ScheduleCalendar[]} カレンダー配列
   */
  getAllCalendars() {
    return Array.from(this.calendars.values());
  }

  /**
   * 月を切り替え
   * @param {string} yearMonth - 年月（"YYYY-MM"形式）
   */
  switchMonth(yearMonth) {
    try {
      // 現在の予定を保存
      if (this.currentYearMonth) {
        this.saveSchedule();
      }

      // 新しい月を読み込み
      this.loadSchedule(yearMonth);

      this.emit('monthChanged', { yearMonth });
      window.Logger?.info('Month switched to:', yearMonth);
    } catch (error) {
      window.Logger?.error('Failed to switch month:', error);
    }
  }

  /**
   * 現在の年月を取得
   * @returns {string|null} 現在の年月
   */
  getCurrentYearMonth() {
    return this.currentYearMonth;
  }

  /**
   * 現在の月の全日付を取得
   * @returns {Date[]} 日付配列
   */
  getAllDates() {
    if (!this.currentYearMonth) {
      return [];
    }

    try {
      return window.DateUtils.getMonthDates(this.currentYearMonth);
    } catch (error) {
      window.Logger?.error('Failed to get all dates:', error);
      return [];
    }
  }

  /**
   * 利用者ごとの宿泊期間を取得
   * @param {string} userId - 利用者ID
   * @returns {StayPeriod[]} 宿泊期間配列
   */
  getStayPeriods(userId) {
    try {
      const calendar = this.calendars.get(userId);
      if (!calendar) {
        return [];
      }

      return calendar.stayPeriods || [];
    } catch (error) {
      window.Logger?.error('Failed to get stay periods:', error);
      return [];
    }
  }

  /**
   * 指定日の全利用者のセル情報を取得
   * @param {Date} date - 日付
   * @returns {Object} 利用者IDをキーとしたセル情報
   */
  getDayCells(date) {
    const result = {};

    try {
      this.calendars.forEach((calendar, userId) => {
        const dayStayCell = calendar.getCell(date, 'dayStay');
        const visitCell = calendar.getCell(date, 'visit');

        result[userId] = {
          dayStay: dayStayCell || null,
          visit: visitCell || null
        };
      });
    } catch (error) {
      window.Logger?.error('Failed to get day cells:', error);
    }

    return result;
  }

  /**
   * バックアップデータを生成
   * @returns {Object} バックアップデータ
   */
  createBackup() {
    try {
      return {
        timestamp: new Date().toISOString(),
        yearMonth: this.currentYearMonth,
        users: this.users.map(user => user.toJSON()),
        calendars: Object.fromEntries(
          Array.from(this.calendars.entries()).map(([userId, calendar]) => [
            userId,
            calendar.toJSON()
          ])
        )
      };
    } catch (error) {
      window.Logger?.error('Failed to create backup:', error);
      return null;
    }
  }

  /**
   * バックアップから復元
   * @param {Object} backup - バックアップデータ
   * @returns {boolean} 成功かどうか
   */
  restoreFromBackup(backup) {
    try {
      if (!backup || !backup.users || !backup.calendars) {
        throw new Error('Invalid backup data');
      }

      // 利用者復元
      this.users = backup.users.map(userData => new window.User(userData));

      // カレンダー復元
      this.calendars.clear();
      for (const [userId, calendarData] of Object.entries(backup.calendars)) {
        const calendar = new window.ScheduleCalendar(userId, backup.yearMonth);
        // TODO: カレンダーデータの復元ロジックを実装
        this.calendars.set(userId, calendar);
      }

      this.currentYearMonth = backup.yearMonth;

      // 保存
      this.saveUsers();
      this.saveSchedule();

      window.Logger?.info('Restored from backup:', backup.timestamp);
      return true;
    } catch (error) {
      window.Logger?.error('Failed to restore from backup:', error);
      return false;
    }
  }

  /**
   * デバッグ情報を出力
   */
  debug() {
    window.Logger?.group('ScheduleController Debug Info');
    window.Logger?.info('Current YearMonth:', this.currentYearMonth);
    window.Logger?.info('Users:', this.users.length);
    window.Logger?.info('Calendars:', this.calendars.size);

    if (this.users.length > 0) {
      window.Logger?.info('Users List:', this.users.map(u => ({ id: u.id, name: u.name })));
    }

    if (this.calendars.size > 0) {
      const calendarInfo = {};
      this.calendars.forEach((calendar, userId) => {
        const user = this.getUser(userId);
        calendarInfo[userId] = {
          name: user ? user.name : 'Unknown',
          cellCount: Object.keys(calendar.cells || {}).length,
          stayPeriods: (calendar.stayPeriods || []).length
        };
      });
      window.Logger?.table(calendarInfo);
    }

    window.Logger?.groupEnd();
  }
}

// グローバルに登録
window.ScheduleController = ScheduleController;