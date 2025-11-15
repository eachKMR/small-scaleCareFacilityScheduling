/**
 * Appクラス（アプリケーション統合）
 * すべてのコンポーネントとコントローラーを統合管理
 */
class App {
    /**
     * コンストラクタ
     */
    constructor() {
        this.logger = new Logger('App');
        
        // サービス層
        this.storageService = null;
        
        // コントローラー層
        this.scheduleController = null;
        this.capacityCheckController = null;
        this.noteController = null;
        this.excelController = null;
        
        // コンポーネント層
        this.toolbar = null;
        this.capacityIndicator = null;
        this.scheduleGrid = null;
        
        this.initialized = false;
    }

    // ==================== 初期化 ====================

    /**
     * アプリケーションを初期化
     */
    async initialize() {
        try {
            this.logger.info('=== Application Starting ===');
            
            // ローディング表示
            this.showLoading('システム初期化中...');
            
            // サービス層の初期化
            this.initializeServices();
            
            // コントローラー層の初期化
            this.initializeControllers();
            
            // コンポーネント層の初期化
            this.initializeComponents();
            
            // データの読み込み
            await this.loadInitialData();
            
            // ローディング非表示
            this.hideLoading();
            
            this.initialized = true;
            this.logger.info('=== Application Started ===');
            
        } catch (error) {
            this.logger.error('Failed to initialize application:', error);
            this.showError('アプリケーションの初期化に失敗しました', error);
        }
    }

    /**
     * サービス層を初期化
     */
    initializeServices() {
        this.logger.info('Initializing services...');
        
        // StorageService
        this.storageService = new StorageService();
        
        this.logger.info('Services initialized');
    }

    /**
     * コントローラー層を初期化
     */
    initializeControllers() {
        this.logger.info('Initializing controllers...');
        
        // ScheduleController
        this.scheduleController = new ScheduleController(this.storageService);
        
        // CapacityCheckController
        this.capacityCheckController = new CapacityCheckController(this.scheduleController);
        
        // NoteController
        this.noteController = new NoteController(this.storageService, this.scheduleController);
        
        // ExcelController
        this.excelController = new ExcelController(
            this.scheduleController,
            this.capacityCheckController,
            this.noteController
        );
        
        this.logger.info('Controllers initialized');
    }

    /**
     * コンポーネント層を初期化
     */
    initializeComponents() {
        this.logger.info('Initializing components...');
        
        // DOM要素を取得
        const toolbarContainer = document.getElementById('toolbar');
        const capacityContainer = document.getElementById('capacity-indicator');
        const gridContainer = document.getElementById('schedule-grid');
        
        if (!toolbarContainer || !capacityContainer || !gridContainer) {
            throw new Error('Required DOM elements not found');
        }
        
        // Toolbar
        this.toolbar = new Toolbar(
            toolbarContainer,
            this.scheduleController,
            this.excelController
        );
        
        // CapacityIndicator
        this.capacityIndicator = new CapacityIndicator(
            capacityContainer,
            this.scheduleController,
            this.capacityCheckController
        );
        
        // ScheduleGrid
        this.scheduleGrid = new ScheduleGrid(
            gridContainer,
            this.scheduleController,
            this.capacityCheckController
        );
        
        // スクロール同期を設定
        this.setupScrollSync(capacityContainer, gridContainer);
        
        this.logger.info('Components initialized');
    }

    /**
     * 定員ヘッダーとグリッドのスクロールを同期
     * @param {HTMLElement} capacityContainer - 定員ヘッダーコンテナ
     * @param {HTMLElement} gridContainer - グリッドコンテナ
     */
    setupScrollSync(capacityContainer, gridContainer) {
        let isCapacityScrolling = false;
        let isGridScrolling = false;
        
        // 定員ヘッダーのスクロール → グリッドに同期
        capacityContainer.addEventListener('scroll', () => {
            if (isGridScrolling) {
                isGridScrolling = false;
                return;
            }
            isCapacityScrolling = true;
            gridContainer.scrollLeft = capacityContainer.scrollLeft;
        });
        
        // グリッドのスクロール → 定員ヘッダーに同期
        gridContainer.addEventListener('scroll', () => {
            if (isCapacityScrolling) {
                isCapacityScrolling = false;
                return;
            }
            isGridScrolling = true;
            capacityContainer.scrollLeft = gridContainer.scrollLeft;
        });
        
        this.logger.info('Scroll synchronization setup completed');
    }

