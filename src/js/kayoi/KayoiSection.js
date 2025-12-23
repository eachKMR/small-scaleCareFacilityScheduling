/**
 * KayoiSection.js
 * 通いセクションコントローラー
 * 
 * UI・ロジチE��・チE�Eタの統合管琁E
 * @version 2.0 - トグル処琁E��簡素化、新しいKayoiUIと連携
 */

import { KayoiSchedule } from './KayoiSchedule.js';
import { KayoiLogic } from './KayoiLogic.js';
import { KayoiUI } from './KayoiUI.js';
import { StorageUtils } from '../common/utils/StorageUtils.js';
import { DateUtils } from '../common/utils/DateUtils.js';

export class KayoiSection {
  constructor(masterDataManager) {
    this.masterData = masterDataManager;
    this.logic = new KayoiLogic(masterDataManager);
    
    const container = document.getElementById('kayoi-grid');
    this.ui = new KayoiUI(container, masterDataManager, this.logic);
    
    this.currentYearMonth = DateUtils.getCurrentYearMonth();
    
    this.load();
    this.setupEventHandlers();
  }

  /**
   * チE�Eタを読み込み
   */
  load() {
    this.ui.loadFromStorage();
  }

  /**
   * チE�Eタを保孁E
   */
  save() {
    this.ui.saveToStorage();
    StorageUtils.updateLastSaved();
  }

  /**
   * イベントハンドラーをセチE��アチE�E
   */
  setupEventHandlers() {
    // Ctrl+Z�E��Eに戻す！E
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        this.ui.undo();
      }
    });
  }

  /**
   * 月を変更
   * @param {string} yearMonth
   */
  changeMonth(yearMonth) {
    this.currentYearMonth = yearMonth;
    this.ui.render(yearMonth);
  }

  /**
   * セクションをアクティブ化
   */
  activate() {
    this.ui.render(this.currentYearMonth);
  }

  /**
   * セクションを非アクティブ化
   */
  deactivate() {
    // 必要に応じてクリーンアップ
  }

  /**
   * v4.0: 泊まりデータを同期
   * @param {Array} tomariReservations - TomariReservationの配列
   */
  syncTomariData(tomariReservations) {
    this.logic.syncTomariData(tomariReservations);
    // 表示を再レンダリング
    this.ui.render(this.currentYearMonth);
  }

  /**
   * 全スケジュールを取得（日別サマリー用）
   * @returns {KayoiSchedule[]} スケジュールデータの配列
   */
  getAllSchedules() {
    return this.logic.getMonthSchedules(this.currentYearMonth);
  }
}

