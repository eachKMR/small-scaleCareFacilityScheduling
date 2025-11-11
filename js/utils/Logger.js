    /**
 * 小規模多機能利用調整システム - ログユーティリティ
 * ログレベル管理、タイムスタンプ付きログ出力、フィルタリング機能
 */

class Logger {
  // ログレベル定義
  static LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  /**
   * ログ出力の基底メソッド
   * @param {string} level - ログレベル (debug, info, warn, error)
   * @param {...any} args - ログに出力する引数
   */
  static log(level, ...args) {
    try {
      // AppConfigからログレベル設定を取得（フォールバック: debug）
      const config = window.AppConfig || { LOG_LEVEL: 'debug' };
      const currentLevel = this.LEVELS[config.LOG_LEVEL] || 0;
      const messageLevel = this.LEVELS[level] || 0;
      
      // 現在のログレベル設定より低いレベルの場合は出力しない
      if (messageLevel < currentLevel) {
        return;
      }
      
      // タイムスタンプとプレフィックスを生成
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      
      // ブラウザのコンソールメソッドを使用してログ出力
      const consoleMethod = console[level] || console.log;
      consoleMethod(prefix, ...args);
      
    } catch (error) {
      // Logger自体でエラーが発生した場合のフォールバック
      console.error('[LOGGER ERROR]', error);
      console.log('[FALLBACK LOG]', level, ...args);
    }
  }

  /**
   * デバッグレベルのログ出力
   * 開発時の詳細な情報、変数の値、フロー確認など
   * @param {...any} args - ログに出力する引数
   */
  static debug(...args) {
    this.log('debug', ...args);
  }

  /**
   * 情報レベルのログ出力
   * 一般的な情報、処理の開始・終了、正常な状態変化など
   * @param {...any} args - ログに出力する引数
   */
  static info(...args) {
    this.log('info', ...args);
  }

  /**
   * 警告レベルのログ出力
   * 注意が必要な状況、推奨されない使用方法、軽微な問題など
   * @param {...any} args - ログに出力する引数
   */
  static warn(...args) {
    this.log('warn', ...args);
  }

  /**
   * エラーレベルのログ出力
   * エラー、例外、重大な問題、失敗した処理など
   * @param {...any} args - ログに出力する引数
   */
  static error(...args) {
    this.log('error', ...args);
  }

  /**
   * 成功レベルのログ出力
   * 成功した処理、正常完了、達成した目標など
   * @param {...any} args - ログに出力する引数
   */
  static success(...args) {
    // successは視覚的に目立つようにinfoレベルで出力し、✓マークを付ける
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [SUCCESS]`;
    console.info(prefix, '✅', ...args);
  }

  /**
   * パフォーマンス測定のためのタイマー開始
   * @param {string} label - タイマーのラベル
   */
  static time(label) {
    if (window.AppConfig?.DEBUG?.SHOW_PERFORMANCE_METRICS) {
      console.time(`[PERF] ${label}`);
    }
  }

  /**
   * パフォーマンス測定のためのタイマー終了
   * @param {string} label - タイマーのラベル
   */
  static timeEnd(label) {
    if (window.AppConfig?.DEBUG?.SHOW_PERFORMANCE_METRICS) {
      console.timeEnd(`[PERF] ${label}`);
    }
  }

  /**
   * グループ化されたログの開始
   * @param {string} label - グループのラベル
   * @param {boolean} collapsed - 初期状態で折りたたむかどうか
   */
  static group(label, collapsed = false) {
    const method = collapsed ? 'groupCollapsed' : 'group';
    if (console[method]) {
      console[method](`[GROUP] ${label}`);
    }
  }

  /**
   * グループ化されたログの終了
   */
  static groupEnd() {
    if (console.groupEnd) {
      console.groupEnd();
    }
  }

  /**
   * テーブル形式でのデータ表示
   * @param {any} data - 表示するデータ
   * @param {string} label - テーブルのラベル
   */
  static table(data, label = '') {
    if (console.table) {
      if (label) {
        this.info(`Table: ${label}`);
      }
      console.table(data);
    } else {
      this.debug('Table data:', data);
    }
  }

  /**
   * 現在のログレベル設定を取得
   * @returns {string} 現在のログレベル
   */
  static getCurrentLevel() {
    const config = window.AppConfig || { LOG_LEVEL: 'debug' };
    return config.LOG_LEVEL;
  }

  /**
   * ログレベルを動的に変更
   * @param {string} level - 新しいログレベル
   */
  static setLevel(level) {
    if (this.LEVELS.hasOwnProperty(level)) {
      if (window.AppConfig) {
        window.AppConfig.LOG_LEVEL = level;
        this.info(`Log level changed to: ${level}`);
      } else {
        this.warn('AppConfig not available, cannot change log level');
      }
    } else {
      this.error(`Invalid log level: ${level}. Valid levels:`, Object.keys(this.LEVELS));
    }
  }

  /**
   * ログの出力可否を判定
   * @param {string} level - 判定するログレベル
   * @returns {boolean} 出力可能かどうか
   */
  static canLog(level) {
    const config = window.AppConfig || { LOG_LEVEL: 'debug' };
    const currentLevel = this.LEVELS[config.LOG_LEVEL] || 0;
    const messageLevel = this.LEVELS[level] || 0;
    return messageLevel >= currentLevel;
  }
}

// グローバルに登録
window.Logger = Logger;