    /**
     * 初期データを読み込み
     */
    async loadInitialData() {
        this.logger.info('Loading initial data...');
        
        try {
            // 利用者データを読み込み
            await this.scheduleController.initialize();
            
            // 備考データを読み込み
            await this.noteController.initialize();
            
            const users = this.scheduleController.getActiveUsers();
            
            if (users.length === 0) {
                // 利用者がいない場合
                this.logger.info('No users found, showing empty state');
                this.showEmptyState();
            } else {
                // 利用者がいる場合
                this.logger.info(`${users.length} users loaded`);
                
                // 現在月のスケジュールを読み込み
                const currentMonth = this.scheduleController.getCurrentYearMonth();
                await this.scheduleController.loadSchedule(currentMonth);
            }
            
        } catch (error) {
            this.logger.error('Failed to load initial data:', error);
            throw error;
        }
    }

    // ==================== 状態管理 ====================

    /**
     * 空の状態を表示
     */
    showEmptyState() {
        this.logger.info('Showing empty state');
        
        // メッセージを表示
        const messageContainer = document.getElementById('empty-message');
        if (messageContainer) {
            messageContainer.style.display = 'block';
            messageContainer.innerHTML = `
                <div class="empty-state">
                    <h2>利用者データがありません</h2>
                    <p>「算定一覧を取り込む」ボタンからCSVファイルを読み込んでください。</p>
                </div>
            `;
        }
    }

    /**
     * 空の状態を非表示
     */
    hideEmptyState() {
        const messageContainer = document.getElementById('empty-message');
        if (messageContainer) {
            messageContainer.style.display = 'none';
        }
    }

    // ==================== ローディング ====================

    /**
     * ローディング表示
     * @param {string} message - メッセージ
     */
    showLoading(message = '読み込み中...') {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.textContent = message;
            loadingElement.style.display = 'block';
        }
    }

    /**
     * ローディング非表示
     */
    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    // ==================== エラー処理 ====================

    /**
     * エラーを表示
     * @param {string} message - エラーメッセージ
     * @param {Error} error - エラーオブジェクト
     */
    showError(message, error) {
        this.logger.error(message, error);
        
        const errorMessage = error ? `${message}\n\n${error.message}` : message;
        alert(errorMessage);
        
        this.hideLoading();
    }

    /**
     * トースト通知を表示
     * @param {string} message - メッセージ
     * @param {string} type - 'success' | 'error' | 'warning' | 'info'
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // アニメーション開始
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // 自動削除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // ==================== ストレージ情報 ====================

    /**
     * ストレージ情報をコンソールに出力
     */
    logStorageInfo() {
        if (!this.storageService) return;
        
        const size = this.storageService.getStorageSizeFormatted();
        const allMonths = this.storageService.getAllScheduleMonths();
        
        this.logger.info('=== Storage Information ===');
        this.logger.info(`Total Size: ${size}`);
        this.logger.info(`Saved Months: ${allMonths.join(', ')}`);
    }

    // ==================== デバッグ ====================

    /**
     * デバッグ情報を出力
     */
    debug() {
        this.logger.info('=== Debug Information ===');
        this.logger.info('Initialized:', this.initialized);
        this.logger.info('Current Month:', this.scheduleController?.getCurrentYearMonth());
        this.logger.info('Users Count:', this.scheduleController?.getSortedUsers().length);
        
        this.logStorageInfo();
    }
}

// グローバル変数として公開
window.App = App;

// DOMContentLoaded時に自動初期化
document.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    await app.initialize();
    
    // デバッグ用にグローバルに公開
    window.app = app;
    
    // コンソールにヘルプ表示
    console.log('%c小規模多機能予定調整システム', 'font-size: 16px; font-weight: bold; color: #0066cc;');
    console.log('');
    console.log('利用可能なコマンド:');
    console.log('  app.debug() - デバッグ情報を表示');
    console.log('  app.logStorageInfo() - ストレージ情報を表示');
    console.log('');
    console.log('グローバル変数:');
    console.log('  app - アプリケーションインスタンス');
    console.log('  app.scheduleController - スケジュールコントローラー');
    console.log('  app.capacityCheckController - 定員チェックコントローラー');
    console.log('  app.noteController - 備考コントローラー');
    console.log('');
});
