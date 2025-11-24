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

      // セクション初期化（Phase 1は通いのみ）
      this.sections.kayoi = new KayoiSection(this.masterData);

      // UI初期化
      this.setupUI();
      this.updateMonthDisplay();

      // 統合UI機能の初期化
      this.initializeIntegratedUI();

      // 初期描画
      this.activateSection('kayoi');

      console.log('Application initialized successfully');
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

    // 日別サマリーを描画
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
    // 現在は通いのみなので、泊まり・訪問は空データ
    const kayoiData = this.sections.kayoi ? this.sections.kayoi.getAllSchedules() : [];
    const tomariData = [];
    const houmonData = [];

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
    // タブ切り替え（新しいクラス名に対応）
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target.dataset.target;
        // targetがsummaryの場合は日別サマリーにスクロール
        if (target === 'summary') {
          const summaryElement = document.getElementById('summary');
          if (summaryElement) {
            summaryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          return;
        }
        // それ以外は対応するセクションIDから名前を取得
        const section = target.replace('-section', '');
        this.activateSection(section);
      });
    });

    // カレンダーコントロール
    document.getElementById('prev-month-btn').addEventListener('click', () => {
      this.changeMonth(-1);
    });

    document.getElementById('next-month-btn').addEventListener('click', () => {
      this.changeMonth(1);
    });

    document.getElementById('today-btn').addEventListener('click', () => {
      this.goToToday();
    });

    // その他のボタン（Phase 1では未実装）
    document.getElementById('csv-import-btn').addEventListener('click', () => {
      console.log('CSV取り込みボタンがクリックされました');
      console.log('csvImportUI:', this.csvImportUI);
      this.csvImportUI.showFileDialog();
    });

    document.getElementById('print-btn').addEventListener('click', () => {
      this.showToast('印刷機能は開発中です', 'info');
    });

    document.getElementById('export-btn').addEventListener('click', () => {
      this.showToast('エクスポート機能は開発中です', 'info');
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
      this.showToast('設定画面は開発中です', 'info');
    });

    document.getElementById('help-btn').addEventListener('click', () => {
      this.showToast('ヘルプは開発中です', 'info');
    });

    // モーダルオーバーレイクリック
    document.getElementById('modal-overlay').addEventListener('click', () => {
      this.closeModal();
    });

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
    // Phase 1では通いのみ
    if (sectionName !== 'kayoi') {
      this.showToast(`${sectionName}セクションは開発中です`, 'info');
      return;
    }

    // 前のセクションを非アクティブ化
    if (this.activeSection && this.sections[this.activeSection]) {
      this.sections[this.activeSection].deactivate();
    }

    this.activeSection = sectionName;

    // タブUIの更新
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.section === sectionName) {
        btn.classList.add('active');
      }
    });

    // セクションコンテナの切り替え
    document.querySelectorAll('.section-content').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById(`${sectionName}-section`).classList.add('active');

    // セクションをアクティブ化
    if (this.sections[sectionName]) {
      this.sections[sectionName].activate();
      this.sections[sectionName].changeMonth(this.currentYearMonth);
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

    // 日別サマリーを更新
    this.updateDailySummary();
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

    // 日別サマリーを更新
    this.updateDailySummary();
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

// アプリケーション起動
const app = new App();
app.init();
