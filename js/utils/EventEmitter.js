/**
 * イベント管理ユーティリティ
 * カスタムイベントの発火と監視を管理
 */
class EventEmitter {
    constructor() {
        this.events = {};
        this.logger = new Logger('EventEmitter');
    }

    /**
     * イベントリスナーを登録
     * @param {string} eventName - イベント名
     * @param {Function} callback - コールバック関数
     * @returns {Function} 登録解除関数
     */
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        
        this.events[eventName].push(callback);
        this.logger.debug(`Event listener added: ${eventName}`);

        // 登録解除関数を返す
        return () => this.off(eventName, callback);
    }

    /**
     * イベントリスナーを解除
     */
    off(eventName, callback) {
        if (!this.events[eventName]) return;

        const index = this.events[eventName].indexOf(callback);
        if (index > -1) {
            this.events[eventName].splice(index, 1);
            this.logger.debug(`Event listener removed: ${eventName}`);
        }
    }

    /**
     * 一度だけ実行されるイベントリスナーを登録
     */
    once(eventName, callback) {
        const onceCallback = (...args) => {
            callback(...args);
            this.off(eventName, onceCallback);
        };
        this.on(eventName, onceCallback);
    }

    /**
     * イベントを発火
     */
    emit(eventName, ...args) {
        if (!this.events[eventName]) return;

        this.logger.debug(`Event emitted: ${eventName}`, args);
        
        this.events[eventName].forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                this.logger.error(`Error in event listener for ${eventName}:`, error);
            }
        });
    }

    /**
     * 全イベントリスナーをクリア
     */
    clear() {
        this.events = {};
        this.logger.debug('All event listeners cleared');
    }

    /**
     * 特定のイベントのリスナーをクリア
     */
    clearEvent(eventName) {
        delete this.events[eventName];
        this.logger.debug(`Event listeners cleared: ${eventName}`);
    }
}

// グローバル変数として公開
window.EventEmitter = EventEmitter;
