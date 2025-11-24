/**
 * 泊まりセクションUI
 * 9居室×30日のグリッド表示、予約の追加・編集・削除
 */
import { TomariLogic } from './TomariLogic.js';

export class TomariUI {
  constructor(masterDataManager, tomariLogic) {
    this.masterData = masterDataManager;
    this.logic = tomariLogic;
    this.container = null;
    this.selectedCell = null; // { roomId, date }
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
      <div class="tomari-section">
        <div class="tomari-grid-container">
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
    const rooms = this.masterData.getRooms();
    const dates = this.generateDateRange(30);

    let html = '<div class="tomari-grid">';
    
    // ヘッダー行（日付）
    html += '<div class="tomari-header-row">';
    html += '<div class="tomari-room-header">居室</div>';
    dates.forEach(date => {
      const dateObj = new Date(date);
      const day = dateObj.getDate();
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dateObj.getDay()];
      html += `<div class="tomari-date-header" data-date="${date}">
        <div class="date-number">${day}</div>
        <div class="date-day">${dayOfWeek}</div>
      </div>`;
    });
    html += '</div>';

    // 各居室の行
    rooms.forEach(room => {
      html += `<div class="tomari-room-row" data-room-id="${room.roomId}">`;
      html += `<div class="tomari-room-label">${room.name}</div>`;
      
      dates.forEach(date => {
        const reservation = this.logic.getReservationForRoomAndDate(room.roomId, date);
        const status = reservation ? reservation.getStatusForDate(date) : 'empty';
        const cellClass = `tomari-cell ${status}`;
        
        html += `<div class="${cellClass}" 
                      data-room-id="${room.roomId}" 
                      data-date="${date}"
                      data-reservation-id="${reservation ? reservation.id : ''}">`;
        
        if (reservation) {
          const user = this.masterData.getUserById(reservation.userId);
          const userName = user ? user.name : '不明';
          html += `<div class="cell-content">
            <span class="user-name">${userName}</span>
          </div>`;
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
    // セルクリック
    this.container.querySelectorAll('.tomari-cell').forEach(cell => {
      cell.addEventListener('click', (e) => {
        const roomId = cell.dataset.roomId;
        const date = cell.dataset.date;
        const reservationId = cell.dataset.reservationId;

        if (reservationId) {
          this.showReservationDetail(reservationId);
        } else {
          this.showNewReservationDialog(roomId, date);
        }
      });
    });
  }

  /**
   * 新規予約ダイアログ表示
   * @param {string} roomId
   * @param {string} date
   */
  showNewReservationDialog(roomId, date) {
    const users = this.masterData.getAllUsers();
    const room = this.masterData.getRoomById(roomId);

    const userOptions = users.map(u => 
      `<option value="${u.userId}">${u.name}</option>`
    ).join('');

    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="modal-content tomari-modal">
        <h3>新規予約登録</h3>
        <div class="form-group">
          <label>居室: ${room ? room.name : '不明'}</label>
        </div>
        <div class="form-group">
          <label>利用者</label>
          <select id="tomari-user-select">${userOptions}</select>
        </div>
        <div class="form-group">
          <label>入所日</label>
          <input type="date" id="tomari-start-date" value="${date}">
        </div>
        <div class="form-group">
          <label>退所日</label>
          <input type="date" id="tomari-end-date" value="${date}">
        </div>
        <div class="form-group">
          <label>備考</label>
          <textarea id="tomari-note" rows="3"></textarea>
        </div>
        <div class="modal-buttons">
          <button class="btn-primary" id="tomari-save-btn">登録</button>
          <button class="btn-secondary" id="tomari-cancel-btn">キャンセル</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // 保存ボタン
    dialog.querySelector('#tomari-save-btn').addEventListener('click', () => {
      const userId = dialog.querySelector('#tomari-user-select').value;
      const startDate = dialog.querySelector('#tomari-start-date').value;
      const endDate = dialog.querySelector('#tomari-end-date').value;
      const note = dialog.querySelector('#tomari-note').value;

      const result = this.logic.addReservation({
        userId,
        roomId,
        startDate,
        endDate,
        note
      });

      if (result) {
        this.render();
        dialog.remove();
      } else {
        alert('予約の登録に失敗しました。日付や重複を確認してください。');
      }
    });

    // キャンセルボタン
    dialog.querySelector('#tomari-cancel-btn').addEventListener('click', () => {
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
   * 予約詳細表示
   * @param {string} reservationId
   */
  showReservationDetail(reservationId) {
    const reservations = this.logic.getAllReservations();
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    const user = this.masterData.getUserById(reservation.userId);
    const room = this.masterData.getRoomById(reservation.roomId);

    const dialog = document.createElement('div');
    dialog.className = 'modal-overlay';
    dialog.innerHTML = `
      <div class="modal-content tomari-modal">
        <h3>予約詳細</h3>
        <div class="detail-row">
          <span class="detail-label">利用者:</span>
          <span>${user ? user.name : '不明'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">居室:</span>
          <span>${room ? room.name : '不明'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">入所日:</span>
          <span>${reservation.startDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">退所日:</span>
          <span>${reservation.endDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">備考:</span>
          <span>${reservation.note || 'なし'}</span>
        </div>
        <div class="modal-buttons">
          <button class="btn-danger" id="tomari-delete-btn">削除</button>
          <button class="btn-secondary" id="tomari-close-btn">閉じる</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // 削除ボタン
    dialog.querySelector('#tomari-delete-btn').addEventListener('click', () => {
      if (confirm('この予約を削除しますか？')) {
        this.logic.deleteReservation(reservationId);
        this.render();
        dialog.remove();
      }
    });

    // 閉じるボタン
    dialog.querySelector('#tomari-close-btn').addEventListener('click', () => {
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
