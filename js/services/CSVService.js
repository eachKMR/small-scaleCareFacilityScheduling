/**
 * CSVServiceクラス
 * CSV（算定基礎）の読み込みと週間パターン→月間展開を担当
 */
class CSVService {
    /**
     * コンストラクタ
     */
    constructor() {
        this.logger = new Logger('CSVService');
    }

    // ==================== Phase 1-A-1: Shift_JIS読み込み ====================

    /**
     * 複数CSVファイルを読み込んで利用者パターンを抽出
     * @param {FileList|Array<File>} files - CSVファイルリスト（介護.csv, 予防.csv）
     * @returns {Promise<Object>} { users: User[], weeklyPatterns: Map<userId, pattern> }
     */
    async parseCSVFiles(files) {
        try {
            this.logger.info(`Parsing ${files.length} CSV file(s)`);
            
            const allRows = [];
            
            // 各ファイルを読み込み
            for (const file of files) {
                this.logger.debug(`Reading file: ${file.name}`);
                
                const arrayBuffer = await file.arrayBuffer();
                const text = await this._decodeShiftJIS(arrayBuffer);
                
                // 行分割（CRLF/LF対応）
                const lines = text.split(/\r\n|\n/);
                this.logger.debug(`File has ${lines.length} lines`);
                
                // ヘッダー行をスキップして解析
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    const row = this._parseCSVLine(line);
                    if (row && row.length >= 16) {
                        allRows.push(row);
                    }
                }
            }
            
            this.logger.info(`Total rows parsed: ${allRows.length}`);
            
            // 利用者と週間パターンを抽出
            return this._extractUsersAndPatterns(allRows);
            
        } catch (error) {
            this.logger.error('Failed to parse CSV files:', error);
            throw error;
        }
    }

    /**
     * Shift_JISのArrayBufferをデコード
     * @param {ArrayBuffer} arrayBuffer - ファイルのバイナリデータ
     * @returns {Promise<string>} デコードされたテキスト
     */
    async _decodeShiftJIS(arrayBuffer) {
        try {
            // TextDecoderでShift_JISをデコード
            const decoder = new TextDecoder('shift-jis');
            const text = decoder.decode(arrayBuffer);
            return text;
        } catch (error) {
            this.logger.error('Shift_JIS decode failed:', error);
            
            // フォールバック: UTF-8で試行
            try {
                this.logger.warn('Trying UTF-8 as fallback');
                const decoder = new TextDecoder('utf-8');
                return decoder.decode(arrayBuffer);
            } catch (utf8Error) {
                throw new Error('CSVファイルの文字コードがShift_JISまたはUTF-8ではありません');
            }
        }
    }

    /**
     * CSV行をパース
     * @param {string} line - CSV行
     * @returns {Array<string>} 列の配列
     */
    _parseCSVLine(line) {
        const columns = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // エスケープされた引用符
                    current += '"';
                    i++;
                } else {
                    // 引用符の開始/終了
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // 列の区切り
                columns.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        // 最後の列を追加
        columns.push(current);
        
        return columns;
    }

    // ==================== Phase 1-A-2: CSV→週間パターン抽出 ====================

    /**
     * CSV行から利用者と週間パターンを抽出
     * @param {Array<Array<string>>} rows - CSVデータ
     * @returns {Object} { users: User[], weeklyPatterns: Map<userId, pattern> }
     */
    _extractUsersAndPatterns(rows) {
        const userMap = new Map(); // userName → { dayPattern, visitPattern, stayPattern }
        
        for (const row of rows) {
            // CSV列構造（要件定義書_データ管理.md 3.3節）
            const userName = row[1];           // 列2: 利用者名
            const serviceCode = row[4];        // 列5: サービスコード
            const weekPattern = row.slice(9, 16); // 列10-16: 月〜日
            
            if (!userName || !serviceCode) {
                continue;
            }
            
            // 利用者エントリを初期化
            if (!userMap.has(userName)) {
                userMap.set(userName, {
                    name: userName,
                    dayPattern: ['-', '-', '-', '-', '-', '-', '-'],
                    visitPattern: ['0', '0', '0', '0', '0', '0', '0'],
                    stayPattern: ['-', '-', '-', '-', '-', '-', '-']
                });
            }
            
            const pattern = userMap.get(userName);
            
            // サービスコードで分類
            if (serviceCode === '071111') {
                // 通所（通い）
                pattern.dayPattern = weekPattern.map(v => (v === '1' || v === '○') ? '1' : '-');
            } else if (serviceCode === '071121') {
                // 訪問
                pattern.visitPattern = weekPattern.map(v => {
                    const num = parseInt(v, 10);
                    return isNaN(num) ? '0' : String(num);
                });
            } else if (serviceCode === '071131') {
                // 宿泊（泊り）
                pattern.stayPattern = weekPattern.map(v => (v === '1' || v === '○') ? '1' : '-');
            }
        }
        
        this.logger.info(`Extracted ${userMap.size} unique users`);
        
        // User配列を生成
        const users = [];
        const userNames = Array.from(userMap.keys());
        
        // あいうえお順にソート
        userNames.sort((a, b) => a.localeCompare(b, 'ja'));
        
        userNames.forEach((userName, index) => {
            const user = new User({
                id: IdGenerator.userId(index + 1),
                name: userName,
                registrationDate: new Date(),
                sortId: index
            });
            users.push(user);
        });
        
        // 週間パターンMapを作成（userId → pattern）
        const weeklyPatterns = new Map();
        users.forEach(user => {
            const pattern = userMap.get(user.name);
            weeklyPatterns.set(user.id, pattern);
        });
        
        this.logger.info(`Created ${users.length} User objects`);
        
        return { users, weeklyPatterns };
    }

    // ==================== Phase 1-A-3: 週間→月間展開 ====================

    /**
     * 週間パターンを月間スケジュールに展開
     * @param {Map} weeklyPatterns - 週間パターン
     * @param {string} yearMonth - 対象月 (YYYY-MM)
     * @param {User[]} users - 利用者リスト
     * @returns {Map<userId, ScheduleCalendar>} 月間スケジュール
     */
    expandWeeklyToMonthly(weeklyPatterns, yearMonth, users) {
        this.logger.info(`Expanding weekly patterns to monthly for ${yearMonth}`);
        
        const calendars = new Map();
        const [year, month] = yearMonth.split('-').map(Number);
        const daysInMonth = DateUtils.getDaysInMonth(year, month);
        
        for (const user of users) {
            const calendar = new ScheduleCalendar(user.id, yearMonth);
            const pattern = weeklyPatterns.get(user.id);
            
            if (!pattern) {
                this.logger.warn(`No pattern found for user ${user.id}`);
                calendars.set(user.id, calendar);
                continue;
            }
            
            // 各日付に対して処理
            for (let day = 1; day <= daysInMonth; day++) {
                const date = `${yearMonth}-${String(day).padStart(2, '0')}`;
                const dayOfWeek = new Date(year, month - 1, day).getDay(); // 0=日, 1=月, ..., 6=土
                
                // 週間パターンのインデックス（月=0, 火=1, ..., 日=6）
                const patternIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                
                // 通いパターン
                if (pattern.dayPattern[patternIndex] === '1') {
                    calendar.setCell(date, 'am', AppConfig.SYMBOLS.FULL_DAY);
                }
                
                // 訪問パターン
                const visitCount = parseInt(pattern.visitPattern[patternIndex], 10);
                if (visitCount > 0) {
                    calendar.setCell(date, 'visit', String(visitCount));
                }
                
                // 宿泊パターン（仮で「入」を設定、後で調整）
                if (pattern.stayPattern[patternIndex] === '1') {
                    calendar.setCell(date, 'am', AppConfig.SYMBOLS.CHECK_IN);
                }
            }
            
            // 宿泊期間を調整
            this._adjustStayPeriods(calendar);
            
            calendars.set(user.id, calendar);
        }
        
        this.logger.info(`Expanded ${calendars.size} calendars`);
        
        return calendars;
    }

    // ==================== Phase 1-A-4: 宿泊期間調整 ====================

    /**
     * 宿泊期間を調整（入所→退所の連続性を確保）
     * @param {ScheduleCalendar} calendar - カレンダー
     */
    _adjustStayPeriods(calendar) {
        const stayCells = [];
        
        // 「入」が設定されているセルを収集
        for (const [key, cell] of calendar.cells) {
            if (cell.cellType === 'am' && cell.inputValue === AppConfig.SYMBOLS.CHECK_IN) {
                stayCells.push(cell);
            }
        }
        
        // 日付順にソート
        stayCells.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA - dateB;
        });
        
        if (stayCells.length === 0) {
            return;
        }
        
        // 連続する宿泊をグループ化
        const groups = [];
        let currentGroup = [stayCells[0]];
        
        for (let i = 1; i < stayCells.length; i++) {
            const prevDate = new Date(stayCells[i - 1].date);
            const currDate = new Date(stayCells[i].date);
            const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
            
            if (dayDiff === 1) {
                // 連続
                currentGroup.push(stayCells[i]);
            } else {
                // 新しいグループ
                groups.push(currentGroup);
                currentGroup = [stayCells[i]];
            }
        }
        groups.push(currentGroup);
        
        // 各グループを処理
        for (const group of groups) {
            if (group.length === 1) {
                // 単独宿泊: 入のみ（退所は同日に設定しない、要件に従う）
                const cell = group[0];
                calendar.setCell(cell.date, 'am', AppConfig.SYMBOLS.CHECK_IN);
                
            } else if (group.length === 2) {
                // 2日連続: 入所→退所
                const firstCell = group[0];
                const lastCell = group[1];
                
                calendar.setCell(firstCell.date, 'am', AppConfig.SYMBOLS.CHECK_IN);
                calendar.setCell(lastCell.date, 'am', AppConfig.SYMBOLS.CHECK_OUT);
                
            } else {
                // 3日以上連続: 入所→○→...→退所
                const firstCell = group[0];
                const lastCell = group[group.length - 1];
                
                // 開始日: 入
                calendar.setCell(firstCell.date, 'am', AppConfig.SYMBOLS.CHECK_IN);
                
                // 中間日: ○
                for (let i = 1; i < group.length - 1; i++) {
                    const cell = group[i];
                    calendar.setCell(cell.date, 'am', AppConfig.SYMBOLS.FULL_DAY);
                }
                
                // 終了日: 退
                calendar.setCell(lastCell.date, 'am', AppConfig.SYMBOLS.CHECK_OUT);
            }
        }
        
        // StayPeriodを再計算
        calendar.calculateStayPeriods();
        calendar.calculateAllFlags();
        
        this.logger.debug(`Adjusted ${groups.length} stay period groups for user ${calendar.userId}`);
    }

    // ==================== Phase 1-A-5: 備考保持ロジック ====================

    /**
     * 既存の備考を保持したまま予定を上書き
     * @param {Map} newCalendars - 新しいスケジュール
     * @param {string} yearMonth - 対象月
     * @param {StorageService} storageService - ストレージサービス
     * @returns {Map} マージ済みスケジュール
     */
    mergeWithExistingNotes(newCalendars, yearMonth, storageService) {
        this.logger.info('Merging with existing notes');
        
        try {
            // 既存スケジュールを読み込み
            const users = Array.from(newCalendars.values()).map(cal => ({ id: cal.userId }));
            const existingCalendars = storageService.loadSchedule(yearMonth, users);
            
            if (!existingCalendars || existingCalendars.size === 0) {
                this.logger.info('No existing schedule found, skipping merge');
                return newCalendars;
            }
            
            // 既存の備考を保持
            let noteCount = 0;
            
            for (const [userId, newCalendar] of newCalendars) {
                const existingCalendar = existingCalendars.get(userId);
                if (!existingCalendar) continue;
                
                // セル備考をコピー
                for (const [key, existingCell] of existingCalendar.cells) {
                    const newCell = newCalendar.cells.get(key);
                    if (newCell && existingCell.note) {
                        newCell.note = existingCell.note;
                        noteCount++;
                    }
                }
            }
            
            this.logger.info(`Merged ${noteCount} notes from existing schedule`);
            
        } catch (error) {
            this.logger.warn('Failed to merge notes:', error);
            // エラーが発生しても新しいスケジュールは返す
        }
        
        return newCalendars;
    }

    // ==================== ユーティリティ ====================

    /**
     * CSVファイルの検証
     * @param {File} file - CSVファイル
     * @returns {Object} { valid: boolean, errors: Array<string> }
     */
    validateCSVFile(file) {
        const errors = [];
        
        // ファイル形式チェック
        if (!file.name.toLowerCase().endsWith('.csv')) {
            errors.push('CSVファイルを選択してください（拡張子: .csv）');
        }
        
        // ファイルサイズチェック（10MB以下）
        if (file.size > 10 * 1024 * 1024) {
            errors.push('ファイルサイズが大きすぎます（上限: 10MB）');
        }
        
        // 空ファイルチェック
        if (file.size === 0) {
            errors.push('ファイルが空です');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// グローバル変数として公開
window.CSVService = CSVService;
