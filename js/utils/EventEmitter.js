/**
 * 小規模多機能利用調整システム - イベントエミッター
 * イベント駆動アーキテクチャの基底クラス
 * コンポーネント間の疎結合な通信を実現
 */

class EventEmitter {
  /**
   * EventEmitterコンストラクタ
   * イベントリスナーを管理するためのマップを初期化
   */
  constructor() {
    this._events = new Map();
    this._maxListeners = 50; // デフォルトの最大リスナー数
    this._debug = false;
  }

  /**
   * イベントリスナーを登録
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック関数
   * @param {Object} options - オプション設定
   * @param {Object} options.context - コールバックのthisコンテキスト
   * @param {boolean} options.once - 一度だけ実行するかどうか
   * @returns {EventEmitter} メソッドチェーンのためにthisを返す
   */
  on(event, callback, options = {}) {
    if (typeof event !== 'string') {
      throw new TypeError('Event name must be a string');
    }
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    // イベントリスナー配列がない場合は作成
    if (!this._events.has(event)) {
      this._events.set(event, []);
    }

    const listeners = this._events.get(event);
    
    // 最大リスナー数チェック
    if (listeners.length >= this._maxListeners) {
      window.Logger?.warn(`Event "${event}" has reached max listeners (${this._maxListeners})`);
    }

    // リスナーオブジェクトを作成
    const listener = {
      callback,
      context: options.context || null,
      once: options.once || false,
      id: this._generateListenerId()
    };

    listeners.push(listener);

    if (this._debug) {
      window.Logger?.debug(`EventEmitter: Added listener for "${event}"`, { listenerId: listener.id });
    }

    return this;
  }

  /**
   * イベントリスナーを解除
   * @param {string} event - イベント名
   * @param {Function} callback - 解除するコールバック関数
   * @returns {EventEmitter} メソッドチェーンのためにthisを返す
   */
  off(event, callback) {
    if (!this._events.has(event)) {
      return this;
    }

    const listeners = this._events.get(event);
    const filteredListeners = listeners.filter(listener => listener.callback !== callback);
    
    if (filteredListeners.length === 0) {
      this._events.delete(event);
    } else {
      this._events.set(event, filteredListeners);
    }

    if (this._debug) {
      window.Logger?.debug(`EventEmitter: Removed listener for "${event}"`);
    }

    return this;
  }

  /**
   * 指定イベントのすべてのリスナーを削除
   * @param {string} event - イベント名
   * @returns {EventEmitter} メソッドチェーンのためにthisを返す
   */
  removeAllListeners(event) {
    if (event) {
      this._events.delete(event);
      if (this._debug) {
        window.Logger?.debug(`EventEmitter: Removed all listeners for "${event}"`);
      }
    } else {
      this._events.clear();
      if (this._debug) {
        window.Logger?.debug('EventEmitter: Removed all listeners for all events');
      }
    }
    return this;
  }

  /**
   * イベントを発火
   * @param {string} event - イベント名
   * @param {any} data - イベントデータ
   * @returns {boolean} リスナーが存在したかどうか
   */
  emit(event, data) {
    if (!this._events.has(event)) {
      if (this._debug) {
        window.Logger?.debug(`EventEmitter: No listeners for event "${event}"`);
      }
      return false;
    }

    const listeners = this._events.get(event);
    const listenersToRemove = [];

    if (this._debug) {
      window.Logger?.debug(`EventEmitter: Emitting "${event}" to ${listeners.length} listeners`, data);
    }

    // リスナーを実行
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      
      try {
        // コンテキストを適用してコールバックを実行
        if (listener.context) {
          listener.callback.call(listener.context, data);
        } else {
          listener.callback(data);
        }

        // onceフラグが立っている場合は削除リストに追加
        if (listener.once) {
          listenersToRemove.push(i);
        }

      } catch (error) {
        window.Logger?.error(`EventEmitter: Error in event handler for "${event}":`, error);
        // エラーが発生してもほかのリスナーの実行を継続
      }
    }

    // once指定のリスナーを削除（逆順で削除してインデックスを保持）
    for (let i = listenersToRemove.length - 1; i >= 0; i--) {
      listeners.splice(listenersToRemove[i], 1);
    }

    // リスナーがなくなった場合はイベントマップから削除
    if (listeners.length === 0) {
      this._events.delete(event);
    }

    return true;
  }

  /**
   * 一度だけ実行されるイベントリスナーを登録
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック関数
   * @param {Object} context - コールバックのthisコンテキスト
   * @returns {EventEmitter} メソッドチェーンのためにthisを返す
   */
  once(event, callback, context = null) {
    return this.on(event, callback, { once: true, context });
  }

  /**
   * 指定イベントのリスナー数を取得
   * @param {string} event - イベント名
   * @returns {number} リスナー数
   */
  listenerCount(event) {
    if (!this._events.has(event)) {
      return 0;
    }
    return this._events.get(event).length;
  }

  /**
   * 登録されているイベント名の一覧を取得
   * @returns {string[]} イベント名の配列
   */
  eventNames() {
    return Array.from(this._events.keys());
  }

  /**
   * 最大リスナー数を設定
   * @param {number} max - 最大リスナー数
   * @returns {EventEmitter} メソッドチェーンのためにthisを返す
   */
  setMaxListeners(max) {
    if (typeof max !== 'number' || max < 0) {
      throw new TypeError('Max listeners must be a non-negative number');
    }
    this._maxListeners = max;
    return this;
  }

  /**
   * 最大リスナー数を取得
   * @returns {number} 最大リスナー数
   */
  getMaxListeners() {
    return this._maxListeners;
  }

  /**
   * デバッグモードの設定
   * @param {boolean} debug - デバッグモードを有効にするかどうか
   * @returns {EventEmitter} メソッドチェーンのためにthisを返す
   */
  setDebug(debug) {
    this._debug = !!debug;
    return this;
  }

  /**
   * プロミスベースのイベント待機
   * @param {string} event - 待機するイベント名
   * @param {number} timeout - タイムアウト時間（ミリ秒）
   * @returns {Promise} イベントデータまたはタイムアウトエラーを解決するプロミス
   */
  waitFor(event, timeout = 5000) {
    return new Promise((resolve, reject) => {
      let timeoutId;
      
      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      // タイムアウト設定
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          this.off(event, onEvent);
          reject(new Error(`Event "${event}" timeout after ${timeout}ms`));
        }, timeout);
      }

      // イベントリスナー
      const onEvent = (data) => {
        cleanup();
        resolve(data);
      };

      this.once(event, onEvent);
    });
  }

  /**
   * 内部用：リスナーIDを生成
   * @returns {string} ユニークなリスナーID
   * @private
   */
  _generateListenerId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * デバッグ情報を出力
   */
  debug() {
    const eventInfo = {};
    for (const [event, listeners] of this._events) {
      eventInfo[event] = listeners.length;
    }
    
    window.Logger?.info('EventEmitter Debug Info:', {
      totalEvents: this._events.size,
      maxListeners: this._maxListeners,
      eventListenerCounts: eventInfo
    });
  }
}

// グローバルに登録
window.EventEmitter = EventEmitter;