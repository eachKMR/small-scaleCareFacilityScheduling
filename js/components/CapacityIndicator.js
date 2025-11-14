/**
 * CapacityIndicatorクラス（定員状況ヘッダー）
 * 日別の定員状況を表示
 */
class CapacityIndicator {
    /**
     * コンストラクタ
     * @param {HTMLElement} container - 定員ヘッダーを表示するコンテナ要素
     * @param {ScheduleController} scheduleController - スケジュールコントローラー
     * @param {CapacityCheckController} capacityCheckController - 定員チェックコントローラー
     */
    constructor(container, scheduleController, capacityCheckController) {
        this.container = container;
        this.scheduleController = scheduleController;
        this.capacityCheckController = capacityCheckController;
        this.logger = new Logger('CapacityIndicator');
        
        this.currentYearMonth = null;
        this.daysInMonth = [];
        
        // イベントリスナー
        this.setupEventListeners();
    }

    // ==================== イベントリスナー ====================

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // 定員更新時
        this.capacityCheckController.on('capacity:updated', () => {
            this.logger.debug('Capacity updated, rendering indicator');
            this.render();
        });

        // スケジュール読み込み時
        this.scheduleController.on('schedule:loaded', () => {
            this.logger.debug('Schedule loaded, rendering indicator');
            this.render();
        });

        // 月変更時
        this.scheduleController.on('month:changed', (data) => {
            this.logger.debug('Month changed, rendering indicator');
            this.currentYearMonth = data.yearMonth;
            this.render();
        });

