/**
 * CellEditorクラス（セル編集）
 * Phase 1-B: UI機能強化（リセット版）
 * 
 * Phase 1: 基本機能のみ
 * - ○⇔空欄のトグル
 * - 訪問回数の循環
 * - 基本ドラッグ（入◎◎退）
 * - フォーカス機能（1回目クリック→フォーカス、2回目クリック→操作実行）
 */
class CellEditor {
    constructor(scheduleGrid, scheduleController) {
        this.grid = scheduleGrid;
        this.controller = scheduleController;
        this.logger = new Logger('CellEditor');
        
        // ドラッグ状態
        this.isDragging = false;
        this.dragStart = null;
        this.dragEnd = null;
        this.hasMoved = false; // マウスが移動したかどうか
        
        // フォーカス管理
        this.focusedCell = null;  // { userId, date, cellType, element }
        
        this.logger.info('CellEditor initialized (Phase 1 with Focus)');
    }
    
    // ========================================
    // フォーカス管理
    // ========================================
    
    /**
     * セルにフォーカスを設定
     * @param {string} userId - 利用者ID
     * @param {string} date - 日付
     * @param {string} cellType - セルタイプ
     * @param {HTMLElement} element - セル要素
     */
    setFocus(userId, date, cellType, element) {
        // 既存のフォーカスを解除
        if (this.focusedCell && this.focusedCell.element) {
            this.focusedCell.element.classList.remove('focused');
        }
        
        // 新しいフォーカスを設定
        this.focusedCell = { userId, date, cellType, element };
        element.classList.add('focused');
        element.focus();
        
        this.logger.debug(`Focus set: ${userId}, ${date}, ${cellType}`);
    }
    
    /**
     * フォーカスを解除
     */
    clearFocus() {
        if (this.focusedCell && this.focusedCell.element) {
            this.focusedCell.element.classList.remove('focused');
            this.focusedCell = null;
            this.logger.debug('Focus cleared');
        }
    }
    
    /**
     * 指定セルがフォーカス中かどうか
     * @param {string} userId - 利用者ID
     * @param {string} date - 日付
     * @param {string} cellType - セルタイプ
     * @returns {boolean}
     */
    isFocused(userId, date, cellType) {
        return this.focusedCell &&
               this.focusedCell.userId === userId &&
               this.focusedCell.date === date &&
               this.focusedCell.cellType === cellType;
    }

    // ========================================
    // Phase 1: 基本クリック操作（フォーカス対応版）
    // ========================================

    /**
     * 通泊セルのクリック（○⇔空欄のトグル）
     * 1回のクリックでフォーカス+値変更を同時に実行
     * Phase 2: 入・退・◎の処理を追加
     */
    async handleDayStayClick(userId, date, currentValue, element) {
        this.logger.debug(`handleDayStayClick: ${date}, value: "${currentValue}"`);
        
        // 先にフォーカスを設定
        this.setFocus(userId, date, 'dayStay', element);
        
        // 値の更新処理
        if (currentValue === AppConfig.SYMBOLS.FULL_DAY) {
            // ○ → 空欄
            await this.controller.updateCell(userId, date, 'dayStay', '');
        } else if (currentValue === '' || !currentValue) {
            // 空欄 → ○
            await this.controller.updateCell(userId, date, 'dayStay', AppConfig.SYMBOLS.FULL_DAY);
        } else if (currentValue === AppConfig.SYMBOLS.CHECK_IN) {
            // 入 → StayPeriodを削除（Phase 2）
            await this.handleCheckInClick(userId, date);
        } else if (currentValue === AppConfig.SYMBOLS.CHECK_OUT) {
            // 退 → StayPeriodを削除（Phase 2）
            await this.handleCheckOutClick(userId, date);
        } else if (currentValue === AppConfig.SYMBOLS.STAY_MIDDLE) {
            // ◎ → ○（通いのみに変換）（Phase 2）
            await this.controller.updateCell(userId, date, 'dayStay', AppConfig.SYMBOLS.FULL_DAY);
        } else {
            // その他（◓◒など）
            this.logger.info(`Other symbol clicked: ${currentValue}`);
        }
    }

    /**
     * 入をクリックした時の処理（Phase 2）
     * StayPeriodを削除して、期間内の全セルを空欄にする
     */
    async handleCheckInClick(userId, date) {
        this.logger.debug(`handleCheckInClick: ${date}`);
        
        const calendar = this.controller.getCalendar(userId);
        if (!calendar) return;
        
        // この入が属するStayPeriodを探す
        const stayPeriod = calendar.stayPeriods.find(period => period.startDate === date);
        
        if (!stayPeriod) {
            this.logger.warn(`StayPeriod not found for checkin: ${date}`);
            return;
        }
        
        // 期間内の日付を取得
        const dates = DateUtils.getDateRange(stayPeriod.startDate, stayPeriod.endDate);
        
        // 全セルを空欄にする
        dates.forEach(d => {
            calendar.setCell(d, 'dayStay', '');
        });
        
        // StayPeriodを削除
        calendar.stayPeriods = calendar.stayPeriods.filter(p => p !== stayPeriod);
        
        // フラグを再計算
        calendar.calculateAllFlags();
        
        // 保存
        if (AppConfig.STORAGE.AUTO_SAVE) {
            await this.controller.saveSchedule();
        }
        
        // 定員再計算
        this.controller.recalculateCapacity();
        
        this.logger.info(`StayPeriod removed: ${stayPeriod.startDate} -> ${stayPeriod.endDate}`);
    }

