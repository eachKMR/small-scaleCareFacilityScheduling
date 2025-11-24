/**
 * TomariReservation.js
 * 泊まり予約データクラス
 */

export class TomariReservation {
  constructor(data) {
    this.id = data.id || this.#generateId(data.startDate);
    this.userId = data.userId;
    this.roomId = data.roomId;
    this.startDate = data.startDate; // "YYYY-MM-DD"
    this.endDate = data.endDate;     // "YYYY-MM-DD"
    this.status = data.status || "計画";
    this.note = data.note || null;
  }

  #generateId(startDate) {
    const dateStr = startDate.replace(/-/g, '');
    const sequence = Math.floor(Math.random() * 1000);
    return `tomari_${dateStr}_${sequence.toString().padStart(3, '0')}`;
  }

  validate() {
    if (!this.userId) return { valid: false, error: '利用者IDは必須です' };
    if (!this.roomId) return { valid: false, error: '居室IDは必須です' };
    if (!this.startDate) return { valid: false, error: '入所日は必須です' };
    if (!this.endDate) return { valid: false, error: '退所日は必須です' };
    
    if (this.startDate >= this.endDate) {
      return { valid: false, error: '退所日は入所日より後である必要があります' };
    }
    
    return { valid: true };
  }

  getStatusForDate(date) {
    if (!this.includesDate(date)) return null;
    if (date === this.startDate) return "入所";
    if (date === this.endDate) return "退所";
    return "継続";
  }

  includesDate(date) {
    return this.startDate <= date && date <= this.endDate;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      roomId: this.roomId,
      startDate: this.startDate,
      endDate: this.endDate,
      status: this.status,
      note: this.note
    };
  }

  static fromJSON(data) {
    return new TomariReservation(data);
  }
}
