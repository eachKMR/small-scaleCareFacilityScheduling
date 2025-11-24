/**
 * KayoiSection.js
 * 通いセクションコントローラー
 * 
 * UI・ロジック・データの統合管理
 */

import { KayoiSchedule } from './KayoiSchedule.js';
import { KayoiLogic } from './KayoiLogic.js';
import { KayoiUI } from './KayoiUI.js';
import { StorageUtils } from '../common/utils/StorageUtils.js';
import { DateUtils } from '../common/utils/DateUtils.js';

export class KayoiSection {
  constructor(masterDataManager) {
    this.masterData = masterDataManager;
    this.logic = new KayoiLogic(masterDataManager);
    
    const container = document.getElementById('kayoi-grid');
    this.ui = new KayoiUI(container, masterDataManager, this.logic);
    
    this.currentYearMonth = DateUtils.getCurrentYearMonth();
    
    this.load();
    this.setupEventHandlers();
  }

  /**
   * データを読み込み
   */
  load() {
    const data = StorageUtils.load('kayoi', null);
    if (data) {
      this.logic.fromJSON(data);
    }
  }

  /**
   * データを保存
   */
  save() {
    const data = this.logic.toJSON();
    StorageUtils.save('kayoi', data);
    StorageUtils.updateLastSaved();
  }

  /**
   * イベントハンドラーをセットアップ
   */
  setupEventHandlers() {
    // セルクリック
    this.ui.onCellClick = (data) => {
      this.handleCellClick(data);
    };
  }

  /**
   * セルクリック処理
   * @param {Object} data - { userId, date, section, schedule }
   */
  handleCellClick(data) {
    const { userId, date, section, schedule } = data;

    if (schedule) {
      // 既存スケジュールの編集・削除
      this.showEditDialog(userId, date, section, schedule);
    } else {
      // 新規スケジュールの作成
      this.showAddDialog(userId, date, section);
    }
  }

  /**
   * 追加ダイアログを表示
   * @param {string} userId
   * @param {string} date
   * @param {string} section
   */
  showAddDialog(userId, date, section) {
    const user = this.masterData.getUser(userId);
    const dateDisplay = DateUtils.formatDateDisplay(date);

    const html = `
      <h2>通い予定を追加</h2>
      <div class="dialog-content">
        <div class="form-group">
          <label>利用者</label>
          <div>${user.displayName}</div>
        </div>
        <div class="form-group">
          <label>日付</label>
          <div>${dateDisplay} ${section}</div>
        </div>
        <div class="form-group">
          <label>記号</label>
          <select id="symbol-select">
            <option value="○">○ 予定</option>
            <option value="◓">◓ 送迎あり</option>
            <option value="◒">◒ 送迎なし</option>
          </select>
        </div>
        <div class="form-group">
          <label>備考</label>
          <input type="text" id="note-input" maxlength="100" placeholder="任意">
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-secondary" id="cancel-btn">キャンセル</button>
        <button class="btn btn-primary" id="save-btn">保存</button>
      </div>
    `;

    this.showModal(html, () => {
      const symbol = document.getElementById('symbol-select').value;
      const note = document.getElementById('note-input').value;

      const schedule = new KayoiSchedule({
        userId,
        date,
        section,
        symbol,
        note
      });

      const result = this.logic.setSchedule(schedule);
      
      if (result.ok) {
        this.save();
        this.ui.updateCell(userId, date, section);
        this.ui.updateDateCapacity(date);
        this.showToast('保存しました', 'success');
        this.closeModal();
      } else {
        this.showToast(result.message, 'error');
      }
    });
  }

