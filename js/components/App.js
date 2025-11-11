/**
 * アプリケーションのメインクラス
 * EventEmitterを継承し、全コントローラーとUIコンポーネントを統合管理
 */
class App extends EventEmitter {
    constructor() {
        // 依存関係チェック
        if (typeof window.EventEmitter === 'undefined') {
            throw new Error('EventEmitter is required');
        }
        if (typeof window.Logger === 'undefined') {
            throw new Error('Logger is required');
        }
        if (typeof window.StorageService === 'undefined') {
            throw new Error('StorageService is required');
        }
        if (typeof window.ExcelService === 'undefined') {
            throw new Error('ExcelService is required');
        }

        super();
        
        this.currentYearMonth = null;
        this.controllers = {};
        this.components = {};
        this.isInitialized = false;
        
        Logger?.info('App instance created');
    }
    
    /**
     * アプリケーション全体を初期化
     */
    async init() {
        try {
            Logger?.info('=== App initialization started ===');
            
            // 1. コントローラー初期化
            this.initControllers();
            
            // 2. デフォルト月を設定
            const now = new Date();
            this.currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            
            // 3. データ読み込み
            await this.loadInitialData();
            
            // 4. UIコンポーネント初期化
            this.initComponents();
            
            // 5. イベントリスナー設定
            this.setupEventListeners();
            
            // 6. 初回レンダリング
            this.render();
            
            this.isInitialized = true;
            Logger?.info('=== App initialization completed ===');
            this.showToast('アプリケーションを起動しました', 'success');
            
        } catch (error) {
            Logger?.error('App initialization failed:', error);
            this.showError('初期化に失敗しました: ' + error.message);
            throw error;
        }
    }
    
    /**
     * コントローラー初期化
     */
    initControllers() {
        try {
            // StorageService と ExcelService のインスタンス作成
            const storage = new StorageService();
            const excelService = new ExcelService();
            
            // コントローラー初期化
            this.controllers.schedule = new ScheduleController();
            this.controllers.capacity = new CapacityCheckController(this.controllers.schedule);
            this.controllers.note = new NoteController();
            this.controllers.excel = new ExcelController(this.controllers.schedule);
            
            Logger?.info('Controllers initialized');
        } catch (error) {
            Logger?.error('Controller initialization failed:', error);
            throw new Error('コントローラーの初期化に失敗しました: ' + error.message);
        }
    }
    
    /**
     * 初期データ読み込み
     */
    async loadInitialData() {
        try {
            // ユーザーデータ読み込み（ScheduleControllerが自動的に行う）
            // 現在の月のスケジュール読み込み
            if (DEFAULT_USERS && DEFAULT_USERS.length > 0) {
                this.controllers.schedule.loadSchedule(DEFAULT_USERS[0].id, this.currentYearMonth);
            }
            
            Logger?.info('Initial data loaded');
        } catch (error) {
            Logger?.error('Initial data loading failed:', error);
            throw new Error('初期データの読み込みに失敗しました: ' + error.message);
        }
    }
    
    /**
     * UIコンポーネント初期化
     */
    initComponents() {
        try {
            // CellEditor は全体で1つ
            this.components.cellEditor = new CellEditor(this);
            
            // 各コンポーネントを初期化
            this.components.toolbar = new Toolbar(this, 'toolbar');
            this.components.capacityIndicator = new CapacityIndicator(this, 'capacity-indicator');
            this.components.grid = new ScheduleGrid(this, 'schedule-grid-container');
            this.components.notePanel = new NotePanel(this);
            
            // 各コンポーネントのinit()を呼び出し
            Object.values(this.components).forEach(component => {
                if (component.init) {
                    component.init();
                }
            });
            
            Logger?.info('Components initialized');
        } catch (error) {
            Logger?.error('Component initialization failed:', error);
            throw new Error('UIコンポーネントの初期化に失敗しました: ' + error.message);
        }
    }
    
