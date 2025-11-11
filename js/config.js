/**
 * 小規模多機能利用調整システム - アプリケーション設定
 * グローバル設定値を管理
 */

const AppConfig = {
  // アプリケーション情報
  APP_NAME: "小規模多機能利用調整システム",
  VERSION: "1.0.0",
  
  // ログレベル設定
  LOG_LEVEL: "debug", // "debug" | "info" | "warn" | "error"
  
  // 定員設定
  CAPACITY: {
    DAY: 15,           // 通いの1日の定員
    STAY: 9,           // 泊まりの1日の定員
    REGISTRATION: 29   // 登録定員
  },
  
  // ローカルストレージキー
  STORAGE_KEYS: {
    SCHEDULES: 'schedules_',  // スケジュールデータ（月別）
    USERS: 'users',           // 利用者マスタ
    NOTES: 'notes',           // メモ・申し送り
    CONFIG: 'app_config',     // アプリ設定
    BACKUP: 'backup_'         // バックアップデータ
  },
  
  // 日付・時間設定
  DATE_FORMAT: {
    DISPLAY: 'YYYY年MM月DD日',
    STORAGE: 'YYYY-MM-DD',
    MONTH: 'YYYY-MM'
  },
  
  // UI設定
  UI: {
    TOAST_DURATION: 5000,     // トースト表示時間（ミリ秒）
    ANIMATION_DURATION: 300,  // アニメーション時間（ミリ秒）
    DEBOUNCE_DELAY: 300      // 入力のデバウンス時間（ミリ秒）
  },
  
  // サービス種別設定
  SERVICE_TYPES: {
    DAY_CARE: 'day',          // 通い
    OVERNIGHT: 'stay',        // 泊まり
    VISIT: 'visit',           // 訪問
    NONE: 'none'              // サービス利用なし
  },
  
  // 色設定（CSS変数と連動）
  COLORS: {
    DAY_CARE: '#2196f3',      // 通い（ブルー）
    OVERNIGHT: '#4caf50',     // 泊まり（グリーン）
    VISIT: '#ff9800',         // 訪問（オレンジ）
    NONE: '#e0e0e0',          // なし（グレー）
    WARNING: '#f44336',       // 警告（レッド）
    OVER_CAPACITY: '#f44336'  // 定員超過（レッド）
  },
  
  // バリデーション設定
  VALIDATION: {
    USER_NAME_MAX_LENGTH: 20,
    NOTE_MAX_LENGTH: 500,
    REQUIRED_FIELDS: ['name']
  },
  
  // 開発・デバッグ設定
  DEBUG: {
    SHOW_CONSOLE_LOGS: true,
    SHOW_PERFORMANCE_METRICS: false,
    MOCK_DATA_ENABLED: false
  }
};

// 設定の不変性を保護（開発時のみ）
if (AppConfig.DEBUG.SHOW_CONSOLE_LOGS) {
  Object.freeze(AppConfig);
  Object.freeze(AppConfig.CAPACITY);
  Object.freeze(AppConfig.STORAGE_KEYS);
  Object.freeze(AppConfig.DATE_FORMAT);
  Object.freeze(AppConfig.UI);
  Object.freeze(AppConfig.SERVICE_TYPES);
  Object.freeze(AppConfig.COLORS);
  Object.freeze(AppConfig.VALIDATION);
  Object.freeze(AppConfig.DEBUG);
}

// グローバルに登録
window.AppConfig = AppConfig;