  /**
   * 編集ダイアログを表示
   * @param {string} userId
   * @param {string} date
   * @param {string} section
   * @param {KayoiSchedule} schedule
   */
  showEditDialog(userId, date, section, schedule) {
    const user = this.masterData.getUser(userId);
    const dateDisplay = DateUtils.formatDateDisplay(date);

    const html = `
      <h2>通い予定を編集</h2>
      <div class="dialog-content">
        <div class="form-group">
          <label>利用者</label>
          <div>${user.displayName}</div>
        </div>
        <div class="form-group">
          <label>日付</label>
          <div>${dateDisplay} ${section}</div>
        </div>
        <div class="form-group">
          <label>記号</label>
          <select id="symbol-select">
            <option value="○" ${schedule.symbol === '○' ? 'selected' : ''}>○ 予定</option>
            <option value="◓" ${schedule.symbol === '◓' ? 'selected' : ''}>◓ 送迎あり</option>
            <option value="◒" ${schedule.symbol === '◒' ? 'selected' : ''}>◒ 送迎なし</option>
          </select>
        </div>
        <div class="form-group">
          <label>備考</label>
          <input type="text" id="note-input" maxlength="100" value="${schedule.note}">
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn btn-danger" id="delete-btn">削除</button>
        <button class="btn btn-secondary" id="cancel-btn">キャンセル</button>
        <button class="btn btn-primary" id="save-btn">保存</button>
      </div>
    `;

    this.showModal(html, () => {
      const symbol = document.getElementById('symbol-select').value;
      const note = document.getElementById('note-input').value;

      schedule.symbol = symbol;
      schedule.note = note;

      const result = this.logic.setSchedule(schedule);
      
      if (result.ok) {
        this.save();
        this.ui.updateCell(userId, date, section);
        this.ui.updateDateCapacity(date);
        this.showToast('保存しました', 'success');
        this.closeModal();
      } else {
        this.showToast(result.message, 'error');
      }
    }, () => {
      // 削除ボタン
      if (confirm('この予定を削除しますか？')) {
        this.logic.deleteSchedule(userId, date, section);
        this.save();
        this.ui.updateCell(userId, date, section);
        this.ui.updateDateCapacity(date);
        this.showToast('削除しました', 'info');
        this.closeModal();
      }
    });
  }

  /**
   * モーダルを表示
   * @param {string} html
   * @param {Function} onSave
   * @param {Function} onDelete
   */
  showModal(html, onSave, onDelete = null) {
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('modal-overlay');
    
    modal.innerHTML = html;
    modal.classList.add('active');
    overlay.classList.add('active');

    // イベントリスナー
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const deleteBtn = document.getElementById('delete-btn');

    if (saveBtn) {
      saveBtn.addEventListener('click', onSave);
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeModal());
    }

    if (deleteBtn && onDelete) {
      deleteBtn.addEventListener('click', onDelete);
    }
  }

  /**
   * モーダルを閉じる
   */
  closeModal() {
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('modal-overlay');
    
    modal.classList.remove('active');
    overlay.classList.remove('active');
  }

  /**
   * トースト通知を表示
   * @param {string} message
   * @param {string} type - 'success' | 'error' | 'info' | 'warning'
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * 月を変更
   * @param {string} yearMonth
   */
  changeMonth(yearMonth) {
    this.currentYearMonth = yearMonth;
    this.ui.render(yearMonth);
  }

  /**
   * セクションをアクティブ化
   */
  activate() {
    this.ui.render(this.currentYearMonth);
  }

  /**
   * セクションを非アクティブ化
   */
  deactivate() {
    // 必要に応じてクリーンアップ
  }

  /**
   * 全スケジュールを取得（日別サマリー用）
   * @returns {Array} スケジュールデータの配列
   */
  getAllSchedules() {
    const schedules = [];
    const users = this.masterData.getAllUsers();
    const [year, month] = this.currentYearMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    users.forEach(user => {
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${this.currentYearMonth}-${String(day).padStart(2, '0')}`;
        const schedule = this.logic.getSchedule(user.userId, dateStr);
        
        if (schedule && schedule.section !== 'none') {
          schedules.push({
            userId: user.userId,
            userName: user.name,
            date: dateStr,
            section: schedule.section
          });
        }
      }
    });

    return schedules;
  }
}
