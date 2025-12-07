/**
 * 全体の日別サマリーUI制御
 * @version 1.0
 * @see L3_UI_日別サマリー設計.md
 */

import { DailySummaryService } from '../services/DailySummaryService.js';

class DailySummaryUI {
  /**
   * コンストラクタ
   * @param {HTMLElement} summaryElement - .daily-summary要素
   * @param {ScheduleManager} scheduleManager - 予定管理オブジェクト
   */
  constructor(summaryElement, scheduleManager) {
    this.summaryElement = summaryElement;
    this.scheduleManager = scheduleManager;
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth() + 1;
    
    this.initializeToggleButton();
    this.restoreMode();
  }
  
  /**
   * トグルボタンの初期化
   */
  initializeToggleButton() {
    const toggleButton = this.summaryElement.querySelector('.toggle-button');
    if (!toggleButton) {
      console.warn('トグルボタンが見つかりません');
      return;
    }
    
    toggleButton.addEventListener('click', () => {
      this.toggleDetailMode();
    });
  }
  
  /**
   * 詳細モードの切り替え
   */
  toggleDetailMode() {
    const simpleMode = this.summaryElement.querySelector('.simple-mode');
    const detailMode = this.summaryElement.querySelector('.detail-mode');
    const toggleButton = this.summaryElement.querySelector('.toggle-button');
    
    if (!simpleMode || !detailMode || !toggleButton) return;
    
    const isDetail = simpleMode.style.display === 'none';
    
    if (!isDetail) {
      // 詳細モードに切り替え
      simpleMode.style.display = 'none';
      detailMode.style.display = 'block';
      toggleButton.textContent = '通常表示';
      localStorage.setItem('kayoi-summary-mode', 'detail');
    } else {
      // 通常モードに切り替え
      simpleMode.style.display = 'block';
      detailMode.style.display = 'none';
      toggleButton.textContent = '詳細表示';
      localStorage.setItem('kayoi-summary-mode', 'simple');
    }
  }
  
  /**
   * 前回のモードを復元
   */
  restoreMode() {
    const savedMode = localStorage.getItem('kayoi-summary-mode');
    if (savedMode === 'detail') {
      const simpleMode = this.summaryElement.querySelector('.simple-mode');
      const detailMode = this.summaryElement.querySelector('.detail-mode');
      const toggleButton = this.summaryElement.querySelector('.toggle-button');
      
      if (simpleMode && detailMode && toggleButton) {
        simpleMode.style.display = 'none';
        detailMode.style.display = 'block';
        toggleButton.textContent = '通常表示';
      }
    }
  }
  
  /**
   * 日別サマリーをレンダリング
   * @param {number} year - 年
   * @param {number} month - 月（1-12）
   */
  render(year, month) {
    this.currentYear = year;
    this.currentMonth = month;
    
    // 通いセクションの予定を取得
    const schedules = this.scheduleManager.getAllSchedules();
    
    // 月全体のサマリーを計算
    const summaryMap = DailySummaryService.calculateKayoiMonthlySummary(schedules, year, month);
    
    // 通常モードをレンダリング
    this.renderSimpleMode(summaryMap, year, month);
    
    // 詳細モードがアクティブな場合は詳細モードもレンダリング
    if (this.summaryElement.classList.contains('detail-active')) {
      this.renderDetailMode(summaryMap, year, month);
    }
    
    // ホバーポップアップを初期化
    this.initializeHoverPopup();
  }
  
