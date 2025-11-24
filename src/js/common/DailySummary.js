/**
 * DailySummary.js
 * 日別サマリー機能（L3_UI_統合UI設計.md v2.1準拠）
 */

/**
 * 日別サマリーのデータを生成するクラス
 */
export class DailySummaryGenerator {
  /**
   * 各セクションのデータから日別サマリーを生成
   * @param {Array} kayoiData - 通いのスケジュールデータ
   * @param {Array} tomariData - 泊まりのデータ
   * @param {Array} houmonData - 訪問のデータ
   * @param {string} yearMonth - 対象年月 (YYYY-MM形式)
   * @returns {Object} 日別サマリーデータ
   */
  static generate(kayoiData, tomariData, houmonData, yearMonth) {
    const daysInMonth = this.getDaysInMonth(yearMonth);
    const summary = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;
      
      const kayoiMorning = this.countKayoi(kayoiData, dateStr, 'morning');
      const kayoiAfternoon = this.countKayoi(kayoiData, dateStr, 'afternoon');
      
      summary[dateStr] = {
        kayoiMorning: kayoiMorning,
        kayoiAfternoon: kayoiAfternoon,
        kayoiMax: Math.max(kayoiMorning, kayoiAfternoon), // 表示用：大きい方
        tomari: this.countTomari(tomariData, dateStr),
        houmon: this.countHoumon(houmonData, dateStr)
      };
    }
    
    return summary;
  }
  
  /**
   * 通いの人数をカウント
   * @param {Array} kayoiData - 通いのスケジュールデータ
   * @param {string} date - 日付 (YYYY-MM-DD形式)
   * @param {string} section - 'morning' または 'afternoon'
   * @returns {number} 人数
   */
  static countKayoi(kayoiData, date, section) {
    if (!Array.isArray(kayoiData)) return 0;
    
    return kayoiData.filter(schedule => {
      // 日付が一致し、該当セクションまたは1日利用の場合をカウント
      return schedule.date === date && (
        schedule.section === section || schedule.section === 'allDay'
      );
    }).length;
  }
  
  /**
   * 泊まりの人数をカウント
   * @param {Array} tomariData - 泊まりのデータ
   * @param {string} date - 日付 (YYYY-MM-DD形式)
   * @returns {number} 人数
   */
  static countTomari(tomariData, date) {
    if (!Array.isArray(tomariData)) return 0;
    
    return tomariData.filter(stay => {
      const startDate = stay.startDate;
      const endDate = stay.endDate;
      return date >= startDate && date <= endDate;
    }).length;
  }
  
  /**
   * 訪問の回数をカウント
   * @param {Array} houmonData - 訪問のデータ
   * @param {string} date - 日付 (YYYY-MM-DD形式)
   * @returns {number} 回数
   */
  static countHoumon(houmonData, date) {
    if (!Array.isArray(houmonData)) return 0;
    
    return houmonData.filter(visit => visit.date === date).length;
  }
  
  /**
   * 月の日数を取得
   * @param {string} yearMonth - 年月 (YYYY-MM形式)
   * @returns {number} 日数
   */
  static getDaysInMonth(yearMonth) {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }
}

/**
 * 日別サマリーをUIに描画するクラス
 */
export class DailySummaryRenderer {
  /**
   * サマリーを描画
   * @param {Object} summary - 日別サマリーデータ
   * @param {string} yearMonth - 対象年月 (YYYY-MM形式)
   */
  static render(summary, yearMonth) {
    const tableBody = document.querySelector('#summary-tbody');
    if (!tableBody) {
      console.error('summary-tbody要素が見つかりません');
      return;
    }
    
    // 既存の内容をクリア
    tableBody.innerHTML = '';
    
    // 通いの行（max値を表示、data属性に前半・後半を保持）
    const kayoiRow = this.createKayoiRow(summary);
    tableBody.appendChild(kayoiRow);
    
    // 泊まりの行
    const tomariRow = this.createRow('泊まり', summary, 'tomari', 9);
    tableBody.appendChild(tomariRow);
    
    // 訪問の行
    const houmonRow = this.createRow('訪問', summary, 'houmon', null);
    tableBody.appendChild(houmonRow);
  }
  
