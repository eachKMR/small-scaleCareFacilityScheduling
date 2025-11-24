/**
 * CSVImportUI.js
 * CSV取り込みUI管理
 */

import { CSVImportService } from '../common/utils/CSVImportService.js';
import { WeeklyPatternExtractor } from '../common/utils/WeeklyPatternExtractor.js';

export class CSVImportUI {
  constructor(masterDataManager) {
    this.masterData = masterDataManager;
    this.csvService = new CSVImportService(masterDataManager);
    this.previewData = null;
  }

  /**
   * ファイル選択ダイアログを表示
   */
  showFileDialog() {
    console.log('showFileDialog() が呼ばれました');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.multiple = false;
    
    console.log('input要素を作成しました:', input);
    
    input.addEventListener('change', async (e) => {
      console.log('ファイルが選択されました:', e.target.files);
      const files = e.target.files;
      if (files.length === 0) return;
      
      try {
        this.showLoading('CSVファイルを読み込んでいます...');
        
        console.log('csvService.importCSV() を呼び出します');
        const result = await this.csvService.importCSV(files);
        console.log('importCSV() 完了, result:', result);
        
        this.hideLoading();
        console.log('showPreviewDialog() を呼び出します');
        console.log('  weeklyPatterns.size:', result.weeklyPatterns.size);
        console.log('  duplicates.length:', result.duplicates.length);
        console.log('  fileName:', files[0].name);
        this.showPreviewDialog(result.weeklyPatterns, result.duplicates, files[0].name);
        console.log('showPreviewDialog() 呼び出し完了');
        
      } catch (error) {
        console.error('CSVImport エラー:', error);
        this.hideLoading();
        this.showToast('CSV読み込みに失敗しました: ' + error.message, 'error');
      }
    });
    
    console.log('input.click()を実行します');
    input.click();
    console.log('input.click()を実行しました');
  }

