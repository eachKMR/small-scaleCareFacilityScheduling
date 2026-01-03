/**
 * KayoiTomariSync.test.js
 * 通いUIと泊まりLogicの連携テスト（簡易版）
 * 
 * テスト対象: main.js の setupKayoiTomariSync() メソッド
 * 設計書:
 * - main.js setupKayoiTomariSync()
 * - L2_通い_データ構造.md v5.0「複数泊まり対応」
 * 
 * @version 1.0
 */

import { MasterDataManager } from '../../src/js/common/MasterDataManager.js';
import { TomariLogic } from '../../src/js/tomari/TomariLogic.js';

// テスト結果を格納
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * アサーション関数
 */
function assert(condition, message) {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    console.log(`✅ PASS: ${message}`);
  } else {
    testResults.failed++;
    testResults.errors.push(message);
    console.error(`❌ FAIL: ${message}`);
  }
}

/**
 * テストセットアップ
 */
function setupTestEnvironment() {
  // LocalStorageをクリア
  localStorage.clear();
  
  // MasterDataManagerを初期化
  const masterData = new MasterDataManager();
  
  // テスト用の居室マスタを作成
  const rooms = [
    { roomId: 'room01', name: '1号室', isActive: true },
    { roomId: 'room02', name: '2号室', isActive: true },
    { roomId: 'room03', name: '3号室', isActive: true },
    { roomId: 'room04', name: '4号室', isActive: true }
  ];
  localStorage.setItem('rooms', JSON.stringify(rooms));
  
  // テスト用の利用者マスタを作成
  const users = [
    { userId: 'user001', name: '山田太郎', nameLast: '山田', nameFirst: '太郎' },
    { userId: 'user002', name: '佐藤花子', nameLast: '佐藤', nameFirst: '花子' },
    { userId: 'user003', name: '鈴木次郎', nameLast: '鈴木', nameFirst: '次郎' }
  ];
  localStorage.setItem('users', JSON.stringify(users));
  
  masterData.initialize();
  
  const tomariLogic = new TomariLogic(masterData);
  tomariLogic.initialize();
  
  return { masterData, tomariLogic };
}

/**
 * イベントリスナーのシミュレーション用ヘルパー
 */
class EventSimulator {
  constructor(tomariLogic) {
    this.tomariLogic = tomariLogic;
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // 泊まり期間設定イベント
    document.addEventListener('kayoi:tomariPeriodChanged', (e) => {
      const { userId, checkInDate, checkOutDate } = e.detail;
      console.log('📅 イベント受信: tomariPeriodChanged', userId, checkInDate, checkOutDate);
      
      // 既存の予約を検索（完全一致）
      const existingReservation = this.tomariLogic.reservations.find(
        r => r.userId === userId && 
             r.startDate === checkInDate && 
             r.endDate === checkOutDate
      );
      
      if (!existingReservation) {
        const reservation = {
          userId: userId,
          roomId: null,  // 未割当
          startDate: checkInDate,
          endDate: checkOutDate,
          status: '計画',
          note: '通いUIから設定'
        };
        
        const result = this.tomariLogic.addReservation(reservation);
        if (result && result.success) {
          console.log('✅ TomariReservation作成:', reservation);
        }
      }
    });
    
    // 泊まり期間削除イベント
    document.addEventListener('kayoi:tomariPeriodCleared', (e) => {
      const { userId, reservations } = e.detail;
      console.log('🗑️ イベント受信: tomariPeriodCleared', userId, reservations.length);
      
      reservations.forEach(r => {
        const found = this.tomariLogic.reservations.find(
          tr => tr.userId === r.userId && 
                tr.startDate === r.startDate && 
                tr.endDate === r.endDate
        );
        if (found) {
          this.tomariLogic.deleteReservation(found.id);
          console.log('✅ TomariReservation削除:', found.id);
        }
      });
    });
  }
  
  /**
   * 通いUIからの泊まり期間設定イベントを発火
   */
  dispatchTomariPeriodChanged(userId, checkInDate, checkOutDate) {
    const event = new CustomEvent('kayoi:tomariPeriodChanged', {
      detail: { userId, checkInDate, checkOutDate }
    });
    document.dispatchEvent(event);
  }
  
