/**
 * 訪問セクションUI
 * 利用者×30日のグリッド表示、訪問スケジュールの追加・編集・削除
 */
import HoumonLogic from './HoumonLogic.js';

class HoumonUI {
  constructor(masterDataManager, houmonLogic) {
    this.masterData = masterDataManager;
    this.logic = houmonLogic;
    this.container = null;
  }

  /**
   * 初期化
   * @param {HTMLElement} container - コンテナ要素
   */
  initialize(container) {
    this.container = container;
    this.render();
  }

  /**
   * 全体レンダリング
   */
  render() {
    if (!this.container) return;

    const html = `
      <div class="houmon-section">
        <div class="houmon-grid-container">
          ${this.renderGrid()}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  /**
   * グリッド描画
   */
  renderGrid() {
    const users = this.masterData.getAllUsers();
    const dates = this.generateDateRange(30);

    let html = '<div class="houmon-grid">';
    
    // ヘッダー行（日付）
    html += '<div class="houmon-header-row">';
    html += '<div class="houmon-user-header">利用者</div>';
    dates.forEach(date => {
      const dateObj = new Date(date);
      const day = dateObj.getDate();
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dateObj.getDay()];
      html += `<div class="houmon-date-header" data-date="${date}">
        <div class="date-number">${day}</div>
        <div class="date-day">${dayOfWeek}</div>
      </div>`;
    });
    html += '</div>';

    // 各利用者の行
    users.forEach(user => {
      html += `<div class="houmon-user-row" data-user-id="${user.userId}">`;
      html += `<div class="houmon-user-label">${user.name}</div>`;
      
      dates.forEach(date => {
        const schedules = this.logic.getSchedulesForUserAndDate(user.userId, date);
        const cellClass = schedules.length > 0 ? 'houmon-cell has-schedule' : 'houmon-cell empty';
        
        html += `<div class="${cellClass}" 
                      data-user-id="${user.userId}" 
                      data-date="${date}">`;
        
        if (schedules.length > 0) {
          html += '<div class="cell-content">';
          schedules.forEach(schedule => {
            const displayText = schedule.getDisplayText();
            html += `<div class="schedule-item" data-schedule-id="${schedule.id}">
              ${displayText}
            </div>`;
          });
          html += '</div>';
        }
        
        html += '</div>';
      });
      
      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  /**
   * 日付範囲生成
   * @param {number} days - 日数
   * @returns {string[]} - 日付配列 (YYYY-MM-DD)
   */
  generateDateRange(days) {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(this.formatDate(date));
    }
    
    return dates;
  }

  /**
   * 日付フォーマット
   * @param {Date} date
   * @returns {string} YYYY-MM-DD
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * イベントリスナー設定
   */
  attachEventListeners() {
    // セルクリック（新規追加）
    this.container.querySelectorAll('.houmon-cell').forEach(cell => {
      cell.addEventListener('click', (e) => {
        // スケジュールアイテムがクリックされた場合は何もしない
        if (e.target.closest('.schedule-item')) return;

        const userId = cell.dataset.userId;
        const date = cell.dataset.date;
        this.showNewScheduleDialog(userId, date);
      });
    });

    // スケジュールアイテムクリック（詳細表示）
    this.container.querySelectorAll('.schedule-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const scheduleId = item.dataset.scheduleId;
        this.showScheduleDetail(scheduleId);
      });
    });
  }

  /**
   * 新規スケジュールダイアログ表示
   * @param {string} userId
   * @param {string} date
   */
  showNewScheduleDialog(userId, date) {
    const user = this.masterData.getUserById(userId);
    const staff = this.masterData.getStaff();

    const staffOptions = staff.map(s => 
      `<option value="${s.staffId}">${s.name}</option>`
    ).join('');

    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="modal-content houmon-modal">
        <h3>訪問予定登録</h3>
        <div class="form-group">
          <label>利用者: ${user ? user.name : '不明'}</label>
        </div>
        <div class="form-group">
          <label>日付: ${date}</label>
        </div>
        <div class="form-group">
          <label>時間帯</label>
          <select id="houmon-time-mode">
            <option value="morning">朝</option>
            <option value="noon">昼</option>
            <option value="evening">夕</option>
            <option value="custom">時刻指定</option>
          </select>
        </div>
        <div class="form-group" id="houmon-custom-time" style="display: none;">
          <label>開始時刻</label>
          <input type="time" id="houmon-start-time">
          <label>終了時刻（任意）</label>
          <input type="time" id="houmon-end-time">
        </div>
        <div class="form-group">
          <label>所要時間（分）</label>
          <input type="number" id="houmon-duration" min="15" step="15" value="60">
        </div>
        <div class="form-group">
          <label>担当者（任意）</label>
          <select id="houmon-staff-select">
            <option value="">未定</option>
            ${staffOptions}
          </select>
        </div>
        <div class="form-group">
          <label>備考</label>
          <textarea id="houmon-note" rows="3"></textarea>
        </div>
        <div class="modal-buttons">
          <button class="btn-primary" id="houmon-save-btn">登録</button>
          <button class="btn-secondary" id="houmon-cancel-btn">キャンセル</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // 時間帯切り替え
    const timeModeSelect = dialog.querySelector('#houmon-time-mode');
    const customTimeDiv = dialog.querySelector('#houmon-custom-time');
    timeModeSelect.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        customTimeDiv.style.display = 'block';
      } else {
        customTimeDiv.style.display = 'none';
      }
    });

    // 保存ボタン
    dialog.querySelector('#houmon-save-btn').addEventListener('click', () => {
      const timeMode = timeModeSelect.value;
      const duration = parseInt(dialog.querySelector('#houmon-duration').value);
      const staffId = dialog.querySelector('#houmon-staff-select').value || null;
      const note = dialog.querySelector('#houmon-note').value;

      const scheduleData = {
        userId,
        date,
        timeMode,
        duration,
        staffId,
        note
      };

      if (timeMode === 'custom') {
        scheduleData.startTime = dialog.querySelector('#houmon-start-time').value;
        scheduleData.endTime = dialog.querySelector('#houmon-end-time').value || null;
      }

      const result = this.logic.addSchedule(scheduleData);

      if (result) {
        this.render();
        dialog.remove();
      } else {
        alert('訪問予定の登録に失敗しました。入力内容を確認してください。');
      }
    });

    // キャンセルボタン
    dialog.querySelector('#houmon-cancel-btn').addEventListener('click', () => {
      dialog.remove();
    });

    // オーバーレイクリック
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });
  }

  /**
   * スケジュール詳細表示
   * @param {string} scheduleId
   */
  showScheduleDetail(scheduleId) {
    const schedules = this.logic.getAllSchedules();
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    const user = this.masterData.getUserById(schedule.userId);
    const staff = schedule.staffId ? this.masterData.getStaffById(schedule.staffId) : null;

    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="modal-content houmon-modal">
        <h3>訪問予定詳細</h3>
        <div class="detail-row">
          <span class="detail-label">利用者:</span>
          <span>${user ? user.name : '不明'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">日付:</span>
          <span>${schedule.date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">時間:</span>
          <span>${schedule.getDisplayText()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">所要時間:</span>
          <span>${schedule.duration}分</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">担当者:</span>
          <span>${staff ? staff.name : '未定'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">備考:</span>
          <span>${schedule.note || 'なし'}</span>
        </div>
        <div class="modal-buttons">
          <button class="btn-danger" id="houmon-delete-btn">削除</button>
          <button class="btn-secondary" id="houmon-close-btn">閉じる</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // 削除ボタン
    dialog.querySelector('#houmon-delete-btn').addEventListener('click', () => {
      if (confirm('この訪問予定を削除しますか？')) {
        this.logic.deleteSchedule(scheduleId);
        this.render();
        dialog.remove();
      }
    });

    // 閉じるボタン
    dialog.querySelector('#houmon-close-btn').addEventListener('click', () => {
      dialog.remove();
    });

    // オーバーレイクリック
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });
  }

  /**
   * 再描画
   */
  refresh() {
    this.render();
  }
}

export default HoumonUI;
