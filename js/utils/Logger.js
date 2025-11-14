/**
 * ログ出力ユーティリティ
 * 開発時のデバッグとエラー追跡を支援
 */
class Logger {
    constructor(name) {
        this.name = name;
        this.enabled = true; // 本番環境ではfalseに設定
    }

    /**
     * 情報ログ
     */
    info(...args) {
        if (!this.enabled) return;
        console.log(`[${this.name}]`, ...args);
    }

    /**
     * 警告ログ
     */
    warn(...args) {
        if (!this.enabled) return;
        console.warn(`[${this.name}]`, ...args);
    }

    /**
     * エラーログ
     */
    error(...args) {
        // エラーは常に出力
        console.error(`[${this.name}]`, ...args);
    }

    /**
     * デバッグログ（詳細情報）
     */
    debug(...args) {
        if (!this.enabled) return;
        console.debug(`[${this.name}]`, ...args);
    }

    /**
     * グループログ開始
     */
    group(label) {
        if (!this.enabled) return;
        console.group(`[${this.name}] ${label}`);
    }

    /**
     * グループログ終了
     */
    groupEnd() {
        if (!this.enabled) return;
        console.groupEnd();
    }

    /**
     * タイマー開始
     */
    time(label) {
        if (!this.enabled) return;
        console.time(`[${this.name}] ${label}`);
    }

    /**
     * タイマー終了
     */
    timeEnd(label) {
        if (!this.enabled) return;
        console.timeEnd(`[${this.name}] ${label}`);
    }
}

// グローバル変数として公開
window.Logger = Logger;
