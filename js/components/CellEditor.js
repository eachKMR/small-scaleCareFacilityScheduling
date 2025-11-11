/**
 * セル編集コンポーネント
 * インライン編集（contenteditable）、バリデーション、キーボードイベント処理を実装
 */
class CellEditor {
    constructor(app) {
        // 依存関係チェック
        if (typeof window.App === 'undefined') {
            throw new Error('App is required');
        }
        if (typeof window.Logger === 'undefined') {
            throw new Error('Logger is required');
        }
        
        this.app = app;
        this.currentCell = null;
        this.isEditing = false;
        this.originalValue = '';
        
        // キーボードイベントをバインド
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleInput = this.handleInput.bind(this);
        
        Logger?.info('CellEditor initialized');
    }
    
    /**
     * 初期化処理
     */
    init() {
        // 特に初期化処理なし
    }
    
    /**
     * 編集開始
     * @param {HTMLTableCellElement} td - セル要素
     * @param {string} userId - 利用者ID
     * @param {Date} date - 日付
     * @param {string} cellType - 'dayStay' | 'visit'
     */
    startEdit(td, userId, date, cellType) {
        try {
            // 既に編集中の場合は先に確定
            if (this.isEditing) {
                this.finishEdit();
            }
            
            const dateStr = DateUtils.formatDate(date);
            
            this.currentCell = { td, userId, date: dateStr, cellType };
            this.isEditing = true;
            this.originalValue = td.textContent || '';
            
            Logger?.debug('Edit started:', userId, dateStr, cellType, 'original:', this.originalValue);
            
            // 編集可能にする
            td.contentEditable = 'true';
            td.classList.add('editing');
            
            // フォーカスして全選択
            td.focus();
            this.selectAllText(td);
            
            // イベントリスナー追加
            td.addEventListener('keydown', this.handleKeyDown);
            td.addEventListener('blur', this.handleBlur);
            td.addEventListener('input', this.handleInput);
            
            // 他のセルのクリックを無効化
            this.disableOtherCells();
            
        } catch (error) {
            Logger?.error('Edit start failed:', error);
            this.app?.showError('編集の開始に失敗しました: ' + error.message);
        }
    }
    
    /**
     * 編集終了（確定）
     */
    finishEdit() {
        if (!this.isEditing || !this.currentCell) return;
        
        try {
            const { td, userId, date, cellType } = this.currentCell;
            
            // 入力値取得・正規化
            const rawValue = td.textContent || '';
            const value = this.normalizeValue(rawValue, cellType);
            
            Logger?.debug('Edit finishing:', userId, date, cellType, 'value:', value);
            
            // バリデーション
            const validationResult = this.validateInput(value, cellType);
            if (!validationResult.isValid) {
                this.app?.showError(validationResult.message);
                this.cancelEdit();
                return;
            }
            
            // 編集不可に戻す
            this.cleanupEditMode(td);
            
            // 値が変更されている場合のみ更新
            if (value !== this.originalValue) {
                // スケジュールコントローラーに更新を依頼
                const scheduleController = this.app.getController('schedule');
                if (scheduleController && scheduleController.updateCell) {
                    scheduleController.updateCell(userId, date, cellType, value);
                } else {
                    Logger?.warn('ScheduleController not available for update');
                }
            }
            
            // 編集状態をクリア
            this.clearEditState();
            
            Logger?.debug('Edit finished successfully');
            
        } catch (error) {
            Logger?.error('Edit finish failed:', error);
            this.app?.showError('編集の確定に失敗しました: ' + error.message);
            this.cancelEdit();
        }
    }
    
    /**
     * 編集キャンセル
     */
    cancelEdit() {
        if (!this.isEditing || !this.currentCell) return;
        
        try {
            const { td } = this.currentCell;
            
            Logger?.debug('Edit cancelled');
            
            // 元の値に戻す
            td.textContent = this.originalValue;
            
            // 編集不可に戻す
            this.cleanupEditMode(td);
            
            // 編集状態をクリア
            this.clearEditState();
            
        } catch (error) {
            Logger?.error('Edit cancel failed:', error);
            this.clearEditState();
        }
    }
    
