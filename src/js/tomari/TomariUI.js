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

    const tbody = document.querySelector('#tomari-tbody');
    if (!tbody) return;

    tbody.innerHTML = this.renderGrid();
    this.attachEventListeners();
  }

  /**
   * グリッド描画（テーブル行を生成）
   */
  renderGrid() {
    const rooms = this.masterData.getRooms();
    const dates = this.generateDateRange(30);

    let html = '';

    // 各居室の行を生成
    rooms.forEach(room => {
      html += '<tr class="tomari-room-row" data-room-id="' + room.roomId + '">';
      
      // 1列目: 居室名
      html += '<td class="room-cell">' + room.name + '</td>';
      
      // 2-31列目: 日付セル（横並び）
      dates.forEach(date => {
        const reservation = this.logic.getReservationForRoomAndDate(room.roomId, date);
        const status = reservation ? reservation.getStatusForDate(date) : 'empty';
        let cellClass = 'schedule-cell tomari-cell';
        
        if (reservation) {
          cellClass += ' occupied';
          if (reservation.startDate === date) cellClass += ' check-in';
          if (reservation.endDate === date) cellClass += ' check-out';
        }
        
        html += '<td class="' + cellClass + '" ';
        html += 'data-room-id="' + room.roomId + '" ';
        html += 'data-date="' + date + '" ';
        html += 'data-reservation-id="' + (reservation ? reservation.id : '') + '">';
        
        if (reservation) {
          const user = this.masterData.getUserById(reservation.userId);
          const userName = user ? user.name : '不明';
          
          // 記号表示
          let symbol = '○';
          if (reservation.startDate === date) symbol = '入';
          else if (reservation.endDate === date) symbol = '退';
          
          html += '<span class="symbol">' + symbol + '</span>';
          html += '<span class="user-name">' + userName + '</span>';
        } else {
          html += '<span class="symbol empty">-</span>';
        }
        
        html += '</td>';
      });
      
      html += '</tr>';
    });

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
    const cells = document.querySelectorAll('#tomari-tbody .schedule-cell');
    cells.forEach(cell => {
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
