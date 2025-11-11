/**
 * 小規模多機能利用調整システム - ExcelService
 * ExcelファイルとScheduleCalendarの相互変換を行うサービスクラス
 * SheetJSライブラリを使用
 */

class ExcelService {
  /**
   * コンストラクタ
   */
  constructor() {
    // 依存関係チェック
    if (typeof window.XLSX === 'undefined') {
      throw new Error('ExcelService requires XLSX library (SheetJS)');
    }
    if (typeof window.Logger === 'undefined') {
      throw new Error('ExcelService requires Logger');
    }
    if (typeof window.User === 'undefined') {
      throw new Error('ExcelService requires User model');
    }
    if (typeof window.ScheduleCell === 'undefined') {
      throw new Error('ExcelService requires ScheduleCell model');
    }
    if (typeof window.ScheduleCalendar === 'undefined') {
      throw new Error('ExcelService requires ScheduleCalendar model');
    }
    if (typeof window.DateUtils === 'undefined') {
      throw new Error('ExcelService requires DateUtils');
    }
    if (typeof window.IdGenerator === 'undefined') {
      throw new Error('ExcelService requires IdGenerator');
    }

    window.Logger.debug('ExcelService initialized');
  }

  /**
   * FileオブジェクトからWorkbookを読み込み
   * @param {File} file - Excelファイル
   * @returns {Promise<Workbook>} Workbookオブジェクト
   */
  readFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('File is required'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = window.XLSX.read(data, { type: 'array' });
          window.Logger?.info(`Excel file loaded: ${file.name}`, {
            sheets: workbook.SheetNames.length,
            sheetNames: workbook.SheetNames
          });
          resolve(workbook);
        } catch (error) {
          window.Logger?.error('Failed to read Excel file:', error);
          reject(error);
        }
      };

      reader.onerror = () => {
        const error = new Error('Failed to read file');
        window.Logger?.error('FileReader error:', error);
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 現行フォーマットのExcelをパース
   * @param {Workbook} workbook - Workbookオブジェクト
   * @returns {Object} { users: User[], calendars: Map<userId, ScheduleCalendar> }
   */
  parseCurrentFormat(workbook) {
    try {
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const users = [];
      const calendars = new Map();

      window.Logger?.debug('Parsing current format Excel');

      // yearMonthをA2セルから取得（例: "2025年12月"）
      const yearMonthStr = this.getCellValue(sheet, 'A2');
      const yearMonth = this.parseYearMonth(yearMonthStr);

      if (!yearMonth) {
        throw new Error(`Invalid year/month format in A2: ${yearMonthStr}`);
      }

      window.Logger?.debug(`Parsing data for: ${yearMonth}`);

      // 月の日付リストを取得
      const dates = window.DateUtils.getMonthDates(yearMonth);

      let row = 7; // 利用者データ開始行
      let userCount = 0;

      while (userCount < 50) { // 最大50人まで処理（無限ループ防止）
        // 利用者名（A列）
        const userName = this.getCellValue(sheet, `A${row}`);
        if (!userName || userName.toString().trim() === '') {
          break; // データ終了
        }

        try {
          // Userオブジェクト作成
          const userId = window.IdGenerator.generate('user');
          const user = new window.User({
            id: userId,
            name: userName.toString().trim(),
            registrationDate: new Date()
          });
          users.push(user);
          userCount++;

          window.Logger?.debug(`Processing user: ${userName} (${userId})`);

          // ScheduleCalendar作成
          const calendar = new window.ScheduleCalendar(userId, yearMonth);

          // 通泊行（現在の行）
          const dayStayRow = row;
          // 訪問行（次の行）
          const visitRow = row + 1;

          // E列から日付データを読み取り（1日〜末日）
          dates.forEach((date, index) => {
            const colIndex = 4 + index; // E列=4, F列=5...
            const colLetter = this.getColumnLetter(colIndex);

            // 通泊セル
            const dayStayValue = this.getCellValue(sheet, `${colLetter}${dayStayRow}`);
            if (dayStayValue && dayStayValue.toString().trim() !== '') {
              const cell = new window.ScheduleCell({
                userId,
                date: new Date(date),
                cellType: 'dayStay',
                inputValue: dayStayValue.toString().trim()
              });
              calendar.setCell(cell);
            }

            // 訪問セル
            const visitValue = this.getCellValue(sheet, `${colLetter}${visitRow}`);
            if (visitValue && visitValue.toString().trim() !== '') {
              const cell = new window.ScheduleCell({
                userId,
                date: new Date(date),
                cellType: 'visit',
                inputValue: visitValue.toString().trim()
              });
              calendar.setCell(cell);
            }
          });

          // StayPeriods計算
          calendar.calculateStayPeriods();
          calendar.calculateAllFlags();

          calendars.set(userId, calendar);

          // 次の利用者（2行スキップ）
          row += 2;
        } catch (error) {
          window.Logger?.warn(`Failed to process user at row ${row}:`, error);
          row += 2; // 次の利用者に進む
        }
      }

      window.Logger?.info(`Parsed ${users.length} users from Excel`, {
        yearMonth,
        totalCalendars: calendars.size
      });

      return { users, calendars };
    } catch (error) {
      window.Logger?.error('Failed to parse current format Excel:', error);
      throw error;
    }
  }

  /**
   * ScheduleCalendarから現行フォーマットのExcelを生成
   * @param {string} yearMonth - 年月（"YYYY-MM"形式）
   * @param {Map<string, ScheduleCalendar>} calendars - カレンダーマップ
   * @param {User[]} users - 利用者配列
   * @returns {Workbook} Workbookオブジェクト
   */
  generateCurrentFormat(yearMonth, calendars, users) {
    try {
      window.Logger?.debug(`Generating Excel for ${yearMonth}`);

      const wb = window.XLSX.utils.book_new();
      const ws = {};

      // ヘッダー設定
      this.setCellValue(ws, 'A1', '小規模多機能型居宅介護事業所');
      this.setCellValue(ws, 'A2', this.formatYearMonth(yearMonth));
      this.setCellValue(ws, 'A3', '利用者名');
      this.setCellValue(ws, 'C3', '通泊');
      this.setCellValue(ws, 'C4', '訪問');

      // 日付ヘッダー（E列から）
      const dates = window.DateUtils.getMonthDates(yearMonth);
      dates.forEach((date, index) => {
        const colIndex = 4 + index; // E列=4, F列=5...
        const colLetter = this.getColumnLetter(colIndex);
        const day = date.getDate();
        this.setCellValue(ws, `${colLetter}3`, day);
      });

      // 利用者データ
      let row = 7;
      users.forEach(user => {
        const calendar = calendars.get(user.id);
        if (!calendar) {
          return;
        }

        // 利用者名
        this.setCellValue(ws, `A${row}`, user.name);
        this.setCellValue(ws, `A${row + 1}`, '');

        // 通泊行とサービス行
        this.setCellValue(ws, `C${row}`, '通泊');
        this.setCellValue(ws, `C${row + 1}`, '訪問');

        // 各日のデータ
        dates.forEach((date, index) => {
          const colIndex = 4 + index;
          const colLetter = this.getColumnLetter(colIndex);

          // 通泊セル
          const dayStayCell = calendar.getCell(date, 'dayStay');
          if (dayStayCell) {
            this.setCellValue(ws, `${colLetter}${row}`, dayStayCell.inputValue || '');
          }

          // 訪問セル
          const visitCell = calendar.getCell(date, 'visit');
          if (visitCell) {
            this.setCellValue(ws, `${colLetter}${row + 1}`, visitCell.inputValue || '');
          }
        });

        row += 2;
      });

      // ワークシートの範囲を設定
      const lastCol = this.getColumnLetter(4 + dates.length - 1);
      const lastRow = Math.max(7 + users.length * 2, 10);
      ws['!ref'] = `A1:${lastCol}${lastRow}`;

      // ワークシートをワークブックに追加
      window.XLSX.utils.book_append_sheet(wb, ws, yearMonth);

      window.Logger?.info(`Excel generated for ${yearMonth}`, {
        users: users.length,
        sheets: wb.SheetNames.length
      });

      return wb;
    } catch (error) {
      window.Logger?.error('Failed to generate Excel:', error);
      throw error;
    }
  }

  /**
   * WorkbookをBlob化してダウンロード
   * @param {Workbook} workbook - Workbookオブジェクト
   * @param {string} filename - ファイル名
   */
  downloadFile(workbook, filename) {
    try {
      const wbout = window.XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array' 
      });

      const blob = new Blob([wbout], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // ダウンロード
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'schedule.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      window.Logger?.info(`File downloaded: ${filename}`);
    } catch (error) {
      window.Logger?.error('Failed to download file:', error);
      throw error;
    }
  }

  /**
   * セルの値を取得
   * @param {Worksheet} sheet - ワークシート
   * @param {string} cellAddress - セルアドレス（例: "A1"）
   * @returns {any} セルの値
   */
  getCellValue(sheet, cellAddress) {
    const cell = sheet[cellAddress];
    return cell ? cell.v : null;
  }

  /**
   * セルに値を設定
   * @param {Worksheet} sheet - ワークシート
   * @param {string} cellAddress - セルアドレス（例: "A1"）
   * @param {any} value - 設定する値
   */
  setCellValue(sheet, cellAddress, value) {
    if (!sheet[cellAddress]) {
      sheet[cellAddress] = {};
    }
    sheet[cellAddress].v = value;
    sheet[cellAddress].t = typeof value === 'number' ? 'n' : 's';
  }

  /**
   * セルに書式を設定
   * @param {Worksheet} sheet - ワークシート
   * @param {string} cellAddress - セルアドレス（例: "A1"）
   * @param {Object} style - スタイルオブジェクト
   */
  applyCellStyle(sheet, cellAddress, style) {
    if (!sheet[cellAddress]) {
      sheet[cellAddress] = {};
    }
    sheet[cellAddress].s = style;
  }

  /**
   * 列インデックスから列文字を取得
   * @param {number} colIndex - 列インデックス（0ベース）
   * @returns {string} 列文字（例: "A", "B", "AA"）
   */
  getColumnLetter(colIndex) {
    let letter = '';
    while (colIndex >= 0) {
      letter = String.fromCharCode(65 + (colIndex % 26)) + letter;
      colIndex = Math.floor(colIndex / 26) - 1;
    }
    return letter;
  }

  /**
   * 年月文字列をパース
   * @param {string} yearMonthStr - 年月文字列（例: "2025年12月"）
   * @returns {string|null} "YYYY-MM"形式の文字列またはnull
   */
  parseYearMonth(yearMonthStr) {
    if (!yearMonthStr) {
      return null;
    }

    const str = yearMonthStr.toString();
    
    // "2025年12月"形式
    const match1 = str.match(/(\d{4})年(\d{1,2})月/);
    if (match1) {
      const year = match1[1];
      const month = match1[2].padStart(2, '0');
      return `${year}-${month}`;
    }

    // "2025-12"形式
    const match2 = str.match(/^(\d{4})-(\d{2})$/);
    if (match2) {
      return str;
    }

    return null;
  }

  /**
   * 年月を表示用文字列に変換
   * @param {string} yearMonth - "YYYY-MM"形式の文字列
   * @returns {string} 表示用文字列（例: "2025年12月"）
   */
  formatYearMonth(yearMonth) {
    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      return yearMonth;
    }

    const [year, month] = yearMonth.split('-');
    return `${year}年${parseInt(month, 10)}月`;
  }

  /**
   * ワークシートの範囲を取得
   * @param {Worksheet} sheet - ワークシート
   * @returns {Object} 範囲情報
   */
  getSheetRange(sheet) {
    const range = window.XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
    return {
      startRow: range.s.r,
      endRow: range.e.r,
      startCol: range.s.c,
      endCol: range.e.c,
      rowCount: range.e.r - range.s.r + 1,
      colCount: range.e.c - range.s.c + 1
    };
  }

  /**
   * シートから範囲データを配列として取得
   * @param {Worksheet} sheet - ワークシート
   * @param {string} range - 範囲（例: "A1:C10"）
   * @returns {Array[]} 2次元配列
   */
  getSheetArrayData(sheet, range) {
    try {
      return window.XLSX.utils.sheet_to_json(sheet, {
        range: range,
        header: 1,
        defval: null
      });
    } catch (error) {
      window.Logger?.error('Failed to get sheet array data:', error);
      return [];
    }
  }

  /**
   * デバッグ情報を出力
   * @param {Workbook} workbook - Workbookオブジェクト
   */
  debug(workbook) {
    if (!workbook) {
      window.Logger?.info('ExcelService Debug: No workbook provided');
      return;
    }

    window.Logger?.group('ExcelService Debug Info');
    window.Logger?.info('Workbook Info:', {
      sheets: workbook.SheetNames.length,
      sheetNames: workbook.SheetNames
    });

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const range = this.getSheetRange(sheet);
      
      window.Logger?.info(`Sheet: ${sheetName}`, {
        range: sheet['!ref'],
        dimensions: `${range.rowCount} x ${range.colCount}`,
        cellCount: range.rowCount * range.colCount
      });

      // 最初の数行をサンプル表示
      const sampleData = this.getSheetArrayData(sheet, `A1:${this.getColumnLetter(Math.min(range.endCol, 9))}${Math.min(range.endRow + 1, 10)}`);
      if (sampleData.length > 0) {
        window.Logger?.table(sampleData);
      }
    });

    window.Logger?.groupEnd();
  }

  /**
   * Excelファイルのバリデーション
   * @param {Workbook} workbook - Workbookオブジェクト
   * @returns {Object} バリデーション結果
   */
  validateCurrentFormat(workbook) {
    const result = {
      isValid: false,
      errors: [],
      warnings: [],
      info: {}
    };

    try {
      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        result.errors.push('No sheets found in workbook');
        return result;
      }

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const range = this.getSheetRange(sheet);

      result.info.sheetName = workbook.SheetNames[0];
      result.info.range = range;

      // A2セルの年月チェック
      const yearMonthStr = this.getCellValue(sheet, 'A2');
      const yearMonth = this.parseYearMonth(yearMonthStr);
      
      if (!yearMonth) {
        result.errors.push(`Invalid year/month in A2: ${yearMonthStr}`);
      } else {
        result.info.yearMonth = yearMonth;
      }

      // 利用者データの存在チェック
      let userCount = 0;
      let row = 7;
      
      while (row <= range.endRow && userCount < 50) {
        const userName = this.getCellValue(sheet, `A${row}`);
        if (!userName || userName.toString().trim() === '') {
          break;
        }
        userCount++;
        row += 2;
      }

      result.info.userCount = userCount;

      if (userCount === 0) {
        result.errors.push('No user data found (starting from row 7)');
      }

      // バリデーション結果の判定
      result.isValid = result.errors.length === 0;

      if (result.isValid) {
        window.Logger?.info('Excel format validation passed', result.info);
      } else {
        window.Logger?.warn('Excel format validation failed', result);
      }

    } catch (error) {
      result.errors.push(`Validation error: ${error.message}`);
      window.Logger?.error('Excel validation error:', error);
    }

    return result;
  }
}

// グローバルに登録
window.ExcelService = ExcelService;