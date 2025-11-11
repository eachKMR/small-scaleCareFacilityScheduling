/**
 * Phase 1-E完成版 main.js
 * アプリケーション起動処理
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        Logger.info('=== Application Starting ===');
        
        // 依存関係チェック
        const phase1ADependencies = [
            'Logger', 'EventEmitter', 'DateUtils', 'IdGenerator', 'AppConfig', 'DEFAULT_USERS'
        ];
        
        const phase1BDependencies = [
            'User', 'Note', 'ScheduleCell', 'StayPeriod', 'ScheduleCalendar',
            'DailyCapacity', 'ServiceCapacity'
        ];
        
        const phase1CDependencies = [
            'StorageService', 'ExcelService'
        ];
        
        const phase1DDependencies = [
            'ScheduleController', 'CapacityCheckController', 'NoteController', 'ExcelController'
        ];
        
        const phase1EDependencies = [
            'App', 'ScheduleGrid', 'CellEditor', 'Toolbar', 'CapacityIndicator', 'NotePanel'
        ];
    
        Logger.debug('Phase 1-A 依存関係チェック開始...');
        const missingPhase1A = phase1ADependencies.filter(dep => {
            const exists = typeof window[dep] !== 'undefined';
            Logger.debug(`${dep}: ${exists ? '✓' : '✗'}`);
            return !exists;
        });
    
        if (missingPhase1A.length > 0) {
            const errorMessage = `Missing Phase 1-A dependencies: ${missingPhase1A.join(', ')}`;
            Logger.error(errorMessage);
            throw new Error(errorMessage);
        }
    
        Logger.info('Phase 1-A 依存関係チェック: 正常');
    
        Logger.debug('Phase 1-B 依存関係チェック開始...');
        const missingPhase1B = phase1BDependencies.filter(dep => {
            const exists = typeof window[dep] !== 'undefined';
            Logger.debug(`${dep}: ${exists ? '✓' : '✗'}`);
            return !exists;
        });
    
        if (missingPhase1B.length > 0) {
            const errorMessage = `Missing Phase 1-B dependencies: ${missingPhase1B.join(', ')}`;
            Logger.error(errorMessage);
            throw new Error(errorMessage);
        }
    
        Logger.info('Phase 1-B 依存関係チェック: 正常');
    
        Logger.debug('Phase 1-C 依存関係チェック開始...');
        const missingPhase1C = phase1CDependencies.filter(dep => {
            const exists = typeof window[dep] !== 'undefined';
            Logger.debug(`${dep}: ${exists ? '✓' : '✗'}`);
            return !exists;
        });
    
        if (missingPhase1C.length > 0) {
            const errorMessage = `Missing Phase 1-C dependencies: ${missingPhase1C.join(', ')}`;
            Logger.error(errorMessage);
            throw new Error(errorMessage);
        }
    
        Logger.info('Phase 1-C 依存関係チェック: 正常');
    
        Logger.debug('Phase 1-D 依存関係チェック開始...');
        const missingPhase1D = phase1DDependencies.filter(dep => {
            const exists = typeof window[dep] !== 'undefined';
            Logger.debug(`${dep}: ${exists ? '✓' : '✗'}`);
            return !exists;
        });
    
        if (missingPhase1D.length > 0) {
            const errorMessage = `Missing Phase 1-D dependencies: ${missingPhase1D.join(', ')}`;
            Logger.error(errorMessage);
            throw new Error(errorMessage);
        }
    
        Logger.info('Phase 1-D 依存関係チェック: 正常');
        
        Logger.debug('Phase 1-E 依存関係チェック開始...');
        const missingPhase1E = phase1EDependencies.filter(dep => {
            const exists = typeof window[dep] !== 'undefined';
            Logger.debug(`${dep}: ${exists ? '✓' : '✗'}`);
            return !exists;
        });
    
        if (missingPhase1E.length > 0) {
            const errorMessage = `Missing Phase 1-E dependencies: ${missingPhase1E.join(', ')}`;
            Logger.error(errorMessage);
            throw new Error(errorMessage);
        }
    
        Logger.info('Phase 1-E 依存関係チェック: 正常');

        // Phase 1-D Controllers の初期化
        initializeControllers();
        
        // Phase 1-E: Appクラスを起動してUIを表示
        Logger.info('=== Phase 1-E: アプリケーション起動 ===');
        
        const app = new App();
        await app.init();
        
        Logger.success('✅ Phase 1-E アプリケーション起動完了！');
        Logger.info('スケジュールグリッド、ツールバー、定員表示が利用可能です');
        
    } catch (error) {
        Logger.error('=== 初期化エラー ===');
        Logger.error(error);
    }
});



// Phase 1-D Controllers 初期化
function initializeControllers() {
    Logger.info('--- Controllers初期化開始 ---');
    
    try {
        // StorageService初期化
        const storageService = new StorageService();
        
        // ScheduleController初期化
        window.scheduleController = new ScheduleController(storageService);
        Logger.success('ScheduleController初期化完了');
        
        // CapacityCheckController初期化
        window.capacityCheckController = new CapacityCheckController(window.scheduleController);
        Logger.success('CapacityCheckController初期化完了');
        
        // NoteController初期化
        window.noteController = new NoteController(storageService);
        Logger.success('NoteController初期化完了');
        
        // ExcelService初期化
        const excelService = new ExcelService();
        
        // ExcelController初期化
        window.excelController = new ExcelController(excelService, window.scheduleController);
        Logger.success('ExcelController初期化完了');
        
        Logger.info('--- Controllers初期化完了 ---');
    } catch (error) {
        Logger.error('Controllers初期化エラー:', error);
        throw error;
    }
}

// グローバル関数として登録
window.initializeControllers = initializeControllers;