    /**
     * 退をクリックした時の処理（Phase 2）
     * StayPeriodを削除して、期間内の全セルを空欄にする
     */
    async handleCheckOutClick(userId, date) {
        this.logger.debug(`handleCheckOutClick: ${date}`);
        
        const calendar = this.controller.getCalendar(userId);
        if (!calendar) return;
        
        // この退が属するStayPeriodを探す
        const stayPeriod = calendar.stayPeriods.find(period => period.endDate === date);
        
        if (!stayPeriod) {
            this.logger.warn(`StayPeriod not found for checkout: ${date}`);
            return;
        }
        
        // 期間内の日付を取得
        const dates = DateUtils.getDateRange(stayPeriod.startDate, stayPeriod.endDate);
        
        // 全セルを空欄にする
        dates.forEach(d => {
            calendar.setCell(d, 'dayStay', '');
        });
        
        // StayPeriodを削除
        calendar.stayPeriods = calendar.stayPeriods.filter(p => p !== stayPeriod);
        
        // フラグを再計算
        calendar.calculateAllFlags();
        
        // 保存
        if (AppConfig.STORAGE.AUTO_SAVE) {
            await this.controller.saveSchedule();
        }
        
        // 定員再計算
        this.controller.recalculateCapacity();
        
        this.logger.info(`StayPeriod removed: ${stayPeriod.startDate} -> ${stayPeriod.endDate}`);
    }

    // ========================================
    // Phase 3: 右クリックメニュー
    // ========================================

    /**
     * 右クリックメニューを表示
     */
    showContextMenu(event, userId, date, cellType, currentValue) {
        event.preventDefault();
        
        // 既存のメニューを削除
        this.hideContextMenu();
        
        // メニューを生成
        const menu = this.createContextMenu(userId, date, cellType, currentValue);
        
        // 位置を設定
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;
        
        // DOM に追加
        document.body.appendChild(menu);
        
        // 外側クリックで閉じる
        setTimeout(() => {
            document.addEventListener('click', () => this.hideContextMenu(), { once: true });
        }, 0);
    }

    /**
     * メニューを生成
     */
    createContextMenu(userId, date, cellType, currentValue) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.id = 'cell-context-menu';
        
        if (cellType === 'dayStay') {
            // 通泊行のメニュー
            this.addMenuItem(menu, '通い全日（○）', async () => {
                await this.controller.updateCell(userId, date, cellType, AppConfig.SYMBOLS.FULL_DAY);
            });
            this.addMenuItem(menu, '前半のみ（◓）', async () => {
                await this.controller.updateCell(userId, date, cellType, AppConfig.SYMBOLS.MORNING);
            });
            this.addMenuItem(menu, '後半のみ（◒）', async () => {
                await this.controller.updateCell(userId, date, cellType, AppConfig.SYMBOLS.AFTERNOON);
            });
            this.addMenuSeparator(menu);
            this.addMenuItem(menu, 'クリア', async () => {
                await this.controller.updateCell(userId, date, cellType, '');
            });
        } else if (cellType === 'visit') {
            // 訪問行のメニュー
            for (let i = 1; i <= 5; i++) {
                this.addMenuItem(menu, `${i}回`, async () => {
                    await this.controller.updateCell(userId, date, cellType, String(i));
                });
            }
            this.addMenuSeparator(menu);
            this.addMenuItem(menu, '直接入力', async () => {
                await this.showDirectInputDialog(userId, date, cellType);
            });
            this.addMenuItem(menu, 'クリア', async () => {
                await this.controller.updateCell(userId, date, cellType, '');
            });
        }
        
