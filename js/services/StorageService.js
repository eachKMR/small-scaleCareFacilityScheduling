/**
 * 小規模多機能利用調整システム - StorageService
 * LocalStorageの操作を抽象化するサービスクラス
 */

class StorageService {
  /**
   * コンストラクタ
   */
  constructor() {
    // 依存関係チェック
    if (typeof window.AppConfig === 'undefined') {
      throw new Error('StorageService requires AppConfig');
    }
    if (typeof window.Logger === 'undefined') {
      throw new Error('StorageService requires Logger');
    }
    if (typeof window.User === 'undefined') {
      throw new Error('StorageService requires User model');
    }
    if (typeof window.Note === 'undefined') {
      throw new Error('StorageService requires Note model');
    }

    this.storageKeys = window.AppConfig.STORAGE_KEYS;
    window.Logger.debug('StorageService initialized');
  }

  /**
   * データをLocalStorageに保存
   * @param {string} key - ストレージキー
   * @param {any} data - 保存するデータ
   * @returns {boolean} 成功かどうか
   */
  save(key, data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(key, json);
      window.Logger?.debug(`Saved to storage: ${key}`, { size: json.length });
      return true;
    } catch (error) {
      window.Logger?.error(`Failed to save to storage: ${key}`, error);
      return false;
    }
  }

  /**
   * LocalStorageからデータを読み込み
   * @param {string} key - ストレージキー
   * @param {any} defaultValue - デフォルト値
   * @returns {any} 読み込んだデータまたはデフォルト値
   */
  load(key, defaultValue = null) {
    try {
      const json = localStorage.getItem(key);
      if (json === null) {
        window.Logger?.debug(`No data found for key: ${key}`);
        return defaultValue;
      }
      const data = JSON.parse(json);
      window.Logger?.debug(`Loaded from storage: ${key}`, { size: json.length });
      return data;
    } catch (error) {
      window.Logger?.error(`Failed to load from storage: ${key}`, error);
      return defaultValue;
    }
  }

  /**
   * データを削除
   * @param {string} key - ストレージキー
   * @returns {boolean} 成功かどうか
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      window.Logger?.debug(`Removed from storage: ${key}`);
      return true;
    } catch (error) {
      window.Logger?.error(`Failed to remove from storage: ${key}`, error);
      return false;
    }
  }

  /**
   * 全データをクリア
   */
  clear() {
    try {
      localStorage.clear();
      window.Logger?.info('Storage cleared');
    } catch (error) {
      window.Logger?.error('Failed to clear storage', error);
    }
  }

  /**
   * 予定データを保存
   * @param {string} yearMonth - 年月（"YYYY-MM"形式）
   * @param {Object} calendarsData - カレンダーデータ
   * @returns {boolean} 成功かどうか
   */
  saveSchedule(yearMonth, calendarsData) {
    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      window.Logger?.error('Invalid yearMonth format:', yearMonth);
      return false;
    }

    const key = this.storageKeys.SCHEDULES + yearMonth;
    const data = {
      yearMonth,
      calendars: calendarsData,
      lastModified: new Date().toISOString(),
      version: '1.0'
    };

    const success = this.save(key, data);
    if (success) {
      window.Logger?.info(`Schedule saved for ${yearMonth}`);
    }
    return success;
  }

  /**
   * 予定データを読み込み
   * @param {string} yearMonth - 年月（"YYYY-MM"形式）
   * @returns {Object|null} 予定データまたはnull
   */
  loadSchedule(yearMonth) {
    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      window.Logger?.error('Invalid yearMonth format:', yearMonth);
      return null;
    }

    const key = this.storageKeys.SCHEDULES + yearMonth;
    const data = this.load(key);
    
    if (data) {
      window.Logger?.info(`Schedule loaded for ${yearMonth}`, {
        lastModified: data.lastModified,
        calendarsCount: Object.keys(data.calendars || {}).length
      });
    }
    
    return data;
  }

  /**
   * 保存されている予定の年月リストを取得
   * @returns {string[]} 年月のリスト
   */
  listSchedules() {
    try {
      const scheduleKeys = [];
      const prefix = this.storageKeys.SCHEDULES;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const yearMonth = key.substring(prefix.length);
          if (/^\d{4}-\d{2}$/.test(yearMonth)) {
            scheduleKeys.push(yearMonth);
          }
        }
      }
      
      // 年月順にソート
      scheduleKeys.sort();
      window.Logger?.debug(`Found ${scheduleKeys.length} schedules:`, scheduleKeys);
      return scheduleKeys;
    } catch (error) {
      window.Logger?.error('Failed to list schedules', error);
      return [];
    }
  }

  /**
   * 利用者データを保存
   * @param {User[]} users - 利用者配列
   * @returns {boolean} 成功かどうか
   */
  saveUsers(users) {
    if (!Array.isArray(users)) {
      window.Logger?.error('Users must be an array');
      return false;
    }

    try {
      const data = users.map(user => {
        if (typeof user.toJSON === 'function') {
          return user.toJSON();
        } else {
          window.Logger?.warn('User object does not have toJSON method:', user);
          return user;
        }
      });

      const success = this.save(this.storageKeys.USERS, data);
      if (success) {
        window.Logger?.info(`Saved ${users.length} users`);
      }
      return success;
    } catch (error) {
      window.Logger?.error('Failed to save users', error);
      return false;
    }
  }

  /**
   * 利用者データを読み込み
   * @returns {User[]} 利用者配列
   */
  loadUsers() {
    try {
      const data = this.load(this.storageKeys.USERS, []);
      
      if (!Array.isArray(data)) {
        window.Logger?.warn('Loaded users data is not an array, returning empty array');
        return [];
      }

      const users = data.map(userData => {
        try {
          if (typeof window.User.fromJSON === 'function') {
            return window.User.fromJSON(userData);
          } else {
            // fromJSONメソッドがない場合は直接コンストラクタを使用
            return new window.User(userData);
          }
        } catch (error) {
          window.Logger?.warn('Failed to create User from data:', userData, error);
          return null;
        }
      }).filter(user => user !== null);

      window.Logger?.info(`Loaded ${users.length} users`);
      return users;
    } catch (error) {
      window.Logger?.error('Failed to load users', error);
      return [];
    }
  }

  /**
   * 備考データを保存
   * @param {Note[]} notes - 備考配列
   * @returns {boolean} 成功かどうか
   */
  saveNotes(notes) {
    if (!Array.isArray(notes)) {
      window.Logger?.error('Notes must be an array');
      return false;
    }

    try {
      const data = notes.map(note => {
        if (typeof note.toJSON === 'function') {
          return note.toJSON();
        } else {
          window.Logger?.warn('Note object does not have toJSON method:', note);
          return note;
        }
      });

      const success = this.save(this.storageKeys.NOTES, data);
      if (success) {
        window.Logger?.info(`Saved ${notes.length} notes`);
      }
      return success;
    } catch (error) {
      window.Logger?.error('Failed to save notes', error);
      return false;
    }
  }

  /**
   * 備考データを読み込み
   * @returns {Note[]} 備考配列
   */
  loadNotes() {
    try {
      const data = this.load(this.storageKeys.NOTES, []);
      
      if (!Array.isArray(data)) {
        window.Logger?.warn('Loaded notes data is not an array, returning empty array');
        return [];
      }

      const notes = data.map(noteData => {
        try {
          if (typeof window.Note.fromJSON === 'function') {
            return window.Note.fromJSON(noteData);
          } else {
            // fromJSONメソッドがない場合は直接コンストラクタを使用
            return new window.Note(noteData);
          }
        } catch (error) {
          window.Logger?.warn('Failed to create Note from data:', noteData, error);
          return null;
        }
      }).filter(note => note !== null);

      window.Logger?.info(`Loaded ${notes.length} notes`);
      return notes;
    } catch (error) {
      window.Logger?.error('Failed to load notes', error);
      return [];
    }
  }

  /**
   * ストレージ使用量を取得
   * @returns {Object} ストレージ使用量情報
   */
  getStorageInfo() {
    try {
      let totalSize = 0;
      const items = {};

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        const size = value ? value.length : 0;
        items[key] = { size, sizeKB: Math.round(size / 1024 * 100) / 100 };
        totalSize += size;
      }

      return {
        totalItems: localStorage.length,
        totalSize,
        totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
        totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
        items
      };
    } catch (error) {
      window.Logger?.error('Failed to get storage info', error);
      return {
        totalItems: 0,
        totalSize: 0,
        totalSizeKB: 0,
        totalSizeMB: 0,
        items: {}
      };
    }
  }

  /**
   * バックアップデータを作成
   * @returns {Object|null} バックアップデータ
   */
  createBackup() {
    try {
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {}
      };

      // 全てのデータを収集
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        backup.data[key] = value;
      }

      window.Logger?.info(`Backup created with ${Object.keys(backup.data).length} items`);
      return backup;
    } catch (error) {
      window.Logger?.error('Failed to create backup', error);
      return null;
    }
  }

  /**
   * バックアップからデータを復元
   * @param {Object} backup - バックアップデータ
   * @returns {boolean} 成功かどうか
   */
  restoreBackup(backup) {
    if (!backup || !backup.data) {
      window.Logger?.error('Invalid backup data');
      return false;
    }

    try {
      // 現在のデータをクリア
      this.clear();

      // バックアップデータを復元
      let restoredCount = 0;
      for (const [key, value] of Object.entries(backup.data)) {
        try {
          localStorage.setItem(key, value);
          restoredCount++;
        } catch (error) {
          window.Logger?.warn(`Failed to restore item: ${key}`, error);
        }
      }

      window.Logger?.info(`Backup restored: ${restoredCount} items`);
      return true;
    } catch (error) {
      window.Logger?.error('Failed to restore backup', error);
      return false;
    }
  }

  /**
   * データの存在確認
   * @param {string} key - ストレージキー
   * @returns {boolean} データが存在するかどうか
   */
  exists(key) {
    return localStorage.getItem(key) !== null;
  }

  /**
   * デバッグ情報を出力
   */
  debug() {
    const info = this.getStorageInfo();
    const schedules = this.listSchedules();

    window.Logger?.group('StorageService Debug Info');
    window.Logger?.info('Storage Keys:', this.storageKeys);
    window.Logger?.info('Storage Info:', info);
    window.Logger?.info('Available Schedules:', schedules);
    
    // 各種データの存在確認
    window.Logger?.info('Data Existence:', {
      users: this.exists(this.storageKeys.USERS),
      notes: this.exists(this.storageKeys.NOTES),
      schedules: schedules.length
    });

    window.Logger?.groupEnd();
  }
}

// グローバルに登録
window.StorageService = StorageService;