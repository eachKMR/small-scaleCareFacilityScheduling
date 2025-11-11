/**
 * 小規模多機能利用調整システム - ExcelController
 * Excel入出力を管理するコントローラークラス
 */

class ExcelController {
  /**
   * コンストラクタ
   * @param {ExcelService} excelService - Excelサービス
   * @param {ScheduleController} scheduleController - スケジュールコントローラー
   */
  constructor(excelService, scheduleController) {
    // 依存関係チェック
    if (typeof window.Logger === 'undefined') {
      throw new Error('ExcelController requires Logger');
    }
    if (typeof window.ExcelService === 'undefined') {
      throw new Error('ExcelController requires ExcelService');
    }
    if (typeof window.ScheduleController === 'undefined') {
      throw new Error('ExcelController requires ScheduleController');
    }

    this.excelService = excelService;
    this.scheduleController = scheduleController;

    window.Logger?.info('ExcelController initialized');
  }

  /**
   * Fileオブジェクトから予定をインポート
   * @param {File} file - Excelファイル
   * @returns {Promise<boolean>} 成功かどうか
   */
  async importFromExcel(file) {
    try {
      window.Logger?.info('Importing from Excel:', file.name);

      // ファイル拡張子チェック
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        throw new Error('Unsupported file format. Please use Excel files (.xlsx, .xls)');
      }

      // ファイルサイズチェック（10MB制限）
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Please use files smaller than 10MB');
      }

      // Workbook読み込み
      const workbook = await this.excelService.readFile(file);

      // フォーマット検証
      const validation = this.excelService.validateCurrentFormat(workbook);
      if (!validation.isValid) {
        window.Logger?.warn('Excel format validation warnings:', validation.errors);
        // 警告があっても処理を続行（完全でない場合もあるため）
      }

      // パース
      const { users, calendars } = this.excelService.parseCurrentFormat(workbook);

      if (!users || users.length === 0) {
        throw new Error('No users found in Excel file. Please check the file format.');
      }

      if (!calendars || calendars.size === 0) {
        throw new Error('No schedule data found in Excel file. Please check the file format.');
      }

      window.Logger?.info('Parsed data:', {
        users: users.length,
        calendars: calendars.size,
        yearMonth: validation.info?.yearMonth
      });

      // 現在の年月を設定（Excelから取得できた場合）
      if (validation.info?.yearMonth) {
        this.scheduleController.currentYearMonth = validation.info.yearMonth;
      }

      // scheduleControllerに反映
      this.scheduleController.users = users;
      this.scheduleController.calendars = calendars;

      // 保存
      this.scheduleController.saveUsers();
      this.scheduleController.saveSchedule();

      // イベント発火
      this.scheduleController.emit('scheduleLoaded', { 
        yearMonth: this.scheduleController.currentYearMonth,
        source: 'excel-import'
      });

