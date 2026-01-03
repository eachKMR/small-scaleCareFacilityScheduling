/**
 * 泊まり予約管理ロジック
 * 居室予約の追加・編集・削除、空き状況判定などを管理
 */
import { TomariReservation } from './TomariReservation.js';
import { Room } from '../common/Room.js';

export class TomariLogic {
  constructor(masterDataManager) {
    this.masterData = masterDataManager;
    this.reservations = []; // TomariReservation[]
  }

  /**
   * 初期化
   */
  initialize() {
    this.loadFromStorage();
  }

  /**
   * ストレージから読み込み
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem('tomari_reservations');
      if (data) {
        const parsed = JSON.parse(data);
        this.reservations = parsed.map(item => TomariReservation.fromJSON(item));
      }
    } catch (error) {
      console.error('泊まり予約データ読み込みエラー:', error);
      this.reservations = [];
    }
  }

  /**
   * ストレージに保存
   */
  saveToStorage() {
    try {
      const data = this.reservations.map(r => r.toJSON());
      localStorage.setItem('tomari_reservations', JSON.stringify(data));
    } catch (error) {
      console.error('泊まり予約データ保存エラー:', error);
    }
  }

  /**
   * 予約追加
   * v2.0: 定員チェックを追加
   * @param {Object} reservationData - 予約データ
   * @returns {Object} { success: boolean, reservation?: TomariReservation, warnings?: string[] }
   */
  addReservation(reservationData) {
    try {
      const reservation = new TomariReservation(reservationData);
      
      // バリデーション
      const validation = reservation.validate();
      if (!validation.valid) {
        console.error('予約データが無効:', validation.error);
        return { success: false, errors: [validation.error] };
      }

      // roomIdがnullでない場合は重複チェック
      if (reservation.roomId !== null && this.hasConflict(reservation)) {
        console.error('予約が重複しています');
        return { success: false, errors: ['予約が重複しています'] };
      }

      // 🆕 定員チェック
      const capacityCheck = this.checkCapacity(
        reservation.startDate,
        reservation.endDate
      );

      // 予約を追加
      this.reservations.push(reservation);
      this.saveToStorage();
      
      // 🆕 定員超過の警告を返す
      if (capacityCheck.overDates && capacityCheck.overDates.length > 0) {
        return {
          success: true,
          reservation: reservation,
          warnings: [capacityCheck.message]
        };
      }
      
      return { success: true, reservation: reservation };
    } catch (error) {
      console.error('予約追加エラー:', error);
      return { success: false, errors: [error.message] };
    }
  }

  /**
   * 予約更新
   * @param {string} id - 予約ID
   * @param {Object} updates - 更新データ
   * @returns {boolean}
   */
  updateReservation(id, updates) {
    const index = this.reservations.findIndex(r => r.id === id);
    if (index === -1) return false;

    try {
      const updated = new TomariReservation({
        ...this.reservations[index].toJSON(),
        ...updates
      });

      const validation = updated.validate();
      if (!validation.isValid) {
        console.error('更新データが無効:', validation.errors);
        return false;
      }

      // 他の予約との重複チェック（自分自身は除外）
      if (this.hasConflict(updated, id)) {
        console.error('更新後に予約が重複します');
        return false;
      }

      this.reservations[index] = updated;
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('予約更新エラー:', error);
      return false;
    }
  }

