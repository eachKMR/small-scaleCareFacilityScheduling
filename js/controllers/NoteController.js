/**
 * 小規模多機能利用調整システム - NoteController
 * 備考管理を行うコントローラークラス
 * EventEmitterを継承
 */

class NoteController extends EventEmitter {
  /**
   * コンストラクタ
   * @param {StorageService} storageService - ストレージサービス
   */
  constructor(storageService) {
    super();

    // 依存関係チェック
    if (typeof window.Logger === 'undefined') {
      throw new Error('NoteController requires Logger');
    }
    if (typeof window.EventEmitter === 'undefined') {
      throw new Error('NoteController requires EventEmitter');
    }
    if (typeof window.StorageService === 'undefined') {
      throw new Error('NoteController requires StorageService');
    }
    if (typeof window.Note === 'undefined') {
      throw new Error('NoteController requires Note model');
    }

    this.storageService = storageService;
    this.notes = new Map();

    window.Logger?.info('NoteController initialized');
  }

  /**
   * 備考データを読み込み
   */
  loadNotes() {
    try {
      const noteArray = this.storageService.loadNotes();

      this.notes.clear();
      noteArray.forEach(note => {
        this.notes.set(note.id, note);
      });

      window.Logger?.info('Loaded notes:', this.notes.size);
    } catch (error) {
      window.Logger?.error('Failed to load notes:', error);
      this.notes.clear();
    }
  }

  /**
   * 備考データを保存
   * @returns {boolean} 成功かどうか
   */
  saveNotes() {
    try {
      const noteArray = Array.from(this.notes.values());
      const success = this.storageService.saveNotes(noteArray);

      if (success) {
        window.Logger?.debug('Notes saved:', noteArray.length);
      }

      return success;
    } catch (error) {
      window.Logger?.error('Failed to save notes:', error);
      return false;
    }
  }

  /**
   * IDから備考を取得
   * @param {string} id - 備考ID
   * @returns {Note|null} 備考またはnull
   */
  getNote(id) {
    return this.notes.get(id) || null;
  }

  /**
   * 利用者の備考を取得
   * @param {string} userId - 利用者ID
   * @returns {Note|null} 備考またはnull
   */
  getUserNote(userId) {
    try {
      for (const note of this.notes.values()) {
        if (note.targetType === 'user' && note.targetId === userId) {
          return note;
        }
      }
      return null;
    } catch (error) {
      window.Logger?.error('Failed to get user note:', error);
      return null;
    }
  }

  /**
   * セルの備考を取得
   * @param {string} cellId - セルID（userId_date_cellType形式）
   * @returns {Note|null} 備考またはnull
   */
  getCellNote(cellId) {
    try {
      for (const note of this.notes.values()) {
        if (note.targetType === 'cell' && note.targetId === cellId) {
          return note;
        }
      }
      return null;
    } catch (error) {
      window.Logger?.error('Failed to get cell note:', error);
      return null;
    }
  }

  /**
   * 利用者の全備考を取得
   * @param {string} userId - 利用者ID
   * @returns {Note[]} 備考配列
   */
  getUserNotes(userId) {
    try {
      const userNotes = [];
      
      for (const note of this.notes.values()) {
        if (note.targetType === 'user' && note.targetId === userId) {
          userNotes.push(note);
        }
      }
      
      // 更新日時順にソート（新しい順）
      userNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      
      return userNotes;
    } catch (error) {
      window.Logger?.error('Failed to get user notes:', error);
      return [];
    }
  }

  /**
   * 指定日の全セル備考を取得
   * @param {string} userId - 利用者ID
   * @param {Date} date - 日付
   * @returns {Object} セルタイプをキーとした備考のオブジェクト
   */
  getDayNotes(userId, date) {
    try {
      const dateStr = window.DateUtils.formatDate(date);
      const dayStayCellId = `${userId}_${dateStr}_dayStay`;
      const visitCellId = `${userId}_${dateStr}_visit`;

      return {
        dayStay: this.getCellNote(dayStayCellId),
        visit: this.getCellNote(visitCellId)
      };
    } catch (error) {
      window.Logger?.error('Failed to get day notes:', error);
      return {
        dayStay: null,
        visit: null
      };
    }
  }

  /**
   * 全備考の配列を返す
   * @returns {Note[]} 備考配列
   */
  getAllNotes() {
    try {
      const noteArray = Array.from(this.notes.values());
      
      // 更新日時順にソート（新しい順）
      noteArray.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      
      return noteArray;
    } catch (error) {
      window.Logger?.error('Failed to get all notes:', error);
      return [];
    }
  }

