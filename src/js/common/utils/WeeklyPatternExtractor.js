/**
 * WeeklyPatternExtractor.js
 * CSV行から週間パターンを抽出
 */

export class WeeklyPatternExtractor {
  /**
   * CSV行から週間パターンを抽出
   * @param {string[][]} rows - パース済みCSV
   * @returns {Map<userName, WeeklyPattern>}
   */
  static extract(rows) {
    console.log('WeeklyPatternExtractor.extract() 開始');
    console.log('入力行数:', rows.length);
    
    const userMap = new Map(); // userName → pattern
    let currentUserName = null;
    
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      console.log(`行${rowIndex}:`, row);
      
      if (row.length < 15) {
        console.log(`行${rowIndex}: 列数不足 (${row.length}列) - スキップ`);
        continue;
      }
      
      // 列2: 利用者名
      const userName = row[1].trim();
      console.log(`行${rowIndex}: 利用者名="${userName}"`);
      
      if (userName) {
        currentUserName = userName;
      }
      
      // 利用者名が確定していない場合はスキップ
      if (!currentUserName) {
        console.log(`行${rowIndex}: 利用者名が未確定 - スキップ`);
        continue;
      }
      
      // パターンを初期化
      if (!userMap.has(currentUserName)) {
        console.log(`行${rowIndex}: 新規利用者「${currentUserName}」を初期化`);
        userMap.set(currentUserName, {
          name: currentUserName,
          dayPattern: ['-','-','-','-','-','-','-'],    // 通い
          visitPattern: ['0','0','0','0','0','0','0'],  // 訪問
          stayPattern: ['-','-','-','-','-','-','-']    // 泊まり
        });
      }
      
      const pattern = userMap.get(currentUserName);
      
      // 列5: サービスコード (インデックス4)
      const serviceCode = row[4];
      const serviceType = this.getServiceType(serviceCode);
      console.log(`行${rowIndex}: サービスコード="${serviceCode}", 種別="${serviceType}"`);
      
      // 列6-12: 週間パターン（月〜日）インデックス5-11
      const weekPattern = row.slice(5, 12);
      console.log(`行${rowIndex}: 週間パターン=`, weekPattern);
      
      // サービス種別ごとに統合
      this.mergePattern(pattern, serviceType, weekPattern);
    }
    
    console.log('WeeklyPatternExtractor.extract() 完了, 利用者数:', userMap.size);
    return userMap;
  }
  
  /**
   * サービスコードからサービス種別を取得
   */
  static getServiceType(serviceCode) {
    if (!serviceCode || serviceCode.length < 2) return 'unknown';
    
    const prefix = serviceCode.substring(0, 2);
    
    switch (prefix) {
      case '06': return 'visit';
      case '07': return 'day';
      case '08': return 'stay';
      default: return 'unknown';
    }
  }
  
  /**
   * パターンを統合
   */
  static mergePattern(pattern, serviceType, weekPattern) {
    switch (serviceType) {
      case 'visit':
        // 訪問: 回数を加算
        for (let i = 0; i < 7; i++) {
          const existingCount = parseInt(pattern.visitPattern[i], 10) || 0;
          const newCount = parseInt(weekPattern[i], 10) || 0;
          pattern.visitPattern[i] = String(existingCount + newCount);
        }
        break;
        
      case 'day':
        // 通い: OR結合
        for (let i = 0; i < 7; i++) {
          if (weekPattern[i] === '1') {
            pattern.dayPattern[i] = '1';
          }
        }
        break;
        
      case 'stay':
        // 泊まり: OR結合
        for (let i = 0; i < 7; i++) {
          if (weekPattern[i] === '1') {
            pattern.stayPattern[i] = '1';
          }
        }
        break;
    }
  }
  
  /**
   * パターンサマリーをフォーマット
   */
  static formatPatternSummary(pattern) {
    const parts = [];
    
    // 通い
    const dayDays = this.getDaysFromPattern(pattern.dayPattern);
    if (dayDays.length > 0) {
      parts.push(`${dayDays.join('')}:通い`);
    }
    
    // 訪問
    const visitDays = this.getDaysFromPattern(pattern.visitPattern, true);
    if (visitDays.length > 0) {
      parts.push(`${visitDays.join('')}:訪問`);
    }
    
    // 泊まり
    const stayDays = this.getDaysFromPattern(pattern.stayPattern);
    if (stayDays.length > 0) {
      parts.push(`${stayDays.join('')}:泊まり`);
    }
    
    return parts.join(' ');
  }
  
  /**
   * パターンから曜日を取得
   */
  static getDaysFromPattern(pattern, isVisit = false) {
    const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const value = pattern[i];
      if (isVisit) {
        if (value !== '0' && value !== '-' && value) {
          days.push(dayNames[i]);
        }
      } else {
        if (value === '1') {
          days.push(dayNames[i]);
        }
      }
    }
    
    return days;
  }
}