        return menu;
    }

    /**
     * メニュー項目を追加
     */
    addMenuItem(menu, label, onClick) {
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        item.textContent = label;
        item.addEventListener('click', async (e) => {
            e.stopPropagation();
            await onClick();
            this.hideContextMenu();
        });
        menu.appendChild(item);
    }

    /**
     * 区切り線を追加
     */
    addMenuSeparator(menu) {
        const separator = document.createElement('div');
        separator.className = 'context-menu-separator';
        menu.appendChild(separator);
    }

    /**
     * メニューを非表示
     */
    hideContextMenu() {
        const menu = document.getElementById('cell-context-menu');
        if (menu) {
            menu.remove();
        }
    }

    /**
     * 直接入力ダイアログを表示
     */
    async showDirectInputDialog(userId, date, cellType) {
        const input = prompt('訪問回数を入力してください（1〜99）：');
        if (input === null) return; // キャンセル
        
        const num = parseInt(input);
        if (isNaN(num) || num < 1 || num > 99) {
            alert('1〜99の数値を入力してください');
            return;
        }
        
        await this.controller.updateCell(userId, date, cellType, String(num));
    }

    /**
     * 訪問回数のクリック（0→1→2→3→0）
     * 1回目クリック: フォーカス、2回目クリック: 操作実行
     * @param {string} userId - 利用者ID
     * @param {string} date - 日付
     * @param {string} currentValue - 現在の値
     * @param {HTMLElement} element - セル要素
     * @returns {Promise<void>}
     */
    async handleVisitClick(userId, date, currentValue, element) {
        // 先にフォーカスを設定
        this.setFocus(userId, date, 'visit', element);
        
        // 値の更新処理
        const currentNum = parseInt(currentValue) || 0;
        const newNum = (currentNum + 1) % 4;  // 0→1→2→3→0
        const newValue = newNum === 0 ? '' : String(newNum);
        
        await this.controller.updateCell(userId, date, 'visit', newValue);
    }

    // ========================================
    // Phase 1: 基本ドラッグ操作
    // ========================================

    /**
     * ドラッグ開始
     */
    handleDragStart(userId, date, cellType) {
        if (cellType !== 'dayStay') return;
        
        this.isDragging = true;
        this.hasMoved = false; // リセット
        this.dragStart = { userId, date };
        this.dragEnd = { userId, date };
        
        this.logger.debug(`Drag start: ${date}`);
    }

    /**
     * ドラッグ移動
     */
    handleDragMove(userId, date, cellType) {
        if (!this.isDragging) return;
        if (cellType !== 'dayStay') return;
        if (userId !== this.dragStart.userId) return;
        
        // 移動したことを記録
        if (date !== this.dragStart.date) {
            this.hasMoved = true;
        }
        
        this.dragEnd = { userId, date };
        
        this.logger.debug(`Dragging: ${this.dragStart.date} -> ${this.dragEnd.date}`);
    }

    /**
     * ドラッグ終了
     */
    async handleDragEnd() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        this.logger.debug(`Drag end: ${this.dragStart.date} -> ${this.dragEnd.date}, hasMoved: ${this.hasMoved}`);
        
        // 移動していない場合は何もしない（クリックとして処理される）
        if (!this.hasMoved) {
            this.logger.debug('No movement detected, treating as click');
            this.dragStart = null;
            this.dragEnd = null;
            this.hasMoved = false;
            return;
        }
        
        // 宿泊期間を設定（Phase 1: シンプル版）
        if (this.dragStart && this.dragEnd) {
            await this.setStayPeriodSimple(
                this.dragStart.userId,
                this.dragStart.date,
                this.dragEnd.date
            );
        }
        
        this.dragStart = null;
        this.dragEnd = null;
        this.hasMoved = false;
    }

    /**
     * 宿泊期間設定（Phase 2: 延長・短縮対応）
     */
    async setStayPeriodSimple(userId, startDate, endDate) {
        // 日付の順序を正規化
        const dates = [startDate, endDate].sort();
        const start = dates[0];
        const end = dates[1];
        
        // 1セルのみの場合はクリック操作と同じ
        if (start === end) {
            const calendar = this.controller.getCalendar(userId);
            const cell = calendar ? calendar.getCell(start, 'dayStay') : null;
            const currentValue = cell ? cell.inputValue : '';
            await this.handleDayStayClick(userId, start, currentValue);
            return;
        }
        
        // Phase 2: 既存のStayPeriodとの重複をチェック
        const calendar = this.controller.getCalendar(userId);
        if (!calendar) return;
        
        // 新しい期間と重複するStayPeriodを探す
        const overlappingPeriods = calendar.stayPeriods.filter(period => {
            // 期間の重複判定
            return !(end < period.startDate || start > period.endDate);
        });
        
        if (overlappingPeriods.length > 0) {
            // 重複がある場合：延長・短縮として処理
            this.logger.debug(`Found ${overlappingPeriods.length} overlapping periods, treating as extension/shortening`);
            
            // 重複している全ての期間を削除
            overlappingPeriods.forEach(period => {
                const periodDates = DateUtils.getDateRange(period.startDate, period.endDate);
                periodDates.forEach(d => {
                    calendar.setCell(d, 'dayStay', '');
                });
                calendar.stayPeriods = calendar.stayPeriods.filter(p => p !== period);
            });
            
            // 既存期間と新しい範囲を統合して、最も広い範囲を設定
            const allDates = [start, end];
            overlappingPeriods.forEach(period => {
                allDates.push(period.startDate, period.endDate);
            });
            
            const newStart = allDates.sort()[0];
            const newEnd = allDates.sort()[allDates.length - 1];
            
            // 新しい期間を設定
            await this.controller.setStayPeriod(userId, newStart, newEnd);
        } else {
            // 重複がない場合：新規作成
            await this.controller.setStayPeriod(userId, start, end);
        }
    }
}

// グローバル変数として公開
window.CellEditor = CellEditor;