  /**
   * 備考を追加
   * @param {Note} note - 追加する備考
   * @returns {boolean} 成功かどうか
   */
  addNote(note) {
    try {
      if (!(note instanceof window.Note)) {
        throw new Error('Invalid note object');
      }

      this.notes.set(note.id, note);
      this.emit('noteAdded', { note });
      this.saveNotes();

      window.Logger?.debug('Note added:', note.id);
      return true;
    } catch (error) {
      window.Logger?.error('Failed to add note:', error);
      return false;
    }
  }

  /**
   * 備考内容を更新
   * @param {string} id - 備考ID
   * @param {string} content - 新しい内容
   * @returns {boolean} 成功かどうか
   */
  updateNote(id, content) {
    try {
      const note = this.notes.get(id);
      if (!note) {
        window.Logger?.error('Note not found:', id);
        return false;
      }

      // Note.update()メソッドを使用
      if (typeof note.update === 'function') {
        note.update(content);
      } else {
        // fallback: 直接更新
        note.content = content;
        note.updatedAt = new Date();
      }

      this.emit('noteUpdated', { note });
      this.saveNotes();

      window.Logger?.debug('Note updated:', id);
      return true;
    } catch (error) {
      window.Logger?.error('Failed to update note:', error);
      return false;
    }
  }

  /**
   * 備考を削除
   * @param {string} id - 備考ID
   * @returns {boolean} 成功かどうか
   */
  deleteNote(id) {
    try {
      const note = this.notes.get(id);
      if (!note) {
        window.Logger?.error('Note not found:', id);
        return false;
      }

      this.notes.delete(id);
      this.emit('noteDeleted', { noteId: id, note: note });
      this.saveNotes();

      window.Logger?.debug('Note deleted:', id);
      return true;
    } catch (error) {
      window.Logger?.error('Failed to delete note:', error);
      return false;
    }
  }

  /**
   * 指定ターゲットに備考があるか
   * @param {string} targetType - ターゲットタイプ（'user' | 'cell'）
   * @param {string} targetId - ターゲットID
   * @returns {boolean} 備考があるかどうか
   */
  hasNote(targetType, targetId) {
    try {
      for (const note of this.notes.values()) {
        if (note.targetType === targetType && note.targetId === targetId) {
          return true;
        }
      }
      return false;
    } catch (error) {
      window.Logger?.error('Failed to check note existence:', error);
      return false;
    }
  }

  /**
   * 新しいNoteインスタンスを生成して追加
   * @param {string} targetType - ターゲットタイプ（'user' | 'cell'）
   * @param {string} targetId - ターゲットID
   * @param {string} content - 内容
   * @returns {Note|null} 作成した備考またはnull
   */
  createNote(targetType, targetId, content) {
    try {
      const note = new window.Note({ targetType, targetId, content });
      const success = this.addNote(note);
      
      if (success) {
        return note;
      } else {
        return null;
      }
    } catch (error) {
      window.Logger?.error('Failed to create note:', error);
      return null;
    }
  }

  /**
   * セル備考を作成（ヘルパーメソッド）
   * @param {string} userId - 利用者ID
   * @param {Date} date - 日付
   * @param {string} cellType - セルタイプ（'dayStay' | 'visit'）
   * @param {string} content - 内容
   * @returns {Note|null} 作成した備考またはnull
   */
  createCellNote(userId, date, cellType, content) {
    try {
      const dateStr = window.DateUtils.formatDate(date);
      const cellId = `${userId}_${dateStr}_${cellType}`;
      
      return this.createNote('cell', cellId, content);
    } catch (error) {
      window.Logger?.error('Failed to create cell note:', error);
      return null;
    }
  }

  /**
   * 一括削除
   * @param {string} targetType - ターゲットタイプ（省略時は全て）
   * @param {string} targetId - ターゲットID（省略時は指定タイプの全て）
   * @returns {number} 削除した件数
   */
  bulkDelete(targetType = null, targetId = null) {
    try {
      let deleteCount = 0;
      const toDelete = [];

      for (const [id, note] of this.notes.entries()) {
        let shouldDelete = true;

        if (targetType && note.targetType !== targetType) {
          shouldDelete = false;
        }
        if (targetId && note.targetId !== targetId) {
          shouldDelete = false;
        }

        if (shouldDelete) {
          toDelete.push(id);
        }
      }

      // 削除実行
      toDelete.forEach(id => {
        const note = this.notes.get(id);
        this.notes.delete(id);
        this.emit('noteDeleted', { noteId: id, note: note });
        deleteCount++;
      });

      if (deleteCount > 0) {
        this.saveNotes();
        window.Logger?.info(`Bulk deleted ${deleteCount} notes`);
      }

      return deleteCount;
    } catch (error) {
      window.Logger?.error('Failed to bulk delete notes:', error);
      return 0;
    }
  }

