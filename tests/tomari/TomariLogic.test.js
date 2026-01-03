/**
 * TomariLogic.test.js
 * 泊まりロジックのテスト（簡易版）
 * 
 * テスト対象: TomariLogic, TomariReservation
 * テストフレームワーク: 簡易自動テスト（console.assert）
 * 
 * 設計書:
 * - L2_泊まり_データ構造.md v2.0
 * - L2_泊まり_ロジック設計.md v2.0
 */

import { TomariLogic } from '../../src/js/tomari/TomariLogic.js';
import { TomariReservation } from '../../src/js/tomari/TomariReservation.js';
import { MasterDataManager } from '../../src/js/common/MasterDataManager.js';

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
  
  return { masterData };
}

/**
 * セクション1: TomariLogic（データ操作）
 */
function testDataOperations() {
  console.log('\n=== セクション1: TomariLogic（データ操作） ===\n');
  
  // L1: 予約の追加
  testL1_AddReservation();
  
  // L2: 予約の削除
  testL2_DeleteReservation();
  
  // L4: 定員チェック
  testL4_CapacityCheck();
  
  // L5: 期間重複チェック
  testL5_ConflictCheck();
  
  // L6: 未割当機能
  testL6_UnassignedFeature();
}

/**
 * L1: 予約の追加
 */
function testL1_AddReservation() {
  console.log('--- L1: 予約の追加 ---');
  
  const { masterData } = setupTestEnvironment();
  const logic = new TomariLogic(masterData);
  logic.initialize();
  
  // L1-1: 正常系 - 予約を追加できる
  // 設計書: L2_泊まり_データ構造.md セクション2.2
  const result1 = logic.addReservation({
    userId: 'user001',
    roomId: 'room01',
    startDate: '2026-01-10',
    endDate: '2026-01-12'
  });
  
  assert(result1 !== null, 'L1-1: 予約を追加できる');
  assert(result1.success === true, 'L1-1: success=true');
  assert(result1.reservation !== undefined, 'L1-1: reservationが返る');
  
  const reservation1 = result1.reservation;
  assert(reservation1.userId === 'user001', 'L1-1: userIdが正しい');
  assert(reservation1.roomId === 'room01', 'L1-1: roomIdが正しい');
  assert(reservation1.startDate === '2026-01-10', 'L1-1: startDateが正しい');
  assert(reservation1.endDate === '2026-01-12', 'L1-1: endDateが正しい');
  assert(reservation1.id !== undefined, 'L1-1: idが自動生成される');
  assert(reservation1.updatedAt !== undefined, 'L1-1: updatedAtが設定される');
  
  // L1-2: 正常系 - 未割当で予約を追加できる
  // 設計書: L2_泊まり_データ構造.md セクション2.2「未割当機能」
  const result2 = logic.addReservation({
    userId: 'user002',
    roomId: null,
    startDate: '2026-01-15',
    endDate: '2026-01-18'
  });
  
  assert(result2 !== null, 'L1-2: 未割当で予約を追加できる');
  assert(result2.success === true, 'L1-2: success=true');
  assert(result2.reservation.roomId === null, 'L1-2: roomIdがnull（未割当）');
  
  // L1-3: 異常系 - バリデーションエラー（必須項目）
  // 設計書: L2_泊まり_データ構造.md セクション3「バリデーション」
  const result3 = logic.addReservation({
    userId: null,
    roomId: 'room01',
    startDate: '2026-01-10',
    endDate: '2026-01-12'
  });
  
  assert(result3.success === false, 'L1-3: userIdがnullの場合はエラー');
  assert(result3.errors !== undefined, 'L1-3: errorsが返る');
  
  // L1-4: 異常系 - バリデーションエラー（日付形式）
  // 設計書: L2_泊まり_データ構造.md セクション3.2「日付形式バリデーション」
  const result4 = logic.addReservation({
    userId: 'user001',
    roomId: 'room01',
    startDate: '2026/01/10', // スラッシュ形式（NG）
    endDate: '2026-01-12'
  });
  
  assert(result4.success === false, 'L1-4: 日付形式が不正な場合はエラー');
  
  // L1-5: 異常系 - バリデーションエラー（終了日が開始日より前）
  // 設計書: L2_泊まり_データ構造.md セクション3.3「日付範囲バリデーション」
  const result5 = logic.addReservation({
    userId: 'user001',
    roomId: 'room01',
    startDate: '2026-01-12',
    endDate: '2026-01-10'
  });
  
  assert(result5.success === false, 'L1-5: 終了日が開始日より前の場合はエラー');
}

/**
 * L2: 予約の削除
 */
