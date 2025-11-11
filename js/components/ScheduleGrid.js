/**
 * スケジュールグリッド表示コンポーネント
 * 利用者×日付のテーブルを生成し、セルの色分けや備考アイコンを表示
 */
class ScheduleGrid {
    constructor(app, containerId) {
        // 依存関係チェック
        if (typeof window.App === 'undefined') {
            throw new Error('App is required');
        }
        if (typeof window.Logger === 'undefined') {
            throw new Error('Logger is required');
        }
        if (typeof window.DateUtils === 'undefined') {
            throw new Error('DateUtils is required');
        }
        
        this.app = app;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            throw new Error(`Container not found: ${containerId}`);
        }
        
        this.table = null;
        
        Logger?.info('ScheduleGrid initialized');
    }
    
    /**
     * 初期化処理
     */
    init() {
        this.render();
    }
    
    /**
     * テーブル全体を再構築
     */
    render() {
        try {
            Logger?.debug('ScheduleGrid rendering...');
            
            // コンテナをクリア
            this.container.innerHTML = '';
            
            // スケジュールコントローラーが利用可能かチェック
            const scheduleController = this.app.getController('schedule');
            if (!scheduleController) {
                this.container.innerHTML = '<p>スケジュールデータを読み込み中...</p>';
                return;
            }
            
            // 新しいテーブル作成
            this.table = document.createElement('table');
            this.table.className = 'schedule-grid';
            
            // ヘッダーとボディ生成
            this.renderHeader();
            this.renderBody();
            
            // コンテナに追加
            this.container.appendChild(this.table);
            
            Logger?.debug('ScheduleGrid rendered');
            
        } catch (error) {
            Logger?.error('ScheduleGrid rendering failed:', error);
            this.container.innerHTML = `<p>グリッドの表示に失敗しました: ${error.message}</p>`;
        }
    }
    
    /**
     * ヘッダー行を生成
     */
    renderHeader() {
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');
        
        // 利用者名列
        const thName = document.createElement('th');
        thName.textContent = '利用者';
        thName.className = 'header-cell header-name';
        tr.appendChild(thName);
        
        // 日付列
        const dates = this.getDatesForCurrentMonth();
        dates.forEach(date => {
            const th = document.createElement('th');
            th.textContent = date.getDate();
            th.className = 'header-cell header-date';
            
            // 土日の色分け
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0) { // 日曜日
                th.classList.add('sunday');
            } else if (dayOfWeek === 6) { // 土曜日
                th.classList.add('saturday');
            }
            
            // 定員オーバーチェック
            try {
                const capacityController = this.app.getController('capacity');
                if (capacityController) {
                    const dateStr = DateUtils.formatDate(date);
                    const capacity = capacityController.checkDate(dateStr);
                    if (capacity && capacity.isOverCapacity && capacity.isOverCapacity()) {
                        th.classList.add('over-capacity');
                    }
                }
            } catch (error) {
                Logger?.warn('Capacity check failed for date:', date, error);
            }
            
            tr.appendChild(th);
        });
        
        thead.appendChild(tr);
        this.table.appendChild(thead);
    }
    
    /**
     * ボディ行を生成
     */
    renderBody() {
        const tbody = document.createElement('tbody');
        
        const scheduleController = this.app.getController('schedule');
        const users = this.getUsers();
        
        users.forEach(user => {
            const [dayStayRow, visitRow] = this.renderUserRows(user);
            tbody.appendChild(dayStayRow);
            tbody.appendChild(visitRow);
        });
        
        this.table.appendChild(tbody);
    }
    
    /**
     * 1人の利用者につき2行を生成
     * @param {User} user - 利用者
     * @returns {HTMLTableRowElement[]} [通泊行, 訪問行]
     */
    renderUserRows(user) {
        const dayStayRow = this.createDayStayRow(user);
        const visitRow = this.createVisitRow(user);
        return [dayStayRow, visitRow];
    }
    
    /**
     * 通泊行を生成
     * @param {User} user - 利用者
     * @returns {HTMLTableRowElement}
     */
    createDayStayRow(user) {
        const tr = document.createElement('tr');
        tr.className = 'user-row day-stay-row';
        tr.dataset.userId = user.id;
        tr.dataset.rowType = 'dayStay';
        
        // 利用者名セル
        const tdName = document.createElement('td');
        tdName.textContent = user.name;
        tdName.className = 'user-name-cell';
        tdName.rowSpan = 2; // 2行分
        tr.appendChild(tdName);
        
        // 日付セル
        const dates = this.getDatesForCurrentMonth();
        dates.forEach(date => {
            const td = this.createCell(user.id, date, 'dayStay');
            tr.appendChild(td);
        });
        
        return tr;
    }
    
    /**
     * 訪問行を生成
     * @param {User} user - 利用者
     * @returns {HTMLTableRowElement}
     */
    createVisitRow(user) {
        const tr = document.createElement('tr');
        tr.className = 'user-row visit-row';
        tr.dataset.userId = user.id;
        tr.dataset.rowType = 'visit';
        
        // 日付セル（利用者名セルはrowSpanで共有）
        const dates = this.getDatesForCurrentMonth();
        dates.forEach(date => {
            const td = this.createCell(user.id, date, 'visit');
            tr.appendChild(td);
        });
        
        return tr;
    }
    
    /**
     * セルを生成
     * @param {string} userId - 利用者ID
     * @param {Date} date - 日付
     * @param {string} cellType - 'dayStay' | 'visit'
     * @returns {HTMLTableCellElement}
     */
    createCell(userId, date, cellType) {
        const td = document.createElement('td');
        td.className = `schedule-cell ${cellType}-cell`;
        td.dataset.userId = userId;
        td.dataset.date = DateUtils.formatDate(date);
        td.dataset.cellType = cellType;
        
        try {
            // セルデータ取得
            const scheduleController = this.app.getController('schedule');
            const dateStr = DateUtils.formatDate(date);
            
            if (scheduleController && scheduleController.getCell) {
                const cell = scheduleController.getCell(userId, dateStr, cellType);
                
                if (cell) {
                    // 値を表示
                    td.textContent = cell.inputValue || '';
                    
                    // スタイル適用
                    this.applyCellStyle(td, cell, cellType);
                }
            }
            
        } catch (error) {
            Logger?.warn('Cell data retrieval failed:', userId, DateUtils.formatDate(date), cellType, error);
        }
        
        // クリックイベント
        td.addEventListener('click', (e) => {
            this.handleCellClick(td, userId, date, cellType, e);
        });
        
        // ホバー効果
        td.addEventListener('mouseenter', () => {
            td.classList.add('hover');
        });
        
        td.addEventListener('mouseleave', () => {
            td.classList.remove('hover');
        });
        
        return td;
    }
    
    /**
     * セルのスタイリング
     * @param {HTMLTableCellElement} td - セル要素
     * @param {ScheduleCell} cell - セルデータ
     * @param {string} cellType - セルタイプ
     */
    applyCellStyle(td, cell, cellType) {
        try {
            // 既存のスタイルクラスをクリア
            td.classList.remove('stay-active', 'day-active', 'has-note', 'stay-in', 'stay-out');
            
            if (cellType === 'dayStay') {
                // 通泊セルのスタイリング
                if (cell.actualFlags) {
                    if (cell.actualFlags.stay) {
                        td.classList.add('stay-active');
                    }
                    if (cell.actualFlags.day) {
                        td.classList.add('day-active');
                    }
                }
                
                // 入所・退所の特別スタイル
                if (cell.inputValue === '入所') {
                    td.classList.add('stay-in');
                } else if (cell.inputValue === '退所') {
                    td.classList.add('stay-out');
                }
                
            } else if (cellType === 'visit') {
                // 訪問セルのスタイリング
                if (cell.inputValue && cell.inputValue.trim() !== '') {
                    td.classList.add('visit-active');
                }
            }
            
            // 備考アイコン
            this.updateNoteIcon(td, cell);
            
        } catch (error) {
            Logger?.warn('Cell styling failed:', error);
        }
    }
    
    /**
     * 備考アイコンを更新
     * @param {HTMLTableCellElement} td - セル要素
     * @param {ScheduleCell} cell - セルデータ
     */
    updateNoteIcon(td, cell) {
        // 既存のアイコンを削除
        const existingIcon = td.querySelector('.note-icon');
        if (existingIcon) {
            existingIcon.remove();
        }
        
        // 備考があればアイコンを追加
        if (cell.hasNote && cell.hasNote()) {
            const icon = document.createElement('span');
            icon.className = 'note-icon';
            icon.textContent = '📝';
            icon.title = '備考あり';
            td.appendChild(icon);
            td.classList.add('has-note');
        }
    }
    
    /**
     * セルクリック時の処理
     * @param {HTMLTableCellElement} td - セル要素
     * @param {string} userId - 利用者ID
     * @param {Date} date - 日付
     * @param {string} cellType - セルタイプ
     * @param {Event} event - クリックイベント
     */
    handleCellClick(td, userId, date, cellType, event) {
        try {
            Logger?.debug('Cell clicked:', userId, DateUtils.formatDate(date), cellType);
            
            // CellEditorを起動
            const cellEditor = this.app.getComponent('cellEditor');
            if (cellEditor && cellEditor.startEdit) {
                cellEditor.startEdit(td, userId, date, cellType);
            }
            
        } catch (error) {
            Logger?.error('Cell click handling failed:', error);
            this.app.showError('セルの編集に失敗しました: ' + error.message);
        }
    }
    
    /**
     * 特定のセルを更新
     * @param {string} userId - 利用者ID
     * @param {string} dateStr - 日付文字列
     * @param {string} cellType - セルタイプ
     */
    updateCell(userId, dateStr, cellType) {
        try {
            const td = this.container.querySelector(
                `[data-user-id="${userId}"][data-date="${dateStr}"][data-cell-type="${cellType}"]`
            );
            
            if (td) {
                const scheduleController = this.app.getController('schedule');
                const cell = scheduleController.getCell(userId, dateStr, cellType);
                
                if (cell) {
                    td.textContent = cell.inputValue || '';
                    this.applyCellStyle(td, cell, cellType);
                }
            }
            
        } catch (error) {
            Logger?.warn('Cell update failed:', userId, dateStr, cellType, error);
        }
    }
    
    /**
     * グリッド全体を再描画
     */
    refresh() {
        this.render();
    }
    
    /**
     * 現在の月の日付一覧を取得
     * @returns {Date[]}
     */
    getDatesForCurrentMonth() {
        try {
            const yearMonth = this.app.getCurrentYearMonth();
            if (!yearMonth) {
                return [];
            }
            
            const [year, month] = yearMonth.split('-').map(Number);
            const daysInMonth = new Date(year, month, 0).getDate();
            
            const dates = [];
            for (let day = 1; day <= daysInMonth; day++) {
                dates.push(new Date(year, month - 1, day));
            }
            
            return dates;
            
        } catch (error) {
            Logger?.error('Failed to get dates for current month:', error);
            return [];
        }
    }
    
    /**
     * 利用者一覧を取得
     * @returns {User[]}
     */
    getUsers() {
        try {
            const scheduleController = this.app.getController('schedule');
            
            if (scheduleController && scheduleController.users) {
                return scheduleController.users;
            }
            
            // フォールバック: デフォルトユーザー
            if (typeof DEFAULT_USERS !== 'undefined') {
                return DEFAULT_USERS;
            }
            
            return [];
            
        } catch (error) {
            Logger?.error('Failed to get users:', error);
            return [];
        }
    }
    
    /**
     * デバッグ情報を取得
     * @returns {object}
     */
    getDebugInfo() {
        return {
            hasContainer: !!this.container,
            hasTable: !!this.table,
            userCount: this.getUsers().length,
            dateCount: this.getDatesForCurrentMonth().length,
            currentMonth: this.app.getCurrentYearMonth()
        };
    }
}

// グローバルに登録
window.ScheduleGrid = ScheduleGrid;

Logger?.info('ScheduleGrid class loaded');