    /**
     * キーボードイベント処理
     * @param {KeyboardEvent} event
     */
    handleKeyDown(event) {
        if (!this.isEditing) return;
        
        try {
            switch (event.key) {
                case 'Enter':
                    event.preventDefault();
                    this.finishEdit();
                    // 次のセルに移動
                    this.moveToNextCell();
                    break;
                    
                case 'Escape':
                    event.preventDefault();
                    this.cancelEdit();
                    break;
                    
                case 'Tab':
                    event.preventDefault();
                    this.finishEdit();
                    // Tab方向に移動
                    this.moveToNextCell(event.shiftKey ? 'prev' : 'next');
                    break;
                    
                case 'ArrowUp':
                case 'ArrowDown':
                case 'ArrowLeft':
                case 'ArrowRight':
                    // 矢印キーでの移動は一旦無効化（将来的に実装可能）
                    break;
            }
        } catch (error) {
            Logger?.warn('Key event handling failed:', error);
        }
    }
    
    /**
     * フォーカス離脱イベント処理
     * @param {FocusEvent} event
     */
    handleBlur(event) {
        if (!this.isEditing) return;
        
        try {
            // 少し遅延させて他の要素へのフォーカス移動を確認
            setTimeout(() => {
                if (this.isEditing && document.activeElement !== this.currentCell.td) {
                    this.finishEdit();
                }
            }, 50);
        } catch (error) {
            Logger?.warn('Blur event handling failed:', error);
        }
    }
    
    /**
     * 入力イベント処理
     * @param {InputEvent} event
     */
    handleInput(event) {
        if (!this.isEditing) return;
        
        try {
            const { td, cellType } = this.currentCell;
            const value = td.textContent || '';
            
            // リアルタイムバリデーション（非ブロッキング）
            const validationResult = this.validateInput(value, cellType);
            
            // エラー状態のクラス制御
            if (validationResult.isValid) {
                td.classList.remove('validation-error');
            } else {
                td.classList.add('validation-error');
            }
            
        } catch (error) {
            Logger?.warn('Input event handling failed:', error);
        }
    }
    
    /**
     * 入力値のバリデーション
     * @param {string} value - 入力値
     * @param {string} cellType - セルタイプ
     * @returns {object} { isValid: boolean, message: string }
     */
    validateInput(value, cellType) {
        try {
            // 空欄は常にOK
            if (value === '') {
                return { isValid: true, message: '' };
            }
            
            if (cellType === 'dayStay') {
                // 通泊セル: "1", "入所", "退所"
                const validValues = ['1', '入所', '退所'];
                if (validValues.includes(value)) {
                    return { isValid: true, message: '' };
                } else {
                    return { 
                        isValid: false, 
                        message: '通泊セルには「1」「入所」「退所」のいずれかを入力してください' 
                    };
                }
                
            } else if (cellType === 'visit') {
                // 訪問セル: 数値（0以上）
                const numValue = Number(value);
                if (!isNaN(numValue) && numValue >= 0 && Number.isInteger(numValue)) {
                    return { isValid: true, message: '' };
                } else {
                    return { 
                        isValid: false, 
                        message: '訪問セルには0以上の整数を入力してください' 
                    };
                }
            }
            
            return { isValid: false, message: '不正なセルタイプです' };
            
        } catch (error) {
            Logger?.warn('Validation failed:', error);
            return { isValid: false, message: 'バリデーションエラーが発生しました' };
        }
    }
    
    /**
     * 入力値の正規化
     * @param {string} value - 入力値
     * @param {string} cellType - セルタイプ
     * @returns {string} 正規化された値
     */
    normalizeValue(value, cellType) {
        try {
            // 前後の空白を除去
            value = value.trim();
            
            if (cellType === 'visit' && value !== '') {
                // 訪問セルは数値として解釈
                const numValue = Number(value);
                if (!isNaN(numValue)) {
                    return String(Math.max(0, Math.floor(numValue)));
                }
            }
            
            return value;
            
        } catch (error) {
            Logger?.warn('Value normalization failed:', error);
            return value;
        }
    }
    