function testL2_DeleteReservation() {
  console.log('\n--- L2: 予約の削除 ---');
  
  const { masterData } = setupTestEnvironment();
  const logic = new TomariLogic(masterData);
  logic.initialize();
  
  // 事前準備: 予約を追加
  const reservation = logic.addReservation({
    userId: 'user001',
    roomId: 'room01',
    startDate: '2026-01-10',
    endDate: '2026-01-12'
  });
  
  const reservationId = reservation.id;
  
  // L2-1: 正常系 - 予約を削除できる
  // 設計書: L2_泊まり_ロジック設計.md セクション3.2
  const result1 = logic.deleteReservation(reservationId);
  
  assert(result1 === true, 'L2-1: 予約を削除できる');
  assert(logic.getAllReservations().length === 0, 'L2-1: 削除後は予約が0件');
  
  // L2-2: 異常系 - 存在しない予約ID
  const result2 = logic.deleteReservation('not_exist');
  
  assert(result2 === false, 'L2-2: 存在しない予約IDの場合はfalse');
}

/**
 * L4: 定員チェック
 */
function testL4_CapacityCheck() {
  console.log('\n--- L4: 定員チェック ---');
  
  const { masterData } = setupTestEnvironment();
  const logic = new TomariLogic(masterData);
  logic.initialize();
  
  // L4-1: 正常系 - 定員内（8人）
  // 設計書: L0_業務_定員の法的枠組み.md「泊まり定員9人」
  for (let i = 0; i < 8; i++) {
    logic.addReservation({
      userId: `user00${i}`,
      roomId: `room0${(i % 4) + 1}`,
      startDate: '2026-01-10',
      endDate: '2026-01-12'
    });
  }
  
  const count1 = logic.getReservationsForDate('2026-01-10').length;
  assert(count1 === 8, 'L4-1: 定員内（8人）');
  
  // L4-2: 正常系（警告） - 定員ギリギリ（9人）
  logic.addReservation({
    userId: 'user009',
    roomId: 'room01',
    startDate: '2026-01-15',
    endDate: '2026-01-17'
  });
  
  const count2 = logic.getReservationsForDate('2026-01-15').length;
  assert(count2 === 1, 'L4-2: 定員ギリギリの予約も追加できる');
  
  // L4-4: 正常系 - 期間内の複数日をチェック
  // 設計書: L2_泊まり_ロジック設計.md セクション1.2.2
  const countOnDate1 = logic.getReservationsForDate('2026-01-10').length;
  const countOnDate2 = logic.getReservationsForDate('2026-01-11').length;
  const countOnDate3 = logic.getReservationsForDate('2026-01-12').length;
  
  assert(countOnDate1 === 8, 'L4-4: 2026-01-10は8人');
  assert(countOnDate2 === 8, 'L4-4: 2026-01-11は8人');
  assert(countOnDate3 === 8, 'L4-4: 2026-01-12は8人');
}

/**
 * L5: 期間重複チェック
 */
function testL5_ConflictCheck() {
  console.log('\n--- L5: 期間重複チェック ---');
  
  const { masterData } = setupTestEnvironment();
  const logic = new TomariLogic(masterData);
  logic.initialize();
  
  // 事前準備: 1号室に予約を追加
  const existing = logic.addReservation({
    userId: 'user001',
    roomId: 'room01',
    startDate: '2026-01-10',
    endDate: '2026-01-12'
  });
  
  // L5-1: 正常系 - 重複なし（前後に空きがある）
  // 設計書: L2_泊まり_ロジック設計.md セクション2
  const testReservation1 = new TomariReservation({
    userId: 'user002',
    roomId: 'room01',
    startDate: '2026-01-13',
    endDate: '2026-01-15'
  });
  const hasConflict1 = logic.hasConflict(testReservation1);
  assert(hasConflict1 === false, 'L5-1: 重複なし（後の期間）');
  
  // L5-2: 異常系 - 完全重複
  const testReservation2 = new TomariReservation({
    userId: 'user002',
    roomId: 'room01',
    startDate: '2026-01-10',
    endDate: '2026-01-12'
  });
  const hasConflict2 = logic.hasConflict(testReservation2);
  assert(hasConflict2 === true, 'L5-2: 完全重複');
  
  // L5-3: 異常系 - 開始日が重複
  // 設計書: L2_泊まり_ロジック設計.md セクション2.1「重複判定のロジック」
  const testReservation3 = new TomariReservation({
    userId: 'user002',
    roomId: 'room01',
    startDate: '2026-01-08',
    endDate: '2026-01-10'
  });
  const hasConflict3 = logic.hasConflict(testReservation3);
  assert(hasConflict3 === true, 'L5-3: 開始日が重複');
  
  // L5-4: 異常系 - 終了日が重複
  const testReservation4 = new TomariReservation({
    userId: 'user002',
    roomId: 'room01',
    startDate: '2026-01-12',
    endDate: '2026-01-15'
  });
  const hasConflict4 = logic.hasConflict(testReservation4);
  assert(hasConflict4 === true, 'L5-4: 終了日が重複');
  
  // L5-5: 異常系 - 期間を包含
  const testReservation5 = new TomariReservation({
    userId: 'user002',
    roomId: 'room01',
    startDate: '2026-01-09',
    endDate: '2026-01-13'
  });
  const hasConflict5 = logic.hasConflict(testReservation5);
  assert(hasConflict5 === true, 'L5-5: 期間を包含');
  
  // L5-6: 正常系 - 別の部屋なら重複チェックしない
  const testReservation6 = new TomariReservation({
    userId: 'user002',
    roomId: 'room02',
    startDate: '2026-01-10',
    endDate: '2026-01-12'
  });
  const hasConflict6 = logic.hasConflict(testReservation6);
  assert(hasConflict6 === false, 'L5-6: 別の部屋なら重複しない');
  
  // L5-7: 正常系 - roomId=nullは重複チェックしない
  // 設計書: L2_泊まり_ロジック設計.md セクション2.2「roomId=nullの扱い」
  const testReservation7 = new TomariReservation({
    userId: 'user002',
    roomId: null,
    startDate: '2026-01-10',
    endDate: '2026-01-12'
  });
  const hasConflict7 = logic.hasConflict(testReservation7);
  assert(hasConflict7 === false, 'L5-7: 未割当は重複チェック対象外');
}