  /**
   * プレビューダイアログを表示
   */
  showPreviewDialog(weeklyPatterns, duplicates, fileName) {
    console.log('=== showPreviewDialog() 開始 ===');
    console.log('  weeklyPatterns:', weeklyPatterns);
    console.log('  duplicates:', duplicates);
    console.log('  fileName:', fileName);
    
    this.previewData = { weeklyPatterns, duplicates };
    console.log('previewData設定完了');
    
    const previewList = [];
    console.log('previewList作成開始, weeklyPatterns.size:', weeklyPatterns.size);
    
    for (const [name, pattern] of weeklyPatterns) {
      console.log('処理中:', name, pattern);
      const isDup = duplicates.includes(name);
      console.log('  formatPatternSummary()を呼び出します');
      const summary = WeeklyPatternExtractor.formatPatternSummary(pattern);
      console.log('  summary:', summary);
      previewList.push({
        name,
        pattern,
        isDuplicate: isDup,
        checked: !isDup,
        patternSummary: summary
      });
    }
    console.log('previewList作成完了, 件数:', previewList.length);
    
    console.log('HTML生成開始');
    const html = `
      <div class="csv-preview-dialog">
        <h2>算定基礎CSV取り込みプレビュー</h2>
        
        <div class="file-info">
          📄 読み込みファイル: ${fileName} (${previewList.length}件)
        </div>
        
        <div class="warning">
          ⚠️ 以下の利用者を取り込みますか？
        </div>
        
        <table class="preview-table">
          <thead>
            <tr>
              <th><input type="checkbox" id="check-all"></th>
              <th>氏名</th>
              <th>週間パターン</th>
              <th>重複</th>
            </tr>
          </thead>
          <tbody>
            ${previewList.map((item, index) => `
              <tr class="${item.isDuplicate ? 'duplicate-row' : ''}" data-index="${index}">
                <td><input type="checkbox" ${item.checked ? 'checked' : ''} 
                           data-name="${item.name}" class="user-checkbox"></td>
                <td>${item.name}</td>
                <td class="pattern-summary">${item.patternSummary}</td>
                <td>${item.isDuplicate ? '🔴重複' : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${duplicates.length > 0 ? `
          <div class="duplicate-info">
            ℹ️ ${duplicates.length}件の重複: 氏名が既存の利用者と重複しています。
          </div>
        ` : ''}
        
        <div class="preview-actions">
          <button id="check-all-btn" class="btn-secondary">✓すべて選択</button>
          <button id="check-non-dup-btn" class="btn-secondary">✓重複以外を選択</button>
          <button id="uncheck-all-btn" class="btn-secondary">すべて解除</button>
        </div>
        
        <div class="dialog-buttons">
          <button id="cancel-btn" class="btn-secondary">キャンセル</button>
          <button id="import-btn" class="btn-primary">
            取り込み (<span id="selected-count">${previewList.filter(i => i.checked).length}</span>名選択中)
          </button>
        </div>
      </div>
    `;
    console.log('HTML生成完了, 長さ:', html.length);
    
    console.log('showModal()を呼び出します');
    this.showModal(html);
    console.log('showModal()完了');
    
    console.log('setupPreviewEventListeners()を呼び出します');
    this.setupPreviewEventListeners(previewList);
    console.log('setupPreviewEventListeners()完了');
  }

  /**
   * プレビューダイアログのイベントリスナー
   */
  setupPreviewEventListeners(previewList) {
    // 個別チェックボックス
    document.querySelectorAll('.user-checkbox').forEach(cb => {
      cb.addEventListener('change', () => this.updateSelectedCount());
    });
    
    // 全選択
    document.getElementById('check-all-btn').addEventListener('click', () => {
      document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = true);
      this.updateSelectedCount();
    });
    
    // 重複以外を選択
    document.getElementById('check-non-dup-btn').addEventListener('click', () => {
      document.querySelectorAll('.preview-table tr').forEach(row => {
        const cb = row.querySelector('.user-checkbox');
        if (cb && !row.classList.contains('duplicate-row')) {
          cb.checked = true;
        }
      });
      this.updateSelectedCount();
    });
    
    // すべて解除
    document.getElementById('uncheck-all-btn').addEventListener('click', () => {
      document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = false);
      this.updateSelectedCount();
    });
    
    // キャンセル
    document.getElementById('cancel-btn').addEventListener('click', () => {
      this.closeModal();
    });
    
    // 取り込み
    document.getElementById('import-btn').addEventListener('click', () => {
      this.handleImport();
    });
  }

  /**
   * 選択数を更新
   */
  updateSelectedCount() {
    const count = document.querySelectorAll('.user-checkbox:checked').length;
    document.getElementById('selected-count').textContent = count;
  }

  /**
   * 取り込み処理
   */
  handleImport() {
    const selectedNames = Array.from(
      document.querySelectorAll('.user-checkbox:checked')
    ).map(cb => cb.dataset.name);
    
    if (selectedNames.length === 0) {
      this.showToast('利用者が選択されていません', 'warning');
      return;
    }
    
    try {
      this.showLoading('利用者を登録しています...');
      
      const registeredUsers = this.csvService.registerUsers(
        this.previewData.weeklyPatterns,
        selectedNames
      );
      
      this.hideLoading();
      this.closeModal();
      
      this.showToast(`${registeredUsers.length}名の利用者を登録しました`, 'success');
      
      // 画面をリロード
      setTimeout(() => {
        location.reload();
      }, 1000);
      
    } catch (error) {
      this.hideLoading();
      this.showToast('登録に失敗しました: ' + error.message, 'error');
    }
  }

  /**
   * モーダルを表示
   */
  showModal(html) {
    console.log('=== showModal() 内部開始 ===');
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('modal-overlay');
    
    console.log('modal要素:', modal);
    console.log('overlay要素:', overlay);
    
    if (!modal || !overlay) {
      console.error('モーダル要素が見つかりません!');
      alert('モーダル要素が見つかりません。index.htmlを確認してください。');
      return;
    }
    
    console.log('modal.innerHTMLを設定します, html長さ:', html.length);
    modal.innerHTML = html;
    console.log('activeクラスを追加します');
    modal.classList.add('active');
    overlay.classList.add('active');
    console.log('activeクラス追加完了');
    console.log('modal.classList:', modal.classList);
    console.log('overlay.classList:', overlay.classList);
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
   * ローディング表示
   */
  showLoading(message) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.textContent = message;
      loading.style.display = 'block';
    }
  }

  /**
   * ローディング非表示
   */
  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  /**
   * トースト通知
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
}
