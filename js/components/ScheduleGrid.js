/**
 * ScheduleGridクラス（予定グリッド）
 * 58行×33列のグリッド表示を担当
 */
class ScheduleGrid {
    /**
     * コンストラクタ
     * @param {HTMLElement} container - グリッドを表示するコンテナ要素
     * @param {ScheduleController} scheduleController - スケジュールコントローラー
     * @param {CapacityCheckController} capacityCheckController - 定員チェックコントローラー
     */
    constructor(container, scheduleController, capacityCheckController) {
        this.container = container;
        this.scheduleController = scheduleController;
        this.capacityCheckController = capacityCheckController;
        this.logger = new Logger('ScheduleGrid');
        
        this.currentYearMonth = null;
        this.users = [];
        this.daysInMonth = [];
        
        // イベントリスナー
        this.setupEventListeners();
    }

    // ==================== イベントリスナー ====================

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // スケジュール読み込み時
        this.scheduleController.on('schedule:loaded', () => {
            this.logger.debug('Schedule loaded, rendering grid');
            this.render();
        });

        // 利用者読み込み時
        this.scheduleController.on('users:loaded', () => {
            this.logger.debug('Users loaded, rendering grid');
            this.render();
        });

        // セル更新時
        this.scheduleController.on('cell:updated', (data) => {
            this.logger.debug('Cell updated:', data);
            this.updateCell(data.userId, data.date, data.cellType);
        });

