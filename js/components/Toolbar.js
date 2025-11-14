/**
 * Toolbarクラス（ツールバー）
 * 月選択、CSV/Excel入出力ボタンを管理
 */
class Toolbar {
    /**
     * コンストラクタ
     * @param {HTMLElement} container - ツールバーを表示するコンテナ要素
     * @param {ScheduleController} scheduleController - スケジュールコントローラー
     * @param {ExcelController} excelController - Excelコントローラー
     */
    constructor(container, scheduleController, excelController) {
        this.container = container;
        this.scheduleController = scheduleController;
        this.excelController = excelController;
        this.logger = new Logger('Toolbar');
        
        this.currentYearMonth = null;
        this.hasUsers = false;
        
        // イベントリスナー
        this.setupEventListeners();
        
        // 初期描画
        this.render();
    }

    // ==================== イベントリスナー ====================

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // 利用者読み込み時
        this.scheduleController.on('users:loaded', () => {
            this.hasUsers = this.scheduleController.getActiveUsers().length > 0;
            this.updateButtonStates();
        });

        // 利用者が空の時
        this.scheduleController.on('users:empty', () => {
            this.hasUsers = false;
            this.updateButtonStates();
        });

        // 月変更時
        this.scheduleController.on('month:changed', (data) => {
            this.currentYearMonth = data.yearMonth;
            this.updateMonthSelector();
        });
    }

    // ==================== レンダリング ====================

    /**
     * ツールバー全体を描画
     */
    render() {
        this.logger.info('Rendering toolbar');
        
        this.currentYearMonth = this.scheduleController.getCurrentYearMonth();
        this.hasUsers = this.scheduleController.getActiveUsers().length > 0;
        
        // コンテナをクリア
        this.container.innerHTML = '';
        this.container.className = 'toolbar';
        
        // 月選択
        const monthSelector = this.createMonthSelector();
        this.container.appendChild(monthSelector);
        
        // ボタングループ
        const buttonGroup = this.createButtonGroup();
        this.container.appendChild(buttonGroup);
    }

    /**
     * 月選択ドロップダウンを作成
     * @returns {HTMLElement}
     */
    createMonthSelector() {
        const wrapper = document.createElement('div');
        wrapper.className = 'month-selector-wrapper';
        
        const label = document.createElement('label');
        label.textContent = '表示月: ';
        label.className = 'month-selector-label';
        
        const select = document.createElement('select');
        select.className = 'month-selector';
        select.id = 'monthSelector';
        
        // 前後3ヶ月の選択肢を生成
        const months = this.getMonthOptions();
        months.forEach(({ value, text, isCurrent }) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            if (isCurrent) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        // 変更イベント
        select.addEventListener('change', (e) => {
            this.handleMonthChange(e.target.value);
        });
        
        wrapper.appendChild(label);
        wrapper.appendChild(select);
        
        return wrapper;
    }

    /**
     * 月選択の選択肢を取得
     * @returns {Array<object>}
     */
    getMonthOptions() {
        const options = [];
        const current = new Date();
        
        // 前後3ヶ月（合計7ヶ月）
        for (let i = -3; i <= 3; i++) {
            const date = new Date(current.getFullYear(), current.getMonth() + i, 1);
            const yearMonth = DateUtils.formatDate(date, 'YYYY-MM');
            const text = DateUtils.formatDate(date, 'YYYY年MM月');
            
            options.push({
                value: yearMonth,
                text: text,
                isCurrent: yearMonth === this.currentYearMonth
            });
        }
        
        return options;
    }

    /**
     * ボタングループを作成
     * @returns {HTMLElement}
     */
    createButtonGroup() {
        const group = document.createElement('div');
        group.className = 'button-group';
        
        // CSV取り込みボタン（算定一覧を取り込む）
        const csvButton = this.createButton({
            id: 'importCsvButton',
            text: '算定一覧を取り込む',
            className: this.hasUsers ? 'toolbar-button secondary' : 'toolbar-button primary-emphasized',
            onClick: () => this.handleImportCsv()
        });
        group.appendChild(csvButton);
        
        // Excel読み込みボタン
        const importExcelButton = this.createButton({
            id: 'importExcelButton',
            text: '作業内容を取り込む',
            className: 'toolbar-button',
            disabled: !this.hasUsers,
            onClick: () => this.handleImportExcel()
        });
        group.appendChild(importExcelButton);
        
        // Excel保存ボタン
        const exportExcelButton = this.createButton({
            id: 'exportExcelButton',
            text: '作業内容を保存',
            className: this.hasUsers ? 'toolbar-button success' : 'toolbar-button',
            disabled: !this.hasUsers,
            onClick: () => this.handleExportExcel()
        });
        group.appendChild(exportExcelButton);
        
        // 設定ボタン
        const settingsButton = this.createButton({
            id: 'settingsButton',
            text: '⚙️',
            className: 'toolbar-button settings-button',
            onClick: () => this.handleSettings()
        });
        group.appendChild(settingsButton);
        
        return group;
    }

    /**
     * ボタンを作成
     * @param {object} options - ボタンオプション
     * @returns {HTMLElement}
     */
    createButton({ id, text, className, disabled = false, onClick }) {
        const button = document.createElement('button');
        button.id = id;
        button.textContent = text;
        button.className = className;
        button.disabled = disabled;
        
        if (onClick) {
            button.addEventListener('click', onClick);
        }
        
        return button;
    }

    // ==================== 更新処理 ====================

    /**
     * ボタンの状態を更新
     */
    updateButtonStates() {
        const csvButton = document.getElementById('importCsvButton');
        const importExcelButton = document.getElementById('importExcelButton');
        const exportExcelButton = document.getElementById('exportExcelButton');
        
        if (csvButton) {
            if (this.hasUsers) {
                csvButton.className = 'toolbar-button secondary';
            } else {
                csvButton.className = 'toolbar-button primary-emphasized';
            }
        }
        
        if (importExcelButton) {
            importExcelButton.disabled = !this.hasUsers;
        }
        
        if (exportExcelButton) {
            exportExcelButton.disabled = !this.hasUsers;
            if (this.hasUsers) {
                exportExcelButton.className = 'toolbar-button success';
            } else {
                exportExcelButton.className = 'toolbar-button';
            }
        }
        
        this.logger.debug(`Button states updated: hasUsers=${this.hasUsers}`);
    }

    /**
     * 月選択を更新
     */
    updateMonthSelector() {
        const select = document.getElementById('monthSelector');
        if (select) {
            select.value = this.currentYearMonth;
        }
    }

    // ==================== イベントハンドラー ====================

    /**
     * 月変更
     * @param {string} yearMonth - "YYYY-MM"形式
     */
    async handleMonthChange(yearMonth) {
        try {
            this.logger.info(`Month changed to: ${yearMonth}`);
            await this.scheduleController.changeMonth(yearMonth);
        } catch (error) {
            this.logger.error('Failed to change month:', error);
            alert(`月の切り替えに失敗しました: ${error.message}`);
        }
    }

    /**
     * CSV取り込み
     */
    async handleImportCsv() {
        this.logger.info('Import CSV button clicked');
        
        // ファイル選択ダイアログを表示
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.multiple = true; // 複数ファイル選択可能
        
        input.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) {
                return;
            }
            
            try {
                this.logger.info(`CSV files selected: ${files.map(f => f.name).join(', ')}`);
                
                // ファイル検証
                const csvService = new CSVService();
                for (const file of files) {
                    const validation = csvService.validateCSVFile(file);
                    if (!validation.valid) {
                        alert(`ファイル検証エラー: ${file.name}\n${validation.errors.join('\n')}`);
                        return;
                    }
                }
                
                // 既存スケジュールがある場合は確認
                const hasSchedule = this.scheduleController.getAllCalendars().size > 0;
                if (hasSchedule) {
                    const confirmed = confirm(
                        '既存の予定データは上書きされます。\n' +
                        '備考は保持されます。\n\n' +
                        '算定基礎を取り込みますか？'
                    );
                    if (!confirmed) {
                        this.logger.info('CSV import cancelled by user');
                        return;
                    }
                }
                
                // インポート実行
                const success = await this.scheduleController.importCSV(files);
                
                if (success) {
                    alert(`CSV取り込みが完了しました。\n利用者数: ${this.scheduleController.getActiveUsers().length}名`);
                }
                
            } catch (error) {
                this.logger.error('Failed to import CSV:', error);
                alert(`CSV取り込みに失敗しました:\n${error.message}`);
            }
        });
        
        input.click();
    }

    /**
     * Excel取り込み
     */
    async handleImportExcel() {
        try {
            this.logger.info('Import Excel button clicked');
            await this.excelController.showImportDialog();
        } catch (error) {
            this.logger.error('Failed to import Excel:', error);
            alert(`Excel取り込みに失敗しました: ${error.message}`);
        }
    }

    /**
     * Excel保存
     */
    async handleExportExcel() {
        try {
            this.logger.info('Export Excel button clicked');
            await this.excelController.showExportDialog();
        } catch (error) {
            this.logger.error('Failed to export Excel:', error);
            alert(`Excel保存に失敗しました: ${error.message}`);
        }
    }

    /**
     * 設定
     */
    handleSettings() {
        this.logger.info('Settings button clicked');
        
        // TODO: 設定画面の実装
        alert('設定画面は実装中です');
    }

    // ==================== ユーティリティ ====================

    /**
     * ツールバーをクリア
     */
    clear() {
        this.container.innerHTML = '';
    }
}

// グローバル変数として公開
window.Toolbar = Toolbar;