        // セル更新時
        this.scheduleController.on('cell:updated', () => {
            this.render();
        });
    }

    // ==================== レンダリング ====================

    /**
     * 定員ヘッダー全体を描画
     */
    render() {
        this.logger.info('Rendering capacity indicator');
        
        // 現在のデータを取得
        this.currentYearMonth = this.scheduleController.getCurrentYearMonth();
        this.daysInMonth = this.getDaysInMonth(this.currentYearMonth);
        
        // コンテナをクリア
        this.container.innerHTML = '';
        this.container.className = 'capacity-header';
        
        // テーブルを生成
        const table = this.createTableElement();
        this.container.appendChild(table);
        
        this.logger.info(`Capacity indicator rendered for ${this.currentYearMonth}`);
    }

    /**
     * テーブル要素を作成
     * @returns {HTMLElement}
     */
    createTableElement() {
        const table = document.createElement('table');
        table.className = 'capacity-table';
        
        const tbody = document.createElement('tbody');
        
        // 日付行
        const dateRow = this.createDateRow();
        tbody.appendChild(dateRow);
        
        // 通い行
        const dayRow = this.createCapacityRow('day');
        tbody.appendChild(dayRow);
        
        // 泊り行
        const stayRow = this.createCapacityRow('stay');
        tbody.appendChild(stayRow);
        
        // 訪問行
        const visitRow = this.createCapacityRow('visit');
        tbody.appendChild(visitRow);
        
        table.appendChild(tbody);
        return table;
    }

    /**
     * 日付行を作成
     * @returns {HTMLElement}
     */
    createDateRow() {
        const tr = document.createElement('tr');
        tr.className = 'capacity-row capacity-date-row';
        
        // 空白セル（利用者名列の位置）
        const thEmpty = document.createElement('th');
        thEmpty.className = 'capacity-cell capacity-label-cell';
        thEmpty.textContent = '';
        tr.appendChild(thEmpty);
        
        // 前月特別セル
        const thPrev = document.createElement('th');
        thPrev.className = 'capacity-cell capacity-special-cell';
        thPrev.textContent = '前月';
        tr.appendChild(thPrev);
        
        // 1日～31日
        this.daysInMonth.forEach(date => {
            const th = document.createElement('th');
            th.className = 'capacity-cell capacity-date-cell';
            
            const dateObj = new Date(date);
            const day = dateObj.getDate();
            const dayOfWeek = dateObj.getDay();
            const dayOfWeekStr = ['日', '月', '火', '水', '木', '金', '土'][dayOfWeek];
            
            // 曜日のクラスを追加
            if (dayOfWeek === 0) {
                th.classList.add('capacity-sunday');
            } else if (dayOfWeek === 6) {
                th.classList.add('capacity-saturday');
            }
            
            th.innerHTML = `${day}<span class="day-of-week">${dayOfWeekStr}</span>`;
            th.title = DateUtils.formatDate(date, 'YYYY/MM/DD (ddd)');
            
            tr.appendChild(th);
        });
        
        // 翌月特別セル
        const thNext = document.createElement('th');
        thNext.className = 'capacity-cell capacity-special-cell';
        thNext.textContent = '翌月';
        tr.appendChild(thNext);
        
        return tr;
    }

    /**
     * 定員行を作成
     * @param {string} type - 'day' | 'stay' | 'visit'
     * @returns {HTMLElement}
     */
    createCapacityRow(type) {
        const tr = document.createElement('tr');
        tr.className = `capacity-row capacity-${type}-row`;
        
        // ラベルセル
        const tdLabel = document.createElement('td');
        tdLabel.className = 'capacity-cell capacity-label-cell';
        
        if (type === 'day') {
            tdLabel.textContent = '通い';
        } else if (type === 'stay') {
            tdLabel.textContent = '泊り';
        } else if (type === 'visit') {
            tdLabel.textContent = '訪問';
        }
        
        tr.appendChild(tdLabel);
        
        // 前月特別セル（空）
        const tdPrev = document.createElement('td');
        tdPrev.className = 'capacity-cell capacity-special-cell';
        tr.appendChild(tdPrev);
        
        // 1日～31日
        this.daysInMonth.forEach(date => {
            const td = this.createCapacityCell(date, type);
            tr.appendChild(td);
        });
        
        // 翌月特別セル（空）
        const tdNext = document.createElement('td');
        tdNext.className = 'capacity-cell capacity-special-cell';
        tr.appendChild(tdNext);
        
        return tr;
    }

    /**
     * 定員セルを作成
     * @param {string} date - 日付（"YYYY-MM-DD"形式）
     * @param {string} type - 'day' | 'stay' | 'visit'
     * @returns {HTMLElement}
     */
    createCapacityCell(date, type) {
        const td = document.createElement('td');
        td.className = 'capacity-cell capacity-value-cell';
        td.dataset.date = date;
        td.dataset.type = type;
        
        // 定員データを取得
        const capacity = this.capacityCheckController.checkDate(date);
        
        if (type === 'day') {
            // 通い: 記号 + 最大カウント
            const symbol = capacity.getCapacitySymbol();
            const maxCount = capacity.getMaxDayCount();
            
            td.innerHTML = `<span class="capacity-symbol">${symbol}</span><span class="capacity-count">${maxCount}</span>`;
            
            // 定員状況に応じてクラスを追加
            if (symbol === '×') {
                td.classList.add('capacity-over');
            } else if (symbol === '△') {
                td.classList.add('capacity-warn');
            } else if (symbol === '○') {
                td.classList.add('capacity-ok');
            } else if (symbol === '◎') {
                td.classList.add('capacity-good');
            }
            
            // ツールチップ
            td.title = this.getDayCapacityTooltip(capacity);
            
        } else if (type === 'stay') {
            // 泊り: 記号 + カウント
            const symbol = capacity.getStaySymbol();
            const count = capacity.stayCount;
            
            td.innerHTML = `<span class="capacity-symbol">${symbol}</span><span class="capacity-count">${count}</span>`;
            
            // 定員状況に応じてクラスを追加
            if (capacity.isStayFull()) {
                td.classList.add('capacity-over');
            } else if (capacity.isStayNearFull()) {
                td.classList.add('capacity-warn');
            } else {
                td.classList.add('capacity-ok');
            }
            
            // ツールチップ
            td.title = this.getStayCapacityTooltip(capacity);
            
        } else if (type === 'visit') {
            // 訪問: カウントのみ
            const count = capacity.visitCount;
            td.innerHTML = `<span class="capacity-count">${count}</span>`;
            
            // ツールチップ
            td.title = `訪問: ${count}回`;
        }
        
        // ホバーイベント
        td.addEventListener('mouseenter', (e) => this.handleCellHover(e, td, capacity, type));
        
        return td;
    }

    // ==================== イベントハンドラー ====================

    /**
     * セルホバー
     * @param {Event} e - イベント
     * @param {HTMLElement} td - セル要素
     * @param {DailyCapacity} capacity - 定員データ
     * @param {string} type - セルタイプ
     */
    handleCellHover(e, td, capacity, type) {
        // ツールチップはtitle属性で表示されるため、追加処理なし
    }

    // ==================== ツールチップ ====================

    /**
     * 通いの定員ツールチップを取得
     * @param {DailyCapacity} capacity - 定員データ
     * @returns {string}
     */
    getDayCapacityTooltip(capacity) {
        const lines = [];
        lines.push(DateUtils.formatDate(capacity.date, 'YYYY/MM/DD (ddd)'));
        lines.push('');
        lines.push(`全日: ${capacity.getMaxDayCount()}/${AppConfig.CAPACITY.DAY_LIMIT}人`);
        lines.push(`前半: ${capacity.dayCountMorning}/${AppConfig.CAPACITY.DAY_LIMIT}人`);
        lines.push(`後半: ${capacity.dayCountAfternoon}/${AppConfig.CAPACITY.DAY_LIMIT}人`);
        
        if (capacity.isDayFull()) {
            lines.push('');
            lines.push('⚠ 定員オーバー');
        }
        
        return lines.join('\n');
    }

    /**
     * 泊りの定員ツールチップを取得
     * @param {DailyCapacity} capacity - 定員データ
     * @returns {string}
     */
    getStayCapacityTooltip(capacity) {
        const lines = [];
        lines.push(DateUtils.formatDate(capacity.date, 'YYYY/MM/DD (ddd)'));
        lines.push('');
        lines.push(`泊り: ${capacity.stayCount}/${AppConfig.CAPACITY.STAY_LIMIT}人`);
        
        const rate = (capacity.stayCount / AppConfig.CAPACITY.STAY_LIMIT) * 100;
        lines.push(`利用率: ${Math.round(rate)}%`);
        
        if (capacity.isStayFull()) {
            lines.push('');
            lines.push('⚠ 定員オーバー');
        }
        
        return lines.join('\n');
    }

    // ==================== ユーティリティ ====================

    /**
     * 指定月の日付配列を取得
     * @param {string} yearMonth - "YYYY-MM"形式
     * @returns {Array<string>} 日付配列（"YYYY-MM-DD"形式）
     */
    getDaysInMonth(yearMonth) {
        if (!yearMonth) return [];
        
        const [year, month] = yearMonth.split('-').map(Number);
        const daysCount = DateUtils.getDaysInMonth(year, month);
        
        const dates = [];
        for (let day = 1; day <= daysCount; day++) {
            const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dates.push(date);
        }
        
        return dates;
    }

    /**
     * 定員ヘッダーをクリア
     */
    clear() {
        this.container.innerHTML = '';
    }
}

// グローバル変数として公開
window.CapacityIndicator = CapacityIndicator;