        // 月変更時
        this.scheduleController.on('month:changed', (data) => {
            this.logger.debug('Month changed:', data);
            this.currentYearMonth = data.yearMonth;
            this.render();
        });
    }

    // ==================== レンダリング ====================

    /**
     * グリッド全体を描画
     */
    render() {
        this.logger.info('Rendering schedule grid');
        
        // 現在のデータを取得
        this.currentYearMonth = this.scheduleController.getCurrentYearMonth();
        this.users = this.scheduleController.getSortedUsers();
        this.daysInMonth = this.getDaysInMonth(this.currentYearMonth);
        
        // コンテナをクリア
        this.container.innerHTML = '';
        
        // グリッドを生成
        const gridElement = this.createGridElement();
        this.container.appendChild(gridElement);
        
        this.logger.info(`Grid rendered: ${this.users.length} users, ${this.daysInMonth.length} days`);
    }

    /**
     * グリッド要素を作成
     * @returns {HTMLElement}
     */
    createGridElement() {
        const table = document.createElement('table');
        table.className = 'schedule-grid';
        
        // ヘッダー行（日付）
        const thead = this.createHeaderRow();
        table.appendChild(thead);
        
        // ボディ（利用者行）
        const tbody = this.createBodyRows();
        table.appendChild(tbody);
        
        return table;
    }

    /**
     * ヘッダー行を作成
     * @returns {HTMLElement}
     */
    createHeaderRow() {
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');
        tr.className = 'header-row';
        
        // 利用者名列（固定）
        const thName = document.createElement('th');
        thName.className = 'header-cell header-name-cell';
        thName.textContent = '利用者名';
        tr.appendChild(thName);
        
        // 前月特別セル
        const thPrev = document.createElement('th');
        thPrev.className = 'header-cell header-special-cell';
        thPrev.textContent = '前月';
        tr.appendChild(thPrev);
        
        // 1日～31日
        this.daysInMonth.forEach(date => {
            const th = document.createElement('th');
            th.className = 'header-cell header-date-cell';
            
            const day = new Date(date).getDate();
            const dayOfWeek = new Date(date).getDay();
            
            // 曜日のクラスを追加
            if (dayOfWeek === 0) {
                th.classList.add('header-sunday');
            } else if (dayOfWeek === 6) {
                th.classList.add('header-saturday');
            }
            
            th.textContent = `${day}`;
            th.title = DateUtils.formatDate(date, 'YYYY/MM/DD (ddd)');
            
            tr.appendChild(th);
        });
        
        // 翌月特別セル
        const thNext = document.createElement('th');
        thNext.className = 'header-cell header-special-cell';
        thNext.textContent = '翌月';
        tr.appendChild(thNext);
        
        thead.appendChild(tr);
        return thead;
    }

    /**
     * ボディ行を作成
     * @returns {HTMLElement}
     */
    createBodyRows() {
        const tbody = document.createElement('tbody');
        
        if (this.users.length === 0) {
            // 利用者がいない場合
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 33; // 列数
            td.className = 'empty-message';
            td.textContent = '利用者データがありません。「算定一覧を取り込む」からCSVファイルを読み込んでください。';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return tbody;
        }
        
        // 各利用者の行を作成（通泊行 + 訪問行）
        this.users.forEach(user => {
            // 通泊行
            const dayStayRow = this.createUserRow(user, 'dayStay');
            tbody.appendChild(dayStayRow);
            
            // 訪問行
            const visitRow = this.createUserRow(user, 'visit');
            tbody.appendChild(visitRow);
        });
        
        return tbody;
    }

    /**
     * 利用者の行を作成
     * @param {User} user - 利用者
     * @param {string} rowType - 'dayStay' | 'visit'
     * @returns {HTMLElement}
     */
    createUserRow(user, rowType) {
        const tr = document.createElement('tr');
        tr.className = rowType === 'dayStay' ? 'row-day-stay' : 'row-visit';
        tr.dataset.userId = user.id;
        tr.dataset.rowType = rowType;
        
        // 利用者名セル（通泊行のみ表示、訪問行は空）
        const tdName = document.createElement('td');
        tdName.className = 'user-name-cell';
        if (rowType === 'dayStay') {
            tdName.textContent = user.name;
            tdName.rowSpan = 2;
        } else {
            // 訪問行は名前セルを表示しない（rowSpanで結合されている）
            tr.style.display = 'contents'; // CSSで制御
        }
        
        if (rowType === 'dayStay') {
            tr.appendChild(tdName);
        }
        
        // 前月特別セル
        const tdPrev = this.createCellElement(user, 'prevMonth', rowType);
        tr.appendChild(tdPrev);
        
        // 1日～31日のセル
        this.daysInMonth.forEach(date => {
            const cellType = rowType === 'dayStay' ? 'am' : 'visit'; // amはdayStayの代表
            const td = this.createCellElement(user, date, cellType);
            tr.appendChild(td);
        });
        
        // 翌月特別セル
        const tdNext = this.createCellElement(user, 'nextMonth', rowType);
        tr.appendChild(tdNext);
        
        return tr;
    }

    /**
     * セル要素を作成
     * @param {User} user - 利用者
     * @param {string} date - 日付（"YYYY-MM-DD"）または "prevMonth" | "nextMonth"
     * @param {string} cellType - セルタイプ
     * @returns {HTMLElement}
     */
    createCellElement(user, date, cellType) {
        const td = document.createElement('td');
        td.className = 'schedule-cell';
        td.dataset.userId = user.id;
        td.dataset.date = date;
        td.dataset.cellType = cellType;
        
        // 特別セルのスタイル
        if (date === 'prevMonth' || date === 'nextMonth') {
            td.classList.add('cell-special');
        }
        
        // セルデータを取得して表示
        this.updateCellContent(td, user.id, date, cellType);
        
        // イベントリスナー
        td.addEventListener('click', (e) => this.handleCellClick(e, td));
        td.addEventListener('contextmenu', (e) => this.handleCellRightClick(e, td));
        td.addEventListener('mouseenter', (e) => this.handleCellHover(e, td));
        td.addEventListener('mouseleave', (e) => this.handleCellLeave(e, td));
        
        return td;
    }

    /**
     * セルの内容を更新
     * @param {HTMLElement} td - セル要素
     * @param {string} userId - 利用者ID
     * @param {string} date - 日付
     * @param {string} cellType - セルタイプ
     */
    updateCellContent(td, userId, date, cellType) {
        // スケジュールデータを取得
        const cell = this.scheduleController.getCell(userId, date, cellType);
        
        if (!cell || cell.isEmpty()) {
            td.textContent = '';
            td.classList.remove('cell-has-value', 'cell-deleted', 'cell-has-note');
            return;
        }
        
        // 削除状態の場合
        if (cell.deletedValue) {
            td.textContent = '';
            td.classList.add('cell-deleted');
            td.classList.remove('cell-has-value');
            return;
        }
        
        // 値を表示
        td.textContent = cell.inputValue;
        td.classList.add('cell-has-value');
        td.classList.remove('cell-deleted');
        
        // 備考がある場合
        if (cell.note) {
            td.classList.add('cell-has-note');
        }
        
        // 宿泊期間の場合
        if (cell.actualFlags && cell.actualFlags.stay) {
            td.classList.add('cell-stay');
        }
        
        // 通いの種類に応じてクラスを追加
        if (cell.actualFlags && cell.actualFlags.day) {
            const halfDayType = cell.actualFlags.halfDayType;
            if (halfDayType === 'morning') {
                td.classList.add('cell-morning');
            } else if (halfDayType === 'afternoon') {
                td.classList.add('cell-afternoon');
            } else if (halfDayType === 'full') {
                td.classList.add('cell-full-day');
            }
        }
    }

    /**
     * 個別セルを更新
     * @param {string} userId - 利用者ID
     * @param {string} date - 日付
     * @param {string} cellType - セルタイプ
     */
    updateCell(userId, date, cellType) {
        const selector = `td[data-user-id="${userId}"][data-date="${date}"][data-cell-type="${cellType}"]`;
        const td = this.container.querySelector(selector);
        
        if (td) {
            this.updateCellContent(td, userId, date, cellType);
        }
    }

    // ==================== イベントハンドラー ====================

    /**
     * セルクリック
     * @param {Event} e - イベント
     * @param {HTMLElement} td - セル要素
     */
    handleCellClick(e, td) {
        const userId = td.dataset.userId;
        const date = td.dataset.date;
        const cellType = td.dataset.cellType;
        
        this.logger.debug(`Cell clicked: ${userId}, ${date}, ${cellType}`);
        
        // 現在の値を取得
        const cell = this.scheduleController.getCell(userId, date, cellType);
        
        // 削除状態の場合は復元
        if (cell && cell.canRestore()) {
            this.scheduleController.restoreCell(userId, date, cellType);
            return;
        }
        
        // 行タイプに応じて処理
        const row = td.closest('tr');
        const rowType = row.dataset.rowType;
        
        if (rowType === 'dayStay') {
            // 通泊行: ○ ⇔ 空白のトグル
            const currentValue = cell ? cell.inputValue : '';
            const newValue = currentValue === AppConfig.SYMBOLS.FULL_DAY ? '' : AppConfig.SYMBOLS.FULL_DAY;
            this.scheduleController.updateCell(userId, date, 'am', newValue);
        } else if (rowType === 'visit') {
            // 訪問行: 回数+1（0→1→2→...→9→0）
            const currentValue = cell ? (parseInt(cell.inputValue) || 0) : 0;
            const newValue = currentValue >= 9 ? 0 : currentValue + 1;
            this.scheduleController.updateCell(userId, date, cellType, newValue.toString());
        }
    }

    /**
     * セル右クリック
     * @param {Event} e - イベント
     * @param {HTMLElement} td - セル要素
     */
    handleCellRightClick(e, td) {
        e.preventDefault();
        
        const userId = td.dataset.userId;
        const date = td.dataset.date;
        const cellType = td.dataset.cellType;
        
        this.logger.debug(`Cell right-clicked: ${userId}, ${date}, ${cellType}`);
        
        // TODO: 右クリックメニュー表示（Phase 3で実装）
        console.log('Right-click menu will be implemented in Phase 3');
    }

    /**
     * セルホバー
     * @param {Event} e - イベント
     * @param {HTMLElement} td - セル要素
     */
    handleCellHover(e, td) {
        const userId = td.dataset.userId;
        const date = td.dataset.date;
        const cellType = td.dataset.cellType;
        
        // TODO: ツールチップ表示（Phase 2で実装）
        const cell = this.scheduleController.getCell(userId, date, cellType);
        if (cell && !cell.isEmpty()) {
            td.title = this.getCellTooltip(cell, userId, date);
        }
    }

    /**
     * セルホバー解除
     * @param {Event} e - イベント
     * @param {HTMLElement} td - セル要素
     */
    handleCellLeave(e, td) {
        // ツールチップは自動で消える
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
     * セルのツールチップテキストを取得
     * @param {ScheduleCell} cell - セル
     * @param {string} userId - 利用者ID
     * @param {string} date - 日付
     * @returns {string}
     */
    getCellTooltip(cell, userId, date) {
        const user = this.scheduleController.getUserById(userId);
        const userName = user ? user.name : '不明';
        
        const lines = [];
        lines.push(userName);
        
        if (date !== 'prevMonth' && date !== 'nextMonth') {
            lines.push(DateUtils.formatDate(date, 'YYYY/MM/DD (ddd)'));
        }
        
        // 値の説明
        if (cell.inputValue === AppConfig.SYMBOLS.FULL_DAY) {
            lines.push('通い全日');
        } else if (cell.inputValue === AppConfig.SYMBOLS.MORNING) {
            lines.push('通い前半');
        } else if (cell.inputValue === AppConfig.SYMBOLS.AFTERNOON) {
            lines.push('通い後半');
        } else if (cell.inputValue === AppConfig.SYMBOLS.CHECK_IN) {
            lines.push('入所');
        } else if (cell.inputValue === AppConfig.SYMBOLS.CHECK_OUT) {
            lines.push('退所');
        } else if (cell.inputValue && !isNaN(cell.inputValue)) {
            lines.push(`訪問 ${cell.inputValue}回`);
        }
        
        // 備考
        if (cell.note) {
            lines.push('');
            lines.push('備考:');
            lines.push(cell.note);
        }
        
        return lines.join('\n');
    }

    /**
     * グリッドをクリア
     */
    clear() {
        this.container.innerHTML = '';
    }
}

// グローバル変数として公開
window.ScheduleGrid = ScheduleGrid;