      window.Logger?.info('Excel import completed successfully');
      return true;

    } catch (error) {
      window.Logger?.error('Failed to import from Excel:', error);
      
      // エラー詳細を返す
      const errorDetail = {
        message: error.message,
        fileName: file?.name,
        fileSize: file?.size,
        timestamp: new Date().toISOString()
      };

      throw new Error(`Excel import failed: ${error.message}`);
    }
  }

  /**
   * 現在の予定をExcelファイルとしてダウンロード
   * @param {string} customFileName - カスタムファイル名（省略可）
   * @returns {boolean} 成功かどうか
   */
  exportToExcel(customFileName = null) {
    try {
      window.Logger?.info('Exporting to Excel');

      const yearMonth = this.scheduleController.getCurrentYearMonth();
      const calendars = this.scheduleController.calendars;
      const users = this.scheduleController.users;

      if (!yearMonth) {
        throw new Error('No current year-month set. Please load a schedule first.');
      }

      if (!calendars || calendars.size === 0) {
        throw new Error('No schedule data to export. Please create some schedule data first.');
      }

      if (!users || users.length === 0) {
        throw new Error('No users to export. Please add users first.');
      }

      // Workbook生成
      const workbook = this.excelService.generateCurrentFormat(
        yearMonth,
        calendars,
        users
      );

      // ファイル名生成
      let filename;
      if (customFileName) {
        filename = customFileName.endsWith('.xlsx') ? customFileName : `${customFileName}.xlsx`;
      } else {
        const yearMonthDisplay = this.excelService.formatYearMonth(yearMonth);
        filename = `利用予定表_${yearMonthDisplay}.xlsx`;
      }

      // ダウンロード
      this.excelService.downloadFile(workbook, filename);

      window.Logger?.info('Excel export completed:', filename);
      return true;

    } catch (error) {
      window.Logger?.error('Failed to export to Excel:', error);
      throw new Error(`Excel export failed: ${error.message}`);
    }
  }

  /**
   * テンプレートExcelファイルを生成・ダウンロード
   * @param {string} yearMonth - 年月（"YYYY-MM"形式）
   * @param {User[]} users - 利用者配列（省略時は現在の利用者）
   * @returns {boolean} 成功かどうか
   */
  exportTemplate(yearMonth = null, users = null) {
    try {
      window.Logger?.info('Exporting Excel template');

      const targetYearMonth = yearMonth || this.scheduleController.getCurrentYearMonth();
      const targetUsers = users || this.scheduleController.users;

      if (!targetYearMonth) {
        throw new Error('Year-month is required for template generation');
      }

      if (!targetUsers || targetUsers.length === 0) {
        throw new Error('Users are required for template generation');
      }

      // 空のカレンダーマップを作成
      const emptyCalendars = new Map();
      targetUsers.forEach(user => {
        const calendar = new window.ScheduleCalendar(user.id, targetYearMonth);
        emptyCalendars.set(user.id, calendar);
      });

      // Workbook生成
      const workbook = this.excelService.generateCurrentFormat(
        targetYearMonth,
        emptyCalendars,
        targetUsers
      );

      // ファイル名生成
      const yearMonthDisplay = this.excelService.formatYearMonth(targetYearMonth);
      const filename = `利用予定表_テンプレート_${yearMonthDisplay}.xlsx`;

      // ダウンロード
      this.excelService.downloadFile(workbook, filename);

      window.Logger?.info('Excel template export completed:', filename);
      return true;

    } catch (error) {
      window.Logger?.error('Failed to export Excel template:', error);
      throw new Error(`Excel template export failed: ${error.message}`);
    }
  }

  /**
   * インポート処理の詳細結果を取得
   * @param {File} file - Excelファイル
   * @returns {Promise<Object>} インポート詳細結果
   */
  async analyzeExcelFile(file) {
    try {
      window.Logger?.info('Analyzing Excel file:', file.name);

      // Workbook読み込み
      const workbook = await this.excelService.readFile(file);

      // バリデーション
      const validation = this.excelService.validateCurrentFormat(workbook);

      // パース（エラーがあっても実行）
      let parseResult = null;
      try {
        parseResult = this.excelService.parseCurrentFormat(workbook);
      } catch (parseError) {
        window.Logger?.warn('Parse failed during analysis:', parseError);
      }

      const analysis = {
        fileName: file.name,
        fileSize: file.size,
        lastModified: new Date(file.lastModified).toISOString(),
        validation,
        sheets: workbook.SheetNames,
        data: parseResult ? {
          userCount: parseResult.users?.length || 0,
          calendarCount: parseResult.calendars?.size || 0,
          userNames: parseResult.users?.map(u => u.name).slice(0, 10) || [], // 最初の10人
          yearMonth: validation.info?.yearMonth
        } : null,
        recommendations: []
      };

      // 推奨事項の生成
      if (!validation.isValid) {
        analysis.recommendations.push('ファイル形式に問題があります。テンプレートファイルを使用することをお勧めします。');
      }

      if (analysis.data && analysis.data.userCount === 0) {
        analysis.recommendations.push('利用者データが見つかりません。A列に利用者名が正しく入力されているか確認してください。');
      }

      if (analysis.data && analysis.data.userCount > 0 && analysis.data.calendarCount === 0) {
        analysis.recommendations.push('スケジュールデータが見つかりません。各利用者の行に予定データが入力されているか確認してください。');
      }

      window.Logger?.info('Excel file analysis completed');
      return analysis;

    } catch (error) {
      window.Logger?.error('Failed to analyze Excel file:', error);
      return {
        fileName: file.name,
        fileSize: file.size,
        error: error.message,
        validation: { isValid: false, errors: [error.message] },
        recommendations: ['ファイルの読み込みに失敗しました。ファイルが破損していないか確認してください。']
      };
    }
  }

  /**
   * インポート履歴を取得
   * @returns {Array} インポート履歴
   */
  getImportHistory() {
    try {
      const history = JSON.parse(localStorage.getItem('excel_import_history') || '[]');
      return history.slice(0, 10); // 最新10件
    } catch (error) {
      window.Logger?.error('Failed to get import history:', error);
      return [];
    }
  }

  /**
   * インポート履歴に記録を追加
   * @param {Object} record - インポート記録
   * @private
   */
  _addImportHistory(record) {
    try {
      const history = this.getImportHistory();
      
      const newRecord = {
        ...record,
        timestamp: new Date().toISOString(),
        id: window.IdGenerator?.generate('import') || Date.now().toString()
      };

      history.unshift(newRecord);
      
      // 最新20件まで保持
      const trimmedHistory = history.slice(0, 20);
      
      localStorage.setItem('excel_import_history', JSON.stringify(trimmedHistory));
    } catch (error) {
      window.Logger?.error('Failed to add import history:', error);
    }
  }

  /**
   * バッチインポート（複数ファイル）
   * @param {FileList} files - ファイルリスト
   * @returns {Promise<Object>} バッチインポート結果
   */
  async batchImport(files) {
    const results = {
      total: files.length,
      successful: 0,
      failed: 0,
      details: []
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const success = await this.importFromExcel(file);
        
        if (success) {
          results.successful++;
          results.details.push({
            fileName: file.name,
            status: 'success',
            message: 'Import completed successfully'
          });
        } else {
          results.failed++;
          results.details.push({
            fileName: file.name,
            status: 'failed',
            message: 'Import failed'
          });
        }
      } catch (error) {
        results.failed++;
        results.details.push({
          fileName: file.name,
          status: 'error',
          message: error.message
        });
      }
    }

    window.Logger?.info('Batch import completed:', results);
    return results;
  }

  /**
   * デバッグ情報を出力
   */
  debug() {
    window.Logger?.group('ExcelController Debug Info');
    
    const currentYearMonth = this.scheduleController.getCurrentYearMonth();
    const userCount = this.scheduleController.users.length;
    const calendarCount = this.scheduleController.calendars.size;
    const importHistory = this.getImportHistory();

    window.Logger?.info('Current State:', {
      yearMonth: currentYearMonth,
      users: userCount,
      calendars: calendarCount,
      canExport: !!(currentYearMonth && userCount > 0 && calendarCount > 0)
    });

    window.Logger?.info('Import History:', importHistory.length);
    
    if (importHistory.length > 0) {
      const recentImports = importHistory.slice(0, 3).map(record => ({
        fileName: record.fileName,
        timestamp: record.timestamp,
        success: record.success
      }));
      window.Logger?.table(recentImports);
    }

    // Excel Service状態
    window.Logger?.info('Excel Service Available:', typeof this.excelService !== 'undefined');
    window.Logger?.info('XLSX Library Available:', typeof window.XLSX !== 'undefined');

    window.Logger?.groupEnd();
  }
}

// グローバルに登録
window.ExcelController = ExcelController;