    /**
     * テキスト全選択
     * @param {HTMLElement} element
     */
    selectAllText(element) {
        try {
            const range = document.createRange();
            range.selectNodeContents(element);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (error) {
            Logger?.warn('Text selection failed:', error);
        }
    }
    
    /**
     * 編集モードのクリーンアップ
     * @param {HTMLTableCellElement} td
     */
    cleanupEditMode(td) {
        try {
            td.contentEditable = 'false';
            td.classList.remove('editing', 'validation-error');
            
            // イベントリスナー削除
            td.removeEventListener('keydown', this.handleKeyDown);
            td.removeEventListener('blur', this.handleBlur);
            td.removeEventListener('input', this.handleInput);
            
            // 他のセルを再有効化
            this.enableOtherCells();
            
        } catch (error) {
            Logger?.warn('Edit mode cleanup failed:', error);
        }
    }
    
    /**
     * 編集状態をクリア
     */
    clearEditState() {
        this.currentCell = null;
        this.isEditing = false;
        this.originalValue = '';
    }
    
    /**
     * 他のセルを無効化
     */
    disableOtherCells() {
        try {
            const allCells = document.querySelectorAll('.schedule-cell');
            allCells.forEach(cell => {
                if (cell !== this.currentCell?.td) {
                    cell.style.pointerEvents = 'none';
                    cell.classList.add('disabled-during-edit');
                }
            });
        } catch (error) {
            Logger?.warn('Disable other cells failed:', error);
        }
    }
    
    /**
     * 他のセルを再有効化
     */
    enableOtherCells() {
        try {
            const allCells = document.querySelectorAll('.schedule-cell');
            allCells.forEach(cell => {
                cell.style.pointerEvents = '';
                cell.classList.remove('disabled-during-edit');
            });
        } catch (error) {
            Logger?.warn('Enable other cells failed:', error);
        }
    }
    
    /**
     * 次のセルに移動
     * @param {string} direction - 'next' | 'prev'
     */
    moveToNextCell(direction = 'next') {
        try {
            if (!this.currentCell) return;
            
            const { td } = this.currentCell;
            const allCells = Array.from(document.querySelectorAll('.schedule-cell'));
            const currentIndex = allCells.indexOf(td);
            
            if (currentIndex === -1) return;
            
            let nextIndex;
            if (direction === 'prev') {
                nextIndex = currentIndex - 1;
            } else {
                nextIndex = currentIndex + 1;
            }
            
            // 範囲チェック
            if (nextIndex >= 0 && nextIndex < allCells.length) {
                const nextCell = allCells[nextIndex];
                
                // 次のセルの情報を取得
                const userId = nextCell.dataset.userId;
                const dateStr = nextCell.dataset.date;
                const cellType = nextCell.dataset.cellType;
                
                if (userId && dateStr && cellType) {
                    const date = new Date(dateStr);
                    setTimeout(() => {
                        this.startEdit(nextCell, userId, date, cellType);
                    }, 50);
                }
            }
            
        } catch (error) {
            Logger?.warn('Move to next cell failed:', error);
        }
    }
    
    /**
     * 編集を強制終了
     */
    forceFinish() {
        if (this.isEditing) {
            this.finishEdit();
        }
    }
    
    /**
     * デバッグ情報を取得
     * @returns {object}
     */
    getDebugInfo() {
        return {
            isEditing: this.isEditing,
            currentCell: this.currentCell ? {
                userId: this.currentCell.userId,
                date: this.currentCell.date,
                cellType: this.currentCell.cellType,
                value: this.currentCell.td?.textContent
            } : null,
            originalValue: this.originalValue
        };
    }
}

// グローバルに登録
window.CellEditor = CellEditor;

Logger?.info('CellEditor class loaded');