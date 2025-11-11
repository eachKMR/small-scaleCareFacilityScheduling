/**
 * ツールバーコンポーネント
 * 月選択ドロップダウン、Excel入出力ボタン、定員チェックボタンを実装
 */
class Toolbar {
    constructor(app, containerId) {
        // 依存関係チェック
        if (typeof window.App === 'undefined') {
            throw new Error('App is required');
        }
        if (typeof window.Logger === 'undefined') {
            throw new Error('Logger is required');
        }
        
        this.app = app;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            throw new Error(`Container not found: ${containerId}`);
        }
        
        this.currentMonth = null;
        
        Logger?.info('Toolbar initialized');
    }
    
    /**
     * 初期化処理
     */
    init() {
        this.render();
    }
    
    /**
     * ツールバー全体を構築
     */
    render() {
        try {
            Logger?.debug('Toolbar rendering...');
            
            // コンテナをクリア
            this.container.innerHTML = '';
            this.container.className = 'toolbar';
            
            // 左側のコントロール群
            const leftControls = document.createElement('div');
            leftControls.className = 'toolbar-left';
            
            // 月選択
            leftControls.appendChild(this.renderMonthSelector());
            
            // 右側のボタン群
            const rightControls = document.createElement('div');
            rightControls.className = 'toolbar-right';
            
            // Excel入力ボタン
            rightControls.appendChild(this.renderExcelImportButton());
            
            // Excel出力ボタン
            rightControls.appendChild(this.renderExcelExportButton());
            
            // 定員チェックボタン
            rightControls.appendChild(this.renderCapacityCheckButton());
            
            // コンテナに追加
            this.container.appendChild(leftControls);
            this.container.appendChild(rightControls);
            
            Logger?.debug('Toolbar rendered');
            
        } catch (error) {
            Logger?.error('Toolbar rendering failed:', error);
            this.container.innerHTML = `<p>ツールバーの表示に失敗しました: ${error.message}</p>`;
        }
    }
    
    /**
     * 月選択ドロップダウンを生成
     * @returns {HTMLElement}
     */
    renderMonthSelector() {
        const container = document.createElement('div');
        container.className = 'month-selector-container';
        
        const label = document.createElement('label');
        label.textContent = '表示月: ';
        label.className = 'month-selector-label';
        
        const select = document.createElement('select');
        select.className = 'month-selector';
        select.id = 'month-selector';
        
        // 過去6ヶ月から未来6ヶ月の選択肢を生成
        const months = this.generateMonthOptions();
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month.value;
            option.textContent = month.label;
            select.appendChild(option);
        });
        
        // 現在の月を選択
        const currentMonth = this.app.getCurrentYearMonth();
        if (currentMonth) {
            select.value = currentMonth;
            this.currentMonth = currentMonth;
        }
        
        // 変更イベント
        select.addEventListener('change', (e) => {
            this.handleMonthChange(e);
        });
        
        container.appendChild(label);
        container.appendChild(select);
        
        return container;
    }
    
    /**
     * Excel入力ボタンを生成
     * @returns {HTMLElement}
     */
    renderExcelImportButton() {
        const button = document.createElement('button');
        button.className = 'toolbar-btn excel-import-btn';
        button.textContent = '📄 Excel読込';
        button.title = 'Excelファイルからスケジュールを読み込みます';
        
        // ファイル入力要素
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.xlsx,.xls';
        fileInput.style.display = 'none';
        fileInput.id = 'excel-file-input';
        
        // ボタンクリックでファイル選択ダイアログを開く
        button.addEventListener('click', () => {
            fileInput.click();
        });
        
        // ファイル選択時の処理
        fileInput.addEventListener('change', (e) => {
            this.handleExcelImport(e);
        });
        
        const container = document.createElement('div');
        container.className = 'excel-import-container';
        container.appendChild(button);
        container.appendChild(fileInput);
        
        return container;
    }
    
    /**
     * Excel出力ボタンを生成
     * @returns {HTMLElement}
     */
    renderExcelExportButton() {
        const button = document.createElement('button');
        button.className = 'toolbar-btn excel-export-btn';
        button.textContent = '💾 Excel出力';
        button.title = '現在のスケジュールをExcelファイルに出力します';
        
        button.addEventListener('click', () => {
            this.handleExcelExport();
        });
        
        return button;
    }
    
    /**
     * 定員チェックボタンを生成
     * @returns {HTMLElement}
     */
    renderCapacityCheckButton() {
        const button = document.createElement('button');
        button.className = 'toolbar-btn capacity-check-btn';
        button.textContent = '👥 定員チェック';
        button.title = '月全体の定員状況をチェックします';
        
        button.addEventListener('click', () => {
            this.handleCapacityCheck();
        });
        
        return button;
    }
    
    /**
     * 月選択の選択肢を生成
     * @returns {Array} 月選択肢の配列
     */
    generateMonthOptions() {
        const options = [];
        const today = new Date();
        
        // 過去6ヶ月から未来6ヶ月
        for (let i = -6; i <= 6; i++) {
            const targetDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth() + 1;
            
            const value = `${year}-${String(month).padStart(2, '0')}`;
            const label = `${year}年${month}月`;
            
            options.push({ value, label });
        }
        
        return options;
    }
    
    /**
     * 月変更イベント処理
     * @param {Event} event
     */
    handleMonthChange(event) {
        try {
            const newMonth = event.target.value;
            Logger?.info('Month changed to:', newMonth);
            
            this.currentMonth = newMonth;
            
            // アプリに月切り替えを依頼
            this.app.switchMonth(newMonth);
            
        } catch (error) {
            Logger?.error('Month change handling failed:', error);
            this.app?.showError('月の切り替えに失敗しました: ' + error.message);
        }
    }
    
    /**
     * Excel入力イベント処理
     * @param {Event} event
     */
    async handleExcelImport(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;
            
            Logger?.info('Excel import started:', file.name);
            this.app?.showToast('Excel読み込み中...', 'info');
            
            // ExcelControllerに処理を依頼
            const excelController = this.app.getController('excel');
            if (!excelController) {
                throw new Error('ExcelControllerが利用できません');
            }
            
            // ファイルを読み込み
            const result = await excelController.importFromExcel(file);
            
            if (result.success) {
                this.app?.showToast(`Excel読み込み完了: ${result.importedCount}件`, 'success');
                
                // 画面を更新
                this.app.render();
            } else {
                throw new Error(result.error || '読み込みに失敗しました');
            }
            
        } catch (error) {
            Logger?.error('Excel import failed:', error);
            this.app?.showError('Excel読み込みに失敗しました: ' + error.message);
        } finally {
            // ファイル入力をクリア
            event.target.value = '';
        }
    }
    
    /**
     * Excel出力イベント処理
     */
    async handleExcelExport() {
        try {
            Logger?.info('Excel export started');
            this.app?.showToast('Excel出力中...', 'info');
            
            // ExcelControllerに処理を依頼
            const excelController = this.app.getController('excel');
            if (!excelController) {
                throw new Error('ExcelControllerが利用できません');
            }
            
            const currentMonth = this.app.getCurrentYearMonth();
            if (!currentMonth) {
                throw new Error('表示月が設定されていません');
            }
            
            // 利用者一覧を取得
            const scheduleController = this.app.getController('schedule');
            const users = scheduleController?.users || [];
            
            if (users.length === 0) {
                throw new Error('出力する利用者データがありません');
            }
            
            // Excel出力実行
            const result = await excelController.exportToExcel(currentMonth, users);
            
            if (result.success) {
                this.app?.showToast('Excel出力完了', 'success');
            } else {
                throw new Error(result.error || '出力に失敗しました');
            }
            
        } catch (error) {
            Logger?.error('Excel export failed:', error);
            this.app?.showError('Excel出力に失敗しました: ' + error.message);
        }
    }
    
    /**
     * 定員チェックイベント処理
     */
    handleCapacityCheck() {
        try {
            Logger?.info('Capacity check started');
            
            const capacityController = this.app.getController('capacity');
            if (!capacityController) {
                throw new Error('CapacityCheckControllerが利用できません');
            }
            
            const currentMonth = this.app.getCurrentYearMonth();
            if (!currentMonth) {
                throw new Error('表示月が設定されていません');
            }
            
            // 月全体のサマリーを取得
            const summary = capacityController.getSummary(currentMonth);
            
            // モーダルまたはアラートでサマリーを表示
            this.showCapacitySummary(summary);
            
        } catch (error) {
            Logger?.error('Capacity check failed:', error);
            this.app?.showError('定員チェックに失敗しました: ' + error.message);
        }
    }
    
    /**
     * 定員チェック結果を表示
     * @param {object} summary - 定員サマリー
     */
    showCapacitySummary(summary) {
        try {
            // 簡易アラート表示（将来的にはモーダルに改善可能）
            let message = `【${this.currentMonth} 定員チェック結果】\n\n`;
            
            if (summary.overCapacityDates && summary.overCapacityDates.length > 0) {
                message += `⚠️ 定員オーバーの日: ${summary.overCapacityDates.length}日\n`;
                summary.overCapacityDates.slice(0, 5).forEach(date => {
                    message += `  • ${date}\n`;
                });
                if (summary.overCapacityDates.length > 5) {
                    message += `  • その他 ${summary.overCapacityDates.length - 5}日\n`;
                }
            } else {
                message += '✅ 定員オーバーの日はありません\n';
            }
            
            message += '\n【月間サマリー】\n';
            message += `• 平均通い人数: ${summary.averageDayUsers || 0}人\n`;
            message += `• 平均泊り人数: ${summary.averageStayUsers || 0}人\n`;
            message += `• 最大通い人数: ${summary.maxDayUsers || 0}人\n`;
            message += `• 最大泊り人数: ${summary.maxStayUsers || 0}人\n`;
            
            alert(message);
            
        } catch (error) {
            Logger?.warn('Capacity summary display failed:', error);
            alert('定員チェック結果の表示に失敗しました');
        }
    }
    
    /**
     * 月選択を更新
     * @param {string} yearMonth - YYYY-MM形式
     */
    updateMonthSelector(yearMonth) {
        try {
            const select = this.container.querySelector('#month-selector');
            if (select) {
                select.value = yearMonth;
                this.currentMonth = yearMonth;
            }
        } catch (error) {
            Logger?.warn('Month selector update failed:', error);
        }
    }
    
    /**
     * ボタンの有効/無効状態を更新
     * @param {object} states - { import: boolean, export: boolean, capacity: boolean }
     */
    updateButtonStates(states = {}) {
        try {
            const importBtn = this.container.querySelector('.excel-import-btn');
            const exportBtn = this.container.querySelector('.excel-export-btn');
            const capacityBtn = this.container.querySelector('.capacity-check-btn');
            
            if (importBtn && typeof states.import === 'boolean') {
                importBtn.disabled = !states.import;
            }
            
            if (exportBtn && typeof states.export === 'boolean') {
                exportBtn.disabled = !states.export;
            }
            
            if (capacityBtn && typeof states.capacity === 'boolean') {
                capacityBtn.disabled = !states.capacity;
            }
            
        } catch (error) {
            Logger?.warn('Button states update failed:', error);
        }
    }
    
    /**
     * デバッグ情報を取得
     * @returns {object}
     */
    getDebugInfo() {
        return {
            hasContainer: !!this.container,
            currentMonth: this.currentMonth,
            appMonth: this.app.getCurrentYearMonth(),
            buttonCount: this.container.querySelectorAll('.toolbar-btn').length
        };
    }
}

// グローバルに登録
window.Toolbar = Toolbar;

Logger?.info('Toolbar class loaded');