  /**
   * 通いUIからの泊まり期間削除イベントを発火
   */
  dispatchTomariPeriodCleared(userId, reservations) {
    const event = new CustomEvent('kayoi:tomariPeriodCleared', {
      detail: { userId, reservations }
    });
    document.dispatchEvent(event);
  }
}

/**
 * セクション3: 通いUIとの連携（v4.0/v5.0同期）
 */
function testKayoiTomariSync() {
  console.log('\n=== セクション3: 通いUIとの連携 ===\n');
  
  // S1: 通いUI→泊まりLogic（泊まり期間設定）
  testS1_PeriodCreate();
  
  // S2: 通いUI→泊まりLogic（泊まり期間削除）
  testS2_PeriodDelete();
  
  // S4: 複数泊まり期間対応（v5.0）
  testS4_MultiplePeriods();
}

/**
 * S1: 通いUI→泊まりLogic（泊まり期間設定）
 */
function testS1_PeriodCreate() {
  console.log('--- S1: 通いUI→泊まりLogic（泊まり期間設定） ---');
  
  const { masterData, tomariLogic } = setupTestEnvironment();
  const simulator = new EventSimulator(tomariLogic);
  
  // S1-1: 正常系 - 通いUIで泊まり期間を設定すると未割当予約が作成される
  // 設計書: main.js setupKayoiTomariSync()
  const initialCount = tomariLogic.getAllReservations().length;
  
  // 通いUIからイベントを発火
  simulator.dispatchTomariPeriodChanged('user001', '2026-01-10', '2026-01-12');
  
  // 少し待つ（イベント処理のため）
  setTimeout(() => {
    const reservations = tomariLogic.getAllReservations();
    const found = reservations.find(
      r => r.userId === 'user001' && 
           r.startDate === '2026-01-10' && 
           r.endDate === '2026-01-12'
    );
    
    assert(found !== undefined, 'S1-1: 予約が作成された');
    if (found) {
      assert(found.roomId === null, 'S1-1: roomIdがnull（未割当）');
      assert(found.userId === 'user001', 'S1-1: userIdが正しい');
      assert(found.startDate === '2026-01-10', 'S1-1: startDateが正しい');
      assert(found.endDate === '2026-01-12', 'S1-1: endDateが正しい');
    }
    
    // S1-2: 異常系 - 既存の予約と完全一致する場合は作成しない
    // 設計書: main.js v5.0 setupKayoiTomariSync()
    const beforeCount = tomariLogic.getAllReservations().length;
    
    // 同じ期間でもう一度イベントを発火
    simulator.dispatchTomariPeriodChanged('user001', '2026-01-10', '2026-01-12');
    
    setTimeout(() => {
      const afterCount = tomariLogic.getAllReservations().length;
      assert(beforeCount === afterCount, 'S1-2: 重複する予約は作成されない');
    }, 100);
  }, 100);
}

/**
 * S2: 通いUI→泊まりLogic（泊まり期間削除）
 */
function testS2_PeriodDelete() {
  console.log('\n--- S2: 通いUI→泊まりLogic（泊まり期間削除） ---');
  
  const { masterData, tomariLogic } = setupTestEnvironment();
  const simulator = new EventSimulator(tomariLogic);
  
  // 事前準備: 予約を追加
  const reservation = tomariLogic.addReservation({
    userId: 'user001',
    roomId: null,
    startDate: '2026-01-10',
    endDate: '2026-01-12'
  });
  
  // S2-1: 正常系 - 通いUIで泊まり期間を削除すると予約も削除される
  // 設計書: main.js setupKayoiTomariSync() イベント2
  const beforeCount = tomariLogic.getAllReservations().length;
  
  // 削除イベントを発火
  simulator.dispatchTomariPeriodCleared('user001', [{
    userId: 'user001',
    startDate: '2026-01-10',
    endDate: '2026-01-12'
  }]);
  
  setTimeout(() => {
    const afterCount = tomariLogic.getAllReservations().length;
    assert(afterCount === beforeCount - 1, 'S2-1: 予約が削除された');
    
    const found = tomariLogic.getAllReservations().find(
      r => r.userId === 'user001' && 
           r.startDate === '2026-01-10'
    );
    assert(found === undefined, 'S2-1: 削除された予約は存在しない');
  }, 100);
}

