/**
 * main.js
 * アプリケーションエントリーポイント
 * 
 * 初期化とセクション管理
 */

import { MasterDataManager } from './common/MasterDataManager.js';
import { KayoiSection } from './kayoi/KayoiSection.js';
import { DateUtils } from './common/utils/DateUtils.js';
import { CSVImportUI } from './settings/CSVImportUI.js';
import { DailySummaryGenerator, DailySummaryRenderer, CalendarHeaderRenderer } from './common/DailySummary.js';
import { TabJumpController, ColumnWidthCalculator } from './common/TabJump.js';
import { TomariLogic } from './tomari/TomariLogic.js';
import { TomariUI } from './tomari/TomariUI.js';
import { HoumonLogic } from './houmon/HoumonLogic.js';
import { HoumonUI } from './houmon/HoumonUI.js';

class App {
  constructor() {
    this.masterData = null;
    this.csvImportUI = null;
    this.sections = {
      kayoi: null,
      tomari: null,
      houmon: null
    };
    this.activeSection = 'kayoi';
    this.currentYearMonth = DateUtils.getCurrentYearMonth();
  }

  /**
   * アプリケーション初期化
   */
  async init() {
    try {
      console.log('Application initializing...');

      // マスターデータ初期化
      this.masterData = new MasterDataManager();

      // CSV取り込みUI初期化
      this.csvImportUI = new CSVImportUI(this.masterData);

      // セクション初期化
      this.sections.kayoi = new KayoiSection(this.masterData);
      
      // 泊まりセクション初期化
      const tomariLogic = new TomariLogic(this.masterData);
      tomariLogic.initialize();
      this.sections.tomari = new TomariUI(this.masterData, tomariLogic);
      this.sections.tomari.initialize(document.querySelector('#tomari-section .section-content'));
      
      // 訪問セクション初期化
      const houmonLogic = new HoumonLogic(this.masterData);
      houmonLogic.initialize();
      this.sections.houmon = new HoumonUI(this.masterData, houmonLogic);
      this.sections.houmon.initialize(document.querySelector('#houmon-section .section-content'));

      // UI初期化
      this.setupUI();
      this.updateMonthDisplay();

      // 統合UI機能の初期化
      this.initializeIntegratedUI();

      // v4.0: 初期化時に泊まりデータを通いセクションに同期
      this.syncTomariToKayoi();

      // 初期描画：デフォルトは日別サマリー（全体）を表示
      // セクションは非表示だが、データは初期化済み
      console.log('Application initialized successfully');
      
      // 初期状態でkayoiセクションをアクティブに（タブは「全体」だが、データは準備）
      this.sections.kayoi.activate();
    } catch (error) {
      console.error('Application initialization failed:', error);
      this.showError('アプリケーションの初期化に失敗しました');
    }
  }

  /**
   * 統合UI機能を初期化
   */
  initializeIntegratedUI() {
    // カレンダー見出しを描画
    CalendarHeaderRenderer.render(this.currentYearMonth);

    // 日別サマリーを描画（統合UI用）
    this.updateDailySummary();

    // タブジャンプ機能を初期化
    TabJumpController.initialize();

    // 列幅計算を初期化
    ColumnWidthCalculator.initialize(this.currentYearMonth);
  }

  /**
   * 日別サマリーを更新
   */
  updateDailySummary() {
    const kayoiData = this.sections.kayoi ? this.sections.kayoi.getAllSchedules() : [];
    const tomariData = this.sections.tomari && this.sections.tomari.logic ? 
                       this.sections.tomari.logic.getAllReservations() : [];
    const houmonData = this.sections.houmon && this.sections.houmon.logic ? 
                       this.sections.houmon.logic.getAllSchedules() : [];

    const summary = DailySummaryGenerator.generate(
      kayoiData,
      tomariData,
      houmonData,
      this.currentYearMonth
    );

    DailySummaryRenderer.render(summary, this.currentYearMonth);
  }

