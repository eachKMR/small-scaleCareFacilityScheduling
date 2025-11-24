/**
 * CSVImportService.js
 * CSV取り込みサービス
 */

import { CSVParser } from './CSVParser.js';
import { WeeklyPatternExtractor } from './WeeklyPatternExtractor.js';
import { User } from '../User.js';

export class CSVImportService {
  constructor(masterDataManager) {
    this.masterData = masterDataManager;
  }

  /**
   * CSV取り込み処理
   * @param {FileList} files - CSVファイルリスト
   * @returns {Promise<{weeklyPatterns: Map, duplicates: string[]}>}
   */
  async importCSV(files) {
    try {
      console.log('CSVImportService.importCSV() 開始');
      // 1. Shift_JISでファイルを読み込み
      console.log('ファイルを読み込み中...');
      const allRows = await this.readCSVFiles(files);
      console.log('読み込んだ行数:', allRows.length);
      
      // 2. 週間パターンを抽出
      console.log('週間パターンを抽出中...');
      const weeklyPatterns = WeeklyPatternExtractor.extract(allRows);
      console.log('抽出したパターン数:', weeklyPatterns.size);
      
      // 3. 重複チェック
      console.log('重複チェック中...');
      const duplicates = this.checkDuplicates(weeklyPatterns);
      console.log('重複数:', duplicates.length);
      
      return { weeklyPatterns, duplicates };
      
    } catch (error) {
      console.error('CSV import failed:', error);
      throw error;
    }
  }
  
  /**
   * Shift_JISでファイルを読み込み
   */
  async readCSVFiles(files) {
    console.log('readCSVFiles() 開始, ファイル数:', files.length);
    const allRows = [];
    
    for (const file of files) {
      console.log('ファイルを読み込み中:', file.name);
      const arrayBuffer = await file.arrayBuffer();
      console.log('ArrayBuffer取得完了, サイズ:', arrayBuffer.byteLength);
      
      const text = CSVParser.decodeShiftJIS(arrayBuffer);
      console.log('Shift_JISデコード完了, 文字数:', text.length);
      
      const rows = CSVParser.parseCSV(text);
      console.log('CSV解析完了, 行数:', rows.length);
      
      // ヘッダー行をスキップ
      allRows.push(...rows.slice(1));
    }
    
    console.log('全ファイル読み込み完了, 総行数:', allRows.length);
    return allRows;
  }
  
  /**
   * 重複チェック（氏名ベース）
   */
  checkDuplicates(weeklyPatterns) {
    const existingUsers = this.masterData.getAllUsers();
    const duplicates = [];
    
    for (const name of weeklyPatterns.keys()) {
      const isDup = existingUsers.some(user => user.name === name);
      if (isDup) {
        duplicates.push(name);
      }
    }
    
    return duplicates;
  }
  
  /**
   * 選択された利用者をマスタに登録
   * @param {Map} weeklyPatterns
   * @param {string[]} selectedNames - 選択された氏名リスト
   * @returns {User[]} - 登録された利用者リスト
   */
  registerUsers(weeklyPatterns, selectedNames) {
    const registeredUsers = [];
    
    for (const name of selectedNames) {
      const pattern = weeklyPatterns.get(name);
      if (!pattern) continue;
      
      // 利用者IDを生成
      const userId = this.generateUserId();
      
      // Userオブジェクトを作成
      const user = new User({
        userId,
        name: pattern.name,
        displayName: pattern.name,
        weeklyPattern: {
          dayPattern: pattern.dayPattern,
          visitPattern: pattern.visitPattern,
          stayPattern: pattern.stayPattern
        },
        registrationDate: new Date().toISOString().split('T')[0],
        sortId: this.masterData.getAllUsers().length + 1
      });
      
      // マスタに追加
      if (this.masterData.addUser(user)) {
        registeredUsers.push(user);
      }
    }
    
    return registeredUsers;
  }
  
  /**
   * 利用者IDを生成
   */
  generateUserId() {
    const existingUsers = this.masterData.getAllUsers();
    const existingIds = existingUsers.map(u => 
      parseInt(u.userId.replace('user', ''))
    );
    
    for (let i = 1; i <= 29; i++) {
      if (!existingIds.includes(i)) {
        return `user${String(i).padStart(3, '0')}`;
      }
    }
    
    throw new Error('利用者定員（29人）に達しています');
  }
}
