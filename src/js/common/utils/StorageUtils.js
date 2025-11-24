/**
 * StorageUtils.js
 * localStorage操作ユーティリティ
 * 
 * データの永続化を管理
 */

export class StorageUtils {
  /**
   * ストレージキーのプレフィックス
   */
  static PREFIX = 'projectB_';

  /**
   * データを保存
   * @param {string} key - キー
   * @param {any} data - 保存するデータ
   * @returns {boolean} - 成功したかどうか
   */
  static save(key, data) {
    try {
      const fullKey = this.PREFIX + key;
      const json = JSON.stringify(data);
      localStorage.setItem(fullKey, json);
      return true;
    } catch (error) {
      console.error(`StorageUtils.save error [${key}]:`, error);
      return false;
    }
  }

  /**
   * データを読み込み
   * @param {string} key - キー
   * @param {any} defaultValue - デフォルト値
   * @returns {any} - 読み込んだデータ（なければdefaultValue）
   */
  static load(key, defaultValue = null) {
    try {
      const fullKey = this.PREFIX + key;
      const json = localStorage.getItem(fullKey);
      
      if (json === null) {
        return defaultValue;
      }
      
      return JSON.parse(json);
    } catch (error) {
      console.error(`StorageUtils.load error [${key}]:`, error);
      return defaultValue;
    }
  }

  /**
   * データを削除
   * @param {string} key - キー
   * @returns {boolean} - 成功したかどうか
   */
  static remove(key) {
    try {
      const fullKey = this.PREFIX + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error(`StorageUtils.remove error [${key}]:`, error);
      return false;
    }
  }

  /**
   * データの存在チェック
   * @param {string} key - キー
   * @returns {boolean}
   */
  static has(key) {
    const fullKey = this.PREFIX + key;
    return localStorage.getItem(fullKey) !== null;
  }

  /**
   * すべてのプロジェクトデータをクリア
   * @returns {boolean}
   */
  static clearAll() {
    try {
      const keys = Object.keys(localStorage);
      const projectKeys = keys.filter(key => key.startsWith(this.PREFIX));
      
      projectKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log(`StorageUtils: ${projectKeys.length} keys cleared`);
      return true;
    } catch (error) {
      console.error('StorageUtils.clearAll error:', error);
      return false;
    }
  }

  /**
   * ストレージの使用状況を取得
   * @returns {Object} { used: number, total: number, percentage: number }
   */
  static getUsage() {
    try {
      let used = 0;
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        used += key.length + (value ? value.length : 0);
      });

      // localStorageの上限は約5MB（ブラウザによる）
      const total = 5 * 1024 * 1024; // 5MB in bytes
      const percentage = (used / total) * 100;

      return {
        used: Math.round(used / 1024), // KB単位
        total: Math.round(total / 1024), // KB単位
        percentage: Math.round(percentage * 10) / 10
      };
    } catch (error) {
      console.error('StorageUtils.getUsage error:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * データのバックアップ（JSON形式）
   * @returns {string} - JSON文字列
   */
  static exportBackup() {
    try {
      const data = {};
      const keys = Object.keys(localStorage);
      const projectKeys = keys.filter(key => key.startsWith(this.PREFIX));
      
      projectKeys.forEach(fullKey => {
        const key = fullKey.replace(this.PREFIX, '');
        const value = localStorage.getItem(fullKey);
        data[key] = JSON.parse(value);
      });

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('StorageUtils.exportBackup error:', error);
      return null;
    }
  }

  /**
   * バックアップからデータを復元
   * @param {string} json - JSON文字列
   * @returns {boolean}
   */
  static importBackup(json) {
    try {
      const data = JSON.parse(json);
      
      Object.keys(data).forEach(key => {
        this.save(key, data[key]);
      });
      
      console.log(`StorageUtils: ${Object.keys(data).length} keys imported`);
      return true;
    } catch (error) {
      console.error('StorageUtils.importBackup error:', error);
      return false;
    }
  }

  /**
   * 最終保存時刻を更新
   */
  static updateLastSaved() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const element = document.getElementById('last-saved');
    if (element) {
      element.textContent = `最終保存: ${timeStr}`;
    }
  }
}
