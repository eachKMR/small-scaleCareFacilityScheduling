/**
 * アプリケーション設定
 * 全体で使用する定数や設定値を定義
 */
const AppConfig = {
    // 記号定義
    SYMBOLS: {
        FULL_DAY: '○',      // 終日通い
        STAY_MIDDLE: '◎',   // 連泊中（通い+泊り）
        MORNING: '◓',       // 前半通い
        AFTERNOON: '◒',     // 後半通い
        CHECK_IN: '入',     // 入所
        CHECK_OUT: '退',    // 退所
        EMPTY: ''           // 空欄
    },

    // 定員設定
    CAPACITY: {
        DAY_LIMIT: 15,      // 通い定員
        STAY_LIMIT: 9,      // 泊り定員
        THRESHOLDS: {       // 定員状況の閾値（％）
            GOOD: 66,       // ◎：良好
            OK: 80,         // ○：通常
            WARN: 93,       // △：注意
            FULL: 94        // ×：満員
        }
    },

    // 表示設定
    VISUAL: {
        COLORS: {
            STAY_PERIOD: '#fffacd',     // 宿泊期間の背景色
            OVER_CAPACITY: '#ffcccc',   // 定員オーバーの背景色
            WEEKEND: '#f0f0f0',          // 土日の背景色
            HOLIDAY: '#fff0f0',          // 祝日の背景色
            SPECIAL_CELL: '#e8e8e8'      // 特別セルの背景色
        },
        GRID: {
            ROWS: 58,                    // 行数（ヘッダー含む）
            COLS: 33,                    // 列数（特別セル含む）
            CELL_WIDTH: 40,              // セル幅（px）
            CELL_HEIGHT: 30              // セル高さ（px）
        }
    },

    // データ保存設定
    STORAGE: {
        PREFIX: 'schedule_',             // LocalStorageキーのプレフィックス
        AUTO_SAVE: true,                 // 自動保存
        MAX_MONTHS: 1                    // 保持する月数
    },

    // デフォルト値
    DEFAULTS: {
        YEAR_MONTH: (() => {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        })(),
        USERS: []  // 空の利用者リスト（DEFAULT_USERS廃止）
    }
};

// グローバル変数として公開
window.AppConfig = AppConfig;