  /**
   * 予約削除
   * @param {string} id - 予約ID
   * @returns {boolean}
   */
  deleteReservation(id) {
    const index = this.reservations.findIndex(r => r.id === id);
    if (index === -1) return false;

    this.reservations.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  /**
   * 🆕 予約削除（エイリアス）
   * @param {string} id - 予約ID
   * @returns {boolean}
   */
  removeReservation(id) {
    return this.deleteReservation(id);
  }

  /**
   * 🆕 指定期間のすべての日の定員をチェック
   * @param {string} startDate - チェック対象の開始日（"YYYY-MM-DD"）
   * @param {string} endDate - チェック対象の終了日（"YYYY-MM-DD"）
   * @returns {Object} { ok: boolean, message?: string, overDates?: string[] }
   */
  checkCapacity(startDate, endDate) {
    const CAPACITY = 9; // 泊まり定員
    const dates = this.getDateRange(startDate, endDate);
    const overDates = [];
    const warnings = [];
    
    // 期間内のすべての日をチェック
    for (const date of dates) {
      const count = this.countReservations(date);
      
      if (count === CAPACITY) {
        // 定員ちょうど（警告）
        warnings.push(`${date}は定員に達しています（${count}人）`);
        overDates.push(date);
      } else if (count > CAPACITY) {
        // 定員超過（警告）
        warnings.push(`${date}は定員を超えています（${count}人/${CAPACITY}人）`);
        overDates.push(date);
      }
    }
    
    if (warnings.length > 0) {
      return {
        ok: true, // 警告のみ（保存は可能）
        message: warnings.join(', '),
        overDates: overDates
      };
    }
    
    return { ok: true };
  }

  /**
   * 🆕 指定日の宿泊者数をカウント
   * @param {string} date - チェック対象の日付（"YYYY-MM-DD"）
   * @returns {number} 宿泊者数
   */
  countReservations(date) {
    return this.reservations.filter(r => 
      r.startDate <= date && date <= r.endDate
    ).length;
  }

  /**
   * 🆕 日付範囲を配列で取得
   * @param {string} startDate - "YYYY-MM-DD"
   * @param {string} endDate - "YYYY-MM-DD"
   * @returns {string[]} ["YYYY-MM-DD", ...]
   */
  getDateRange(startDate, endDate) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }

  /**
   * 特定日・居室の予約取得
   * @param {string} roomId - 居室ID
   * @param {string} date - 日付 (YYYY-MM-DD)
   * @returns {TomariReservation|null}
   */
  getReservationForRoomAndDate(roomId, date) {
    return this.reservations.find(r => 
      r.roomId === roomId && r.includesDate(date)
    ) || null;
  }

  /**
   * 特定日の全予約取得
   * @param {string} date - 日付 (YYYY-MM-DD)
   * @returns {TomariReservation[]}
   */
  getReservationsForDate(date) {
    return this.reservations.filter(r => r.includesDate(date));
  }

  /**
   * 利用者IDで予約検索
   * @param {string} userId - 利用者ID
   * @returns {TomariReservation[]}
   */
  getReservationsByUserId(userId) {
    return this.reservations.filter(r => r.userId === userId);
  }

  /**
   * 予約重複チェック
   * @param {TomariReservation} reservation - チェック対象の予約
   * @param {string} excludeId - 除外する予約ID（更新時）
   * @returns {boolean}
   */
  hasConflict(reservation, excludeId = null) {
    const start = new Date(reservation.startDate);
    const end = new Date(reservation.endDate);

    return this.reservations.some(r => {
      if (r.id === excludeId) return false; // 自分自身は除外
      if (r.roomId !== reservation.roomId) return false; // 別の部屋は問題なし

      const rStart = new Date(r.startDate);
      const rEnd = new Date(r.endDate);

      // 期間の重複判定
      return start <= rEnd && end >= rStart;
    });
  }

  /**
   * 居室の空き状況取得
   * @param {string} date - 日付 (YYYY-MM-DD)
   * @returns {Object} { available: Room[], occupied: Room[] }
   */
  getRoomAvailability(date) {
    const rooms = this.masterData.getRooms();
    const available = [];
    const occupied = [];

    rooms.forEach(room => {
      const reservation = this.getReservationForRoomAndDate(room.roomId, date);
      if (reservation) {
        occupied.push(room);
      } else {
        available.push(room);
      }
    });

    return { available, occupied };
  }

  /**
   * 全予約取得
   * @returns {TomariReservation[]}
   */
  getAllReservations() {
    return [...this.reservations];
  }

  /**
   * データクリア
   */
  clearAll() {
    this.reservations = [];
    this.saveToStorage();
  }
}
