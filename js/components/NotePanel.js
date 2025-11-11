/**
 * 備考パネルコンポーネント
 * 備考表示・編集、ユーザー別・セル別の備考管理を実装
 */
class NotePanel {
    constructor(app) {
        // 依存関係チェック
        if (typeof window.App === 'undefined') {
            throw new Error('App is required');
        }
        if (typeof window.Logger === 'undefined') {
            throw new Error('Logger is required');
        }
        
        this.app = app;
        this.panel = null;
        this.currentTarget = null; // { type, id, userId?, date?, cellType? }
        this.isVisible = false;
        
        Logger?.info('NotePanel initialized');
    }
    
    /**
     * 初期化処理
     */
    init() {
        this.createPanel();
    }
    
    /**
     * パネル要素を作成
     */
    createPanel() {
        try {
            // 既存のパネルがあれば削除
            const existingPanel = document.getElementById('note-panel');
            if (existingPanel) {
                existingPanel.remove();
            }
            
            // パネル要素作成
            this.panel = document.createElement('div');
            this.panel.id = 'note-panel';
            this.panel.className = 'note-panel hidden';
            
            // パネル構造を構築
            this.panel.innerHTML = `
                <div class="note-panel-header">
                    <h3 class="note-panel-title">備考</h3>
                    <button class="note-panel-close" title="閉じる">×</button>
                </div>
                <div class="note-panel-body">
                    <div class="note-target-info"></div>
                    <div class="note-list-container">
                        <div class="note-list"></div>
                    </div>
                    <div class="note-form-container">
                        <textarea class="note-input" placeholder="備考を入力してください..."></textarea>
                        <div class="note-form-actions">
                            <select class="note-priority">
                                <option value="normal">通常</option>
                                <option value="high">重要</option>
                                <option value="urgent">緊急</option>
                            </select>
                            <button class="note-save-btn">保存</button>
                            <button class="note-cancel-btn">キャンセル</button>
                        </div>
                    </div>
                </div>
            `;
            
            // イベントリスナー設定
            this.setupEventListeners();
            
            // body に追加
            document.body.appendChild(this.panel);
            
            Logger?.debug('Note panel created');
            
        } catch (error) {
            Logger?.error('Note panel creation failed:', error);
        }
    }
    