  /**
   * UIセットアップ
   */
  setupUI() {
    console.log('setupUI() called');
    
    // タブ切り替え（新しいクラス名に対応）
    const tabButtons = document.querySelectorAll('.tab-button');
    console.log('Found tab buttons:', tabButtons.length);
    
    tabButtons.forEach(btn => {
      console.log('Adding listener to tab:', btn.textContent, btn.dataset.target);
      btn.addEventListener('click', (e) => {
        console.log('Tab clicked:', e.target.dataset.target);
        const target = e.target.dataset.target;
        
        // タブのアクティブ状態を更新
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // targetがsummaryの場合は全体表示（日別サマリーのみ）
        if (target === 'summary') {
          // 全セクションを非表示
          ['kayoi', 'tomari', 'houmon'].forEach(name => {
            const section = document.getElementById(`${name}-section`);
            if (section) section.style.display = 'none';
          });
          
          // 日別サマリーとカレンダーヘッダーは表示
          const summaryElement = document.getElementById('summary');
          if (summaryElement) {
            summaryElement.style.display = 'block';
          }
          const calendarHeader = document.querySelector('.calendar-header-ruler');
          if (calendarHeader) {
            calendarHeader.style.display = 'block';
          }
          return;
        }
        
        // それ以外は対応するセクションIDから名前を取得
        const section = target.replace('-section', '');
        this.activateSection(section);
      });
    });

    // カレンダーコントロール
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    const todayBtn = document.getElementById('today-button');
    
    console.log('Calendar controls:', { prevBtn, nextBtn, todayBtn });
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        console.log('Prev month clicked');
        this.changeMonth(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        console.log('Next month clicked');
        this.changeMonth(1);
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        console.log('Today button clicked');
        this.goToToday();
      });
    }

    // その他のボタン（Phase 1では未実装）
    const csvBtn = document.getElementById('csv-import-btn');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        this.csvImportUI.showFileDialog();
      });
    }

    const printBtn = document.getElementById('print-button');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        this.showToast('印刷機能は開発中です', 'info');
      });
    }

    const exportBtn = document.getElementById('export-button');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.showToast('エクスポート機能は開発中です', 'info');
      });
    }

    const settingsBtn = document.getElementById('settings-button');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.showToast('設定画面は開発中です', 'info');
      });
    }

    const helpBtn = document.getElementById('help-button');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        this.showToast('ヘルプは開発中です', 'info');
      });
    }

    // モーダルオーバーレイクリック
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', () => {
        this.closeModal();
      });
    }

    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
      this.handleKeyboard(e);
    });
  }

  /**
   * セクションをアクティブ化
   * @param {string} sectionName - 'kayoi' | 'tomari' | 'houmon'
   */
  activateSection(sectionName) {
    // 前のセクションを非アクティブ化
    if (this.activeSection && this.sections[this.activeSection]) {
      if (this.sections[this.activeSection].deactivate) {
        this.sections[this.activeSection].deactivate();
      }
    }

    this.activeSection = sectionName;

    // タブUIの更新
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
      const target = btn.dataset.target;
      if (target === `${sectionName}-section`) {
        btn.classList.add('active');
      }
    });

    // 日別サマリーは常に表示
    const summarySection = document.getElementById('summary');
    if (summarySection) {
      summarySection.style.display = 'block';
    }
    
    // カレンダーヘッダーも常に表示
    const calendarHeader = document.querySelector('.calendar-header-ruler');
    if (calendarHeader) {
      calendarHeader.style.display = 'block';
    }

    // セクションコンテナの切り替え（kayoi/tomari/houmonのみ）
    ['kayoi', 'tomari', 'houmon'].forEach(name => {
      const section = document.getElementById(`${name}-section`);
      if (section) {
        section.style.display = (name === sectionName) ? 'block' : 'none';
      }
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.style.display = 'block';
    }

    // v4.0: 通いセクションをアクティブ化する前に泊まりデータを同期
    if (sectionName === 'kayoi') {
      this.syncTomariToKayoi();
    }

    // セクションをアクティブ化
    if (this.sections[sectionName]) {
      if (this.sections[sectionName].activate) {
        this.sections[sectionName].activate();
      }
      if (this.sections[sectionName].changeMonth) {
        this.sections[sectionName].changeMonth(this.currentYearMonth);
      } else if (this.sections[sectionName].refresh) {
        this.sections[sectionName].refresh();
      }
    }
  }

  /**
   * 月を変更
   * @param {number} delta - 月の増減
   */
  changeMonth(delta) {
    this.currentYearMonth = DateUtils.addMonths(this.currentYearMonth, delta);
    this.updateMonthDisplay();

    // カレンダー見出しを更新
    CalendarHeaderRenderer.render(this.currentYearMonth);

    // 列幅を再計算
    ColumnWidthCalculator.calculate(this.currentYearMonth);

    // セクションを更新
    if (this.sections[this.activeSection]) {
      this.sections[this.activeSection].changeMonth(this.currentYearMonth);
    }

    // 日別サマリーを更新（統合UI用）
    this.updateDailySummary();

    // 通い専用の日別サマリーを更新
    if (this.kayoiDailySummaryUI) {
      const { year, month } = this.currentYearMonth;
      this.kayoiDailySummaryUI.render(year, month);
    }
  }

  /**
   * 今月に戻る
   */
  goToToday() {
    this.currentYearMonth = DateUtils.getCurrentYearMonth();
    this.updateMonthDisplay();

    // カレンダー見出しを更新
    CalendarHeaderRenderer.render(this.currentYearMonth);

    // 列幅を再計算
    ColumnWidthCalculator.calculate(this.currentYearMonth);

    // セクションを更新
    if (this.sections[this.activeSection]) {
      this.sections[this.activeSection].changeMonth(this.currentYearMonth);
    }

    // 日別サマリーを更新（統合UI用）
    this.updateDailySummary();
  }

  /**
   * v4.0: 泊まりデータを通いセクションに同期
   * 泊まりデータが変更されたときに呼び出す
   */
  syncTomariToKayoi() {
    if (this.sections.kayoi && this.sections.tomari && this.sections.tomari.logic) {
      const tomariReservations = this.sections.tomari.logic.reservations || [];
      this.sections.kayoi.syncTomariData(tomariReservations);
    }
  }

  /**
   * 月表示を更新
   */
  updateMonthDisplay() {
    const [year, month] = this.currentYearMonth.split('-');
    document.getElementById('current-month').textContent = `${year}年${parseInt(month)}月`;
  }

  /**
   * キーボードイベント処理
   * @param {KeyboardEvent} e
   */
  handleKeyboard(e) {
    // Escキーでモーダルを閉じる
    if (e.key === 'Escape') {
      this.closeModal();
    }

    // Ctrl/Cmd + 矢印キーで月移動
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.changeMonth(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.changeMonth(1);
      }
    }
  }

  /**
   * モーダルを閉じる
   */
  closeModal() {
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('modal-overlay');
    
    modal.classList.remove('active');
    overlay.classList.remove('active');
  }

  /**
   * トースト通知を表示
   * @param {string} message
   * @param {string} type
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * エラー表示
   * @param {string} message
   */
  showError(message) {
    this.showToast(message, 'error');
  }
}

// アプリケーション起動（DOMContentLoaded後に実行）
console.log('main.js loaded, readyState:', document.readyState);

if (document.readyState === 'loading') {
  console.log('Waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    const app = new App();
    app.init();
  });
} else {
  // すでにロード済みの場合（ES6モジュールは常にこちら）
  console.log('DOM already loaded, initializing immediately');
  const app = new App();
  app.init();
}