/**
 * S4: 複数泊まり期間対応（v5.0）
 */
function testS4_MultiplePeriods() {
  console.log('\n--- S4: 複数泊まり期間対応（v5.0） ---');
  
  const { masterData, tomariLogic } = setupTestEnvironment();
  const simulator = new EventSimulator(tomariLogic);
  
  // S4-1: 正常系 - 1人が1ヶ月に複数回泊まれる
  // 設計書: L2_通い_データ構造.md v5.0 セクション1.2
  simulator.dispatchTomariPeriodChanged('user001', '2026-01-10', '2026-01-12');
  
  setTimeout(() => {
    simulator.dispatchTomariPeriodChanged('user001', '2026-01-20', '2026-01-22');
    
    setTimeout(() => {
      const reservations = tomariLogic.getAllReservations().filter(
        r => r.userId === 'user001'
      );
      
      assert(reservations.length === 2, `S4-1: 2件の予約が作成される（実際: ${reservations.length}件）`);
      
      if (reservations.length === 2) {
        const period1 = reservations.find(r => r.startDate === '2026-01-10');
        const period2 = reservations.find(r => r.startDate === '2026-01-20');
        
        assert(period1 !== undefined, 'S4-1: 1つ目の期間が存在');
        assert(period2 !== undefined, 'S4-1: 2つ目の期間が存在');
      }
      
      // S4-2: 正常系 - 複数期間がそれぞれ独立して管理される
      // 設計書: L2_泊まり_データ構造.md v2.0「Single Source of Truth」
      if (reservations.length >= 2) {
        const period1 = reservations[0];
        const period2 = reservations[1];
        
        assert(period1.id !== period2.id, 'S4-2: 予約IDがそれぞれ異なる');
        assert(period1.startDate !== period2.startDate, 'S4-2: 開始日がそれぞれ異なる');
      }
      
      // S2-2: 正常系 - 複数予約の一括削除（v5.0）
      // 設計書: main.js v5.0 setupKayoiTomariSync()
      const beforeCount = tomariLogic.getAllReservations().length;
      
      simulator.dispatchTomariPeriodCleared('user001', [
        { userId: 'user001', startDate: '2026-01-10', endDate: '2026-01-12' },
        { userId: 'user001', startDate: '2026-01-20', endDate: '2026-01-22' }
      ]);
      
      setTimeout(() => {
        const afterCount = tomariLogic.getAllReservations().length;
        assert(afterCount === beforeCount - 2, 'S2-2: 2件とも削除される');
        
        const remainingUser001 = tomariLogic.getAllReservations().filter(
          r => r.userId === 'user001'
        );
        assert(remainingUser001.length === 0, 'S2-2: user001の予約が全て削除される');
      }, 100);
    }, 100);
  }, 100);
}

/**
 * テスト結果のサマリーを表示
 */
function printTestSummary() {
  console.log('\n=== テスト結果サマリー ===');
  console.log(`総テスト数: ${testResults.total}`);
  console.log(`✅ 合格: ${testResults.passed}`);
  console.log(`❌ 不合格: ${testResults.failed}`);
  
  if (testResults.failed > 0) {
    console.log('\n失敗したテスト:');
    testResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`\n成功率: ${successRate}%`);
}

/**
 * すべてのテストを実行
 */
function runAllTests() {
  console.log('🧪 KayoiTomariSync.test.js - テスト開始\n');
  console.log('設計書:');
  console.log('  - main.js setupKayoiTomariSync()');
  console.log('  - L2_通い_データ構造.md v5.0');
  
  try {
    testKayoiTomariSync();
    
    // 非同期テストのため、少し待ってからサマリーを表示
    setTimeout(() => {
      printTestSummary();
    }, 1000);
  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生しました:', error);
  }
}

// テストを実行（ブラウザで読み込まれた場合）
if (typeof window !== 'undefined') {
  window.runKayoiTomariSyncTests = runAllTests;
  console.log('💡 テストを実行するには、コンソールで runKayoiTomariSyncTests() を実行してください');
}

// Node.js環境の場合は自動実行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
}
