/**
 * 定員表示コンポーネント
 * 月別サマリー、日別簡易表示、定員オーバー警告を実装
 */
class CapacityIndicator {
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
        
        this.currentSummary = null;
        
        Logger?.info('CapacityIndicator initialized');
    }
    
    /**
     * 初期化処理
     */
    init() {
        this.render();
    }
    
    /**
     * 定員表示全体を構築
     */
    render() {
        try {
            Logger?.debug('CapacityIndicator rendering...');
            
            // コンテナをクリア
            this.container.innerHTML = '';
            this.container.className = 'capacity-indicator';
            
            // CapacityCheckControllerが利用可能かチェック
            const capacityController = this.app.getController('capacity');
            if (!capacityController) {
                this.container.innerHTML = '<p>定員情報を読み込み中...</p>';
                return;
            }
            
            const currentMonth = this.app.getCurrentYearMonth();
            if (!currentMonth) {
                this.container.innerHTML = '<p>表示月が設定されていません</p>';
                return;
            }
            
            // 月のサマリーを取得
            this.currentSummary = capacityController.getSummary(currentMonth);
            
            // ヘッダー
            this.container.appendChild(this.renderHeader());
            
            // メインサマリー
            this.container.appendChild(this.renderMainSummary());
            
            // 詳細情報
            this.container.appendChild(this.renderDetailSummary());
            
            Logger?.debug('CapacityIndicator rendered');
            
        } catch (error) {
            Logger?.error('CapacityIndicator rendering failed:', error);
            this.container.innerHTML = `<p>定員表示に失敗しました: ${error.message}</p>`;
        }
    }
    
    /**
     * ヘッダー部分を生成
     * @returns {HTMLElement}
     */
    renderHeader() {
        const header = document.createElement('div');
        header.className = 'capacity-header';
        
        const title = document.createElement('h3');
        title.textContent = '定員状況';
        title.className = 'capacity-title';
        
        const month = document.createElement('span');
        month.textContent = this.formatMonthDisplay(this.app.getCurrentYearMonth());
        month.className = 'capacity-month';
        
        header.appendChild(title);
        header.appendChild(month);
        
        return header;
    }
    
    /**
     * メインサマリー部分を生成
     * @returns {HTMLElement}
     */
    renderMainSummary() {
        const summary = document.createElement('div');
        summary.className = 'capacity-main-summary';
        
        // 定員オーバー警告
        if (this.currentSummary && this.currentSummary.overCapacityDates && this.currentSummary.overCapacityDates.length > 0) {
            const warning = document.createElement('div');
            warning.className = 'capacity-warning';
            warning.innerHTML = `
                ⚠️ <strong>定員オーバー: ${this.currentSummary.overCapacityDates.length}日間</strong>
            `;
            summary.appendChild(warning);
        } else {
            const ok = document.createElement('div');
            ok.className = 'capacity-ok';
            ok.innerHTML = '✅ <strong>定員内で運営されています</strong>';
            summary.appendChild(ok);
        }
        
        // 基本定員情報
        const capacityInfo = document.createElement('div');
        capacityInfo.className = 'capacity-info';
        
        if (typeof AppConfig !== 'undefined' && AppConfig.CAPACITY) {
            capacityInfo.innerHTML = `
                <div class="capacity-row">
                    <span class="capacity-label">通いの定員:</span>
                    <span class="capacity-value">${AppConfig.CAPACITY.DAY}名</span>
                </div>
                <div class="capacity-row">
                    <span class="capacity-label">泊まりの定員:</span>
                    <span class="capacity-value">${AppConfig.CAPACITY.STAY}名</span>
                </div>
                <div class="capacity-row">
                    <span class="capacity-label">登録定員:</span>
                    <span class="capacity-value">${AppConfig.CAPACITY.REGISTRATION}名</span>
                </div>
            `;
        }
        
        summary.appendChild(capacityInfo);
        
        return summary;
    }
    
    /**
     * 詳細サマリー部分を生成
     * @returns {HTMLElement}
     */
    renderDetailSummary() {
        const detail = document.createElement('div');
        detail.className = 'capacity-detail-summary';
        
        if (!this.currentSummary) {
            detail.innerHTML = '<p>詳細情報がありません</p>';
            return detail;
        }
        
        // 統計情報
        const stats = document.createElement('div');
        stats.className = 'capacity-stats';
        
        stats.innerHTML = `
            <div class="stats-section">
                <h4>月間統計</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">平均通い人数:</span>
                        <span class="stat-value">${this.formatNumber(this.currentSummary.averageDayUsers)}名</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">平均泊り人数:</span>
                        <span class="stat-value">${this.formatNumber(this.currentSummary.averageStayUsers)}名</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">最大通い人数:</span>
                        <span class="stat-value">${this.currentSummary.maxDayUsers || 0}名</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">最大泊り人数:</span>
                        <span class="stat-value">${this.currentSummary.maxStayUsers || 0}名</span>
                    </div>
                </div>
            </div>
        `;
        
        detail.appendChild(stats);
        
        // 定員オーバー日の一覧
        if (this.currentSummary.overCapacityDates && this.currentSummary.overCapacityDates.length > 0) {
            const overCapacitySection = document.createElement('div');
            overCapacitySection.className = 'over-capacity-section';
            
            const title = document.createElement('h4');
            title.textContent = '定員オーバーの日';
            overCapacitySection.appendChild(title);
            
            const datesList = document.createElement('div');
            datesList.className = 'over-capacity-dates';
            
            // 最大10日まで表示
            const displayDates = this.currentSummary.overCapacityDates.slice(0, 10);
            displayDates.forEach(dateStr => {
                const dateItem = document.createElement('span');
                dateItem.className = 'over-capacity-date';
                dateItem.textContent = this.formatDateDisplay(dateStr);
                datesList.appendChild(dateItem);
            });
            
            // 残りがあれば表示
            if (this.currentSummary.overCapacityDates.length > 10) {
                const more = document.createElement('span');
                more.className = 'over-capacity-more';
                more.textContent = `...その他${this.currentSummary.overCapacityDates.length - 10}日`;
                datesList.appendChild(more);
            }
            
            overCapacitySection.appendChild(datesList);
            detail.appendChild(overCapacitySection);
        }
        
        return detail;
    }
    
    /**
     * 日別簡易表示を生成（オプション）
     * @returns {HTMLElement}
     */
    renderDailySummary() {
        const daily = document.createElement('div');
        daily.className = 'capacity-daily-summary';
        
        try {
            const capacityController = this.app.getController('capacity');
            const currentMonth = this.app.getCurrentYearMonth();
            
            if (!capacityController || !currentMonth) {
                return daily;
            }
            
            // 今日の定員状況
            const today = new Date();
            const todayStr = DateUtils.formatDate(today);
            
            if (todayStr.startsWith(currentMonth)) {
                const todayCapacity = capacityController.checkDate(todayStr);
                
                if (todayCapacity) {
                    daily.innerHTML = `
                        <div class="today-capacity">
                            <h4>今日の定員状況 (${this.formatDateDisplay(todayStr)})</h4>
                            <div class="today-stats">
                                <span>通い: ${todayCapacity.dayUsers || 0}/${AppConfig.CAPACITY?.DAY || 0}名</span>
                                <span>泊り: ${todayCapacity.stayUsers || 0}/${AppConfig.CAPACITY?.STAY || 0}名</span>
                            </div>
                        </div>
                    `;
                }
            }
            
        } catch (error) {
            Logger?.warn('Daily summary generation failed:', error);
        }
        
        return daily;
    }
    
    /**
     * 表示を更新
     */
    refresh() {
        this.render();
    }
    
    /**
     * 月表示をフォーマット
     * @param {string} yearMonth - YYYY-MM形式
     * @returns {string}
     */
    formatMonthDisplay(yearMonth) {
        if (!yearMonth) return '';
        
        try {
            const [year, month] = yearMonth.split('-');
            return `${year}年${parseInt(month)}月`;
        } catch (error) {
            return yearMonth;
        }
    }
    
    /**
     * 日付表示をフォーマット
     * @param {string} dateStr - YYYY-MM-DD形式
     * @returns {string}
     */
    formatDateDisplay(dateStr) {
        if (!dateStr) return '';
        
        try {
            const [year, month, day] = dateStr.split('-');
            
            // 曜日も表示
            const date = new Date(year, month - 1, day);
            const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
            const weekday = weekdays[date.getDay()];
            
            return `${month}/${day}(${weekday})`;
        } catch (error) {
            return dateStr;
        }
    }
    
    /**
     * 数値をフォーマット（小数点以下1桁）
     * @param {number} num
     * @returns {string}
     */
    formatNumber(num) {
        if (typeof num !== 'number' || isNaN(num)) return '0';
        return num.toFixed(1);
    }
    
    /**
     * 定員チェック結果を強調表示
     * @param {string} dateStr - 日付文字列
     * @param {boolean} isOverCapacity - 定員オーバーかどうか
     */
    highlightDate(dateStr, isOverCapacity) {
        try {
            // この機能は将来的な拡張用
            // グリッドとの連携で特定の日付をハイライトする
            Logger?.debug('Highlight date:', dateStr, 'over capacity:', isOverCapacity);
        } catch (error) {
            Logger?.warn('Date highlight failed:', error);
        }
    }
    
    /**
     * デバッグ情報を取得
     * @returns {object}
     */
    getDebugInfo() {
        return {
            hasContainer: !!this.container,
            hasSummary: !!this.currentSummary,
            currentMonth: this.app.getCurrentYearMonth(),
            overCapacityDates: this.currentSummary?.overCapacityDates?.length || 0,
            averageDayUsers: this.currentSummary?.averageDayUsers,
            averageStayUsers: this.currentSummary?.averageStayUsers
        };
    }
}

// グローバルに登録
window.CapacityIndicator = CapacityIndicator;

Logger?.info('CapacityIndicator class loaded');