  /**
   * 通いの行を作成（max値表示、data属性に詳細保持）
   * @param {Object} summary - 日別サマリーデータ
   * @returns {HTMLTableRowElement} 行要素
   */
  static createKayoiRow(summary) {
    const tr = document.createElement('tr');
    tr.className = 'summary-row';
    
    // ラベルセル
    const labelCell = document.createElement('td');
    labelCell.className = 'summary-label';
    labelCell.textContent = '通い';
    tr.appendChild(labelCell);
    
    // 日付ごとのセル
    Object.entries(summary).forEach(([date, data]) => {
      const cell = document.createElement('td');
      cell.className = 'summary-cell';
      cell.dataset.date = date;
      cell.dataset.morning = data.kayoiMorning;   // data属性に保持
      cell.dataset.afternoon = data.kayoiAfternoon; // data属性に保持
      cell.textContent = data.kayoiMax; // max値を表示
      
      // 定員状況の色分け（max値で判定、定員15人）
      const ratio = data.kayoiMax / 15;
      if (ratio >= 1) {
        cell.classList.add('full');
      } else if (ratio >= 0.8) {
        cell.classList.add('warning');
      } else {
        cell.classList.add('normal');
      }
      
      tr.appendChild(cell);
    });
    
    return tr;
  }
  
  /**
   * 行を作成
   * @param {string} label - ラベル
   * @param {Object} summary - 日別サマリーデータ
   * @param {string} key - データキー
   * @param {number|null} capacity - 定員
   * @returns {HTMLTableRowElement} 行要素
   */
  static createRow(label, summary, key, capacity) {
    const tr = document.createElement('tr');
    tr.className = 'summary-row';
    
    // ラベルセル
    const labelCell = document.createElement('td');
    labelCell.className = 'summary-label';
    labelCell.textContent = label;
    tr.appendChild(labelCell);
    
    // 日付ごとのセル
    Object.entries(summary).forEach(([date, data]) => {
      const cell = document.createElement('td');
      cell.className = 'summary-cell';
      cell.dataset.date = date;
      cell.textContent = data[key];
      
      // 定員状況の色分け
      if (capacity) {
        const ratio = data[key] / capacity;
        if (ratio >= 1) {
          cell.classList.add('full');
        } else if (ratio >= 0.8) {
          cell.classList.add('warning');
        } else {
          cell.classList.add('normal');
        }
      }
      
      tr.appendChild(cell);
    });
    
    return tr;
  }
}

/**
 * カレンダー見出しを描画するクラス
 */
export class CalendarHeaderRenderer {
  /**
   * カレンダー見出しを描画
   * @param {string} yearMonth - 対象年月 (YYYY-MM形式)
   */
  static render(yearMonth) {
    const headerRow = document.querySelector('#calendar-header-row');
    if (!headerRow) {
      console.error('calendar-header-row要素が見つかりません');
      return;
    }
    
    // 既存の内容をクリア（ラベルセルを除く）
    while (headerRow.children.length > 1) {
      headerRow.removeChild(headerRow.lastChild);
    }
    
    const [year, month] = yearMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // 曜日名
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const dayClasses = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      
      const th = document.createElement('th');
      th.className = 'date-header';
      th.dataset.date = dateStr;
      
      const dateDiv = document.createElement('div');
      dateDiv.className = 'date';
      dateDiv.textContent = day;
      
      const dayDiv = document.createElement('div');
      dayDiv.className = `day ${dayClasses[dayOfWeek]}`;
      dayDiv.textContent = dayNames[dayOfWeek];
      
      th.appendChild(dateDiv);
      th.appendChild(dayDiv);
      headerRow.appendChild(th);
    }
  }
}