  /**
   * 検索
   * @param {string} searchText - 検索テキスト
   * @param {Object} options - 検索オプション
   * @returns {Note[]} 検索結果
   */
  search(searchText, options = {}) {
    try {
      if (!searchText || typeof searchText !== 'string') {
        return [];
      }

      const {
        targetType = null,
        caseSensitive = false,
        exactMatch = false
      } = options;

      const searchPattern = caseSensitive ? searchText : searchText.toLowerCase();
      const results = [];

      for (const note of this.notes.values()) {
        // ターゲットタイプフィルター
        if (targetType && note.targetType !== targetType) {
          continue;
        }

        // 内容検索
        const content = caseSensitive ? note.content : note.content.toLowerCase();
        let matches = false;

        if (exactMatch) {
          matches = content === searchPattern;
        } else {
          matches = content.includes(searchPattern);
        }

        if (matches) {
          results.push(note);
        }
      }

      // 関連性順にソート（完全一致 > 前方一致 > 部分一致）
      results.sort((a, b) => {
        const aContent = caseSensitive ? a.content : a.content.toLowerCase();
        const bContent = caseSensitive ? b.content : b.content.toLowerCase();

        const aExact = aContent === searchPattern ? 3 : 0;
        const bExact = bContent === searchPattern ? 3 : 0;
        const aPrefix = aContent.startsWith(searchPattern) ? 2 : 0;
        const bPrefix = bContent.startsWith(searchPattern) ? 2 : 0;
        const aPartial = aContent.includes(searchPattern) ? 1 : 0;
        const bPartial = bContent.includes(searchPattern) ? 1 : 0;

        const aScore = aExact + aPrefix + aPartial;
        const bScore = bExact + bPrefix + bPartial;

        if (aScore !== bScore) {
          return bScore - aScore; // 高スコア順
        }

        // 同スコアの場合は更新日時順
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });

      window.Logger?.debug(`Search for "${searchText}" found ${results.length} results`);
      return results;
    } catch (error) {
      window.Logger?.error('Failed to search notes:', error);
      return [];
    }
  }

  /**
   * 統計情報を取得
   * @returns {Object} 統計情報
   */
  getStatistics() {
    try {
      const stats = {
        total: this.notes.size,
        byTargetType: {
          user: 0,
          cell: 0
        },
        byMonth: {},
        averageLength: 0,
        totalLength: 0
      };

      let totalLength = 0;

      for (const note of this.notes.values()) {
        // タイプ別集計
        if (stats.byTargetType.hasOwnProperty(note.targetType)) {
          stats.byTargetType[note.targetType]++;
        }

        // 月別集計
        const month = note.createdAt.toISOString().substring(0, 7); // YYYY-MM
        stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;

        // 長さ集計
        totalLength += note.content.length;
      }

      stats.totalLength = totalLength;
      stats.averageLength = stats.total > 0 ? Math.round(totalLength / stats.total) : 0;

      return stats;
    } catch (error) {
      window.Logger?.error('Failed to get statistics:', error);
      return {
        total: 0,
        byTargetType: { user: 0, cell: 0 },
        byMonth: {},
        averageLength: 0,
        totalLength: 0
      };
    }
  }

  /**
   * デバッグ情報を出力
   */
  debug() {
    window.Logger?.group('NoteController Debug Info');
    
    const stats = this.getStatistics();
    const recentNotes = this.getAllNotes().slice(0, 5);

    window.Logger?.info('Total Notes:', this.notes.size);
    window.Logger?.info('Statistics:', stats);

    if (recentNotes.length > 0) {
      window.Logger?.info('Recent Notes:');
      const recentData = recentNotes.map(note => ({
        id: note.id.substring(0, 8) + '...',
        targetType: note.targetType,
        targetId: note.targetId.substring(0, 12) + '...',
        content: note.content.substring(0, 30) + (note.content.length > 30 ? '...' : ''),
        updatedAt: note.updatedAt.toISOString().substring(0, 19)
      }));
      window.Logger?.table(recentData);
    }

    window.Logger?.groupEnd();
  }
}

// グローバルに登録
window.NoteController = NoteController;