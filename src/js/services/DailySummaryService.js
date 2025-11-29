/**
 * 日別サマリーの計算サービス
 * @version 1.0
 * @see L3_UI_日別サマリー設計.md
 */
export class DailySummaryService {
  /**
   * 指定日の通いセクションの日別サマリーを計算
   * 
   * @param {KayoiSchedule[]} schedules - 通いの全予定データ
   * @param {string} date - 対象日付（"YYYY-MM-DD"）
   * @returns {Object} サマリーデータ
   * 
   * @example
   * const summary = DailySummaryService.calculateKayoiDailySummary(schedules, '2025-11-25');
   * // { kayoi: 12, zenhan: 12, kohan: 10, pickup: 8, dropoff: 9 }
   */
  static calculateKayoiDailySummary(schedules, date) {
    // 指定日の予定のみをフィルタ
    const dateSchedules = schedules.filter(s => s.date === date);
    
    // 前半の人数（前半 + 終日）
    const zenhanCount = dateSchedules.filter(
      s => s.section === "前半" || s.section === "終日"
    ).length;
    
    // 後半の人数（後半 + 終日）
    const kohanCount = dateSchedules.filter(
      s => s.section === "後半" || s.section === "終日"
    ).length;
    
    // 通い人数 = 前半と後半の最大値
    // 理由: 同じ利用者が前半と後半で重複カウントされないようにするため
    const kayoiCount = Math.max(zenhanCount, kohanCount);
    
    // 送迎人数（職員送迎のみカウント）
    const pickupCount = dateSchedules.filter(
      s => s.pickupType === "staff"
    ).length;
    
    const dropoffCount = dateSchedules.filter(
      s => s.dropoffType === "staff"
    ).length;
    
    return {
      kayoi: kayoiCount,    // 通い人数（前半・後半の最大値）
      zenhan: zenhanCount,  // 前半人数
      kohan: kohanCount,    // 後半人数
      pickup: pickupCount,  // 迎え人数（職員送迎のみ）
      dropoff: dropoffCount // 送り人数（職員送迎のみ）
    };
  }
  
  /**
   * 月全体の日別サマリーを計算
   * 
   * @param {KayoiSchedule[]} schedules - 通いの全予定データ
   * @param {number} year - 年
   * @param {number} month - 月（1-12）
   * @returns {Map<string, Object>} 日付をキーとしたサマリーのMap
   * 
   * @example
   * const summaryMap = DailySummaryService.calculateKayoiMonthlySummary(schedules, 2025, 11);
   * summaryMap.get('2025-11-25'); // { kayoi: 12, zenhan: 12, kohan: 10, ... }
   */
  static calculateKayoiMonthlySummary(schedules, year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const summaryMap = new Map();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const summary = this.calculateKayoiDailySummary(schedules, date);
      summaryMap.set(date, summary);
    }
    
    return summaryMap;
  }
  
  /**
   * 定員状況のCSSクラス名を取得
   * 
   * @param {number} count - 人数
   * @param {number} capacity - 定員（デフォルト: 15人）
   * @returns {string} CSSクラス名
   * 
   * @example
   * DailySummaryService.getCapacityClass(16); // "over-capacity"
   * DailySummaryService.getCapacityClass(15); // "at-capacity"
   * DailySummaryService.getCapacityClass(14); // "near-capacity"
   * DailySummaryService.getCapacityClass(12); // ""
   */
  static getCapacityClass(count, capacity = 15) {
    if (count > capacity) {
      return 'over-capacity';  // 赤色
    } else if (count === capacity) {
      return 'at-capacity';    // 黄色（濃い）
    } else if (count >= capacity - 1) {
      return 'near-capacity';  // 黄色（薄い）
    }
    return '';
  }
}