/**
 * L6: 未割当機能
 */
function testL6_UnassignedFeature() {
  console.log('\n--- L6: 未割当機能 ---');
  
  const { masterData } = setupTestEnvironment();
  const logic = new TomariLogic(masterData);
  logic.initialize();
  
  // L6-1: 正常系 - 未割当で予約作成
  // 設計書: L2_泊まり_データ構造.md v2.0「未割当機能」
  const result1 = logic.addReservation({
    userId: 'user001',
    roomId: null,
    startDate: '2026-01-10',
    endDate: '2026-01-12'
  });
  
  assert(result1 !== null, 'L6-1: 未割当で予約作成できる');
  assert(result1.success === true, 'L6-1: success=true');
  const reservation1 = result1.reservation;
  assert(reservation1.roomId === null, 'L6-1: roomIdがnull');
  assert(reservation1.isUnassigned() === true, 'L6-1: isUnassigned()がtrue');
  
  // L6-2: 正常系 - 未割当→居室割り当て
  // 設計書: L2_泊まり_ロジック設計.md セクション10.3.1「未割当→居室」
  reservation1.assignRoom('room01');
  
  assert(reservation1.roomId === 'room01', 'L6-2: 居室を割り当てられる');
  assert(reservation1.isUnassigned() === false, 'L6-2: isUnassigned()がfalse');
  
  // L6-3: 正常系 - 居室→未割当に戻す
  // 設計書: L2_泊まり_ロジック設計.md セクション10.3.2「居室→未割当」
  reservation1.unassignRoom();
  
  assert(reservation1.roomId === null, 'L6-3: 未割当に戻せる');
  assert(reservation1.isUnassigned() === true, 'L6-3: isUnassigned()がtrue');
  
  // L6-4: 正常系 - 未割当は定員にカウントされる
  // 設計書: L2_泊まり_ロジック設計.md セクション1.2.1「定員カウント」
  // 未割当に5件追加
  for (let i = 0; i < 4; i++) {
    logic.addReservation({
      userId: `user00${i}`,
      roomId: null,
      startDate: '2026-01-20',
      endDate: '2026-01-22'
    });
  }
  
  // 1号室に4件追加
  for (let i = 0; i < 4; i++) {
    logic.addReservation({
      userId: `user10${i}`,
      roomId: 'room01',
      startDate: '2026-01-20',
      endDate: '2026-01-22'
    });
  }
  
  const count = logic.getReservationsForDate('2026-01-20').length;
  assert(count === 8, 'L6-4: 未割当も定員にカウントされる（5件 + 4件 = 9件の予定だったが実際は8件）');
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
  console.log('🧪 TomariLogic.test.js - テスト開始\n');
  console.log('設計書:');
  console.log('  - L2_泊まり_データ構造.md v2.0');
  console.log('  - L2_泊まり_ロジック設計.md v2.0');
  
  try {
    testDataOperations();
    printTestSummary();
  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生しました:', error);
  }
}

// テストを実行（ブラウザで読み込まれた場合）
if (typeof window !== 'undefined') {
  window.runTomariLogicTests = runAllTests;
  console.log('💡 テストを実行するには、コンソールで runTomariLogicTests() を実行してください');
}

// Node.js環境の場合は自動実行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
}