  /**
   * 通常モードのレンダリング（3行: 通い・迎え・送り）
   */
  renderSimpleMode(summaryMap, year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const simpleModeContainer = this.summaryElement.querySelector('.simple-mode');
    if (!simpleModeContainer) {
      console.error('通常モードのコンテナが見つかりません');
      return;
    }
    
    const kayoiCells = simpleModeContainer.querySelector('[data-row-type="kayoi"] .count-cells');
    const pickupCells = simpleModeContainer.querySelector('[data-row-type="pickup"] .count-cells');
    const dropoffCells = simpleModeContainer.querySelector('[data-row-type="dropoff"] .count-cells');
    
    if (!kayoiCells || !pickupCells || !dropoffCells) {
      console.error('日別サマリーのセルコンテナが見つかりません');
      return;
    }
    
    // 既存のセルをクリア
    kayoiCells.innerHTML = '';
    pickupCells.innerHTML = '';
    dropoffCells.innerHTML = '';
    
    // 各日のセルを生成
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const summary = summaryMap.get(date);
      
      if (!summary) continue;
      
      // 通い行（ホバートリガー付き）
      const kayoiCell = this.createCell(
        summary.kayoi,
        {
          date,
          kayoi: summary.kayoi,
          zenhan: summary.zenhan,
          kohan: summary.kohan,
          pickup: summary.pickup,
          dropoff: summary.dropoff
        },
        true // hover-trigger
      );
      kayoiCell.classList.add(DailySummaryService.getCapacityClass(summary.kayoi, 15));
      kayoiCells.appendChild(kayoiCell);
      
      // 迎え行
      const pickupCell = this.createCell(summary.pickup);
      pickupCells.appendChild(pickupCell);
      
      // 送り行
      const dropoffCell = this.createCell(summary.dropoff);
      dropoffCells.appendChild(dropoffCell);
    }
  }
  
  /**
   * 詳細モードのレンダリング（5行: 通い・前半・後半・迎え・送り）
   */
  renderDetailMode(summaryMap, year, month) {
    if (!summaryMap) {
      // summaryMapが渡されていない場合は再計算
      const schedules = this.scheduleManager.getKayoiSchedulesByMonth(
        year || this.currentYear, 
        month || this.currentMonth
      );
      summaryMap = DailySummaryService.calculateKayoiMonthlySummary(
        schedules, 
        year || this.currentYear, 
        month || this.currentMonth
      );
    }
    
    const daysInMonth = new Date(
      year || this.currentYear, 
      month || this.currentMonth, 
      0
    ).getDate();
    
    const kayoiCellsDetail = this.summaryElement.querySelector('#kayoi-summary-cells-detail');
    const zenhanCells = this.summaryElement.querySelector('#zenhan-summary-cells');
    const kohanCells = this.summaryElement.querySelector('#kohan-summary-cells');
    const pickupCellsDetail = this.summaryElement.querySelector('#pickup-summary-cells-detail');
    const dropoffCellsDetail = this.summaryElement.querySelector('#dropoff-summary-cells-detail');
    
    if (!kayoiCellsDetail || !zenhanCells || !kohanCells || !pickupCellsDetail || !dropoffCellsDetail) {
      console.error('詳細モードのセルコンテナが見つかりません');
      return;
    }
    
    // 既存のセルをクリア
    kayoiCellsDetail.innerHTML = '';
    zenhanCells.innerHTML = '';
    kohanCells.innerHTML = '';
    pickupCellsDetail.innerHTML = '';
    dropoffCellsDetail.innerHTML = '';
    
    // 各日のセルを生成
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year || this.currentYear}-${String(month || this.currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const summary = summaryMap.get(date);
      
      if (!summary) continue;
      
      // 通い行
      const kayoiCell = this.createCell(summary.kayoi);
      kayoiCell.classList.add(DailySummaryService.getCapacityClass(summary.kayoi, 15));
      kayoiCellsDetail.appendChild(kayoiCell);
      
      // 前半行
      const zenhanCell = this.createCell(summary.zenhan);
      zenhanCell.classList.add(DailySummaryService.getCapacityClass(summary.zenhan, 15));
      zenhanCells.appendChild(zenhanCell);
      
      // 後半行
      const kohanCell = this.createCell(summary.kohan);
      kohanCell.classList.add(DailySummaryService.getCapacityClass(summary.kohan, 15));
      kohanCells.appendChild(kohanCell);
      
      // 迎え行
      const pickupCell = this.createCell(summary.pickup);
      pickupCellsDetail.appendChild(pickupCell);
      
      // 送り行
      const dropoffCell = this.createCell(summary.dropoff);
      dropoffCellsDetail.appendChild(dropoffCell);
    }
  }
  
  /**
   * セルを作成
   * @param {number} value - 表示する数値
   * @param {Object} dataAttrs - data属性（ホバー用）
   * @param {boolean} isHoverTrigger - ホバートリガーにするか
   * @returns {HTMLElement} セル要素
   */
  createCell(value, dataAttrs = null, isHoverTrigger = false) {
    const cell = document.createElement('span');
    cell.className = 'count-cell';
    cell.textContent = value;
    
    if (isHoverTrigger) {
      cell.classList.add('hover-trigger');
      
      // data属性を設定
      if (dataAttrs) {
        for (const [key, val] of Object.entries(dataAttrs)) {
          cell.dataset[key] = val;
        }
      }
    }
    
    return cell;
  }
  
  /**
   * ホバーポップアップの初期化
   */
  initializeHoverPopup() {
    const hoverTriggers = this.summaryElement.querySelectorAll('.hover-trigger');
    const hoverPopup = this.summaryElement.querySelector('#hover-popup-kayoi');
    
    if (!hoverPopup) {
      console.warn('ホバーポップアップが見つかりません');
      return;
    }
    
    hoverTriggers.forEach(cell => {
      cell.addEventListener('mouseenter', (e) => {
        this.showHoverPopup(e, cell, hoverPopup);
      });
      
      cell.addEventListener('mouseleave', () => {
        hoverPopup.style.display = 'none';
      });
    });
  }
  
  /**
   * ホバーポップアップを表示
   */
  showHoverPopup(event, cell, popup) {
    // data属性から値を取得
    const kayoi = cell.dataset.kayoi || '-';
    const zenhan = cell.dataset.zenhan || '-';
    const kohan = cell.dataset.kohan || '-';
    const pickup = cell.dataset.pickup || '-';
    const dropoff = cell.dataset.dropoff || '-';
    
    // ポップアップに値を設定
    const popupKayoi = popup.querySelector('#popup-kayoi');
    const popupZenhan = popup.querySelector('#popup-zenhan');
    const popupKohan = popup.querySelector('#popup-kohan');
    const popupPickup = popup.querySelector('#popup-pickup');
    const popupDropoff = popup.querySelector('#popup-dropoff');
    
    if (popupKayoi) popupKayoi.textContent = kayoi;
    if (popupZenhan) popupZenhan.textContent = zenhan;
    if (popupKohan) popupKohan.textContent = kohan;
    if (popupPickup) popupPickup.textContent = pickup;
    if (popupDropoff) popupDropoff.textContent = dropoff;
    
    // ポップアップの位置を計算
    const rect = cell.getBoundingClientRect();
    const popupWidth = 140; // CSSで定義されているmin-width
    
    // 画面右端を超えないように調整
    let left = rect.left;
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 10;
    }
    
    popup.style.left = `${left}px`;
    popup.style.top = `${rect.bottom + 5}px`;
    
    // 表示
    popup.style.display = 'block';
  }
}

export { DailySummaryUI };
