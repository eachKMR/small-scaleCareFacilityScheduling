/**
 * TabJump.js
 * タブジャンプ機能（L3_UI_統合UI設計.md v2.1準拠）
 */

/**
 * タブによるジャンプ機能を管理するクラス
 */
export class TabJumpController {
  /**
   * タブジャンプ機能を初期化
   */
  static initialize() {
    const tabs = document.querySelectorAll('.tab-button');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // すべてのタブのactiveクラスを削除
        tabs.forEach(t => t.classList.remove('active'));
        
        // クリックされたタブをアクティブ化
        tab.classList.add('active');
        
        // ターゲット要素を取得
        const targetId = tab.dataset.target;
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          // スムーススクロール
          // 統合ヘッダー60px + コンパクトタブ40px = 100px
          // sticky見出し60px
          const headerHeight = 100;
          const stickyHeight = 60;
          const offsetTop = targetElement.offsetTop - headerHeight - stickyHeight;
          
          window.scrollTo({
            top: Math.max(0, offsetTop),
            behavior: 'smooth'
          });
        }
      });
    });
  }
}

/**
 * 画面幅に応じた列幅の動的計算を管理するクラス
 */
export class ColumnWidthCalculator {
  /**
   * 画面幅に応じて列幅を動的計算
   * @param {string} yearMonth - 対象年月 (YYYY-MM形式)
   */
  static calculate(yearMonth) {
    const screenWidth = window.innerWidth;
    const labelColumnWidth = 120;
    const scrollbarWidth = 20;
    const margin = 40;
    
    // 日付列の数（月によって28-31日）
    const [year, month] = yearMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // 利用可能な幅
    const availableWidth = screenWidth - labelColumnWidth - scrollbarWidth - margin;
    
    // 1列あたりの幅
    let columnWidth = availableWidth / daysInMonth;
    
    // 最小・最大の範囲内に収める
    columnWidth = Math.max(40, Math.min(60, columnWidth));
    
    // CSS変数に設定
    document.documentElement.style.setProperty('--column-width', `${columnWidth}px`);
  }
  
  /**
   * 列幅計算を初期化（初回計算とリサイズイベント設定）
   * @param {string} yearMonth - 対象年月 (YYYY-MM形式)
   */
  static initialize(yearMonth) {
    // 初回計算
    this.calculate(yearMonth);
    
    // リサイズ時の再計算
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.calculate(yearMonth);
      }, 100);
    });
  }
}
