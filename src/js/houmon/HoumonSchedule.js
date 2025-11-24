/**
 * HoumonSchedule.js
 * 訪問スケジュールデータクラス
 */

export class HoumonSchedule {
  constructor(data) {
    this.id = data.id || this.#generateId(data.date);
    this.userId = data.userId;
    this.date = data.date; // "YYYY-MM-DD"
    this.timeMode = data.timeMode || "morning";
    this.startTime = data.startTime || null;
    this.endTime = data.endTime || null;
    this.duration = data.duration || 30;
    this.staffId = data.staffId || null;
    this.note = data.note || "";
  }

  #generateId(date) {
    const dateStr = date.replace(/-/g, '');
    const sequence = Math.floor(Math.random() * 1000);
    return `houmon_${dateStr}_${sequence.toString().padStart(3, '0')}`;
  }

  validate() {
    if (!this.userId) return { valid: false, error: '利用者IDは必須です' };
    if (!this.date) return { valid: false, error: '訪問日は必須です' };
    
    if (this.timeMode === 'strict') {
      if (!this.startTime) return { valid: false, error: '開始時刻は必須です' };
      if (!this.endTime) return { valid: false, error: '終了時刻は必須です' };
    }
    
    return { valid: true };
  }

  getDisplayText() {
    if (this.timeMode === 'strict' && this.startTime) {
      return this.startTime;
    }
    
    const timeModeLabels = {
      morning: '朝',
      daytime: '昼',
      afternoon: '午後',
      evening: '夕',
      night: '夜',
      anytime: '随時'
    };
    
    return timeModeLabels[this.timeMode] || '';
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      date: this.date,
      timeMode: this.timeMode,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      staffId: this.staffId,
      note: this.note
    };
  }

  static fromJSON(data) {
    return new HoumonSchedule(data);
  }
}
