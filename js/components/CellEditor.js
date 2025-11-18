/**
 * CellEditorクラス（セル編集）
 * Phase 1-B: 2ステップクリック方式
 * 
 * 主要機能:
 * - ○⇔空欄のトグル
 * - 訪問回数の循環（0→1→2→3→0）
 * - 2ステップクリック方式による宿泊期間作成
 * - フォーカス機能
 * - 右クリックメニュー
 * - ステータスバー表示
 */
class CellEditor {
    constructor(scheduleGrid, scheduleController) {
        this.grid = scheduleGrid;
        this.controller = scheduleController;
        this.logger = new Logger('CellEditor');
        
        // フォーカス管理
        this.focusedCell = null;  // { userId, date, cellType, element }
        
        // 2ステップクリック状態管理
        this.waitingForCheckOut = false;  // 退所日待ち状態
        this.checkInCell = null;  // { userId, date, element }
        
        // ステータスバー要素
        this.statusBar = null;
        this.statusBarTimer = null;
        
        // ステータスバーを作成
        this.createStatusBar();
        
        this.logger.info('CellEditor initialized (Phase 1-B: 2-step click)');
    }
    
    /**
     * ステータスバーを作成
     */
    createStatusBar() {
        this.statusBar = document.createElement('div');
        this.statusBar.id = 'status-bar';
        this.statusBar.className = 'status-bar';
        document.body.appendChild(this.statusBar);
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
    // Phase 1-B: 基本クリック操作（2ステップ対応）
    // ========================================

    /**
     * 通泊セルのクリック（○⇔空欄のトグル + 2ステップクリック対応）
     * @param {string} userId - 利用者ID
     * @param {string} date - 日付
     * @param {string} currentValue - 現在の値
     * @param {HTMLElement} element - セル要素
     */
    async handleDayStayClick(userId, date, currentValue, element) {
        this.logger.debug(`handleDayStayClick: ${date}, value: "${currentValue}"`);
        
        // 2ステップクリック待機中の場合
        if (this.waitingForCheckOut) {
            const consumed = await this.handleDayStayCellClickForStayPeriod(userId, date, 'dayStay');
            if (consumed) {
                return;  // イベントを消費
            }
        }
        
        // 入・退・◎はクリック不可（フォーカスのみ許可）
        if (currentValue === AppConfig.SYMBOLS.CHECK_IN ||
            currentValue === AppConfig.SYMBOLS.CHECK_OUT ||
            currentValue === AppConfig.SYMBOLS.STAY_MIDDLE) {
            // フォーカスのみ設定
            this.setFocus(userId, date, 'dayStay', element);
            this.logger.debug(`Stay-related symbol clicked (focus only): ${currentValue}`);
            return;
        }
        
        // 先にフォーカスを設定
        this.setFocus(userId, date, 'dayStay', element);
        
        // 値の更新処理（○⇔空欄のみ）
        if (currentValue === AppConfig.SYMBOLS.FULL_DAY) {
            // ○ → 空欄
            await this.controller.updateCell(userId, date, 'dayStay', '');
        } else if (currentValue === '' || !currentValue) {
            // 空欄 → ○
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
        
        // メニューを生成（eventを渡す）
        const menu = this.createContextMenu(event, userId, date, cellType, currentValue);
        
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
    createContextMenu(event, userId, date, cellType, currentValue) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.id = 'cell-context-menu';
        
        if (cellType === 'dayStay') {
            // 通泊行のメニュー
            
            // 宿泊期間中（入・◎・退）の場合は「クリア」のみ
            if (currentValue === AppConfig.SYMBOLS.CHECK_IN ||
                currentValue === AppConfig.SYMBOLS.STAY_MIDDLE ||
                currentValue === AppConfig.SYMBOLS.CHECK_OUT) {
                
                this.addMenuItem(menu, 'クリア（期間全体を削除）', async () => {
                    await this.clearStayPeriod(userId, date);
                });
                
            } else {
                // 空欄または○の場合は通常メニュー
                
                // 「泊り」メニュー（2ステップクリック開始）
                const cellElement = event.target.closest('.schedule-cell');
                this.addMenuItem(menu, '泊り（宿泊期間作成）', async () => {
                    await this.startStayPeriod(userId, date, cellElement);
                });
                
                this.addMenuSeparator(menu);
                
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
            }
            
        } else if (cellType === 'visit') {
            // 訪問行のメニュー
            for (let i = 1; i <= 3; i++) {  // 3回まで
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
     * 宿泊期間全体を削除
     * @param {string} userId - 利用者ID
     * @param {string} date - 期間内のいずれかの日付
     */
    async clearStayPeriod(userId, date) {
        const calendar = this.controller.getCalendar(userId);
        if (!calendar) return;
        
        // この日付が属するStayPeriodを探す
        const period = calendar.stayPeriods.find(p => {
            return date >= p.startDate && date <= p.endDate;
        });
        
        if (!period) {
            this.logger.warn(`StayPeriod not found for date: ${date}`);
            return;
        }
        
        // 期間内の全セルを空欄にする
        const periodDates = DateUtils.getDateRange(period.startDate, period.endDate);
        for (const d of periodDates) {
            await this.controller.updateCell(userId, d, 'dayStay', '');
        }
        
        this.logger.info(`StayPeriod cleared: ${period.startDate} -> ${period.endDate}`);
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
    // 2ステップクリック方式（宿泊期間作成）
    // ========================================

    /**
     * 宿泊期間作成を開始（ステップ1: 入所日設定）
     * 右クリックメニューから「泊り」を選択した時に呼ばれる
     * @param {string} userId - 利用者ID
     * @param {string} date - 入所日
     * @param {HTMLElement} element - セル要素
     */
    async startStayPeriod(userId, date, element) {
        // 既存の待機状態をキャンセル
        if (this.waitingForCheckOut) {
            await this.cancelStayPeriod();
        }
        
        // 入所日を設定
        await this.controller.updateCell(userId, date, 'dayStay', AppConfig.SYMBOLS.CHECK_IN);
        
        // 待機状態に入る
        this.waitingForCheckOut = true;
        this.checkInCell = { userId, date, element };
        
        // セルに点滅アニメーションを追加
        element.classList.add('waiting-for-checkout');
        
        // ステータスバーを表示
        this.showStatusMessage('退所日を選択してください (Escでキャンセル)', 'info');
        
        // Escキーでキャンセル
        document.addEventListener('keydown', this.handleEscapeKey.bind(this), { once: true });
        
        this.logger.info(`Stay period started: ${date}`);
    }
    
    /**
     * 宿泊期間作成を完了（ステップ2: 退所日設定）
     * @param {string} userId - 利用者ID
     * @param {string} checkOutDate - 退所日
     * @returns {Promise<boolean>} 成功した場合true
     */
    async completeStayPeriod(userId, checkOutDate) {
        if (!this.waitingForCheckOut || !this.checkInCell) {
            return false;
        }
        
        const checkInDate = this.checkInCell.date;
        const checkInUserId = this.checkInCell.userId;
        
        // バリデーション
        if (userId !== checkInUserId) {
            this.showStatusMessage('同じ利用者のセルを選択してください', 'error');
            return false;
        }
        
        if (checkOutDate <= checkInDate) {
            this.showStatusMessage('退所日は入所日より後の日付を選択してください', 'error');
            return false;
        }
        
        // 宿泊期間を設定
        await this.controller.setStayPeriod(checkInUserId, checkInDate, checkOutDate);
        
        // 待機状態を解除
        this.checkInCell.element.classList.remove('waiting-for-checkout');
        this.waitingForCheckOut = false;
        this.checkInCell = null;
        
        // ステータスバーを非表示
        this.hideStatusMessage();
        
        this.logger.info(`Stay period completed: ${checkInDate} -> ${checkOutDate}`);
        return true;
    }
    
    /**
     * 宿泊期間作成をキャンセル
     */
    async cancelStayPeriod() {
        if (!this.waitingForCheckOut || !this.checkInCell) {
            return;
        }
        
        // 入所日を空欄に戻す
        await this.controller.updateCell(
            this.checkInCell.userId,
            this.checkInCell.date,
            'dayStay',
            ''
        );
        
        // アニメーションを削除
        this.checkInCell.element.classList.remove('waiting-for-checkout');
        
        // 待機状態を解除
        this.waitingForCheckOut = false;
        this.checkInCell = null;
        
        // ステータスバーを非表示
        this.hideStatusMessage();
        
        this.logger.info('Stay period cancelled');
    }
    
    /**
     * Escキーでキャンセル
     * @param {KeyboardEvent} e - キーボードイベント
     */
    async handleEscapeKey(e) {
        if (e.key === 'Escape') {
            await this.cancelStayPeriod();
        }
    }
    
    /**
     * 通泊行セルのクリック処理（待機状態を考慮）
     * @param {string} userId - 利用者ID
     * @param {string} date - 日付
     * @param {string} cellType - セルタイプ
     */
    async handleDayStayCellClickForStayPeriod(userId, date, cellType) {
        // 待機状態でない場合は何もしない
        if (!this.waitingForCheckOut) {
            return false;
        }
        
        // 訪問行の場合はエラー
        if (cellType !== 'dayStay') {
            this.showStatusMessage('通泊行のセルを選択してください', 'error');
            return true;  // イベントを消費
        }
        
        // 退所日として設定
        const success = await this.completeStayPeriod(userId, date);
        return success;  // イベントを消費するかどうか
    }
    
    // ========================================
    // トースト表示
    // ========================================
    // ステータスバー表示
    // ========================================
    
    /**
     * ステータスバーにメッセージを表示
     * @param {string} message - メッセージ
     * @param {string} type - タイプ（'info' | 'error' | 'success'）
     */
    showStatusMessage(message, type = 'info') {
        // 既存のタイマーをクリア
        if (this.statusBarTimer) {
            clearTimeout(this.statusBarTimer);
            this.statusBarTimer = null;
        }
        
        // アイコンを設定
        const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : '⏱️';
        
        // メッセージを表示
        this.statusBar.textContent = `${icon} ${message}`;
        this.statusBar.className = `status-bar status-bar-${type} show`;
        
        // エラーの場合は3秒後に通常のメッセージに戻す
        if (type === 'error') {
            this.statusBarTimer = setTimeout(() => {
                // 待機状態の場合は通常のメッセージに戻す
                if (this.waitingForCheckOut) {
                    this.showStatusMessage('退所日を選択してください (Escでキャンセル)', 'info');
                } else {
                    this.hideStatusMessage();
                }
            }, 3000);
        }
        
        this.logger.debug(`Status message shown: ${message} (${type})`);
    }
    
    /**
     * ステータスバーを非表示
     */
    hideStatusMessage() {
        if (this.statusBar) {
            this.statusBar.className = 'status-bar';
            this.statusBar.textContent = '';
        }
        
        if (this.statusBarTimer) {
            clearTimeout(this.statusBarTimer);
            this.statusBarTimer = null;
        }
    }
}

// グローバル変数として公開
window.CellEditor = CellEditor;