    /**
     * イベントリスナー設定
     */
    setupEventListeners() {
        try {
            // ScheduleController のイベント
            this.controllers.schedule.on('cellUpdated', (data) => {
                Logger?.debug('Cell updated event received:', data);
                
                // グリッドと定員表示を更新
                this.components.grid?.refresh();
                this.components.capacityIndicator?.refresh();
                
                // 更新通知
                this.showToast('スケジュールを更新しました', 'success');
            });
            
            this.controllers.schedule.on('monthChanged', (data) => {
                Logger?.debug('Month changed event received:', data);
                
                this.currentYearMonth = data.yearMonth;
                this.render();
                
                this.showToast(`${data.yearMonth}に切り替えました`, 'info');
            });
            
            this.controllers.schedule.on('userSwitched', (data) => {
                Logger?.debug('User switched event received:', data);
                
                this.components.grid?.refresh();
                this.components.capacityIndicator?.refresh();
            });
            
            // NoteController のイベント
            this.controllers.note.on('noteCreated', (data) => {
                Logger?.debug('Note created event received:', data);
                this.showToast('備考を追加しました', 'success');
            });
            
            this.controllers.note.on('noteUpdated', (data) => {
                Logger?.debug('Note updated event received:', data);
                this.showToast('備考を更新しました', 'success');
            });
            
            this.controllers.note.on('noteDeleted', (data) => {
                Logger?.debug('Note deleted event received:', data);
                this.showToast('備考を削除しました', 'info');
            });
            
            Logger?.info('Event listeners set up');
        } catch (error) {
            Logger?.error('Event listener setup failed:', error);
            throw new Error('イベントリスナーの設定に失敗しました: ' + error.message);
        }
    }
    
    /**
     * 全コンポーネントを再レンダリング
     */
    render() {
        try {
            Logger?.debug('App rendering...');
            
            // 各コンポーネントのレンダリング
            this.components.toolbar?.render();
            this.components.capacityIndicator?.render();
            this.components.grid?.render();
            
            Logger?.debug('App rendered');
        } catch (error) {
            Logger?.error('App rendering failed:', error);
            this.showError('画面の描画に失敗しました: ' + error.message);
        }
    }
    
    /**
     * 月切り替え
     * @param {string} yearMonth - YYYY-MM形式
     */
    switchMonth(yearMonth) {
        try {
            Logger?.info('Switching to month:', yearMonth);
            
            // ScheduleController に月切り替えを依頼
            this.controllers.schedule.switchMonth(yearMonth);
            
        } catch (error) {
            Logger?.error('Month switch failed:', error);
            this.showError('月の切り替えに失敗しました: ' + error.message);
        }
    }
    
    /**
     * トースト通知を表示
     * @param {string} message - メッセージ
     * @param {string} type - 'success' | 'warning' | 'error' | 'info'
     */
    showToast(message, type = 'info') {
        try {
            // 既存のトーストを削除
            const existingToasts = document.querySelectorAll('.toast');
            existingToasts.forEach(toast => toast.remove());
            
            // 新しいトーストを作成
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.textContent = message;
            
            // スタイル設定
            Object.assign(toast.style, {
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '12px 20px',
                borderRadius: '4px',
                color: 'white',
                fontWeight: 'bold',
                zIndex: '10000',
                opacity: '0',
                transition: 'opacity 0.3s ease',
                maxWidth: '300px',
                wordWrap: 'break-word'
            });
            
            // タイプ別色設定
            const colors = {
                success: '#4CAF50',
                warning: '#FF9800',
                error: '#F44336',
                info: '#2196F3'
            };
            toast.style.backgroundColor = colors[type] || colors.info;
            
            document.body.appendChild(toast);
            
            // フェードイン
            setTimeout(() => {
                toast.style.opacity = '1';
            }, 10);
            
            // 3秒後にフェードアウト
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            }, 3000);
            
            Logger?.info(`Toast: [${type}] ${message}`);
        } catch (error) {
            Logger?.error('Toast display failed:', error);
            // フォールバック: コンソールに出力
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    /**
     * エラートーストを表示
     * @param {string} message - エラーメッセージ
     */
    showError(message) {
        this.showToast(message, 'error');
    }
    
    /**
     * 現在の年月を取得
     * @returns {string} YYYY-MM形式
     */
    getCurrentYearMonth() {
        return this.currentYearMonth;
    }
    
    /**
     * コントローラーを取得
     * @param {string} name - コントローラー名
     * @returns {object} コントローラー
     */
    getController(name) {
        return this.controllers[name];
    }
    
    /**
     * コンポーネントを取得
     * @param {string} name - コンポーネント名
     * @returns {object} コンポーネント
     */
    getComponent(name) {
        return this.components[name];
    }
    
    /**
     * デバッグ情報を取得
     * @returns {object} デバッグ情報
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            currentYearMonth: this.currentYearMonth,
            controllers: Object.keys(this.controllers),
            components: Object.keys(this.components),
            users: this.controllers.schedule?.users?.length || 0
        };
    }
}

// グローバルに登録
window.App = App;

Logger?.info('App class loaded');