    /**
     * イベントリスナー設定
     */
    setupEventListeners() {
        if (!this.panel) return;
        
        try {
            // 閉じるボタン
            const closeBtn = this.panel.querySelector('.note-panel-close');
            closeBtn?.addEventListener('click', () => {
                this.hide();
            });
            
            // 保存ボタン
            const saveBtn = this.panel.querySelector('.note-save-btn');
            saveBtn?.addEventListener('click', () => {
                this.saveNote();
            });
            
            // キャンセルボタン
            const cancelBtn = this.panel.querySelector('.note-cancel-btn');
            cancelBtn?.addEventListener('click', () => {
                this.clearForm();
            });
            
            // パネル外クリックで閉じる
            this.panel.addEventListener('click', (e) => {
                if (e.target === this.panel) {
                    this.hide();
                }
            });
            
            // Escapeキーで閉じる
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isVisible) {
                    this.hide();
                }
            });
            
        } catch (error) {
            Logger?.warn('Note panel event listener setup failed:', error);
        }
    }
    
    /**
     * パネルを表示
     * @param {string} targetType - 'user' | 'cell'
     * @param {string} targetId - 対象ID
     * @param {object} options - { userId?, date?, cellType? }
     */
    show(targetType, targetId, options = {}) {
        try {
            Logger?.debug('Showing note panel:', targetType, targetId, options);
            
            this.currentTarget = {
                type: targetType,
                id: targetId,
                ...options
            };
            
            // パネル表示
            this.panel.classList.remove('hidden');
            this.isVisible = true;
            
            // 対象情報を更新
            this.updateTargetInfo();
            
            // 既存の備考を読み込み
            this.loadNotes();
            
            // フォームをクリア
            this.clearForm();
            
            // 入力フィールドにフォーカス
            const input = this.panel.querySelector('.note-input');
            if (input) {
                setTimeout(() => input.focus(), 100);
            }
            
        } catch (error) {
            Logger?.error('Note panel show failed:', error);
            this.app?.showError('備考パネルの表示に失敗しました: ' + error.message);
        }
    }
    
    /**
     * パネルを非表示
     */
    hide() {
        try {
            this.panel.classList.add('hidden');
            this.isVisible = false;
            this.currentTarget = null;
            
            Logger?.debug('Note panel hidden');
            
        } catch (error) {
            Logger?.warn('Note panel hide failed:', error);
        }
    }
    
    /**
     * 対象情報を更新
     */
    updateTargetInfo() {
        const targetInfo = this.panel.querySelector('.note-target-info');
        if (!targetInfo || !this.currentTarget) return;
        
        try {
            let infoText = '';
            
            if (this.currentTarget.type === 'user') {
                // 利用者の備考
                const user = this.getUserById(this.currentTarget.id);
                infoText = `利用者: ${user?.name || this.currentTarget.id}`;
                
            } else if (this.currentTarget.type === 'cell') {
                // セルの備考
                const user = this.getUserById(this.currentTarget.userId);
                const dateStr = this.currentTarget.date;
                const cellType = this.currentTarget.cellType;
                
                const cellTypeLabel = cellType === 'dayStay' ? '通泊' : '訪問';
                infoText = `${user?.name || this.currentTarget.userId} - ${this.formatDateDisplay(dateStr)} (${cellTypeLabel})`;
            }
            
            targetInfo.textContent = infoText;
            
        } catch (error) {
            Logger?.warn('Target info update failed:', error);
        }
    }
    
    /**
     * 備考一覧を読み込み
     */
    loadNotes() {
        const noteList = this.panel.querySelector('.note-list');
        if (!noteList || !this.currentTarget) return;
        
        try {
            const noteController = this.app.getController('note');
            if (!noteController) {
                noteList.innerHTML = '<p>備考コントローラーが利用できません</p>';
                return;
            }
            
            let notes = [];
            
            if (this.currentTarget.type === 'user') {
                // 利用者の備考を取得
                notes = noteController.getUserNotes(this.currentTarget.id);
                
            } else if (this.currentTarget.type === 'cell') {
                // セルの備考を取得
                const cellId = `${this.currentTarget.userId}_${DateUtils.formatDate(this.currentTarget.date)}_${this.currentTarget.cellType}`;
                const cellNote = noteController.getCellNote(cellId);
                notes = cellNote ? [cellNote] : [];
            }
            
            // 備考一覧を描画
            this.renderNoteList(notes);
            
        } catch (error) {
            Logger?.error('Note loading failed:', error);
            noteList.innerHTML = `<p>備考の読み込みに失敗しました: ${error.message}</p>`;
        }
    }
    
    /**
     * 備考一覧を描画
     * @param {Note[]} notes - 備考一覧
     */
    renderNoteList(notes) {
        const noteList = this.panel.querySelector('.note-list');
        if (!noteList) return;
        
        try {
            if (!notes || notes.length === 0) {
                noteList.innerHTML = '<p class="no-notes">備考はありません</p>';
                return;
            }
            
            // 作成日時の降順でソート
            const sortedNotes = [...notes].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            
            noteList.innerHTML = '';
            
            sortedNotes.forEach(note => {
                const noteItem = this.createNoteItem(note);
                noteList.appendChild(noteItem);
            });
            
        } catch (error) {
            Logger?.warn('Note list rendering failed:', error);
            noteList.innerHTML = '<p>備考一覧の表示に失敗しました</p>';
        }
    }
    
    /**
     * 備考項目を作成
     * @param {Note} note - 備考データ
     * @returns {HTMLElement}
     */
    createNoteItem(note) {
        const item = document.createElement('div');
        item.className = `note-item priority-${note.priority}`;
        item.dataset.noteId = note.id;
        
        const priorityLabel = {
            'normal': '通常',
            'high': '重要',
            'urgent': '緊急'
        }[note.priority] || '通常';
        
        item.innerHTML = `
            <div class="note-header">
                <span class="note-priority-badge">${priorityLabel}</span>
                <span class="note-date">${this.formatDateTime(note.createdAt)}</span>
                <button class="note-delete-btn" title="削除">🗑️</button>
            </div>
            <div class="note-content">${this.escapeHtml(note.content)}</div>
        `;
        
        // 削除ボタンのイベント
        const deleteBtn = item.querySelector('.note-delete-btn');
        deleteBtn?.addEventListener('click', () => {
            this.deleteNote(note.id);
        });
        
        return item;
    }
    
    /**
     * 備考を保存
     */
    async saveNote() {
        try {
            const input = this.panel.querySelector('.note-input');
            const priority = this.panel.querySelector('.note-priority');
            
            const content = input?.value?.trim();
            const priorityValue = priority?.value || 'normal';
            
            if (!content) {
                this.app?.showError('備考の内容を入力してください');
                return;
            }
            
            const noteController = this.app.getController('note');
            if (!noteController) {
                throw new Error('NoteControllerが利用できません');
            }
            
            let result;
            
            if (this.currentTarget.type === 'user') {
                // 利用者の備考を作成
                result = noteController.createNote(
                    this.currentTarget.id,
                    '利用者備考',
                    content,
                    priorityValue
                );
                
            } else if (this.currentTarget.type === 'cell') {
                // セルの備考を作成
                result = noteController.createCellNote(
                    this.currentTarget.userId,
                    this.currentTarget.date,
                    this.currentTarget.cellType,
                    content,
                    priorityValue
                );
            }
            
            if (result) {
                this.app?.showToast('備考を保存しました', 'success');
                
                // フォームをクリア
                this.clearForm();
                
                // 一覧を再読み込み
                this.loadNotes();
                
                // グリッドを更新（備考アイコンの表示更新）
                this.app.getComponent('grid')?.refresh();
            }
            
        } catch (error) {
            Logger?.error('Note save failed:', error);
            this.app?.showError('備考の保存に失敗しました: ' + error.message);
        }
    }
    
    /**
     * 備考を削除
     * @param {string} noteId - 備考ID
     */
    async deleteNote(noteId) {
        try {
            if (!confirm('この備考を削除しますか？')) {
                return;
            }
            
            const noteController = this.app.getController('note');
            if (!noteController) {
                throw new Error('NoteControllerが利用できません');
            }
            
            const result = noteController.deleteNote(noteId);
            
            if (result) {
                this.app?.showToast('備考を削除しました', 'info');
                
                // 一覧を再読み込み
                this.loadNotes();
                
                // グリッドを更新
                this.app.getComponent('grid')?.refresh();
            }
            
        } catch (error) {
            Logger?.error('Note delete failed:', error);
            this.app?.showError('備考の削除に失敗しました: ' + error.message);
        }
    }
    
    /**
     * フォームをクリア
     */
    clearForm() {
        try {
            const input = this.panel.querySelector('.note-input');
            const priority = this.panel.querySelector('.note-priority');
            
            if (input) input.value = '';
            if (priority) priority.value = 'normal';
            
        } catch (error) {
            Logger?.warn('Form clear failed:', error);
        }
    }
    
    /**
     * 利用者をIDで取得
     * @param {string} userId - 利用者ID
     * @returns {User|null}
     */
    getUserById(userId) {
        try {
            const scheduleController = this.app.getController('schedule');
            
            if (scheduleController && scheduleController.users) {
                return scheduleController.users.find(u => u.id === userId);
            }
            
            if (typeof DEFAULT_USERS !== 'undefined') {
                return DEFAULT_USERS.find(u => u.id === userId);
            }
            
            return null;
            
        } catch (error) {
            Logger?.warn('User lookup failed:', error);
            return null;
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
            return `${month}/${day}`;
        } catch (error) {
            return dateStr;
        }
    }
    
    /**
     * 日時をフォーマット
     * @param {string} dateTimeStr - ISO日時文字列
     * @returns {string}
     */
    formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return '';
        
        try {
            const date = new Date(dateTimeStr);
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const hours = date.getHours();
            const minutes = date.getMinutes();
            
            return `${month}/${day} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } catch (error) {
            return dateTimeStr;
        }
    }
    
    /**
     * HTMLエスケープ
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * デバッグ情報を取得
     * @returns {object}
     */
    getDebugInfo() {
        return {
            hasPanel: !!this.panel,
            isVisible: this.isVisible,
            currentTarget: this.currentTarget,
            notesLoaded: this.panel?.querySelectorAll('.note-item').length || 0
        };
    }
}

// グローバルに登録
window.NotePanel = NotePanel;

Logger?.info('NotePanel class loaded');