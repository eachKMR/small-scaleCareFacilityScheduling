/**
 * main.js - アプリケーションエントリーポイント
 * App.jsで自動初期化されるため、ここでは設定確認のみ
 */

// AppConfigの確認
if (typeof AppConfig !== 'undefined') {
    console.log('[main.js] AppConfig loaded successfully');
    console.log('[main.js] SYMBOLS:', AppConfig.SYMBOLS);
    console.log('[main.js] CAPACITY:', AppConfig.CAPACITY);
} else {
    console.error('[main.js] AppConfig not found!');
}

// アプリケーション起動はApp.jsで自動実行される
console.log('[main.js] Application will be initialized by App.js');
